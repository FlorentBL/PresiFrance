import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { BarChart3, MapPin, Trophy, Users } from "lucide-react";

import { GlowCard, PageHero, Reveal, SegmentedControl, Section } from "@/components/design";
import JsonLd from "@/components/JsonLd";
import { YearResults } from "@/components/seo/HistoricResults";
import LinkCard from "@/components/seo/LinkCard";
import NationalYearChart from "@/components/seo/NationalYearChart";
import SeoConnectorLinks from "@/components/SeoConnectorLinks";
import SEOHead from "@/components/SEOHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { PRESIDENTIAL_YEARS_DESC } from "@/lib/elections";
import { yearDescription, yearTitle } from "@/lib/yearContent";
import { useYearFaq } from "@/lib/yearQueries";
import { getPresidentialYearSummary, isPresidentialYear } from "@/lib/presidentialSeo";

const YEAR_OPTIONS = [...PRESIDENTIAL_YEARS_DESC].reverse().map((y) => ({ value: y, label: String(y) }));

export default function PresidentialYearPage() {
  const { year: yearParam } = useParams<{ year: string }>();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const year = Number(yearParam || pathname.match(/^\/presidentielle-(\d{4})$/)?.[1]);
  const summary = getPresidentialYearSummary(year);
  const faq = useYearFaq(year);

  if (!summary || !isPresidentialYear(year)) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEOHead title="Année présidentielle introuvable" description="Cette année de présidentielle n'est pas disponible sur PrésiFrance." path="/resultats-presidentielle" />
        <SiteHeader />
        <main id="contenu" tabIndex={-1} className="focus:outline-none flex-1">
          <PageHero
            title="Année introuvable"
            size="lg"
            actions={<Link to="/resultats-presidentielle" className="text-primary hover:underline">Voir toutes les présidentielles</Link>}
          />
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={yearTitle(year, summary.winner)}
        description={yearDescription(year, summary.winner, summary.runnerUp)}
        path={`/presidentielle-${year}`}
      />
      <JsonLd
        path={`/presidentielle-${year}`}
        breadcrumbs={[
          { name: "Résultats présidentielle", path: "/resultats-presidentielle" },
          { name: `Présidentielle ${year}`, path: `/presidentielle-${year}` },
        ]}
        faq={faq}
      />
      <SiteHeader />

      <main id="contenu" tabIndex={-1} className="focus:outline-none flex-1">
        <PageHero
          eyebrow="Élection présidentielle"
          title={<>Résultats de l'élection présidentielle <span className="text-gradient-tricolor">{year}</span></>}
          description={`${summary.winner} remporte l'élection face à ${summary.runnerUp}. Cette page sert de point d'entrée vers les résultats par commune, par département et les outils de comparaison de PrésiFrance.`}
          actions={
            <>
              <SegmentedControl
                label="Changer d'année"
                options={YEAR_OPTIONS}
                value={year}
                onChange={(y) => navigate(`/presidentielle-${y}`)}
                size="sm"
              />
              <Link to="/resultats-presidentielle" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                Toutes les présidentielles
              </Link>
            </>
          }
        />

        <Section>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Reveal>
              <GlowCard className="h-full">
                <Trophy className="mb-3 h-5 w-5 text-primary" aria-hidden="true" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Vainqueur</p>
                <p className="mt-1 font-heading text-2xl font-bold">{summary.winner}</p>
              </GlowCard>
            </Reveal>
            <Reveal delay={0.08}>
              <GlowCard glow="red" className="h-full">
                <Users className="mb-3 h-5 w-5 text-primary" aria-hidden="true" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Finaliste</p>
                <p className="mt-1 font-heading text-2xl font-bold">{summary.runnerUp}</p>
              </GlowCard>
            </Reveal>
            <Reveal delay={0.16}>
              <GlowCard glow="white" className="h-full">
                <BarChart3 className="mb-3 h-5 w-5 text-primary" aria-hidden="true" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Lecture utile</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{summary.angle}.</p>
              </GlowCard>
            </Reveal>
          </div>
        </Section>

        <Section eyebrow="Vue nationale" title={`Le scrutin ${year} en chiffres`} className="pt-0 sm:pt-0">
          <NationalYearChart year={year} />
        </Section>

        <YearResults year={year} />

        <Section className="pt-0 sm:pt-0">
          <SeoConnectorLinks context="year" year={year} />
        </Section>

        <Section className="pt-0 sm:pt-0">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <LinkCard
              to={`/explorer?year=${year}`}
              Icon={MapPin}
              title={`Explorer les communes en ${year}`}
              text={`Recherchez une commune ou parcourez les départements pour retrouver les résultats locaux de la présidentielle ${year}.`}
            />
            <LinkCard
              to={`/comparer?year=${year}`}
              Icon={BarChart3}
              glow="red"
              title="Comparer deux communes"
              text="Comparez les scores, la participation et les écarts entre deux territoires pour cette année électorale."
            />
          </div>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
