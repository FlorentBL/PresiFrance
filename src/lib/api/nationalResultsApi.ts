import { PresidentialYear, Round } from "@/lib/elections";

/** Années pour lesquelles `national-results.json` contient le résultat national (France entière). */
export const YEARS_WITH_NATIONAL_RESULTS: readonly PresidentialYear[] = [
  1965, 1969, 1974, 1981, 1988, 1995, 2002, 2007, 2012, 2017, 2022,
];

export interface NationalCandidateResult {
  prenom: string;
  nom: string;
  pourcentExprimes: number;
  voix: number;
}

export interface NationalResult {
  participation: number;
  candidates: NationalCandidateResult[];
}

export async function getNationalResults(
  year: PresidentialYear,
  round: Round
): Promise<NationalResult | null> {
  const res = await fetch(`/data/presidential/national-results.json`);
  if (!res.ok) return null;
  const data = (await res.json()) as Record<string, Record<string, NationalResult>>;
  const yearData = data[String(year)];
  if (!yearData) return null;
  return yearData[`t${round}`] ?? null;
}

/** Tout le fichier national (toutes les années, 1er et 2nd tour). */
export async function getAllNationalResults(): Promise<Record<string, { t1?: NationalResult; t2?: NationalResult }> | null> {
  const res = await fetch(`/data/presidential/national-results.json`);
  if (!res.ok) return null;
  return (await res.json()) as Record<string, { t1?: NationalResult; t2?: NationalResult }>;
}
