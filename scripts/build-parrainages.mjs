/**
 * Build parrainages JSON from CSV sources.
 * Sources: Conseil constitutionnel (2027, 2022, 2017)
 * 2022: presidentielle2022.conseil-constitutionnel.fr
 * 2017: https://www.data.gouv.fr/datasets/parrainages-des-candidats-a-lelection-presidentielle-francaise-de-2017
 * 2027: URL non publiée à ce jour (« publication à venir ») : à fournir via PARRAINAGES_2027_URL
 *       ou --url, ou un CSV local via PARRAINAGES_2027_FILE / --file / parrainages2027.csv.
 *
 * Usage:
 *   node scripts/build-parrainages.mjs                 # toutes les années
 *   node scripts/build-parrainages.mjs --year 2027 [--file chemin.csv | --url https://...]
 *   (fichier d'exemple de validation : scripts/fixtures/parrainages-sample-2022.csv)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { buildParrainages, snapshotOf, appendSnapshot, resolveSource } from "./lib/parrainages.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "data", "parrainages");

const SOURCES = {
  2027: {
    path: join(ROOT, "parrainages2027.csv"),
    url: null,
    refresh: true, // publication en cours : on retélécharge à chaque exécution
  },
  2022: {
    path: join(ROOT, "parrainages2022.csv"),
    url: "https://presidentielle2022.conseil-constitutionnel.fr/telechargement/parrainagestotal.csv",
  },
  2017: {
    path: join(ROOT, "parrainages2017.csv"),
    url: "https://static.data.gouv.fr/resources/parrainages/20170320-103202/parrainagestotal.csv",
  },
};
/** Années suivies en direct : un historique daté des publications est conservé. */
const TRACKED_YEARS = [2027];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) args[argv[i].slice(2)] = argv[i + 1]?.startsWith("--") ? true : argv[++i];
  }
  return args;
}

async function fetchOrRead(year, args) {
  const { path, url, refresh } = resolveSource(year, SOURCES, { env: process.env, args });
  const explicitFile = args.file || process.env[`PARRAINAGES_${year}_FILE`];
  if (path && existsSync(path) && (explicitFile || !(refresh && url))) {
    return readFileSync(path, "utf-8");
  }
  if (url) {
    console.log(`[parrainages] ${year}: téléchargement depuis ${url}...`);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);
      const text = await res.text();
      if (path) writeFileSync(path, text, "utf-8");
      return text;
    } catch (err) {
      // Pour une année suivie, l'échec (404, réseau) signifie « publication à venir ».
      if (TRACKED_YEARS.includes(year)) {
        console.warn(`[parrainages] ${year}: source indisponible (${err.message}) : publication à venir.`);
        return null;
      }
      throw err;
    }
  }
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const only = args.year ? Number(args.year) : null;
  mkdirSync(OUT_DIR, { recursive: true });

  const manifestPath = join(OUT_DIR, "manifest.json");
  const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf-8")) : null;
  const years = new Set(previous?.years ?? []);
  const sources = { ...(previous?.sources ?? {}) };
  const pending = new Set(previous?.pending ?? []);

  for (const year of Object.keys(SOURCES).map(Number)) {
    if (only && year !== only) continue;
    const content = await fetchOrRead(year, args);
    const data = buildParrainages(year, content);
    if (!data) {
      console.warn(`[parrainages] ${year}: pas de données`);
      if (TRACKED_YEARS.includes(year) && !years.has(year)) pending.add(year);
      continue;
    }
    const { list: _list, byDep, ...published } = data;
    writeFileSync(join(OUT_DIR, `${year}.json`), JSON.stringify(published, null, 0), "utf-8");
    years.add(year);
    pending.delete(year);
    sources[year] = {
      total: data.total,
      candidats: data.candidats.length,
      departements: data.departements,
      lastPublication: data.lastPublication,
    };
    console.log(`[parrainages] ${year}: ${data.total} parrainages, ${data.candidats.length} candidats, ${data.departements} départements`);

    const byDepData = {};
    for (const [dep, cands] of Object.entries(byDep)) {
      byDepData[dep] = Object.entries(cands)
        .map(([c, n]) => ({ candidat: c, count: n }))
        .sort((a, b) => b.count - a.count);
    }
    writeFileSync(join(OUT_DIR, `${year}-by-dep.json`), JSON.stringify(byDepData, null, 0), "utf-8");

    if (TRACKED_YEARS.includes(year)) {
      const histPath = join(OUT_DIR, `${year}-history.json`);
      const history = existsSync(histPath) ? JSON.parse(readFileSync(histPath, "utf-8")) : [];
      const { history: next, added } = appendSnapshot(history, snapshotOf(data, new Date().toISOString()));
      if (added) writeFileSync(histPath, JSON.stringify(next, null, 0), "utf-8");
      console.log(`[parrainages] ${year}: historique ${added ? "complété" : "inchangé"} (${next.length} publication(s))`);
    }
  }

  const manifest = { years: [...years].sort((a, b) => a - b), sources };
  if (pending.size) manifest.pending = [...pending].sort((a, b) => a - b);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  console.log("[parrainages] Done. manifest:", manifest);
}

main();
