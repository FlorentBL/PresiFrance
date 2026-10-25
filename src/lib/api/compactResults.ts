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
