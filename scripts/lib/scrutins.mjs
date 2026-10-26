/**
 * Autres scrutins par commune (législatives 2022 et 2024, européennes 2019 et 2024, municipales 2020 et 2026).
 *
 * Les fichiers du ministère de l'Intérieur sont « larges » : une ligne par commune, puis un bloc de colonnes par
 * candidat ou par liste. Ce module les lit (CSV ou TXT, UTF-8 ou ISO-8859-1), normalise les codes en codes INSEE,
 * agrège et encode au format compact lu par src/lib/api/scrutinsApi.ts.
 *
 * Trois genres de scrutin (champ `kind` des fichiers produits) :
 *  - "nuance" : législatives. Les candidats changent d'une circonscription à l'autre ; on additionne donc les voix
 *    par nuance politique (RN, ENS, NUP…) sur toutes les circonscriptions qui recoupent la commune.
 *  - "list"   : européennes. Mêmes listes partout : noms écrits une fois dans l'en-tête du fichier.
 *  - "local"  : municipales. Chaque commune a ses propres listes, écrites dans sa ligne.
 *
 * Ligne : [nomCommune, inscrits, abstentions, votants, blancs, nuls, exprimes, ...voix] pour "nuance" et "list"
 * (une voix par entrée de l'en-tête, null si absente) ; pour "local", la 8ᵉ valeur est la liste des listes
 * [[libellé, nuance, voix, sièges, tête de liste], ...] triées par voix décroissantes.
 */

import { readFileSync } from "node:fs";

export const SCRUTIN_FORMAT_VERSION = 1;

const strip = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

/** Découpe une ligne CSV (guillemets facultatifs, séparateur simple). */
export function splitLine(line, delim) {
  if (!line.includes('"')) return line.split(delim);
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/** « 1 234 », « 12,5% », « » -> nombre ou null. */
export function toNumber(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).replace(/[\s  %]/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const ZONE_PREFIX = { ZA: "97", ZB: "97", ZC: "97", ZD: "97", ZM: "97", ZS: "97", ZX: "97", ZN: "98", ZP: "98" };

/**
 * Code INSEE à cinq caractères depuis (département, commune) tels que publiés. Renvoie null pour les Français de
 * l'étranger (ZZ) ou un code inexploitable.
 */
export function inseeCode(dep, com) {
  const d = String(dep).trim().toUpperCase();
  const c = String(com).trim().toUpperCase();
  if (!d || !c || d === "ZZ") return null;
  let code;
  if (c.length >= 4) code = c.padStart(5, "0");
  else if (ZONE_PREFIX[d]) code = `${ZONE_PREFIX[d]}${c.padStart(3, "0")}`;
  else if (/^9[78]\d$/.test(d)) code = `${d.slice(0, 2)}${c.padStart(3, "0")}`.slice(0, 5);
  else code = `${d.padStart(2, "0")}${c.padStart(3, "0")}`;
  return /^(\d{5}|2[AB]\d{3})$/.test(code) ? code : null;
}

/** Fichier compact d'un département : « 97… » -> trois premiers caractères, sinon deux. */
export function depOfCode(code) {
  return /^9[78]/.test(code) ? code.slice(0, 3) : code.slice(0, 2);
}

/** Paris, Lyon et Marseille : les fichiers de certains scrutins sont publiés par arrondissement. */
export function parentCommune(code) {
  if (/^751(0[1-9]|1\d|20)$/.test(code)) return "75056";
  if (/^132(0[1-9]|1[0-6])$/.test(code)) return "13055";
  if (/^6938[1-9]$/.test(code)) return "69123";
  return code;
}

const HEAD_FIELDS = {
  dep: ["code du departement", "code departement"],
  com: ["code de la commune", "code commune"],
  nom: ["libelle de la commune", "libelle commune"],
  inscrits: ["inscrits"],
  abstentions: ["abstentions"],
  votants: ["votants"],
  blancs: ["blancs"],
  nuls: ["nuls"],
  exprimes: ["exprimes"],
};

const BLOCK_START = /^(numero de panneau|n°panneau|n\.pan\.|n°liste)/;

const BLOCK_FIELDS = {
  panneau: [BLOCK_START],
  nuance: [/^nuance( candidat| liste)?$/, /^code nuance$/],
  court: [/^libelle abrege( de)? liste$/],
  long: [/^libelle de liste$/, /^libelle etendu liste$/, /^liste$/],
  tete: [/^nom tete de liste$/],
  nom: [/^nom( candidat)?$/],
  prenom: [/^prenom( candidat)?$/],
  voix: [/^voix$/],
  sieges: [/^sieges au cm$/, /^sieges \/ elu$/],
};

const baseName = (h) => strip(h).replace(/\s+\d+$/, "");

/** Repère les colonnes d'après la ligne d'en-tête (les intitulés varient d'un fichier à l'autre). */
export function readHeader(headerCells) {
  const names = headerCells.map(baseName);
  while (names.length && !names[names.length - 1]) names.pop();

  const head = {};
  for (const [key, labels] of Object.entries(HEAD_FIELDS)) {
    const idx = names.findIndex((n) => labels.includes(n));
    if (idx >= 0) head[key] = idx;
  }
  for (const required of ["dep", "com", "nom", "inscrits", "exprimes"]) {
    if (head[required] === undefined) throw new Error(`Colonne « ${required} » introuvable dans l'en-tête`);
  }

  const start = names.findIndex((n) => BLOCK_START.test(n));
  if (start < 0) throw new Error("Aucun bloc de candidats ou de listes dans l'en-tête");
  const second = names.findIndex((n, i) => i > start && BLOCK_START.test(n));
  const size = second > 0 ? second - start : names.length - start;
  const block = {};
  for (const [key, patterns] of Object.entries(BLOCK_FIELDS)) {
    const offset = names.slice(start, start + size).findIndex((n) => patterns.some((p) => p.test(n)));
    if (offset >= 0) block[key] = offset;
  }
  if (block.voix === undefined) throw new Error("Colonne « voix » introuvable dans les blocs");
  return { head, start, size, block };
}

const clean = (v) => (v === undefined || v === null ? "" : String(v).trim());

/**
 * Lit un fichier du ministère. Renvoie un tableau de lignes brutes :
 * { code, nom, inscrits, abstentions, votants, blancs, nuls, exprimes, entries: [{ nuance, court, long, tete, nom, prenom, voix, sieges }] }.
 */
export function parseWideFile(text, { delimiter = ";" } = {}) {
  const lines = text.split(/\r?\n/);
  const layout = readHeader(splitLine(lines[0], delimiter));
  const { head, start, size, block } = layout;
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cells = splitLine(line, delimiter);
    const code = inseeCode(cells[head.dep], cells[head.com]);
    if (!code) continue;
    const entries = [];
    for (let at = start; at < cells.length; at += size) {
      const voix = toNumber(cells[at + block.voix]);
      if (voix === null) continue;
      const get = (key) => (block[key] === undefined ? "" : clean(cells[at + block[key]]));
      entries.push({
        nuance: get("nuance"),
        court: get("court"),
        long: get("long"),
        tete: get("tete"),
        nom: get("nom"),
        prenom: get("prenom"),
        voix,
        sieges: toNumber(get("sieges")),
      });
    }
    const num = (key) => (head[key] === undefined ? 0 : (toNumber(cells[head[key]]) ?? 0));
    out.push({
      code,
      nom: clean(cells[head.nom]),
      inscrits: num("inscrits"),
      abstentions: num("abstentions"),
      votants: num("votants"),
      blancs: num("blancs"),
      nuls: num("nuls"),
      exprimes: num("exprimes"),
      entries,
    });
  }
  return out;
}

/** Additionne les lignes d'une même commune (circonscriptions législatives, arrondissements). */
export function mergeByCommune(rows, { keyOf }) {
  const byCode = new Map();
  for (const r of rows) {
    const code = parentCommune(r.code);
    let cur = byCode.get(code);
    if (!cur) {
      cur = { code, nom: code === r.code ? r.nom : PARENT_NAMES[code], inscrits: 0, abstentions: 0, votants: 0, blancs: 0, nuls: 0, exprimes: 0, entries: new Map() };
      byCode.set(code, cur);
    }
    for (const f of ["inscrits", "abstentions", "votants", "blancs", "nuls", "exprimes"]) cur[f] += r[f];
    for (const e of r.entries) {
      const k = keyOf(e);
      const prev = cur.entries.get(k);
      if (prev) prev.voix += e.voix;
      else cur.entries.set(k, { ...e });
    }
  }
  return [...byCode.values()].map((c) => ({ ...c, entries: [...c.entries.values()] }));
}

const PARENT_NAMES = { "75056": "Paris", "13055": "Marseille", "69123": "Lyon" };

/** Libellés des nuances du ministère (src/content/nuances.json, partagé avec l'interface). Un code inconnu garde son code. */
export const NUANCES = JSON.parse(readFileSync(new URL("../../src/content/nuances.json", import.meta.url), "utf8"));

export const nuanceLabel = (code) => (code !== "_source" && NUANCES[code]) || code;

/** Encodage compact d'un département : rows = { code: ligne }. */
function counts(c) {
  return [c.nom, c.inscrits, c.abstentions, c.votants, c.blancs, c.nuls, c.exprimes];
}

/** Colonne des voix d'une entrée fixe ; les voix absentes finales sont supprimées. */
function fixedVoix(c, index, size) {
  const voix = new Array(size).fill(null);
  for (const e of c.entries) {
    const i = index.get(e.key);
    if (i !== undefined) voix[i] = e.voix;
  }
  while (voix.length && voix[voix.length - 1] === null) voix.pop();
  return voix;
}

/**
 * Construit les fichiers compacts d'un scrutin et d'un tour.
 * @param {Array} communes lignes fusionnées (mergeByCommune)
 * @param {{ kind: "nuance"|"list"|"local", scrutin: string, tour: number }} meta
 * @returns {Map<string, object>} département -> contenu du fichier
 */
export function encodeScrutin(communes, meta) {
  const { kind } = meta;
  // Entrées communes à tous les départements (kind nuance/list), triées par voix totales décroissantes.
  let entries = [];
  let index = new Map();
  if (kind !== "local") {
    const totals = new Map();
    for (const c of communes) {
      for (const e of c.entries) {
        const key = kind === "nuance" ? e.nuance : e.court || e.long;
        e.key = key;
        const t = totals.get(key) ?? { key, voix: 0, nuance: e.nuance, long: e.long, tete: e.tete };
        t.voix += e.voix;
        totals.set(key, t);
      }
    }
    entries = [...totals.values()].sort((a, b) => b.voix - a.voix || a.key.localeCompare(b.key, "fr"));
    entries.forEach((t, i) => index.set(t.key, i));
  }

  const files = new Map();
  const skipped = [];
  for (const c of communes) {
    if (c.exprimes <= 0 && c.inscrits <= 0) continue;
    // Anomalie de la source (ex. liste manquante) : on n'affiche pas une commune dont les voix ne retombent pas sur les exprimés.
    const total = c.entries.reduce((a, e) => a + e.voix, 0);
    if (Math.abs(total - c.exprimes) > Math.max(5, c.exprimes * 0.02)) {
      skipped.push(c.code);
      continue;
    }
    const dep = depOfCode(c.code);
    let file = files.get(dep);
    if (!file) {
      file = { v: SCRUTIN_FORMAT_VERSION, scrutin: meta.scrutin, tour: meta.tour, kind, rows: {} };
      if (kind === "nuance") file.entries = entries.map((t) => [t.key, nuanceLabel(t.key)]);
      if (kind === "list") file.entries = entries.map((t) => [t.key, t.long && t.long !== t.key ? t.long : "", t.nuance, t.tete]);
      files.set(dep, file);
    }
    if (kind === "local") {
      const lists = c.entries
        .filter((e) => e.voix > 0 || e.sieges)
        .sort((a, b) => b.voix - a.voix)
        .map((e) => [e.long || e.court || e.nom, e.nuance, e.voix, e.sieges ?? 0, e.tete || [e.prenom, e.nom].filter(Boolean).join(" ")]);
      file.rows[c.code] = [...counts(c), lists];
    } else {
      file.rows[c.code] = [...counts(c), ...fixedVoix(c, index, entries.length)];
    }
  }
  files.skipped = skipped;
  return files;
}

/** Clé d'additionnement des entrées d'une même commune selon le genre de scrutin. */
export function entryKey(kind) {
  if (kind === "nuance") return (e) => e.nuance || "DIV";
  return (e) => e.court || e.long;
}

/** Municipales : chaque ligne est une commune (ou un secteur) à part, sans fusion. */
export function asCommunes(rows) {
  return rows.map((r) => ({ ...r }));
}

/**
 * Fichiers compacts d'un tour : lit le texte source et renvoie Map département -> fichier.
 * `only` (Set de codes INSEE, facultatif) limite aux communes voulues.
 */
export function buildTour(scrutin, tour, text, { delimiter = ";", only } = {}) {
  const rows = parseWideFile(text, { delimiter });
  let communes =
    scrutin.kind === "local" ? asCommunes(rows) : mergeByCommune(rows, { keyOf: entryKey(scrutin.kind) });
  if (only) communes = communes.filter((c) => only.has(c.code));
  return encodeScrutin(communes, { kind: scrutin.kind, scrutin: scrutin.id, tour });
}
