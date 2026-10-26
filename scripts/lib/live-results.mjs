/**
 * Résultats en direct de la soirée électorale : lecture des fichiers « résultats par niveau »
 * du ministère de l'Intérieur et normalisation vers le format compact de public/data/live-2027/.
 *
 * Format source (tel que publié en 2022 sur data.gouv.fr, séparateur « ; », ISO-8859-1/Windows-1252,
 * décimales à la virgule) : une ligne par territoire, colonnes fixes (Inscrits, Abstentions, Votants,
 * Blancs, Nuls, Exprimés, avec leurs pourcentages) puis un bloc répété par candidat
 * (N°Panneau, Sexe, Nom, Prénom, Voix, % Voix/Ins, % Voix/Exp). Seuls les comptes sont lus : les
 * pourcentages sont recalculés dans le navigateur, comme pour les archives.
 *
 * Aucune estimation : tout provient d'un décompte publié, avec la colonne « Etat saisie ».
 */
import { encodeDepResults } from "./compact-results.mjs";

export const LIVE_VERSION = 1;

/** Etat saisie publié par le ministère pour un territoire dont le décompte est terminé. */
export const ETAT_COMPLET = "Complet";

export function decodeText(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

const num = (v) => {
  const n = Number(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

/**
 * Lit un fichier « résultats par niveau ».
 * @returns {{ level: "national"|"departement"|"commune", rows: object[] }}
 */
export function parseMinistryCsv(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) throw new Error("Fichier vide ou sans ligne de données");
  const header = lines[0].split(";").map((h) => h.trim());
  const col = (name) => header.indexOf(name);
  for (const name of ["Etat saisie", "Inscrits", "Abstentions", "Votants", "Blancs", "Nuls", "Exprimés", "Nom", "Prénom", "Voix"]) {
    if (col(name) < 0) throw new Error(`Colonne « ${name} » absente : format du fichier inattendu`);
  }
  const level = col("Code du niveau") >= 0 ? "national" : col("Code de la commune") >= 0 ? "commune" : "departement";
  const blockStart = col("N°Panneau") >= 0 ? col("N°Panneau") : col("Sexe");
  const blockLen = header.length - blockStart;
  const off = { nom: col("Nom") - blockStart, prenom: col("Prénom") - blockStart, voix: col("Voix") - blockStart };

  const rows = lines.slice(1).map((line, i) => {
    const f = line.split(";");
    if ((f.length - blockStart) % blockLen !== 0 || f.length < header.length) {
      throw new Error(`Ligne ${i + 2} : nombre de colonnes incohérent (${f.length})`);
    }
    const candidates = [];
    for (let p = blockStart; p < f.length; p += blockLen) {
      candidates.push({ nom: f[p + off.nom].trim(), prenom: f[p + off.prenom].trim(), voix: num(f[p + off.voix]) });
    }
    const code = level === "national" ? f[col("Code du niveau")] : f[col("Code du département")];
    const name = level === "national" ? f[col("Libellé du niveau")] : f[col("Libellé du département")];
    return {
      depCode: code.trim(),
      depName: name.trim(),
      communeCode: level === "commune" ? f[col("Code de la commune")].trim() : null,
      communeName: level === "commune" ? f[col("Libellé de la commune")].trim() : null,
      etat: f[col("Etat saisie")].trim(),
      inscrits: num(f[col("Inscrits")]),
      abstentions: num(f[col("Abstentions")]),
      votants: num(f[col("Votants")]),
      blancs: num(f[col("Blancs")]),
      nuls: num(f[col("Nuls")]),
      exprimes: num(f[col("Exprimés")]),
      candidates,
    };
  });
  return { level, rows };
}

/** Un territoire complet doit avoir des comptes cohérents : sinon le fichier est rejeté. */
export function checkRow(row) {
  const where = row.communeCode ? `${row.depCode}${row.communeCode}` : row.depCode;
  const sum = row.candidates.reduce((s, c) => s + c.voix, 0);
  if (sum !== row.exprimes) throw new Error(`${where} : somme des voix (${sum}) différente des exprimés (${row.exprimes})`);
  if (row.exprimes + row.blancs + row.nuls !== row.votants) throw new Error(`${where} : exprimés + blancs + nuls différent des votants`);
  if (row.votants + row.abstentions !== row.inscrits) throw new Error(`${where} : votants + abstentions différent des inscrits`);
}

const rowKey = (r) => (r.communeCode ? `${r.depCode}${r.communeCode}` : r.depCode);

function toElectionResult(r, niveau) {
  return {
    codeDepartement: r.depCode,
    nomDepartement: r.depName,
    codeCommune: rowKey(r),
    nomCommune: r.communeName ?? r.depName,
    niveau,
    inscrits: r.inscrits,
    abstentions: r.abstentions,
    votants: r.votants,
    blancs: r.blancs,
    nuls: r.nuls,
    exprimes: r.exprimes,
    candidates: r.candidates,
  };
}

/**
 * Construit les fichiers publiés pour un tour.
 *
 * @param {{national: object, departements: object, communes: object}} parsed sorties de parseMinistryCsv
 * @param {{round: 1|2, fetchedAt: string, source: {label: string, url: string|null}, final?: boolean,
 *   inscritsReference?: number|null}} opts
 * @returns {{ summary: object, files: Record<string, object> }} fichiers relatifs à public/data/live-2027/
 */
export function buildRoundFiles(parsed, opts) {
  const { national, departements, communes } = parsed;
  if (national.level !== "national" || departements.level !== "departement" || communes.level !== "commune") {
    throw new Error("Les trois fichiers doivent être, dans l'ordre, national, départements, communes");
  }
  if (national.rows.length !== 1) throw new Error("Le fichier national doit contenir une seule ligne");
  const tour = `t${opts.round}`;
  const ref = communes.rows.find((r) => r.candidates.length > 0)?.candidates.map((c) => `${c.nom}|${c.prenom}`).join(",");
  for (const r of [...national.rows, ...departements.rows, ...communes.rows]) {
    if (r.candidates.map((c) => `${c.nom}|${c.prenom}`).join(",") !== ref) {
      throw new Error(`${rowKey(r)} : liste de candidats différente de celle des communes`);
    }
    if (r.etat === ETAT_COMPLET) checkRow(r);
  }

  const done = communes.rows.filter((r) => r.etat === ETAT_COMPLET);
  const inscritsDone = done.reduce((s, r) => s + r.inscrits, 0);
  const inscritsAll = opts.inscritsReference || communes.rows.reduce((s, r) => s + r.inscrits, 0);
  const couverture = inscritsAll > 0 ? Math.min(100, (inscritsDone / inscritsAll) * 100) : 0;
  const allDone = done.length === communes.rows.length && communes.rows.length > 0;
  const state = opts.final ? "definitif" : done.length === 0 ? "avenir" : allDone ? "complet-provisoire" : "partiel";

  const files = {};
  files[`${tour}/national.json`] = encodeDepResults({ FE: toElectionResult(national.rows[0], "departement") });
  const depMap = {};
  const etat = {};
  for (const r of departements.rows) {
    depMap[r.depCode] = toElectionResult(r, "departement");
    etat[r.depCode] = r.etat;
  }
  files[`${tour}/departements.json`] = { ...encodeDepResults(depMap), etat };

  const byDep = new Map();
  for (const r of done) {
    if (!byDep.has(r.depCode)) byDep.set(r.depCode, {});
    byDep.get(r.depCode)[rowKey(r)] = toElectionResult(r, "commune");
  }
  for (const [dep, map] of byDep) files[`${tour}/communes/${dep}.json`] = encodeDepResults(map);

  const summary = {
    state,
    couvertureInscrits: Math.round(couverture * 100) / 100,
    communesCompletes: done.length,
    communesTotal: communes.rows.length,
    inscritsReference: opts.inscritsReference || null,
    fetchedAt: opts.fetchedAt,
    source: opts.source,
  };
  return { summary, files };
}

/** Statut global : un bloc par tour ; `current` = tour affiché par défaut sur la page. */
export function emptyStatus() {
  return { v: LIVE_VERSION, election: 2027, current: null, rounds: {} };
}

export function mergeStatus(previous, round, summary) {
  const prev = previous && previous.v === LIVE_VERSION ? previous : emptyStatus();
  const prevRound = prev.rounds?.[`t${round}`];
  if (prevRound && summary.state !== "definitif" && prevRound.state === "definitif") {
    throw new Error(`Le tour ${round} est déjà définitif : refus de revenir à « ${summary.state} »`);
  }
  if (prevRound && summary.couvertureInscrits < prevRound.couvertureInscrits && prevRound.state !== "avenir") {
    throw new Error(
      `Couverture en baisse (${prevRound.couvertureInscrits} % -> ${summary.couvertureInscrits} %) : fichier suspect, rien n'est écrit`,
    );
  }
  const rounds = { ...prev.rounds, [`t${round}`]: summary };
  const live = Object.entries(rounds).filter(([, s]) => s.state !== "avenir");
  const current = live.length ? Number(live[live.length - 1][0].slice(1)) : null;
  return { ...prev, current, rounds };
}
