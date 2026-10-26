// Contrôle du HTML prérendu après build (postbuild) : le build échoue si une route prérendue est vide ou mal balisée.
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

import { generatedRoutes } from "./lib/seo-content/index.mjs";
import { visibleText } from "./lib/seo-content/html.mjs";
import { seoPrerenderRoutes } from "./seo-routes.mjs";

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
  if (route.path === "/") {
    // dist/index.html est aussi le fallback SPA : un canonical figé y pointerait toutes les routes non prérendues vers l'accueil.
    if (canon.length) fail("/ : dist/index.html (fallback SPA) ne doit pas porter de canonical");
  } else if (canon.length !== 1) {
    fail(`${route.path} : ${canon.length} balises canonical (1 attendue)`);
  } else {
    const expected = `${siteUrl}${route.path}`;
    if (canon[0][1] !== expected) fail(`${route.path} : canonical ${canon[0][1]} (attendu ${expected})`);
    if (canonicals.has(canon[0][1])) fail(`${route.path} : canonical déjà utilisé par ${canonicals.get(canon[0][1])}`);
    canonicals.set(canon[0][1], route.path);
  }

  const title = /<title>(.*?)<\/title>/is.exec(html)?.[1]?.trim();
  if (!title) fail(`${route.path} : title absent`);
  else if (titles.has(title)) fail(`${route.path} : title identique à ${titles.get(title)} (« ${title} »)`);
  else titles.set(title, route.path);

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

// robots.txt : robots des IA admis (décision du 26/10/2026), /data/ et /assets/ fermés.
const robots = await readFile(path.join(distDir, "robots.txt"), "utf8");
for (const bot of ["GPTBot", "CCBot", "ClaudeBot", "PerplexityBot", "Amazonbot"]) {
  if (robots.includes(bot)) fail(`robots.txt : ${bot} ne doit plus être traité à part`);
}
for (const rule of ["Disallow: /data/", "Disallow: /assets/"]) {
  if (!robots.includes(rule)) fail(`robots.txt : « ${rule} » manquant`);
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
