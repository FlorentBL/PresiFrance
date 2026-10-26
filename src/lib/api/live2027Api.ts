/**
 * Résultats en direct de la soirée électorale 2027 (public/data/live-2027/, écrit par
 * scripts/fetch-live-2027.mjs). Les fichiers sont servis sans cache : ils changent plusieurs fois
 * dans la soirée. Aucune estimation : uniquement des décomptes publiés par le ministère de l'Intérieur.
 */
import { decodeCompactRow, type CompactDepFile } from "@/lib/api/compactResults";
import type { ElectionResult } from "@/lib/api/resultsApi";

export type LiveState = "avenir" | "partiel" | "complet-provisoire" | "definitif";
export type LiveRound = 1 | 2;

export interface LiveRoundStatus {
  state: LiveState;
  /** Part des inscrits des communes dont le décompte est terminé, en %. */
  couvertureInscrits: number;
  communesCompletes: number;
  communesTotal: number;
  fetchedAt: string;
  source: { label: string; url: string | null };
}

export interface LiveStatus {
  v: 1;
  election: 2027;
  current: LiveRound | null;
  rounds: Partial<Record<`t${LiveRound}`, LiveRoundStatus>>;
}

export interface LiveDepartmentsFile extends CompactDepFile {
  /** « Etat saisie » du ministère par département (« Complet » = décompte terminé). */
  etat: Record<string, string>;
}

const BASE = "/data/live-2027";

async function getLive<T>(path: string, allowMissing = false): Promise<T | null> {
  const res = await fetch(`${BASE}/${path}?t=${Math.floor(Date.now() / 30_000)}`, { cache: "no-store" });
  // Un fichier absent peut être remplacé par la page d'accueil (repli SPA) : ni JSON ni 404.
  const json = res.ok && (res.headers.get("content-type") ?? "application/json").includes("json");
  if (!json) {
    if (allowMissing) return null;
    throw new Error(`Impossible de charger les résultats en direct (${path}).`);
  }
  return (await res.json()) as T;
}

export async function getLiveStatus(): Promise<LiveStatus> {
  return (await getLive<LiveStatus>("status.json")) as LiveStatus;
}

export const getLiveNational = async (round: LiveRound): Promise<ElectionResult | null> => {
  const file = await getLive<CompactDepFile>(`t${round}/national.json`);
  return file ? decodeCompactRow(file, "FE") : null;
};

export const getLiveDepartments = (round: LiveRound) => getLive<LiveDepartmentsFile>(`t${round}/departements.json`);

/** Communes dont le décompte est terminé dans le département ; null tant qu'aucune ne l'est. */
export const getLiveCommunes = (round: LiveRound, dep: string) =>
  getLive<CompactDepFile>(`t${round}/communes/${encodeURIComponent(dep)}.json`, true);

/** Vrai dès qu'un tour a des résultats publiés : pilote l'affichage des liens vers la page. */
export function isLiveVisible(status: LiveStatus | undefined): boolean {
  return Object.values(status?.rounds ?? {}).some((r) => r.state !== "avenir");
}

export function roundsWithResults(status: LiveStatus): LiveRound[] {
  return ([1, 2] as const).filter((r) => (status.rounds[`t${r}`]?.state ?? "avenir") !== "avenir");
}

export function stateHeadline(s: LiveRoundStatus): string {
  const pct = s.couvertureInscrits.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  switch (s.state) {
    case "partiel":
      return `Résultats partiels (${pct} % des inscrits)`;
    case "complet-provisoire":
      return "Résultats provisoires complets, en attente de la proclamation officielle";
    case "definitif":
      return "Résultats définitifs";
    default:
      return "Résultats à venir";
  }
}
