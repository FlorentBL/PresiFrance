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
};

export type ParrainagesManifest = {
  years: number[];
  sources: Record<number, { total: number; candidats: number }>;
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
