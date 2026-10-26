#!/usr/bin/env node
/**
 * Récupère les résultats de la soirée électorale 2027 (ministère de l'Intérieur) et les normalise
 * vers public/data/live-2027/ (voir docs/soiree-electorale-2027.md).
 *
 * Usage :
 *   node scripts/fetch-live-2027.mjs                      # lit scripts/live-2027.config.json (enabled doit valoir true)
 *   node scripts/fetch-live-2027.mjs --round 1 --final    # fige le tour en « définitif » (après proclamation)
 *   node scripts/fetch-live-2027.mjs --reset              # remet tous les tours à « à venir » (retour arrière)
 *   node scripts/fetch-live-2027.mjs --round 1 --input-dir scripts/fixtures/live-2022 --prefix t1- --out /tmp/x
 *                                                         # test hors réseau : <prefix>national.txt, departements.txt, communes.txt
 *
 * URLs : jamais codées en dur ; config ou variables LIVE_2027_URL_NATIONAL / _DEPARTEMENTS / _COMMUNES.
 * Codes de sortie : 0 ok ou désactivé, 2 configuration invalide, 3 source inaccessible ou fichier rejeté.
 */
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildRoundFiles, decodeText, emptyStatus, mergeStatus, parseMinistryCsv } from "./lib/live-results.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name) => (argv.includes(`--${name}`) ? argv[argv.indexOf(`--${name}`) + 1] : undefined);

const outDir = path.resolve(opt("out") ?? path.join(root, "public/data/live-2027"));
const log = (m) => console.log(`[live-2027] ${m}`);
const fail = (code, m) => {
  console.error(`[live-2027] ERREUR : ${m}`);
  process.exit(code);
};

async function writeJson(rel, data) {
  const file = path.join(outDir, rel);
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(data));
  await rename(tmp, file);
}

async function readStatus() {
  try {
    return JSON.parse(await readFile(path.join(outDir, "status.json"), "utf8"));
  } catch {
    return null;
  }
}

async function download(url) {
  const res = await fetch(url, { headers: { "User-Agent": "PresiFrance-live-2027 (+https://presifrance.fr)" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

const config = JSON.parse(await readFile(path.join(root, "scripts/live-2027.config.json"), "utf8"));
const inputDir = opt("input-dir");

if (flag("reset")) {
  await writeJson("status.json", emptyStatus());
  for (const t of ["t1", "t2"]) await rm(path.join(outDir, t), { recursive: true, force: true });
  log("remise à zéro : tous les tours sont « à venir ».");
  process.exit(0);
}

if (!inputDir && config.enabled !== true) {
  log("désactivé (scripts/live-2027.config.json : enabled = false) : rien à faire.");
  process.exit(0);
}

const round = Number(opt("round") ?? process.env.LIVE_2027_ROUND ?? config.round);
if (![1, 2].includes(round)) fail(2, "tour inconnu : renseigner `round` (1 ou 2) dans la configuration ou --round.");
const final = flag("final") || config.final === true;

const src = config.sources?.[`t${round}`] ?? {};
const urls = {
  national: process.env.LIVE_2027_URL_NATIONAL || src.national,
  departements: process.env.LIVE_2027_URL_DEPARTEMENTS || src.departements,
  communes: process.env.LIVE_2027_URL_COMMUNES || src.communes,
};
if (!inputDir) {
  const missing = Object.entries(urls).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) fail(2, `URL de source non renseignée (${missing.join(", ")}) pour le tour ${round}.`);
}

let parsed;
try {
  const read = async (k) =>
    inputDir ? readFile(path.join(inputDir, `${opt("prefix") ?? ""}${k}.txt`)) : download(urls[k]);
  parsed = {};
  for (const k of ["national", "departements", "communes"]) parsed[k] = parseMinistryCsv(decodeText(await read(k)));
} catch (e) {
  fail(3, `lecture des sources : ${e.message}`);
}

try {
  const { summary, files } = buildRoundFiles(parsed, {
    round,
    final,
    fetchedAt: new Date().toISOString(),
    source: {
      label: src.label || "Ministère de l'Intérieur, résultats de la soirée électorale (open data)",
      url: inputDir ? null : urls.communes,
    },
    inscritsReference: config.inscritsReference?.[`t${round}`] ?? null,
  });
  const status = mergeStatus(await readStatus(), round, summary);
  // Les fichiers de données d'abord, le statut en dernier : la page ne voit jamais un statut sans ses données.
  await rm(path.join(outDir, `t${round}`), { recursive: true, force: true });
  for (const [rel, data] of Object.entries(files)) await writeJson(rel, data);
  await writeJson("status.json", status);
  log(`tour ${round} : ${summary.state}, ${summary.couvertureInscrits} % des inscrits, ${summary.communesCompletes}/${summary.communesTotal} communes, ${Object.keys(files).length} fichiers.`);
} catch (e) {
  fail(3, e.message);
}
