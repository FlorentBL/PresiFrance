import { GlowCard } from "@/components/design";

/** Résumé factuel en une phrase, en tête de page. */
export function CommuneSummaryCard({ sentence }: { sentence: string }) {
  return (
    <GlowCard className="p-5 sm:p-6" glow="blue">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Comment a voté cette commune ?</p>
      <p className="mt-2 text-lg font-medium leading-relaxed text-foreground sm:text-xl" data-testid="commune-summary">
        {sentence}
      </p>
    </GlowCard>
  );
}
