import { getCandidateColor } from "@/lib/candidateColors";

export function colorForPollCandidate(label: string, index: number): string {
  const parts = label.trim().split(/\s+/);
  if (parts.length < 2) return getCandidateColor("", label, index);
  const nom = parts.pop()!;
  const prenom = parts.join(" ");
  return getCandidateColor(prenom, nom, index);
}
