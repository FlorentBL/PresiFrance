import { useState } from "react";
import { getCandidatePhotoUrl } from "@/lib/candidatePhotos";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Clock, MapPin, BarChart3, Users, Globe, GitCompare, Trophy, Loader2, LineChart, CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import CommuneSearch from "@/components/CommuneSearch";
import { GeoCommune } from "@/lib/api/geoApi";
import { getSearchHistory, clearSearchHistory, HistoryEntry } from "@/lib/searchHistory";
import { DEFAULT_YEAR, PRESIDENTIAL_YEARS_DESC, PresidentialYear } from "@/lib/elections";
import { getNationalResults, YEARS_WITH_NATIONAL_RESULTS } from "@/lib/api/nationalResultsApi";
import type { NationalCandidateResult } from "@/lib/api/nationalResultsApi";

function CandidateRow({ candidate, rank }: { candidate: NationalCandidateResult; rank: number }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = getCandidatePhotoUrl(candidate.prenom, candidate.nom);
  const initials = `${candidate.prenom.charAt(0)}${candidate.nom.charAt(0)}`.toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-black text-muted-foreground w-5 shrink-0">#{rank}</span>
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted">
        {photoUrl && !imgError ? (
          <img
            src={photoUrl}
            alt={`${candidate.prenom} ${candidate.nom}`}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10 font-bold text-primary text-xs">
            {initials}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-2 mb-0.5">
          <span className="font-semibold text-sm truncate">{candidate.prenom} {candidate.nom}</span>
          <span className="font-bold text-sm text-primary shrink-0">{candidate.pourcentExprimes.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary/80"
            style={{ width: `${candidate.pourcentExprimes}%` }}
          />
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0 w-16 text-right">{candidate.voix.toLocaleString("fr-FR")} voix</span>
    </div>
  );
}

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [history, setHistory] = useState<HistoryEntry[]>(getSearchHistory());
  const yearParam = searchParams.get("year");
  const year = (yearParam ? Number(yearParam) : DEFAULT_YEAR) as PresidentialYear;
  const [round, setRound] = useState<1 | 2>(1);

  const { data: nationalResults, isLoading: nationalLoading } = useQuery({
    queryKey: ["national-results", year, round],
    queryFn: () => getNationalResults(year, round),
    enabled: YEARS_WITH_NATIONAL_RESULTS.includes(year),
  });

  const setYear = (y: PresidentialYear) => {
    const next = new URLSearchParams(searchParams);
    next.set("year", String(y));
    setSearchParams(next, { replace: true });
  };

  const handleSelect = (commune: GeoCommune) => {
    navigate(`/commune/${commune.code}?year=${encodeURIComponent(year)}`);
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead path="/" />
      <JsonLd path="/" />
      <SiteHeader />

      <section className="flex-1 px-4 py-8 sm:py-12 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <img src="/logo.webp" alt="PrésiFrance" className="h-28 w-28 sm:h-36 sm:w-36 mx-auto mb-6 rounded-full object-cover" />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
              <Globe className="h-3 w-3" />
              Données Officielles Open Data
            </div>
            <h1 className="text-4xl sm:text-5xl font-black font-heading text-foreground mb-3 tracking-tight">
              Explorez le vote de <span className="text-primary italic">chaque commune</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
              Résultats détaillés, participation et parrainages des élections présidentielles françaises.
            </p>
          </div>

          {/* Année + recherche sur une ligne fluide */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 sm:gap-6 mb-6">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-muted-foreground uppercase hidden sm:inline">Année</span>
              <div className="inline-flex p-1 rounded-lg bg-muted/50 border border-border/50 overflow-x-auto max-w-full shrink-0">
                {PRESIDENTIAL_YEARS_DESC.map((y) => (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                      year === y ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-0 max-w-xl mx-auto sm:mx-0">
              <CommuneSearch onSelect={handleSelect} />
            </div>
          </div>

          {/* Historique compact */}
          {history.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
              {history.map((entry) => (
                <button
                  key={entry.code}
                  onClick={() => navigate(`/commune/${entry.code}?year=${encodeURIComponent(year)}`)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/50 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-primary hover:text-white hover:border-primary transition-colors"
                >
                  <MapPin className="h-3 w-3" />
                  {entry.nom}
                  <span className="text-muted-foreground text-xs">({entry.codeDepartement})</span>
                </button>
              ))}
              <button onClick={handleClearHistory} className="text-muted-foreground/60 hover:text-foreground text-xs" title="Effacer">×</button>
            </div>
          )}

          {/* Résultat national — intégré, compact */}
          {YEARS_WITH_NATIONAL_RESULTS.includes(year) && (
            <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm">Résultat national {year}</h2>
                    {nationalResults && (
                      <p className="text-xs text-muted-foreground">Participation {nationalResults.participation.toFixed(1)}%</p>
                    )}
                  </div>
                </div>
                <div className="flex p-1 rounded-lg bg-muted/50 border border-border/50 w-fit">
                  <button
                    onClick={() => setRound(1)}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${
                      round === 1 ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    1er tour
                  </button>
                  <button
                    onClick={() => setRound(2)}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${
                      round === 2 ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    2nd tour
                  </button>
                </div>
              </div>
              {nationalLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : nationalResults ? (
                <div className="p-4">
                  <div className="space-y-2">
                    {nationalResults.candidates.slice(0, 5).map((c, i) => (
                      <CandidateRow key={i} candidate={c} rank={i + 1} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-20 bg-muted/30 border-y border-border">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
            <Link
              to="/resultats-presidentielle"
              className="p-8 rounded-2xl bg-background border border-border shadow-sm hover:shadow-md transition-shadow hover:border-primary/50 group block sm:col-span-2 xl:col-span-4"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Résultats des présidentielles</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Parcourez les résultats par année, puis explorez les départements et les communes pour suivre les scores, la participation et les évolutions locales.
              </p>
            </Link>

            <Link
              to="/explorer"
              className="p-8 rounded-2xl bg-background border border-border shadow-sm hover:shadow-md transition-shadow hover:border-primary/50 group block"
            >
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Explorer par ville</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Accédez aux résultats détaillés de chacune des 35 000 communes de France, classées par département.
              </p>
            </Link>

            <Link
              to="/analyse"
              className="p-8 rounded-2xl bg-background border border-border shadow-sm hover:shadow-md transition-shadow hover:border-primary/50 group block"
            >
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6 group-hover:bg-violet-500/20 transition-colors">
                <LineChart className="h-6 w-6 text-violet-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Sondages 2022</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Chronologie des intentions au 1er tour (2022) : courbes lissées à partir des sondages après la liste
                officielle des candidats.
              </p>
            </Link>
            
            <Link
              to="/comparer"
              className="p-8 rounded-2xl bg-background border border-border shadow-sm hover:shadow-md transition-shadow hover:border-primary/50 group block"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                <GitCompare className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Comparer</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Comparez les résultats de deux communes côte à côte : participation, scores des candidats, écarts.
              </p>
            </Link>
            
            <Link
              to="/parrainages"
              className="p-8 rounded-2xl bg-background border border-border shadow-sm hover:shadow-md transition-shadow hover:border-primary/50 group block"
            >
              <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-6 group-hover:bg-red-500/20 transition-colors">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Parrainages</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Découvrez qui a parrainé quel candidat dans votre département ou votre région.
              </p>
            </Link>

            <div className="p-8 rounded-2xl bg-background border border-border shadow-sm sm:col-span-2 xl:col-span-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6">
                <Globe className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Open Data</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Toutes nos données proviennent directement de data.gouv.fr et du Ministère de l'Intérieur.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Index;
