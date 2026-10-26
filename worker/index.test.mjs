// @vitest-environment node
import { describe, expect, it } from "vitest";

import worker from "./index.js";
import { SHELL_PATH } from "./shell.js";

const SHELL = `<!doctype html><html lang="fr"><head><meta charset="UTF-8" />
<title>Accueil</title>
<meta name="description"
  content="Description d'accueil" />
<meta property="og:title" content="Accueil" />
<meta property="og:description" content="x" />
<meta property="og:url" content="https://presifrance.fr/" />
<meta name="twitter:title" content="Accueil" />
<meta name="twitter:description" content="x" />
</head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`;

const SHARD_01 = {
  d: "Ain",
  c: ["Emmanuel Macron", "Marine Le Pen"],
  r: {
    "01001": ["L'Abergement-Clémenciat", 645, 537, 520, 0, 150, 1, 149],
    "01002": ["Ancienne <Commune> (01)"],
  },
};

/** Faux binding ASSETS : fichiers en mémoire, 404 sinon (not_found_handling "none"). */
function makeEnv(extra = {}) {
  const files = {
    "/": { body: "<html>accueil prérendu</html>", type: "text/html" },
    "/commune/01004": { body: "<html>commune prérendue</html>", type: "text/html" },
    "/assets/app.js": { body: "console.log(1)", type: "text/javascript" },
    "/data/presidential/manifest.json": { body: "{}", type: "application/json" },
    "/data/communes/01.json": { body: JSON.stringify(SHARD_01), type: "application/json" },
    [SHELL_PATH]: { body: SHELL, type: "text/html" },
    ...extra,
  };
  const calls = [];
  return {
    calls,
    ASSETS: {
      async fetch(request) {
        const { pathname } = new URL(request.url);
        calls.push(pathname);
        const file = files[pathname];
        if (!file) return new Response("Not found", { status: 404 });
        const headers = { "Content-Type": file.type, "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "frame-ancestors 'self'" };
        return new Response(file.body, { status: 200, headers });
      },
    },
  };
}

const get = (env, path, init) => worker.fetch(new Request(`https://presifrance.fr${path}`, init), env);

describe("Worker presifrance", () => {
  it("sert les fichiers statiques tels quels", async () => {
    const env = makeEnv();
    for (const [path, expected] of [
      ["/", "accueil prérendu"],
      ["/commune/01004", "commune prérendue"],
      ["/assets/app.js", "console.log(1)"],
      ["/data/presidential/manifest.json", "{}"],
    ]) {
      const res = await get(env, path);
      expect(res.status).toBe(200);
      expect(await res.text()).toContain(expected);
    }
  });

  it("renvoie un vrai 404 avec la page 404 du site pour une route inconnue", async () => {
    const res = await get(makeEnv(), "/page-qui-nexiste-pas");
    expect(res.status).toBe(404);
    expect(res.headers.get("x-robots-tag")).toBe("noindex");
    expect(res.headers.get("content-security-policy")).toBe("frame-ancestors 'self'");
    const html = await res.text();
    expect(html).toContain("<title>Page introuvable — PrésiFrance</title>");
    expect(html).toContain('<meta name="robots" content="noindex, follow" />');
    expect(html).not.toContain('rel="canonical"');
    expect(html).toContain('<script type="module" src="/src/main.tsx">');
  });

  it("renvoie 404 pour les codes commune inexistants ou mal formés, et pour un département inconnu", async () => {
    const env = makeEnv();
    for (const path of ["/commune/99999", "/commune/01999", "/commune/abc", "/commune/1234", "/embed/commune/01999", "/explorer/99", "/commune/01001/extra"]) {
      const res = await get(env, path);
      expect(res.status, path).toBe(404);
    }
  });

  it("habille une commune existante non prérendue (titre, description, canonique, résumé chiffré)", async () => {
    const res = await get(makeEnv(), "/commune/01001");
    expect(res.status).toBe(200);
    expect(res.headers.get("x-robots-tag")).toBeNull();
    const html = await res.text();
    expect(html).toContain("<title>Résultats des élections à L&#039;Abergement-Clémenciat".replace("&#039;", "'"));
    expect(html).toContain('<link rel="canonical" href="https://presifrance.fr/commune/01001" />');
    expect(html).toContain('<meta property="og:url" content="https://presifrance.fr/commune/01001" />');
    expect(html).toMatch(/<meta name="description" content="L'Abergement-Clémenciat \(Ain\) : résultats de la présidentielle 2022\. Emmanuel Macron arrive en tête \(28,8 %\)/);
    expect(html).toContain("<h1>Résultats des élections à L'Abergement-Clémenciat</h1>");
    expect(html).toContain("Emmanuel Macron arrive en tête à L'Abergement-Clémenciat avec 28,8 % des suffrages exprimés, devant Marine Le Pen (28,7 %). La participation y est de 83,3 %.");
    expect(html).not.toContain("noindex");
    expect(html).not.toContain("Accueil</title>");
  });

  it("met en noindex une commune sans résultats 2022 et échappe son nom", async () => {
    const res = await get(makeEnv(), "/commune/01002");
    expect(res.status).toBe(200);
    expect(res.headers.get("x-robots-tag")).toBe("noindex");
    const html = await res.text();
    expect(html).toContain('<meta name="robots" content="noindex, follow" />');
    expect(html).toContain("Ancienne &lt;Commune&gt; (01)");
    expect(html).not.toContain("<Commune>");
  });

  it("sert les embeds avec leurs en-têtes (iframe libre, noindex)", async () => {
    const env = makeEnv();
    for (const path of ["/embed/carte", "/embed/commune/01001"]) {
      const res = await get(env, path);
      expect(res.status, path).toBe(200);
      expect(res.headers.get("content-security-policy")).toBe("frame-ancestors *");
      expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
      expect(await res.text()).toContain('<div id="root">');
    }
    const missing = await get(env, "/embed/commune/01999");
    expect(missing.status).toBe(404);
    expect(missing.headers.get("content-security-policy")).toBe("frame-ancestors *");
  });

  it("redirige l'adresse à slash final vers la forme canonique", async () => {
    const res = await get(makeEnv(), "/commune/01001/");
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://presifrance.fr/commune/01001");
  });

  it("ne publie pas le gabarit et ne laisse pas passer les méthodes autres que GET", async () => {
    const env = makeEnv();
    expect((await get(env, SHELL_PATH)).status).toBe(404);
    const post = await get(env, "/commune/01001", { method: "POST" });
    expect(post.status).toBe(404);
  });

  it("sert une page hors index pour les collectivités d'outre-mer sans index fiable (98x) et répond à HEAD", async () => {
    const env = makeEnv();
    const res = await get(env, "/commune/98818");
    expect(res.status).toBe(200);
    expect(res.headers.get("x-robots-tag")).toBe("noindex");
    const head = await get(env, "/page-inconnue", { method: "HEAD" });
    expect(head.status).toBe(404);
    expect(await head.text()).toBe("");
  });

  it("répond 503 si le gabarit est absent", async () => {
    const env = makeEnv();
    const original = env.ASSETS.fetch;
    env.ASSETS.fetch = (req) => (new URL(req.url).pathname === SHELL_PATH ? Promise.resolve(new Response("", { status: 404 })) : original(req));
    expect((await get(env, "/inconnue")).status).toBe(503);
  });
});
