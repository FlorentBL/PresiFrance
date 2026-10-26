import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { eligibleCommunes } from "./lib/seo-content/data.mjs";
import { departmentRoutes, staticRoutes } from "./seo-routes.mjs";

const distDir = path.resolve(process.cwd(), "dist");

// Configure with: SITE_URL="https://presifrance.fr" npm run build
const siteUrl = String(process.env.SITE_URL || "https://presifrance.fr").replace(/\/+$/, "");

export function isoDate(d = new Date()) {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function escapeXml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

const lastmod = isoDate();
const allRoutes = [
  ...staticRoutes.map(r => ({ loc: `${siteUrl}${r}`, priority: "1.0" })),
  ...departmentRoutes.map(r => ({ loc: `${siteUrl}${r}`, priority: "0.8" })),
];

// Helper to split into chunks of 50k (Google limit)
export function chunkSitemap(routes, chunkSize = 45000) {
  const chunks = [];
  for (let i = 0; i < routes.length; i += chunkSize) {
    chunks.push(routes.slice(i, i + chunkSize));
  }
  return chunks;
}

function urlsetXml(routes) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    routes.map(r => `  <url>\n    <loc>${escapeXml(r.loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`).join("\n") +
    `\n</urlset>\n`;
}

export async function generateSitemaps() {
  await mkdir(distDir, { recursive: true });

  // Fiches commune : mêmes communes que celles prérendues (1 000 habitants et plus, résultats disponibles).
  const communeRoutes = eligibleCommunes().map(c => ({ loc: `${siteUrl}/commune/${c.code}`, priority: "0.5" }));

  // sitemap.xml est un index : pages du site, puis fiches commune (découpées si besoin).
  const files = [{ name: "sitemap-pages.xml", routes: allRoutes }];
  chunkSitemap(communeRoutes).forEach((routes, i, all) => {
    files.push({ name: all.length === 1 ? "sitemap-communes.xml" : `sitemap-communes-${i}.xml`, routes });
  });

  const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    files.map(f => `  <sitemap>\n    <loc>${siteUrl}/${f.name}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`).join("\n") +
    `\n</sitemapindex>\n`;
  await writeFile(path.join(distDir, "sitemap.xml"), sitemapIndexXml, "utf8");
  for (const f of files) await writeFile(path.join(distDir, f.name), urlsetXml(f.routes), "utf8");

  // Tous les robots sont admis (décision du 26/10/2026, y compris les robots des IA). /assets/ et /data/ restent ouverts : Google doit
  // exécuter le JS et charger les données ; /data/ est exclu de l'index par X-Robots-Tag (public/_headers).
  const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
  await writeFile(path.join(distDir, "robots.txt"), robotsTxt, "utf8");

  const total = files.reduce((n, f) => n + f.routes.length, 0);
  console.log(`[sitemap] wrote ${total} URLs across ${files.length} sitemap file(s) + index (SITE_URL=${siteUrl})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await generateSitemaps();
}
