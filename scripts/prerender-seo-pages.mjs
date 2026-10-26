import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildBody, buildJsonLd, generatedRoutes } from "./lib/seo-content/index.mjs";
import { seoPrerenderRoutes } from "./seo-routes.mjs";

const distDir = path.resolve(process.cwd(), "dist");
const siteUrl = String(process.env.SITE_URL || "https://presifrance.fr").replace(/\/+$/, "");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function upsertMeta(html, selector, tag) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<meta\\s+${escapedSelector}[^>]*>`, "i");
  if (re.test(html)) return html.replace(re, tag);
  return html.replace("</head>", `  ${tag}\n</head>`);
}

function upsertCanonical(html, href) {
  const tag = `<link rel="canonical" href="${escapeHtml(href)}" />`;
  if (/<link\s+rel="canonical"[^>]*>/i.test(html)) {
    return html.replace(/<link\s+rel="canonical"[^>]*>/i, tag);
  }
  return html.replace("</head>", `  ${tag}\n</head>`);
}

function renderRouteHtml(baseHtml, route) {
  const url = `${siteUrl}${route.path === "/" ? "/" : route.path}`;
  let html = baseHtml;
  html = html.replace(/<title>.*?<\/title>/is, `<title>${escapeHtml(route.title)}</title>`);
  html = upsertMeta(html, 'name="description"', `<meta name="description" content="${escapeHtml(route.description)}" />`);
  html = upsertMeta(html, 'property="og:title"', `<meta property="og:title" content="${escapeHtml(route.title)}" />`);
  html = upsertMeta(html, 'property="og:description"', `<meta property="og:description" content="${escapeHtml(route.description)}" />`);
  html = upsertMeta(html, 'property="og:url"', `<meta property="og:url" content="${escapeHtml(url)}" />`);
  html = upsertMeta(html, 'name="twitter:title"', `<meta name="twitter:title" content="${escapeHtml(route.title)}" />`);
  html = upsertMeta(html, 'name="twitter:description"', `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`);
  // dist/index.html sert aussi de fallback SPA (routes non prérendues) : SEOHead réécrit ce canonical côté client.
  html = upsertCanonical(html, url);
  for (const data of buildJsonLd(route)) {
    // « < » échappé : un texte de réponse ne peut pas fermer la balise <script>.
    const json = JSON.stringify(data).replaceAll("<", "\\u003c");
    html = html.replace("</head>", () => `  <script type="application/ld+json">${json}</script>\n</head>`);
  }
  html = html.replace('<div id="root"></div>', () => `<div id="root">${buildBody(route)}</div>`);
  return html;
}

function routeOutputPath(routePath) {
  if (routePath === "/") return path.join(distDir, "index.html");
  return path.join(distDir, routePath.replace(/^\/+/, ""), "index.html");
}

const started = Date.now();
const baseHtml = await readFile(path.join(distDir, "index.html"), "utf8");
if (!baseHtml.includes('<div id="root"></div>')) throw new Error("[prerender] #root introuvable dans dist/index.html");

// Gabarit vierge pour le Worker (404, fiches commune non prérendues) : écrit avant que "/" ne réécrive dist/index.html.
await writeFile(path.join(distDir, "app-shell.html"), baseHtml, "utf8");

const routes = [...seoPrerenderRoutes, ...generatedRoutes()];
const paths = new Set();
for (const route of routes) {
  if (paths.has(route.path)) throw new Error(`[prerender] route en double : ${route.path}`);
  paths.add(route.path);
}

// Le HTML de base est lu une fois : "/" réécrit dist/index.html en dernier pour ne pas contaminer les autres routes.
const ordered = [...routes.filter((r) => r.path !== "/"), ...routes.filter((r) => r.path === "/")];
for (const route of ordered) {
  const filePath = routeOutputPath(route.path);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, renderRouteHtml(baseHtml, route), "utf8");
}

console.log(`[prerender] wrote ${routes.length} SEO HTML routes in ${((Date.now() - started) / 1000).toFixed(1)}s`);
