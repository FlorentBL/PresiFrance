// Faits par année (nombre de candidats au 1er tour, départements disposant de résultats, niveau de détail) lus dans public/data.
// Le même contenu est figé dans src/content/years-facts.json (npm run build:year-facts) pour la page React ;
// seo-content.test.mjs vérifie que le fichier est à jour.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { departmentCodes, presidentialYears } from "../../seo-routes.mjs";
import { loadCommuneSnapshot } from "./data.mjs";

const root = path.resolve(import.meta.dirname, "../../..");
export const TOP_COMMUNES = 8;

export function computeYearFacts() {
  const years = {};
  for (const year of [...presidentialYears].sort((a, b) => a - b)) {
    const dir = path.join(root, "public/data/presidential", String(year), "t1");
    const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
    const first = JSON.parse(readFileSync(path.join(dir, files[0]), "utf8"));
    const codes = new Set(files.map((f) => f.replace(".json", "")));
    years[year] = {
      candidatsT1: first.candidates.length,
      communeLevel: first.niveau !== "departement",
      deps: departmentCodes.filter((c) => codes.has(c)),
    };
  }
  const topCommunes = [...loadCommuneSnapshot().communes]
    .sort((a, b) => b.population - a.population)
    .slice(0, TOP_COMMUNES)
    .map((c) => ({ code: c.code, nom: c.nom }));
  return { years, topCommunes };
}
