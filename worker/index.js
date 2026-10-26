// Worker PrésiFrance : sert les fichiers statiques (binding ASSETS) et traite ce que les fichiers ne couvrent pas.
//  - route inconnue ou code commune inexistant : vrai 404 HTTP avec la page 404 du site (gabarit SPA) ;
//  - fiche commune existante mais non prérendue : gabarit habillé (titre, description, canonique, résumé chiffré) ;
//  - /embed/carte et /embed/commune/<code> : application React, avec les en-têtes des embeds (cf. public/_headers).
// Un module Worker ne peut exporter que ses gestionnaires : les constantes partagées sont dans shell.js.
// Les index départementaux viennent de dist/data/communes/<dep>.json (scripts/build-commune-index.mjs).
import { SHELL_PATH, communePage, genericAppPage, notFoundPage, renderShell } from "./shell.js";

const COMMUNE_CODE = /^\d[\dAB]\d{3}$/;
const COMMUNE_ROUTE = /^\/(embed\/)?commune\/([^/]+)$/;
const EMBED_ROUTES = new Set(["/embed/carte"]);

/** Index départementaux déjà lus dans cet isolate : dep -> Promise<index|null>. */
const shardCache = new Map();

function depOfCode(code) {
  return code.startsWith("97") ? code.slice(0, 3) : code.slice(0, 2);
}

function loadShard(env, origin, dep) {
  let pending = shardCache.get(dep);
  if (!pending) {
    pending = env.ASSETS.fetch(new Request(`${origin}/data/communes/${dep}.json`))
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
    shardCache.set(dep, pending);
    pending.then((shard) => {
      if (!shard) shardCache.delete(dep);
    });
  }
  return pending;
}

/** Réponse HTML à partir du gabarit ; les en-têtes de sécurité viennent de public/_headers (appliqués par ASSETS). */
async function shellResponse(env, origin, page, { status = 200, embed = false } = {}) {
  const res = await env.ASSETS.fetch(new Request(`${origin}${SHELL_PATH}`));
  if (!res.ok) return new Response("Service indisponible", { status: 503 });
  const headers = new Headers(res.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.delete("Content-Length");
  headers.delete("ETag");
  if (embed) {
    // Même règle que /embed/* dans public/_headers (le gabarit est servi sous un autre chemin).
    headers.set("Content-Security-Policy", "frame-ancestors *");
    headers.set("X-Robots-Tag", "noindex, nofollow");
    headers.set("Cache-Control", "public, max-age=300");
  } else if (page.noindex || status !== 200) {
    headers.set("X-Robots-Tag", "noindex");
  }
  if (status === 404) headers.set("Cache-Control", "public, max-age=300");
  return new Response(renderShell(await res.text(), page), { status, headers });
}

const notFound = (env, origin, embed = false) => shellResponse(env, origin, notFoundPage(), { status: 404, embed });

async function handleDynamic(env, url) {
  const { origin, pathname } = url;
  if (pathname === SHELL_PATH) return notFound(env, origin);

  if (EMBED_ROUTES.has(pathname)) return shellResponse(env, origin, genericAppPage(), { embed: true });

  const m = COMMUNE_ROUTE.exec(pathname);
  if (!m) return notFound(env, origin);
  const embed = Boolean(m[1]);
  const code = m[2];
  if (!COMMUNE_CODE.test(code)) return notFound(env, origin, embed);

  const dep = depOfCode(code);
  // Collectivités d'outre-mer (98x) : pas d'index fiable, l'application interroge ses sources ; page hors index.
  if (dep.startsWith("98")) return shellResponse(env, origin, genericAppPage(), { embed });

  const shard = await loadShard(env, origin, dep);
  if (!shard?.r[code]) return notFound(env, origin, embed);
  if (embed) return shellResponse(env, origin, genericAppPage(), { embed });
  return shellResponse(env, origin, communePage(code, dep, shard));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") return env.ASSETS.fetch(request);

    // Adresse avec slash final : redirection vers la forme canonique (comme html_handling drop-trailing-slash).
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.replace(/\/+$/, "") || "/";
      return Response.redirect(url.toString(), 308);
    }

    if (url.pathname !== SHELL_PATH) {
      const res = await env.ASSETS.fetch(request);
      if (res.status !== 404) return res;
    }
    const res = await handleDynamic(env, url);
    return request.method === "HEAD" ? new Response(null, res) : res;
  },
};
