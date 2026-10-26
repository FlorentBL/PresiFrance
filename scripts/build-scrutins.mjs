/**
 * Génère public/data/scrutins/<scrutin>/t<tour>/<département>.json (législatives 2022 et 2024, européennes
 * 2019 et 2024, municipales 2020 et 2026) et public/data/scrutins/manifest.json.
 *
 * Sources : scripts/scrutins-sources.json (ministère de l'Intérieur via data.gouv.fr). Les fichiers sont téléchargés
 * une fois dans un dossier de cache (hors dépôt) ; le format présidentiel n'est pas touché.
 *
 * Usage :
 *   node scripts/build-scrutins.mjs [--cache DIR] [--only legislatives-2024,europeennes-2024]
 */
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { buildTour, SCRUTIN_FORMAT_VERSION } from "./lib/scrutins.mjs";

const root = path.resolve(import.meta.dirname, "..");
const outRoot = path.join(root, "public/data/scrutins");
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const cacheDir = path.resolve(opt("--cache") ?? path.join(os.tmpdir(), "presifrance-scrutins"));
const only = opt("--only")?.split(",");

const sources = JSON.parse(await readFile(path.join(import.meta.dirname, "scrutins-sources.json"), "utf8"));
const snapshot = JSON.parse(await readFile(path.join(import.meta.dirname, "data/communes-1000.json"), "utf8"));
const communes1000 = new Set(snapshot.rows.map((r) => r[0]));

async function download(tour, id) {
  const file = path.join(cacheDir, `${id}-t${tour.tour}.src`);
  if (existsSync(file) && (await stat(file)).size > 0) return file;
  await mkdir(cacheDir, { recursive: true });
  const response = await fetch(tour.url);
  if (!response.ok) throw new Error(`${tour.url} : HTTP ${response.status}`);
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
  return file;
}

const manifestPath = path.join(outRoot, "manifest.json");
const previous = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, "utf8")) : { scrutins: [] };
const manifest = { v: SCRUTIN_FORMAT_VERSION, verifiedOn: sources.verifiedOn, scrutins: [] };

for (const scrutin of sources.scrutins) {
  if (only && !only.includes(scrutin.id)) {
    const kept = previous.scrutins.find((s) => s.id === scrutin.id);
    if (kept) manifest.scrutins.push(kept);
    continue;
  }
  await rm(path.join(outRoot, scrutin.id), { recursive: true, force: true });
  const tours = [];
  for (const tour of scrutin.tours) {
    const file = await download(tour, scrutin.id);
    const text = (await readFile(file)).toString(tour.encoding === "latin1" ? "latin1" : "utf8");
    const files = buildTour(scrutin, tour.tour, text, {
      delimiter: tour.delimiter,
      only: scrutin.onlyCommunes1000 ? communes1000 : undefined,
    });
    if (files.skipped.length) console.warn(`[scrutins] ${scrutin.id} t${tour.tour} : communes écartées (voix incohérentes avec les exprimés) : ${files.skipped.join(", ")}`);
    let communes = 0;
    let bytes = 0;
    for (const [dep, content] of files) {
      const dir = path.join(outRoot, scrutin.id, `t${tour.tour}`);
      await mkdir(dir, { recursive: true });
      const json = JSON.stringify(content);
      await writeFile(path.join(dir, `${dep}.json`), json, "utf8");
      communes += Object.keys(content.rows).length;
      bytes += Buffer.byteLength(json);
    }
    if (communes < 1000) throw new Error(`${scrutin.id} tour ${tour.tour} : ${communes} communes seulement, source suspecte`);
    tours.push({ tour: tour.tour, skipped: files.skipped.length, files: files.size, communes, bytes, departments: [...files.keys()].sort(), source: tour.url, dataset: tour.dataset });
    console.log(`[scrutins] ${scrutin.id} t${tour.tour} : ${files.size} fichiers, ${communes} communes, ${(bytes / 1e6).toFixed(2)} Mo`);
  }
  manifest.scrutins.push({
    id: scrutin.id,
    label: scrutin.label,
    title: scrutin.title,
    date: scrutin.date,
    kind: scrutin.kind,
    license: scrutin.license,
    dataset: scrutin.dataset,
    tours,
  });
}

await mkdir(outRoot, { recursive: true });
await writeFile(manifestPath, JSON.stringify(manifest, null, 1) + "\n", "utf8");
const total = manifest.scrutins.flatMap((s) => s.tours);
console.log(`[scrutins] total : ${total.reduce((a, t) => a + t.files, 0)} fichiers, ${(total.reduce((a, t) => a + t.bytes, 0) / 1e6).toFixed(1)} Mo`);
