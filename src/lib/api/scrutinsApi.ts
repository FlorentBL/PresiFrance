/**
 * Autres scrutins (législatives, européennes, municipales) : fichiers compacts par scrutin, tour et département
 * dans /data/scrutins (voir scripts/lib/scrutins.mjs). Décodage et textes dans src/lib/scrutinsCore.mjs.
 */

import {
  SCRUTINS,
  SCRUTIN_FILE_VERSION,
  aggregateScrutinFile,
  decodeScrutinRow,
  type ScrutinFile,
  type ScrutinResult,
  type ScrutinResults,
} from "@/lib/scrutinsCore.mjs";

export type { ScrutinResult, ScrutinResults };

/** Fichiers départementaux : à l'outre-mer, trois premiers caractères du code INSEE, sinon deux. */
export function scrutinDepOf(communeCode: string): string {
  return /^9[78]/.test(communeCode) ? communeCode.slice(0, 3) : communeCode.slice(0, 2);
}

const fileCache = new Map<string, Promise<ScrutinFile | null>>();

/** Un seul téléchargement par fichier et par session. null si le fichier n'existe pas (ex. département sans scrutin). */
export function loadScrutinFile(scrutinId: string, tour: number, dep: string): Promise<ScrutinFile | null> {
  const path = `/data/scrutins/${scrutinId}/t${tour}/${dep}.json`;
  let pending = fileCache.get(path);
  if (!pending) {
    pending = fetch(`${path}?v=${SCRUTIN_FILE_VERSION}`)
      .then((res) => (res.ok ? (res.json() as Promise<ScrutinFile>) : null))
      .catch(() => null);
    pending.then((file) => {
      if (!file) fileCache.delete(path);
    });
    fileCache.set(path, pending);
  }
  return pending;
}

export async function getScrutinCommune(scrutinId: string, tour: number, communeCode: string): Promise<ScrutinResult | null> {
  const file = await loadScrutinFile(scrutinId, tour, scrutinDepOf(communeCode));
  return decodeScrutinRow(file, communeCode);
}

export async function getScrutinDepartment(scrutinId: string, tour: number, dep: string): Promise<ScrutinResult | null> {
  const file = await loadScrutinFile(scrutinId, tour, dep);
  return file ? aggregateScrutinFile(file) : null;
}

/** Tous les scrutins et tours d'une commune (ou d'un département si `scope.dep`), dans la forme attendue par scrutinsCore. */
export async function getAllScrutins(scope: { commune: string } | { dep: string }): Promise<ScrutinResults> {
  const entries = await Promise.all(
    SCRUTINS.map(async (s) => {
      const perTour = await Promise.all(
        s.tours.map(async (t) => {
          const r = "commune" in scope ? await getScrutinCommune(s.id, t, scope.commune) : await getScrutinDepartment(s.id, t, scope.dep);
          return [t, r] as const;
        }),
      );
      return [s.id, Object.fromEntries(perTour)] as const;
    }),
  );
  return Object.fromEntries(entries);
}
