import { STATUS_LABEL, type CandidateStatus } from "@/lib/api/presidential2027Api";

/** Pastille de statut, même rendu pour tous les candidats (neutre, sans couleur partisane). */
export function StatusBadge({ statut }: { statut: CandidateStatus }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
      {STATUS_LABEL[statut]}
    </span>
  );
}
