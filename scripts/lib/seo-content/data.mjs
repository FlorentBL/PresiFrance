// Chargement (une seule fois par build) des données publiques du dépôt utilisées par le prérendu.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const presidentialDir = path.join(root, "public/data/presidential");

/** Années disposant de résultats par commune (les scrutins plus anciens sont au niveau département). */
export const COMMUNE_YEARS = [1995, 2002, 2007, 2012, 2017, 2022];
export const LATEST_YEAR = 2022;

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

let snapshotCache;
/** Communes de 1 000 habitants et plus : { code, nom, dep, population, lon, lat }. */
export function loadCommuneSnapshot() {
  if (!snapshotCache) {
    const raw = readJson(path.join(root, "scripts/data/communes-1000.json"));
    snapshotCache = {
      source: raw.source,
      generatedAt: raw.generatedAt,
      communes: raw.rows.map(([code, nom, dep, population, lon, lat]) => ({ code, nom, dep, population, lon, lat })),
    };
  }
  return snapshotCache;
}

/** Clé du fichier compact -> code INSEE (les DOM sont codés ZA101… dans les fichiers du ministère). */
function inseeKey(key) {
  if (/^Z[A-DMX]\d{3}$/.test(key)) return `97${key[2]}${key.slice(3)}`;
  return key;
}

function depOfCode(code) {
  return code.startsWith("97") ? code.slice(0, 3) : code.slice(0, 2);
}

const plain = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase();

let nationalNames;
/** Les fichiers communaux 1995 et 2002 écrivent les prénoms en capitales sans accents : on reprend ceux des résultats nationaux. */
function canonicalName(year, nom, prenom) {
  if (!nationalNames) {
    nationalNames = new Map();
    for (const [y, rounds] of Object.entries(loadNational())) {
      for (const round of Object.values(rounds)) {
        for (const c of round.candidates) nationalNames.set(`${y}|${plain(c.nom)}`, c);
      }
    }
  }
  const hit = nationalNames.get(`${year}|${plain(nom)}`);
  return hit ? { nom: hit.nom, prenom: hit.prenom } : { nom, prenom };
}

function decodeRow(file, key, year) {
  const row = file.rows[key];
  const [nomCommune, inscrits, , votants, blancs, nuls, exprimes] = row;
  const candidates = [];
  for (let i = 7; i < row.length; i++) {
    if (row[i] === null || row[i] === undefined) continue;
    const [nom, prenom] = file.candidates[i - 7];
    candidates.push({ ...canonicalName(year, nom, prenom), voix: row[i] });
  }
  candidates.sort((a, b) => b.voix - a.voix);
  return { nomCommune, inscrits, votants, blancs, nuls, exprimes, candidates };
}

let resultsCache;
/**
 * byCommune : Map code -> { [année]: { 1: résultat, 2: résultat } } (communes du snapshot uniquement)
 * byDepartment : Map code département -> { [année]: { 1: agrégat, 2: agrégat } } (années communales)
 */
export function loadResults() {
  if (resultsCache) return resultsCache;
  const wanted = new Set(loadCommuneSnapshot().communes.map((c) => c.code));
  const byCommune = new Map();
  const byDepartment = new Map();

  for (const year of COMMUNE_YEARS) {
    for (const round of [1, 2]) {
      const dir = path.join(presidentialDir, String(year), `t${round}`);
      if (!existsSync(dir)) continue;
      for (const name of readdirSync(dir)) {
        const file = readJson(path.join(dir, name));
        for (const key of Object.keys(file.rows)) {
          const code = inseeKey(key);
          if (file.niveau === "departement" || !/^\d[\dAB]\d{3}$/.test(code)) continue;
          const decoded = decodeRow(file, key, year);
          if (wanted.has(code)) {
            const perYear = byCommune.get(code) ?? {};
            (perYear[year] ??= {})[round] = decoded;
            byCommune.set(code, perYear);
          }
          // agrégat départemental
          const dep = depOfCode(code);
          const depYears = byDepartment.get(dep) ?? {};
          const agg = ((depYears[year] ??= {})[round] ??= { inscrits: 0, votants: 0, exprimes: 0, communes: 0, voix: new Map() });
          agg.inscrits += decoded.inscrits;
          agg.votants += decoded.votants;
          agg.exprimes += decoded.exprimes;
          agg.communes += 1;
          for (const c of decoded.candidates) {
            const k = `${c.prenom}|${c.nom}`;
            agg.voix.set(k, (agg.voix.get(k) ?? 0) + c.voix);
          }
          byDepartment.set(dep, depYears);
        }
      }
    }
  }
  resultsCache = { byCommune, byDepartment };
  return resultsCache;
}

let nationalCache;
export function loadNational() {
  return (nationalCache ??= readJson(path.join(presidentialDir, "national-results.json")));
}

export function load2027() {
  return {
    candidats: readJson(path.join(presidentialDir, "2027/candidats.json")),
    calendrier: readJson(path.join(presidentialDir, "2027/calendrier.json")),
  };
}

/** Communes prérendues : 1 000 hab. et plus, avec des résultats 2022 au 1er tour. */
export function eligibleCommunes() {
  const { byCommune } = loadResults();
  return loadCommuneSnapshot().communes.filter((c) => byCommune.get(c.code)?.[LATEST_YEAR]?.[1]);
}
