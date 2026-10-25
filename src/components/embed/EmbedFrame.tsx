import { useEffect, type ReactNode } from "react";
import { SITE_NAME, SITE_URL } from "@/lib/site";

interface EmbedFrameProps {
  title: string;
  /** Page complète correspondante sur PrésiFrance (lien « Source »). */
  sourcePath: string;
  children: ReactNode;
}

/** Cadre minimal des embeds : pas d'en-tête/pied de page, noindex, lien « Source : PrésiFrance » obligatoire. */
export function EmbedFrame({ title, sourcePath, children }: EmbedFrameProps) {
  useEffect(() => {
    document.title = `${title} — ${SITE_NAME}`;
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", "noindex, nofollow");
  }, [title]);

  return (
    <main id="contenu" className="flex min-h-screen flex-col bg-background px-3 py-3 text-foreground">
      <h1 className="mb-2 font-heading text-base font-bold leading-tight sm:text-lg">{title}</h1>
      <div className="flex-1">{children}</div>
      <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
        Source :{" "}
        <a
          href={`${SITE_URL}${sourcePath}`}
          target="_blank"
          rel="noopener"
          className="font-semibold text-primary underline-offset-2 hover:underline"
        >
          PrésiFrance
        </a>
      </p>
    </main>
  );
}
