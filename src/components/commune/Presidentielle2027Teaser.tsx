import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { GlowCard } from "@/components/design";

/** Encart vers le hub /presidentielle-2027. */
export function Presidentielle2027Teaser() {
  return (
    <GlowCard className="p-5 sm:p-6" glow="red">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Présidentielle 2027</p>
      <p className="mt-2 text-base text-foreground">
        Candidatures, parrainages, sondages et calendrier : suivez l'élection à venir.
      </p>
      <Link
        to="/presidentielle-2027"
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Découvrir la présidentielle 2027
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </GlowCard>
  );
}

export default Presidentielle2027Teaser;
