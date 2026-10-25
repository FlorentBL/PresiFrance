import { useQuery } from "@tanstack/react-query";
import { getCandidateColor } from "@/lib/candidateColors";
import type { NationalResult } from "@/lib/api/nationalResultsApi";

export type NationalAll = Record<string, { t1?: NationalResult; t2?: NationalResult }>;

export interface HomeMapYear {
  candidates: string[];
  /** Code département → [index du candidat en tête, % de ses voix]. */
  depts: Record<string, [number, number]>;
  exprimes: number;
}
export interface HomeMapData {
  v: number;
  years: Record<string, HomeMapYear>;
}

/** Tous les résultats nationaux (fichier unique, ~10 Ko), partagé entre les blocs de l'accueil. */
export function useNationalAll() {
  return useQuery({
    queryKey: ["national-results-all"],
    queryFn: async (): Promise<NationalAll> => {
      const res = await fetch("/data/presidential/national-results.json");
      if (!res.ok) throw new Error("national-results indisponible");
      return (await res.json()) as NationalAll;
    },
    staleTime: Infinity,
  });
}

/** Vainqueur de chaque département au 1er tour (chargé à la demande par la carte). */
export function useHomeMap() {
  return useQuery({
    queryKey: ["home-map"],
    queryFn: async (): Promise<HomeMapData> => {
      const res = await fetch("/data/presidential/home-map.json");
      if (!res.ok) throw new Error("home-map indisponible");
      return (await res.json()) as HomeMapData;
    },
    staleTime: Infinity,
  });
}

/** Couleur d'un libellé « Prénom NOM » ou « NOM » (libellés de home-map.json). */
export function colorFromLabel(label: string, index = 0): string {
  const tokens = label.split(" ");
  const first = tokens.findIndex((t) => t === t.toUpperCase());
  const prenom = tokens.slice(0, Math.max(first, 0)).join(" ");
  const nom = tokens.slice(Math.max(first, 0)).join(" ");
  return getCandidateColor(prenom, nom, index);
}

export const nf = new Intl.NumberFormat("fr-FR");
