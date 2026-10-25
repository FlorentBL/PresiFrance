/**
 * Decoder for the compact department files written by scripts/lib/compact-results.mjs.
 * Percentages are recomputed from raw counts.
 */

import type { CandidateResult, ElectionResult } from "@/lib/api/resultsApi";

type CompactRow = [string, number, number, number, number, number, number, ...(number | null)[]];

export interface CompactDepFile {
  v: 1;
  candidates: [string, string][];
  rows: Record<string, CompactRow>;
  dep?: [string, string];
  deps?: Record<string, [string, string]>;
  niveau?: "commune" | "departement";
}

function pct(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0;
}

export function decodeCompactRow(file: CompactDepFile, key: string): ElectionResult | null {
  const row = file.rows?.[key];
  if (!row) return null;
  const [nomCommune, inscrits, abstentions, votants, blancs, nuls, exprimes] = row;
  const [codeDepartement, nomDepartement] = file.dep ?? file.deps?.[key] ?? ["", ""];

  const candidates: CandidateResult[] = [];
  for (let i = 7; i < row.length; i++) {
    const voix = row[i] as number | null;
    if (voix === null) continue;
    const [nom, prenom] = file.candidates[i - 7];
    candidates.push({
      nom,
      prenom,
      voix,
      pourcentInscrits: pct(voix, inscrits),
      pourcentExprimes: pct(voix, exprimes),
    });
  }
  candidates.sort((a, b) => b.voix - a.voix);

  const result: ElectionResult = {
    codeDepartement,
    nomDepartement,
    codeCommune: key,
    nomCommune,
    inscrits,
    abstentions,
    abstentionsPourcent: pct(abstentions, inscrits),
    votants,
    votantsPourcent: pct(votants, inscrits),
    blancs,
    blancsPourcentInscrits: pct(blancs, inscrits),
    blancsPourcentVotants: pct(blancs, votants),
    nuls,
    nulsPourcentInscrits: pct(nuls, inscrits),
    nulsPourcentVotants: pct(nuls, votants),
    exprimes,
    exprimesPourcentInscrits: pct(exprimes, inscrits),
    exprimesPourcentVotants: pct(exprimes, votants),
    candidates,
  };
  if (file.niveau) result.niveau = file.niveau;
  return result;
}

/**
 * Agrège toutes les communes d'un fichier départemental (niveau commune) en un résultat départemental.
 * Renvoie null pour les fichiers au niveau département (années anciennes) ou vides.
 */
export function aggregateCompactFile(file: CompactDepFile): ElectionResult | null {
  if (file.niveau === "departement") return null;
  const keys = Object.keys(file.rows ?? {});
  if (keys.length === 0) return null;
  let inscrits = 0, abstentions = 0, votants = 0, blancs = 0, nuls = 0, exprimes = 0;
  const voix = new Array<number>(file.candidates.length).fill(0);
  for (const k of keys) {
    const row = file.rows[k];
    inscrits += row[1]; abstentions += row[2]; votants += row[3];
    blancs += row[4]; nuls += row[5]; exprimes += row[6];
    for (let i = 7; i < row.length; i++) voix[i - 7] += (row[i] as number | null) ?? 0;
  }
  const [codeDepartement, nomDepartement] = file.dep ?? ["", ""];
  const candidates: CandidateResult[] = file.candidates
    .map(([nom, prenom], i) => ({
      nom, prenom, voix: voix[i],
      pourcentInscrits: pct(voix[i], inscrits),
      pourcentExprimes: pct(voix[i], exprimes),
    }))
    .filter((c) => c.voix > 0)
    .sort((a, b) => b.voix - a.voix);
  return {
    codeDepartement, nomDepartement, codeCommune: codeDepartement, nomCommune: nomDepartement, niveau: "departement",
    inscrits, abstentions, abstentionsPourcent: pct(abstentions, inscrits),
    votants, votantsPourcent: pct(votants, inscrits),
    blancs, blancsPourcentInscrits: pct(blancs, inscrits), blancsPourcentVotants: pct(blancs, votants),
    nuls, nulsPourcentInscrits: pct(nuls, inscrits), nulsPourcentVotants: pct(nuls, votants),
    exprimes, exprimesPourcentInscrits: pct(exprimes, inscrits), exprimesPourcentVotants: pct(exprimes, votants),
    candidates,
  };
}
