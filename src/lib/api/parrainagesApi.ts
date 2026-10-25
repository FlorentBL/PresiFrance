/**
 * API for parrainages (presidential endorsements) data.
 * Data source: Conseil constitutionnel via data.gouv.fr
 */

export type ParrainageEntry = {
  candidat: string;
  dep: string | null;
  nom: string;
  prenom: string;
  mandat: string;
  circonscription: string;
  date: string;
};

export type ParrainageStats = {
  candidat: string;
  total: number;
  departements: number;
};

export type ParrainageByDep = {
  candidat: string;
  count: number;
};

export type ParrainagesData = {
  year: number;
  total: number;
  candidats: string[];
  stats: ParrainageStats[];
  byCandidat: Record<string, ParrainageEntry[]>;
  /** Départements distincts et date (AAAA-MM-JJ) de la dernière publication ; absents des anciens fichiers. */
  departements?: number;
  lastPublication?: string | null;
};

/** Une publication successive : stats = [candidat, total, départements]. */
export type ParrainagesSnapshot = {
  publishedAt: string | null;
  recordedAt: string;
  total: number;
  candidats: number;
  departements: number;
  stats: [string, number, number][];
};

export type ParrainagesManifest = {
  years: number[];
  sources: Record<number, { total: number; candidats: number; departements?: number; lastPublication?: string | null }>;
  /** Années dont la publication n'a pas encore eu lieu. */
  pending?: number[];
};

const BASE = "/data/parrainages";

export async function getParrainagesManifest(): Promise<ParrainagesManifest> {
  const res = await fetch(`${BASE}/manifest.json`);
  if (!res.ok) throw new Error("Manifest parrainages introuvable");
  return res.json();
}

export async function getParrainagesByYear(year: number): Promise<ParrainagesData> {
  const res = await fetch(`${BASE}/${year}.json`);
  if (!res.ok) throw new Error(`Parrainages ${year} introuvables`);
  return res.json();
}

export async function getParrainagesByDep(year: number): Promise<Record<string, ParrainageByDep[]>> {
  const res = await fetch(`${BASE}/${year}-by-dep.json`);
  if (!res.ok) throw new Error(`Parrainages par département ${year} introuvables`);
  return res.json();
}

export async function getParrainagesHistory(year: number): Promise<ParrainagesSnapshot[]> {
  const res = await fetch(`${BASE}/${year}-history.json`);
  if (!res.ok) throw new Error(`Historique des parrainages ${year} introuvable`);
  return res.json();
}
