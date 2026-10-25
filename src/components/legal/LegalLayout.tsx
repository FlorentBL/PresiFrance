import type { ReactNode } from "react";
import SEOHead from "@/components/SEOHead";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { PageHero, Reveal } from "@/components/design";

interface LegalLayoutProps {
  seoTitle: string;
  path: string;
  title: string;
  eyebrow: string;
  updated?: string;
  children: ReactNode;
}

/** Mise en page éditoriale des pages légales : colonne de lecture étroite, titres h2 numérotables, liens soulignés. */
export function LegalLayout({
  seoTitle,
  path,
  title,
  eyebrow,
  updated,
  children,
}: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title={seoTitle} path={path} />
      <SiteHeader />
      <main id="contenu" tabIndex={-1} className="focus:outline-none flex-1">
        <PageHero
          eyebrow={eyebrow}
          title={title}
          description={updated}
          size="lg"
        />
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8 sm:py-16">
          <Reveal>
            <article
              className="space-y-10 text-base leading-[1.8] text-muted-foreground
                [&_h2]:mb-4 [&_h2]:border-t [&_h2]:border-border [&_h2]:pt-8 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground
                [&_section:first-child_h2]:border-t-0 [&_section:first-child_h2]:pt-0
                [&_p+p]:mt-4 [&_strong]:text-foreground
                [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-foreground
                [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_li::marker]:text-primary"
            >
              {children}
            </article>
          </Reveal>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
