import { getCandidateColor } from "@/lib/candidateColors";

/** « LE PEN Marine » → { nom: "LE PEN", prenom: "Marine" } (nom = mots entièrement en capitales en tête). */
export function splitCandidat(candidat: string): { prenom: string; nom: string } {
  const words = candidat.trim().split(/\s+/);
  let i = 0;
  while (i < words.length - 1 && words[i] === words[i].toUpperCase()) i++;
  if (i === 0) i = 1;
  return { nom: words.slice(0, i).join(" "), prenom: words.slice(i).join(" ") };
}

export function displayName(candidat: string): string {
  const { prenom, nom } = splitCandidat(candidat);
  return `${prenom} ${nom}`.trim();
}

export function colorOf(candidat: string, index = 0): string {
  const { prenom, nom } = splitCandidat(candidat);
  return getCandidateColor(prenom, nom, index);
}
