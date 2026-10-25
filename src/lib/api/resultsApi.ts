/**
 * API service for French Presidential Elections data from data.gouv.fr.
 *
 * Important: the "tabular-api" parsing of the official TXT resources can be incomplete
 * for these election files (it may only expose the first candidate/panel).
 *
 * To avoid truncated results (e.g. Nantes/44109 showing only ARTHAUD),
 * we read the official "subcom" TXT directly and extract the single commune line.
 */

import { PresidentialYear, Round } from "@/lib/elections";
import { aggregateCompactFile, decodeCompactRow, type CompactDepFile } from "@/lib/api/compactResults";

export const RESOURCES = {
  // Kept for future use elsewhere in the app
  PARRAINAGES_2022: "f943a1a9-fc14-47e9-9e22-0ec5c50f5fe2",
} as const;

export interface ElectionResult {
  codeDepartement: string;
  nomDepartement: string;
  codeCommune: string;
  nomCommune: string;
  niveau?: "commune" | "departement";
  inscrits: number;
  abstentions: number;
  abstentionsPourcent: number;
  votants: number;
  votantsPourcent: number;
  blancs: number;
  blancsPourcentInscrits: number;
  blancsPourcentVotants: number;
  nuls: number;
  nulsPourcentInscrits: number;
  nulsPourcentVotants: number;
  exprimes: number;
  exprimesPourcentInscrits: number;
  exprimesPourcentVotants: number;
  candidates: CandidateResult[];
}

export interface CandidateResult {
  nom: string;
  prenom: string;
  voix: number;
  pourcentInscrits: number;
  pourcentExprimes: number;
}

/** En dev / preview localhost : proxy Vite vers static.data.gouv.fr (voir vite.config). */
function staticDataGouvUrl(path: string): string {
  const base = "https://static.data.gouv.fr";
  if (typeof window === "undefined") return `${base}${path}`;
  const h = window.location.hostname;
  const useProxy =
    import.meta.env.DEV || h === "localhost" || h === "127.0.0.1";
  return useProxy ? `/static-dgf${path}` : `${base}${path}`;
}

const SUBCOM_2022_T1_PATH =
  "/resources/election-presidentielle-des-10-et-24-avril-2022-resultats-definitifs-du-1er-tour/20220414-152459/resultats-par-niveau-subcom-t1-france-entiere.txt";
const SUBCOM_2022_T2_PATH =
  "/resources/election-presidentielle-des-10-et-24-avril-2022-resultats-definitifs-du-2nd-tour/20220428-142333/resultats-par-niveau-subcom-t2-france-entiere.txt";

function parseFrNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const s = String(value).trim();
  if (!s) return 0;
  // thousands separator is not expected in these MI files, but we normalize anyway
  const normalized = s.replace(/\s/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

async function findCommuneLineInTxt(url: string, dep: string, com: number): Promise<string | null> {
  const prefix = `${dep};`;
  const com3 = String(com).padStart(3, "0");
  const com4 = String(com).padStart(4, "0");

  const response = await fetch(url);
  if (!response.ok || !response.body) return null;

  const reader = response.body.getReader();
  const decoder = new TextDecoder("latin1"); // official MI files are typically ISO-8859-1

  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    // Process complete lines; keep the last partial line in buffer
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const rawLine = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);

      const line = rawLine.replace(/\r$/, "");
      if (!line || !line.startsWith(prefix)) continue;

      // Expected format for subcom:
      // dep;libDep;codeCommune;libCommune;...; then candidate blocks
      // We match strictly the 3rd field (code commune), which is usually 3 digits (zero-padded).
      const parts = line.split(";");
      const codeCommune = parts[2];
      if (codeCommune === com3 || codeCommune === com4 || codeCommune === String(com)) {
        return line;
      }
    }
  }

  // Handle last line (no trailing newline)
  if (buffer) {
    const line = buffer.replace(/\r$/, "");
    if (line.startsWith(prefix)) {
      const parts = line.split(";");
      const codeCommune = parts[2];
      if (codeCommune === String(com).padStart(3, "0") || codeCommune === String(com)) return line;
    }
  }

  return null;
}

function parseSubcomLineToResult(communeCode: string, line: string): ElectionResult | null {
  const parts = line.split(";");
  // Minimal expected base columns up to "% Exp/Vot"
  if (parts.length < 19) return null;

  const codeDepartement = String(parts[0] ?? "");
  const nomDepartement = String(parts[1] ?? "");
  const nomCommune = String(parts[3] ?? "Commune");

  const inscrits = Math.round(parseFrNumber(parts[5]));
  const abstentions = Math.round(parseFrNumber(parts[6]));
  const abstentionsPourcent = parseFrNumber(parts[7]);
  const votants = Math.round(parseFrNumber(parts[8]));
  const votantsPourcent = parseFrNumber(parts[9]);
  const blancs = Math.round(parseFrNumber(parts[10]));
  const blancsPourcentInscrits = parseFrNumber(parts[11]);
  const blancsPourcentVotants = parseFrNumber(parts[12]);
  const nuls = Math.round(parseFrNumber(parts[13]));
  const nulsPourcentInscrits = parseFrNumber(parts[14]);
  const nulsPourcentVotants = parseFrNumber(parts[15]);
  const exprimes = Math.round(parseFrNumber(parts[16]));
  const exprimesPourcentInscrits = parseFrNumber(parts[17]);
  const exprimesPourcentVotants = parseFrNumber(parts[18]);

  const candidates: CandidateResult[] = [];
  // Candidate blocks: N°Panneau, Sexe, Nom, Prénom, Voix, % Voix/Ins, % Voix/Exp
  for (let i = 19; i + 6 < parts.length; i += 7) {
    const nom = String(parts[i + 2] ?? "").trim();
    const prenom = String(parts[i + 3] ?? "").trim();
    if (!nom) continue;

    candidates.push({
      nom,
      prenom,
      voix: Math.round(parseFrNumber(parts[i + 4])),
      pourcentInscrits: parseFrNumber(parts[i + 5]),
      pourcentExprimes: parseFrNumber(parts[i + 6]),
    });
  }

  candidates.sort((a, b) => b.voix - a.voix);

  return {
    codeDepartement,
    nomDepartement,
    codeCommune: communeCode,
    nomCommune,
    inscrits,
    abstentions,
    abstentionsPourcent,
    votants,
    votantsPourcent,
    blancs,
    blancsPourcentInscrits,
    blancsPourcentVotants,
    nuls,
    nulsPourcentInscrits,
    nulsPourcentVotants,
    exprimes,
    exprimesPourcentInscrits,
    exprimesPourcentVotants,
    candidates,
  };
}

/** Bump when the department file format changes: old copies may sit in browser caches. */
const DEP_FILE_VERSION = "c1";

const depFileCache = new Map<string, Promise<CompactDepFile | null>>();

/** One fetch per department file and session, shared by all communes of the department. */
function loadDepFile(year: PresidentialYear, round: Round, dep: string): Promise<CompactDepFile | null> {
  const path = `/data/presidential/${year}/t${round}/${dep}.json`;
  let pending = depFileCache.get(path);
  if (!pending) {
    pending = fetch(`${path}?v=${DEP_FILE_VERSION}`)
      .then((res) => (res.ok ? (res.json() as Promise<CompactDepFile>) : null))
      .catch(() => null);
    pending.then((file) => {
      if (!file) depFileCache.delete(path);
    });
    depFileCache.set(path, pending);
  }
  return pending;
}

/**
 * Get results for a specific commune
 */
export async function getCommuneResults(
  communeCode: string,
  round: Round = 1,
  year: PresidentialYear = 2022
): Promise<ElectionResult | null> {
  // Split INSEE code: e.g. "33063" -> dep "33", com (integer) "63"
  let dep = communeCode.substring(0, 2);
  let com = parseInt(communeCode.substring(2), 10);

  // Special case for DOM/TOM (3 digits dep)
  if (communeCode.startsWith("97") || communeCode.startsWith("98")) {
      dep = communeCode.substring(0, 3);
      com = parseInt(communeCode.substring(3), 10);
  }

  // Prefer prebuilt offline data (generated by `npm run build:data`)
  try {
    const file = await loadDepFile(year, round, dep);
    if (file) {
      const lookupKey = [1965, 1969, 1974, 1981, 1988].includes(year) ? dep : communeCode;
      const fromLocal = decodeCompactRow(file, lookupKey);
      if (fromLocal) return fromLocal;
      // JSON départemental partiel ou clé absente : poursuivre vers TXT officiel (2022)
    }
  } catch {
    // ignore; fall back
  }

  if (year === 2022) {
    try {
      const path = round === 1 ? SUBCOM_2022_T1_PATH : SUBCOM_2022_T2_PATH;
      const url = staticDataGouvUrl(path);
      const line = await findCommuneLineInTxt(url, dep, com);
      if (!line) return null;
      return parseSubcomLineToResult(communeCode, line);
    } catch {
      return null;
    }
  }

  return null;
}

/** Résultat agrégé du département d'une commune (somme des communes du fichier compact). */
export async function getDepartmentAggregate(
  depCode: string,
  round: Round = 1,
  year: PresidentialYear = 2022
): Promise<ElectionResult | null> {
  try {
    const file = await loadDepFile(year, round, depCode);
    return file ? aggregateCompactFile(file) : null;
  } catch {
    return null;
  }
}
