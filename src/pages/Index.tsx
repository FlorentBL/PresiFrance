import { lazy, Suspense, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import HomeHero from "@/components/home/HomeHero";
import StatsStrip from "@/components/home/StatsStrip";
import type { GeoCommune } from "@/lib/api/geoApi";
import { getSearchHistory, clearSearchHistory, HistoryEntry } from "@/lib/searchHistory";
import { DEFAULT_YEAR, PRESIDENTIAL_YEARS_DESC, PresidentialYear, Round } from "@/lib/elections";

// Blocs sous la ligne de flottaison : chargés dans des chunks séparés.
const ElectionTimeline = lazy(() => import("@/components/home/ElectionTimeline"));
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
          year={year}
          history={history}
          onSelect={(c: GeoCommune) => goCommune(c.code)}
          onOpenHistory={(e) => goCommune(e.code)}
          onClearHistory={handleClearHistory}
        />
        <StatsStrip />
        <Suspense fallback={null}>
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
