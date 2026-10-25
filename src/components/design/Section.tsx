import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: ReactNode;
  id?: string;
  className?: string;
  /** Sur-titre (eyebrow) en capitales. */
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  /** Largeur max du contenu. */
  width?: "narrow" | "default" | "wide";
}

const WIDTHS = { narrow: "max-w-3xl", default: "max-w-6xl", wide: "max-w-7xl" } as const;

/** Section de page : rythme vertical, conteneur centré et en-tête éditorial optionnel. */
export function Section({ children, id, className, eyebrow, title, description, width = "default" }: SectionProps) {
  return (
    <section id={id} className={cn("relative py-14 sm:py-20", className)}>
      <div className={cn("mx-auto px-4 sm:px-8", WIDTHS[width])}>
        {(eyebrow || title || description) && (
          <header className="mb-8 sm:mb-12 max-w-3xl">
            {eyebrow && (
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
            )}
            {title && <h2 className="font-heading text-display-lg font-semibold">{title}</h2>}
            {description && <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">{description}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

export default Section;
