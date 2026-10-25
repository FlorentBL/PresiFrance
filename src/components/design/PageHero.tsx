import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

interface PageHeroProps {
  /** Sur-titre en capitales. */
  eyebrow?: string;
  /** Titre principal (h1), échelle display. */
  title: ReactNode;
  description?: ReactNode;
  /** Zone d'actions / contrôles (SegmentedControl, boutons…). */
  actions?: ReactNode;
  /** Visuel optionnel à droite sur desktop. */
  aside?: ReactNode;
  /** Taille du titre. */
  size?: "lg" | "xl" | "xxl";
  className?: string;
}

const TITLE_SIZE = { lg: "text-display-lg", xl: "text-display-xl", xxl: "text-display-xxl" } as const;

/** En-tête de page éditorial : halos tricolores, grain, titre display XXL. Un seul par page (porte le h1). */
export function PageHero({ eyebrow, title, description, actions, aside, size = "xl", className }: PageHeroProps) {
  return (
    <div className={cn("night-bg grain relative isolate -mt-[4.75rem] overflow-hidden border-b border-border", className)}>
      <div className="tricolor-bar absolute inset-x-0 top-0" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-36 sm:px-8 sm:pb-20 sm:pt-44 lg:grid-cols-[1fr_auto]">
        <Reveal>
          {eyebrow && (
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
          )}
          <h1 className={cn("font-heading font-extrabold", TITLE_SIZE[size])}>{title}</h1>
          {description && (
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>
          )}
          {actions && <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>}
        </Reveal>
        {aside && <Reveal delay={0.15} className="hidden lg:block">{aside}</Reveal>}
      </div>
    </div>
  );
}

export default PageHero;
