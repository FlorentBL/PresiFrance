import type { ParrainageEntry, ParrainagesManifest, ParrainagesSnapshot } from "@/lib/api/parrainagesApi";

/**
 * Règle légale de recevabilité d'une candidature (loi n° 62-1292 du 6 novembre 1962, art. 3-I,
 * dans sa rédaction issue de la loi organique n° 2016-506 du 25 avril 2016) :
 * 500 présentations d'élus, issues d'au moins 30 départements ou collectivités d'outre-mer,
 * sans que plus d'un dixième d'entre elles (soit 50) émanent d'élus d'un même département
 * ou d'une même collectivité. Règle à revérifier sur Légifrance avant chaque scrutin.
 */
export const PARRAINAGES_RULE = {
  threshold: 500,
  minDepartements: 30,
  maxPerDepartement: 50,
  sourceLabel: "Loi n° 62-1292 du 6 novembre 1962, article 3, I",
  sourceUrl: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000878217",
} as const;

export const DEFAULT_PARRAINAGES_YEAR = 2022;
export const TRACKED_YEAR = 2027;

/** 2027 par défaut dès que des données existent, sinon 2022. */
export function resolveDefaultYear(manifest: Pick<ParrainagesManifest, "years"> | undefined): number {
  return manifest?.years.includes(TRACKED_YEAR) ? TRACKED_YEAR : DEFAULT_PARRAINAGES_YEAR;
}

export function isPendingYear(manifest: ParrainagesManifest | undefined, year: number): boolean {
  if (!manifest) return false;
  return !manifest.years.includes(year) && (manifest.pending?.includes(year) ?? year === TRACKED_YEAR);
}

export type CandidateProgress = {
  candidat: string;
  total: number;
  departements: number;
  maxInDepartement: number;
  /** Parrainages comptés en appliquant le plafond de 50 par département. */
  countedTotal: number;
  /** Les trois conditions sont réunies sur les données publiées (indicatif, non officiel). */
  reached: boolean;
  /** Parrainages restant à obtenir avant le seuil (sur le total compté). */
  remaining: number;
};

export function computeProgress(candidat: string, entries: ParrainageEntry[]): CandidateProgress {
  const perDep = new Map<string, number>();
  for (const e of entries) {
    if (e.dep) perDep.set(e.dep, (perDep.get(e.dep) ?? 0) + 1);
  }
  const { threshold, minDepartements, maxPerDepartement } = PARRAINAGES_RULE;
  const counts = [...perDep.values()];
  const countedTotal = counts.reduce((acc, n) => acc + Math.min(n, maxPerDepartement), 0);
  return {
    candidat,
    total: entries.length,
    departements: perDep.size,
    maxInDepartement: counts.length ? Math.max(...counts) : 0,
    countedTotal,
    reached: countedTotal >= threshold && perDep.size >= minDepartements,
    remaining: Math.max(0, threshold - countedTotal),
  };
}

/** Date AAAA-MM-JJ → "15 février 2022". */
export function formatIsoDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Dernière date de publication trouvée dans les entrées (format jj/mm/aaaa), en ISO. */
export function lastPublicationOf(entries: ParrainageEntry[]): string | null {
  let best: string | null = null;
  for (const e of entries) {
    const m = e.date?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!m) continue;
    const iso = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    if (!best || iso > best) best = iso;
  }
  return best;
}

export type HistoryRow = {
  publishedAt: string | null;
  recordedAt: string;
  total: number;
  delta: number;
  candidats: number;
  departements: number;
};

/** Historique du plus récent au plus ancien, avec l'évolution par rapport à la publication précédente. */
export function historyRows(history: ParrainagesSnapshot[]): HistoryRow[] {
  return history
    .map((h, i) => ({
      publishedAt: h.publishedAt,
      recordedAt: h.recordedAt,
      total: h.total,
      delta: h.total - (i > 0 ? history[i - 1].total : 0),
      candidats: h.candidats,
      departements: h.departements,
    }))
    .reverse();
}

/** Gain par candidat entre l'avant-dernière et la dernière publication. */
export function lastDeltas(history: ParrainagesSnapshot[]): Record<string, number> {
  if (history.length < 2) return {};
  const prev = new Map(history[history.length - 2].stats.map(([c, t]) => [c, t]));
  const out: Record<string, number> = {};
  for (const [c, t] of history[history.length - 1].stats) out[c] = t - (prev.get(c) ?? 0);
  return out;
}
