import { lazy, Suspense, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";

import { Section } from "@/components/design";
import HomeHero from "@/components/home/HomeHero";
import Home2027 from "@/components/home/Home2027";
import StatsStrip from "@/components/home/StatsStrip";
import type { GeoCommune } from "@/lib/api/geoApi";
import { getSearchHistory, clearSearchHistory, HistoryEntry } from "@/lib/searchHistory";
import { DEFAULT_YEAR, PRESIDENTIAL_YEARS_DESC, PresidentialYear, Round } from "@/lib/elections";

// Blocs sous la ligne de flottaison : chargés dans des chunks séparés.
const ElectionTimeline = lazy(() => import("@/components/home/ElectionTimeline"));
const FranceMap = lazy(() => import("@/components/home/FranceMap"));
const RunoffDuel = lazy(() => import("@/components/home/RunoffDuel"));
const FeatureBento = lazy(() => import("@/components/home/FeatureBento"));

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [history, setHistory] = useState<HistoryEntry[]>(getSearchHistory());
  const [round, setRound] = useState<Round>(1);
  const yearParam = Number(searchParams.get("year"));
  const year = (PRESIDENTIAL_YEARS_DESC as number[]).includes(yearParam) ? (yearParam as PresidentialYear) : DEFAULT_YEAR;

  const setYear = (y: PresidentialYear) => {
    const next = new URLSearchParams(searchParams);
    next.set("year", String(y));
    setSearchParams(next, { replace: true });
  };

  const goCommune = (code: string) => navigate(`/commune/${code}?year=${encodeURIComponent(year)}`);

  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead path="/" />
      <JsonLd path="/" />
      <SiteHeader />

      <main id="contenu" tabIndex={-1} className="focus:outline-none flex-1">
        <HomeHero
          history={history}
          onSelect={(c: GeoCommune) => goCommune(c.code)}
          onOpenHistory={(e) => goCommune(e.code)}
          onClearHistory={handleClearHistory}
        />
        <Home2027 />
        <StatsStrip />
        <Section width="narrow" eyebrow="Repères" title="L'élection présidentielle en France">
          <p className="text-muted-foreground">
            PrésiFrance réunit en données ouvertes les résultats des {PRESIDENTIAL_YEARS_DESC.length} élections présidentielles françaises, de 1965 à 2022, avec le détail par département et par commune, ainsi que le suivi de la présidentielle de 2027. Le 1er tour aura lieu le dimanche 18 avril 2027 et le 2nd tour le dimanche 2 mai 2027 (source : Service-public.fr).
          </p>
          <ul className="mt-6 space-y-2">
            <li><Link to="/presidentielle-2027" className="font-medium text-primary hover:underline">Présidentielle 2027 : date, candidats et calendrier</Link></li>
            <li><Link to="/sondages-presidentielle-2027" className="font-medium text-primary hover:underline">Sondages de la présidentielle 2027</Link></li>
            <li><Link to="/parrainages?year=2027" className="font-medium text-primary hover:underline">Parrainages de la présidentielle 2027</Link></li>
            <li><Link to="/resultats-presidentielle" className="font-medium text-primary hover:underline">Résultats de toutes les présidentielles depuis 1965</Link></li>
            <li><Link to="/resultats-presidentielle-par-commune" className="font-medium text-primary hover:underline">Résultats de la présidentielle par commune</Link></li>
          </ul>
        </Section>
        <Suspense fallback={null}>
          <Section
            width="default"
            eyebrow={`Résultats ${year}`}
            title="La carte du vote, département par département"
            id="carte"
          >
            <FranceMap year={year} className="mx-auto w-full max-w-lg" />
          </Section>
          <RunoffDuel year={year} round={round} onYearChange={setYear} onRoundChange={setRound} />
          <ElectionTimeline />
          <FeatureBento />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
