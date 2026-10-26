import { ArrowUpRight } from "lucide-react";
import { GlowCard } from "@/components/design";
import { DEPENSES_PUBLIQUES_NAME } from "@/lib/partnerSites";

interface Props {
  /** Ex. « Les finances de Lyon ». */
  title: string;
  text: string;
  href: string;
  cta: string;
}

/** Encart vers le site partenaire DépensesPubliques.fr. */
export function DepensesPubliquesCard({ title, text, href, cta }: Props) {
  return (
    <GlowCard className="p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Site partenaire · {DEPENSES_PUBLIQUES_NAME}</p>
      <p className="mt-2 font-heading text-lg font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener"
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {cta}
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">(nouvel onglet)</span>
      </a>
    </GlowCard>
  );
}

export default DepensesPubliquesCard;
