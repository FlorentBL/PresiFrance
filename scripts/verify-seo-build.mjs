// Contrôle du HTML prérendu après build (postbuild) : le build échoue si une route prérendue est vide ou mal balisée.
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

import { generatedRoutes } from "./lib/seo-content/index.mjs";
import { visibleText } from "./lib/seo-content/html.mjs";
import { seoPrerenderRoutes, staticRoutes } from "./seo-routes.mjs";

const distDir = path.resolve(process.cwd(), "dist");
const siteUrl = String(process.env.SITE_URL || "https://presifrance.fr").replace(/\/+$/, "");
const MIN_WORDS = 80;
// Pages de résultats historiques (/presidentielle-AAAA 1965-2022 et hub) : contenu riche exigé (vague SEO 5).
const MIN_WORDS_HISTORIC = 500;
const isHistoricResultsPage = (p) => p === "/resultats-presidentielle" || /^\/presidentielle-(19\d\d|20[0-2][0-2])$/.test(p);
// Workers Static Assets : 20 000 fichiers par version sur l'offre gratuite, 100 000 sur l'offre payante
// (developers.cloudflare.com/workers/platform/limits, consulté le 26/10/2026). Marge sous la limite gratuite.
const MAX_FILES = Number(process.env.SEO_MAX_DIST_FILES || 19000);

const errors = [];
const fail = (msg) => errors.push(msg);

async function walk(dir) {
  let files = 0;
  let bytes = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await walk(full);
      files += sub.files;
      bytes += sub.bytes;
    } else {
      files += 1;
      bytes += (await stat(full)).size;
    }
  }
  return { files, bytes };
}

const routes = [...seoPrerenderRoutes, ...generatedRoutes()];
const titles = new Map();
const canonicals = new Map();

for (const route of routes) {
  const file = route.path === "/" ? path.join(distDir, "index.html") : path.join(distDir, route.path.replace(/^\/+/, ""), "index.html");
  let html;
  try {
    html = await readFile(file, "utf8");
  } catch {
    fail(`${route.path} : fichier prérendu absent`);
    continue;
  }

  const canon = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]*)"/gi)];
  if (canon.length !== 1) {
    fail(`${route.path} : ${canon.length} balises canonical (1 attendue)`);
  } else {
    const expected = `${siteUrl}${route.path}`;
    if (canon[0][1] !== expected) fail(`${route.path} : canonical ${canon[0][1]} (attendu ${expected})`);
    if (canonicals.has(canon[0][1])) fail(`${route.path} : canonical déjà utilisé par ${canonicals.get(canon[0][1])}`);
    canonicals.set(canon[0][1], route.path);
  }

  if (route.path === "/") {
    const types = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => {
      try {
        return JSON.parse(m[1])["@type"];
      } catch {
        return null;
      }
    });
    for (const t of ["WebSite", "Organization"]) if (!types.includes(t)) fail(`/ : JSON-LD ${t} absent ou invalide`);
  }

  const title = /<title>(.*?)<\/title>/is.exec(html)?.[1]?.trim();
  if (!title) fail(`${route.path} : title absent`);
  else if (titles.has(title)) fail(`${route.path} : title identique à ${titles.get(title)} (« ${title} »)`);
  else titles.set(title, route.path);

  if (route.commune) {
    // Fiche commune : titre « Résultats des élections à <Ville> », scrutins cités et FAQPage dès qu'une section « autres scrutins » existe.
    if (!title?.startsWith("Résultats des élections à ")) fail(`${route.path} : titre de fiche commune inattendu (« ${title} »)`);
    if (html.includes("Législatives, européennes et municipales à ")) {
      const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => {
        try {
          return JSON.parse(m[1]);
        } catch {
          return null;
        }
      });
      if (!ld.some((d) => d?.["@type"] === "FAQPage" && d.mainEntity?.length >= 3)) fail(`${route.path} : JSON-LD FAQPage absent ou invalide`);
      if (!/<meta name="description" content="[^"]*(législatives|européennes|municipales)/.test(html)) fail(`${route.path} : description sans les autres scrutins`);
    }
  }

  if (route.path.startsWith("/presidentielle-2027/candidats/")) {
    const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => {
      try {
        return JSON.parse(m[1]);
      } catch {
        return null;
      }
    });
    if (!ld.some((d) => d?.["@type"] === "FAQPage" && d.mainEntity?.length >= 2)) fail(`${route.path} : JSON-LD FAQPage absent ou invalide`);
    if (!/ : candidature présidentielle 2027, sondages et parcours<\/title>/.test(html)) fail(`${route.path} : titre de fiche candidat inattendu`);
  }

  if (isHistoricResultsPage(route.path)) {
    const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => {
      try {
        return JSON.parse(m[1]);
      } catch {
        return null;
      }
    });
    if (!ld.some((d) => d?.["@type"] === "FAQPage" && d.mainEntity?.length >= 3)) fail(`${route.path} : JSON-LD FAQPage absent ou invalide`);
  }

  const root = /<div id="root">([\s\S]*?)<\/main>/i.exec(html)?.[1] ?? "";
  const h1 = root.match(/<h1[\s>]/gi) ?? [];
  if (h1.length !== 1) fail(`${route.path} : ${h1.length} balises H1 (1 attendue)`);
  const words = (() => {
    const t = visibleText(root);
    return t ? t.split(" ").length : 0;
  })();
  if (words < MIN_WORDS) fail(`${route.path} : ${words} mots visibles (minimum ${MIN_WORDS})`);
  else if (isHistoricResultsPage(route.path) && words < MIN_WORDS_HISTORIC) fail(`${route.path} : ${words} mots visibles (minimum ${MIN_WORDS_HISTORIC} pour les pages de résultats historiques)`);
}

// robots.txt : robots des IA admis (décision du 26/10/2026) ; /data/ et /assets/ ouverts (Google doit charger le JS et les données).
const robots = await readFile(path.join(distDir, "robots.txt"), "utf8");
for (const bot of ["GPTBot", "CCBot", "ClaudeBot", "PerplexityBot", "Amazonbot"]) {
  if (robots.includes(bot)) fail(`robots.txt : ${bot} ne doit plus être traité à part`);
}
for (const rule of ["Disallow: /data/", "Disallow: /assets/"]) {
  if (robots.includes(rule)) fail(`robots.txt : « ${rule} » ne doit plus figurer (bloque le rendu JS de Google)`);
}

// _headers : /data/* exclu de l'index par en-tête, /embed/* aussi (le noindex JS d'EmbedFrame ne suffit pas).
const headers = await readFile(path.join(distDir, "_headers"), "utf8");
for (const prefix of ["/data/*", "/embed/*"]) {
  const block = headers.split(new RegExp(`^${prefix.replace("*", "\\*")}\\n`, "m"))[1]?.split(/\n\s*\n|\n(?=\S)/)[0] ?? "";
  if (!/X-Robots-Tag:\s*noindex/i.test(block)) fail(`_headers : X-Robots-Tag noindex manquant pour ${prefix}`);
}

// sitemap : les fiches commune prérendues y figurent toutes.
const sitemapIndex = await readFile(path.join(distDir, "sitemap.xml"), "utf8");
const sitemapFiles = [...sitemapIndex.matchAll(/<loc>[^<]*\/([^/<]+\.xml)<\/loc>/g)].map((m) => m[1]);
let sitemapLocs = new Set();
for (const name of sitemapFiles) {
  const xml = await readFile(path.join(distDir, name), "utf8");
  for (const m of xml.matchAll(/<loc>([^<]*)<\/loc>/g)) sitemapLocs.add(m[1]);
}
const missing = routes.filter((r) => r.commune && !sitemapLocs.has(`${siteUrl}${r.path}`));
if (missing.length) fail(`sitemap : ${missing.length} fiches commune absentes (ex. ${missing[0].path})`);

// Routes applicatives : chaque chemin statique de src/App.tsx est prérendu (ou connu du Worker) et chaque route du sitemap existe dans dist.
const WORKER_ROUTES = new Set(["/embed/carte"]);
const distHtmlOf = (route) => (route === "/" ? path.join(distDir, "index.html") : path.join(distDir, route.replace(/^\/+/, ""), "index.html"));
const appSource = await readFile(path.resolve(process.cwd(), "src/App.tsx"), "utf8");
for (const m of appSource.matchAll(/<Route\s+path="([^"]+)"/g)) {
  const route = m[1];
  if (route === "*" || route.includes(":") || route.includes("*") || WORKER_ROUTES.has(route)) continue;
  try {
    await stat(distHtmlOf(route));
  } catch {
    fail(`App.tsx : ${route} n'est ni prérendue (dist${route}/index.html) ni connue du Worker (répondrait 404)`);
  }
}
for (const route of staticRoutes) {
  try {
    await stat(distHtmlOf(route));
  } catch {
    fail(`sitemap : ${route} (staticRoutes) absente de dist`);
  }
}

// Worker : gabarit vierge et index départementaux des communes (404 et fiches non prérendues).
try {
  const shell = await readFile(path.join(distDir, "app-shell.html"), "utf8");
  if (!shell.includes('<div id="root"></div>')) fail("app-shell.html : #root vide introuvable");
  if (/<link\s+rel="canonical"/i.test(shell)) fail("app-shell.html ne doit pas porter de canonical");
} catch {
  fail("app-shell.html absent (gabarit du Worker)");
}
let indexed = 0;
for (const name of await readdir(path.join(distDir, "data/communes")).catch(() => [])) {
  const shard = JSON.parse(await readFile(path.join(distDir, "data/communes", name), "utf8"));
  for (const [code, row] of Object.entries(shard.r)) {
    if (row.length > 1 && !sitemapLocs.has(`${siteUrl}/commune/${code}`)) fail(`sitemap : commune ${code} avec résultats absente`);
    indexed += 1;
  }
}
if (indexed < 30000) fail(`index des communes : ${indexed} communes (au moins 30 000 attendues)`);
for (const r of routes.filter((r) => r.commune)) {
  const dep = r.commune.dep;
  const shard = JSON.parse(await readFile(path.join(distDir, "data/communes", `${dep}.json`), "utf8").catch(() => "{\"r\":{}}"));
  if (!shard.r[r.commune.code]) {
    fail(`index des communes : ${r.commune.code} (prérendue) absente`);
    break;
  }
}

const { files, bytes } = await walk(distDir);
if (files > MAX_FILES) {
  fail(`dist contient ${files} fichiers (seuil ${MAX_FILES}) : limite Cloudflare Workers Static Assets, relever le seuil après vérification du plan`);
}

console.log(
  `[verify-seo] ${routes.length} routes, ${files} fichiers dans dist, ${(bytes / 1048576).toFixed(1)} Mo, ${sitemapLocs.size} URL de sitemap`,
);
if (errors.length) {
  console.error(`[verify-seo] ${errors.length} erreur(s) :\n- ${errors.slice(0, 40).join("\n- ")}${errors.length > 40 ? `\n… et ${errors.length - 40} autres` : ""}`);
  process.exit(1);
}
console.log("[verify-seo] OK");
