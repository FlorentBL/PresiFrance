import { BarChart3, CalendarDays, GitCompare, Map, MapPin, Search, UsersRound } from "lucide-react";

import { BentoGrid, BentoItem, PageHero, Reveal, Section } from "@/components/design";
import JsonLd from "@/components/JsonLd";
import LinkCard from "@/components/seo/LinkCard";
import SEOHead from "@/components/SEOHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { PRESIDENTIAL_YEAR_SUMMARIES } from "@/lib/presidentialSeo";

export default function ResultatsPresidentiellePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Résultats des élections présidentielles françaises"
        description="Tous les résultats des élections présidentielles françaises par année, commune et département : scores, participation, candidats et données officielles."
        path="/resultats-presidentielle"
      />
      <JsonLd path="/resultats-presidentielle" breadcrumbs={[{ name: "Résultats présidentielle", path: "/resultats-presidentielle" }]} />
      <SiteHeader />

      <main id="contenu" tabIndex={-1} className="focus:outline-none flex-1">
        <PageHero
          eyebrow="Hub résultats"
          title="Résultats des élections présidentielles françaises"
          description="Retrouvez les résultats officiels des présidentielles par année, puis descendez vers les départements et les communes pour comparer les scores, la participation et l'évolution du vote."
        />

        <Section>
          <BentoGrid>
            <BentoItem span={2}>
              <LinkCard
                to="/resultats-presidentielle-par-commune"
                Icon={MapPin}
                title="Par commune"
                text="Accédez aux résultats détaillés dans chaque ville ou village, avec participation et scores par candidat."
              />
            </BentoItem>
            <BentoItem span={2}>
              <LinkCard
                to="/explorer"
                Icon={Search}
                glow="red"
                title="Par département"
                text="Parcourez les communes département par département pour construire une lecture géographique du scrutin."
              />
            </BentoItem>
            <BentoItem span={2}>
              <LinkCard
                to="/comparer"
                Icon={GitCompare}
                glow="white"
                title="Comparer"
                text="Comparez deux communes côte à côte pour mesurer les écarts de participation et de vote."
              />
            </BentoItem>
          </BentoGrid>
        </Section>

        <Section eyebrow="Thématiques" title="Explorer par intention">
          <BentoGrid>
            <BentoItem span={2}>
              <LinkCard to="/carte-presidentielle" Icon={Map} title="Carte présidentielle" text="Lire les résultats comme un phénomène territorial." />
            </BentoItem>
            <BentoItem span={2}>
              <LinkCard to="/participation-presidentielle" Icon={UsersRound} glow="red" title="Participation" text="Comparer la mobilisation électorale par commune ou département." />
            </BentoItem>
            <BentoItem span={2}>
              <LinkCard to="/abstention-presidentielle" Icon={BarChart3} glow="white" title="Abstention" text="Nuancer les scores grâce au niveau de non-vote." />
            </BentoItem>
          </BentoGrid>
        </Section>

        <Section eyebrow="Archives" title="Résultats par année">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRESIDENTIAL_YEAR_SUMMARIES.map((summary, i) => (
              <Reveal key={summary.year} delay={(i % 3) * 0.07}>
                <LinkCard
                  to={`/presidentielle-${summary.year}`}
                  Icon={CalendarDays}
                  title={`Présidentielle ${summary.year}`}
                  text={
                    <>
                      Vainqueur : <strong className="text-foreground">{summary.winner}</strong>. Face à {summary.runnerUp}, avec {summary.angle}.
                    </>
                  }
                />
              </Reveal>
            ))}
          </div>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
