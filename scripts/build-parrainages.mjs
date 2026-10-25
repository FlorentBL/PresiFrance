/**
 * Build parrainages JSON from CSV sources.
 * Sources: Conseil constitutionnel (2022, 2017)
 * 2022: presidentielle2022.conseil-constitutionnel.fr
 * 2017: https://www.data.gouv.fr/datasets/parrainages-des-candidats-a-lelection-presidentielle-francaise-de-2017
 *
 * Usage: node scripts/build-parrainages.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "data", "parrainages");

const SOURCES = {
  2022: {
    path: join(ROOT, "parrainages2022.csv"),
    url: "https://presidentielle2022.conseil-constitutionnel.fr/telechargement/parrainagestotal.csv",
  },
  2017: {
    path: join(ROOT, "parrainages2017.csv"),
    url: "https://static.data.gouv.fr/resources/parrainages/20170320-103202/parrainagestotal.csv",
  },
};

async function fetchOrRead(year) {
  const { path, url } = SOURCES[year];
  if (existsSync(path)) {
    return readFileSync(path, "utf-8");
  }
  if (url) {
    console.log(`[parrainages] ${year}: téléchargement depuis data.gouv.fr...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);
    const text = await res.text();
    writeFileSync(path, text, "utf-8");
    console.log(`[parrainages] ${year}: sauvegardé dans ${path}`);
    return text;
  }
  return null;
}

function parseCSVLine(line) {
  const parts = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === ";" || c === ",") && !inQuotes) {
      parts.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  parts.push(current.trim());
  return parts;
}

function parseCSV(content, sep = ";") {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(sep).map((h) => h.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).map((line) => {
    const parts = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (parts[i] || "").replace(/^"|"$/g, "").trim();
    });
    return obj;
  });
  return { headers, rows };
}

function normalizeDep(dep) {
  if (!dep) return null;
  const s = String(dep).trim();
  if (/^\d{2}$/.test(s)) return s;
  if (/^\d{2}[A-Z]?$/.test(s)) return s;
  return s;
}

function buildParrainages(year, content) {
  if (!content) {
    console.warn(`[parrainages] ${year}: pas de contenu CSV`);
    return null;
  }
  const { headers, rows } = parseCSV(content);

  const byCandidat = {};
  const byDep = {};
  const list = [];

  for (const row of rows) {
    const candidat = row.Candidat || row.candidat || row["Candidat-e parrainé-e"] || "";
    const dep = normalizeDep(row.Département || row.departement || row["Département/Collectivité"] || "");
    const nom = row.Nom || row.nom || "";
    const prenom = row.Prénom || row.prenom || row["Prénom"] || "";
    const mandat = row.Mandat || row.mandat || "";
    const circo = row.Circonscription || row.circonscription || row["Commune ou circonscription"] || "";

    if (!candidat) continue;

    const entry = {
      candidat,
      dep,
      nom,
      prenom,
      mandat,
      circonscription: circo,
      date: row["Date de publication"] || row["date de publication"] || "",
    };
    list.push(entry);

    if (!byCandidat[candidat]) byCandidat[candidat] = [];
    byCandidat[candidat].push(entry);

    if (dep) {
      if (!byDep[dep]) byDep[dep] = {};
      if (!byDep[dep][candidat]) byDep[dep][candidat] = 0;
      byDep[dep][candidat]++;
    }
  }

  const candidats = Object.keys(byCandidat).sort();
  const stats = candidats.map((c) => ({
    candidat: c,
    total: byCandidat[c].length,
    departements: new Set(byCandidat[c].map((e) => e.dep).filter(Boolean)).size,
  }));

  return {
    year,
    total: list.length,
    candidats,
    stats,
    byCandidat,
    byDep,
    list,
  };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const manifest = { years: [], sources: {} };

  for (const year of Object.keys(SOURCES).map(Number)) {
    const content = await fetchOrRead(year);
    const data = buildParrainages(year, content);
    if (data) {
      const outFile = join(OUT_DIR, `${year}.json`);
      // `list` et `byDep` dupliquent `byCandidat` / `${year}-by-dep.json` : non publiés.
      const { list: _list, byDep: _byDep, ...published } = data;
      writeFileSync(outFile, JSON.stringify(published, null, 0), "utf-8");
      manifest.years.push(year);
      manifest.sources[year] = { total: data.total, candidats: data.candidats.length };
      console.log(`[parrainages] ${year}: ${data.total} parrainages, ${data.candidats.length} candidats`);

      const byDepFile = join(OUT_DIR, `${year}-by-dep.json`);
      const byDepData = {};
      for (const [dep, cands] of Object.entries(data.byDep)) {
        byDepData[dep] = Object.entries(cands)
          .map(([c, n]) => ({ candidat: c, count: n }))
          .sort((a, b) => b.count - a.count);
      }
      writeFileSync(byDepFile, JSON.stringify(byDepData, null, 0), "utf-8");
    }
  }

  writeFileSync(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");
  console.log("[parrainages] Done. manifest:", manifest);
}

main();
