/**
 * Encodes a department results map ({ key: ElectionResult }) into the compact
 * format read by src/lib/api/compactResults.ts.
 *
 * Only raw counts are stored: percentages are recomputed client-side.
 * Candidate names are stored once per file; each row holds one vote count per
 * candidate (null when the candidate is absent from that row).
 *
 * Row layout: [nomCommune, inscrits, abstentions, votants, blancs, nuls, exprimes, ...voix]
 * Department code/name are stored once when uniform, otherwise in `deps` per row.
 */

export const COMPACT_VERSION = 1;

export function encodeDepResults(depMap) {
  const entries = Object.entries(depMap);
  const candKeys = new Map();
  const candidates = [];
  for (const [, r] of entries) {
    for (const c of r.candidates) {
      const k = `${c.nom}\u0000${c.prenom}`;
      if (!candKeys.has(k)) {
        candKeys.set(k, candidates.length);
        candidates.push([c.nom, c.prenom]);
      }
    }
  }

  const first = entries[0]?.[1];
  const uniformDep = entries.every(
    ([, r]) => r.codeDepartement === first.codeDepartement && r.nomDepartement === first.nomDepartement
  );
  const niveaux = new Set(entries.map(([, r]) => r.niveau ?? null));
  if (niveaux.size > 1) throw new Error("Mixed niveau values in one department file");

  const rows = {};
  const deps = uniformDep ? undefined : {};
  for (const [key, r] of entries) {
    const voix = new Array(candidates.length).fill(null);
    for (const c of r.candidates) voix[candKeys.get(`${c.nom}\u0000${c.prenom}`)] = c.voix;
    while (voix.length && voix[voix.length - 1] === null) voix.pop();
    rows[key] = [r.nomCommune, r.inscrits, r.abstentions, r.votants, r.blancs, r.nuls, r.exprimes, ...voix];
    if (deps) deps[key] = [r.codeDepartement, r.nomDepartement];
    if (r.codeCommune !== key && !(r.niveau === "departement")) {
      throw new Error(`Row key ${key} differs from codeCommune ${r.codeCommune}`);
    }
  }

  const out = { v: COMPACT_VERSION, candidates, rows };
  if (uniformDep && first) out.dep = [first.codeDepartement, first.nomDepartement];
  if (deps) out.deps = deps;
  const niveau = [...niveaux][0];
  if (niveau) out.niveau = niveau;
  return out;
}
