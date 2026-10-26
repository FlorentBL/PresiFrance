// Instantané des communes de 1 000 habitants et plus (geo.api.gouv.fr), utilisé au build pour
// prérendre /commune/<code>. Hors build : `npm run build:communes` (réseau requis), puis commit.
import { writeFile } from "node:fs/promises";
import path from "node:path";

const MIN_POPULATION = 1000;
const url = "https://geo.api.gouv.fr/communes?fields=nom,code,codeDepartement,population,centre&format=json&geometry=centre";
const response = await fetch(url);
if (!response.ok) throw new Error(`geo.api.gouv.fr: ${response.status}`);
const all = await response.json();

// Ligne : [code, nom, codeDepartement, population, longitude, latitude]
const rows = all
  .filter((c) => c.population >= MIN_POPULATION && c.centre?.coordinates)
  .sort((a, b) => a.code.localeCompare(b.code))
  .map((c) => [c.code, c.nom, c.codeDepartement, c.population, ...c.centre.coordinates.map((n) => Math.round(n * 1e4) / 1e4)]);

const out = {
  source: "geo.api.gouv.fr/communes (population légale INSEE)",
  generatedAt: new Date().toISOString().slice(0, 10),
  minPopulation: MIN_POPULATION,
  columns: ["code", "nom", "codeDepartement", "population", "lon", "lat"],
  rows,
};
await writeFile(path.resolve("scripts/data/communes-1000.json"), JSON.stringify(out), "utf8");
console.log(`[communes] ${rows.length} communes >= ${MIN_POPULATION} habitants`);
