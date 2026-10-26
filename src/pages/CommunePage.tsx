import { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import SeoConnectorLinks from "@/components/SeoConnectorLinks";
import { ArrowLeft, Loader2, GitCompare } from "lucide-react";
import { useQuery, useQueries } from "@tanstack/react-query";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { PageHero, Section, SegmentedControl } from "@/components/design";
import { CommunePodium } from "@/components/commune/CommunePodium";
import { CommuneVsNational } from "@/components/commune/CommuneVsNational";
import { CommuneEvolution } from "@/components/commune/CommuneEvolution";
import { CommuneTurnout } from "@/components/commune/CommuneTurnout";
import { CommuneMap } from "@/components/commune/CommuneMap";
import { CommuneSummaryCard } from "@/components/commune/CommuneSummaryCard";
import { CommuneComparison } from "@/components/commune/CommuneComparison";
import { CommuneNeighbours } from "@/components/commune/CommuneNeighbours";
import { CommuneShare } from "@/components/commune/CommuneShare";
import { Presidentielle2027Teaser } from "@/components/commune/Presidentielle2027Teaser";
import {
  buildCommuneSummary,
  buildShareCardData,
  communeSeoDescription,
  communeSeoTitle,
  communeShareUrl,
  nearestCommunes,
} from "@/lib/communeShare";
import { getCandidateColor } from "@/lib/candidateColors";
import { SITE_URL } from "@/lib/site";
import { getCommuneWithCoords, getDepartmentCommunes } from "@/lib/api/geoApi";
import { getCommuneResults, getDepartmentAggregate, ElectionResult } from "@/lib/api/resultsApi";
import { getNationalResults } from "@/lib/api/nationalResultsApi";
import { addToSearchHistory } from "@/lib/searchHistory";
import { depensesCommuneUrl } from "@/lib/partnerSites";
import DepensesPubliquesCard from "@/components/partner/DepensesPubliquesCard";
import { DEFAULT_YEAR, PresidentialYear } from "@/lib/elections";

const EVOLUTION_YEARS = [1995, 2002, 2007, 2012, 2017, 2022] as const;

const actionBtn =
  "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-accent";

const CommunePage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [round, setRound] = useState<1 | 2>(1);
  const yearParam = searchParams.get("year");
  const year = (yearParam ? Number(yearParam) : DEFAULT_YEAR) as PresidentialYear;

  const { data: geo, isLoading: geoLoading } = useQuery({
    queryKey: ["geo", code],
    queryFn: () => getCommuneWithCoords(code!),
    enabled: !!code,
  });

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ["results", code, round, year],
    queryFn: () => getCommuneResults(code!, round, year),
    enabled: !!code,
  });

  const evolutionQueries = useQueries({
    queries: EVOLUTION_YEARS.map((y) => ({
      queryKey: ["results", code, 1, y],
      queryFn: () => getCommuneResults(code!, 1, y),
      enabled: !!code && !results?.niveau,
    })),
  });

  const { data: national } = useQuery({
    queryKey: ["national", year, round],
    queryFn: () => getNationalResults(year, round),
    enabled: !!code,
    staleTime: Infinity,
  });

  const depCode = geo?.codeDepartement;
  const { data: departmentAgg } = useQuery({
    queryKey: ["dep-aggregate", depCode, year, round],
    queryFn: () => getDepartmentAggregate(depCode!, round, year),
    enabled: !!depCode,
  });

  const { data: depCommunes } = useQuery({
    queryKey: ["dep-communes", depCode],
    queryFn: () => getDepartmentCommunes(depCode!),
    enabled: !!depCode,
  });

  const evolutionData = evolutionQueries
    .map((q, i) => (q.data ? { year: EVOLUTION_YEARS[i], ...q.data } : null))
    .filter(Boolean) as Array<{ year: number } & ElectionResult>;

  useEffect(() => {
    if (geo) {
      addToSearchHistory(geo);
    }
  }, [geo]);

  if (geoLoading || resultsLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SEOHead path={code ? `/commune/${code}` : "/"} />
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center" role="status" aria-label="Chargement">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!geo || !results) {
    const noCommuneDataRound = year === 1981 && round === 2;
    const noCommuneData = noCommuneDataRound;
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SEOHead
          title={noCommuneData ? "Données indisponibles" : "Commune introuvable"}
          path={code ? `/commune/${code}` : "/"}
        />
        <SiteHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-display-lg font-heading font-extrabold mb-4">
            {noCommuneData ? "Données par commune indisponibles" : "Commune ou résultats introuvables"}
          </h1>
          {noCommuneDataRound && (
            <p className="text-muted-foreground max-w-md mb-4">
              Le 2ᵉ tour 1981 n'est pas disponible par commune. Seul le 1ᵉʳ tour est accessible (communes de plus de 9 000 habitants).
            </p>
          )}
          <button onClick={() => navigate(`/?year=${encodeURIComponent(String(year || 2022))}`)} className="text-primary hover:underline flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
          </button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const isDep = results.niveau === "departement";
  const title = isDep ? results.nomDepartement || `Département ${geo.codeDepartement}` : geo.nom;
  const pop = geo.population?.toLocaleString("fr-FR");
  const scopeLabel = isDep ? `le département ${results.nomDepartement}` : geo.nom;
  const summary = buildCommuneSummary({ commune: geo.nom, year, round, results, national: national ?? null });
  const shareUrl = communeShareUrl(geo.code, year, round, typeof window !== "undefined" ? window.location.origin : SITE_URL);
  const shareCard = buildShareCardData({
    commune: geo.nom,
    year,
    round,
    results,
    national: national ?? null,
    colorOf: (c, i) => getCandidateColor(c.prenom, c.nom, i),
    url: `${SITE_URL}/commune/${geo.code}`,
  });
  const neighbours = depCommunes ? nearestCommunes(geo, depCommunes, 6) : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={communeSeoTitle(geo.nom)}
        description={communeSeoDescription(geo.nom, summary.sentence)}
        path={`/commune/${code}`}
      />
      <JsonLd
        path={`/commune/${code}`}
        commune={{ nom: geo.nom, code: geo.code, codeDepartement: geo.codeDepartement }}
        breadcrumbs={[
          { name: "Explorer par commune", path: "/explorer" },
          { name: `Département ${geo.codeDepartement}`, path: `/explorer/${geo.codeDepartement}` },
          { name: geo.nom, path: `/commune/${code}` },
        ]}
      />
      <SiteHeader />

      <main id="contenu" tabIndex={-1} className="focus:outline-none flex-1">
        <PageHero
          eyebrow={isDep ? `Résultats par département · ${year}` : `Département ${geo.codeDepartement} · Présidentielle ${year}`}
          title={title}
          description={
            isDep
              ? `Commune : ${geo.nom} (située dans ce département) • ${pop} habitants`
              : `${pop} habitants`
          }
          actions={
            <>
              <button
                type="button"
                onClick={() => navigate(`/?year=${encodeURIComponent(String(year || 2022))}`)}
                className={actionBtn}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Retour à la recherche
              </button>
              <Link to={`/comparer?a=${geo.code}&year=${year}`} className={actionBtn}>
                <GitCompare className="h-4 w-4" aria-hidden="true" />
                Comparer avec une autre
              </Link>
              <CommuneShare
                url={shareUrl}
                title={communeSeoTitle(geo.nom)}
                text={summary.sentence}
                card={shareCard}
              />
              <SegmentedControl<1 | 2>
                label="Tour de scrutin"
                value={round}
                onChange={setRound}
                options={[
                  { value: 1, label: "1er tour" },
                  { value: 2, label: "2nd tour" },
                ]}
              />
            </>
          }
        />

        {isDep && (
          <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-8">
            <div className="rounded-2xl border border-border bg-card/60 p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Pour les années 1965, 1969, 1974, 1981 et 1988</strong>, les résultats par commune n'existent pas. Nous affichons donc les résultats du <strong className="text-foreground">département {results.nomDepartement}</strong>, dans lequel se trouve {geo.nom}. Les chiffres correspondent à l’ensemble du département.
              </p>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-8">
          <CommuneSummaryCard sentence={summary.sentence} />
        </div>

        <Section eyebrow="Mobilisation" title="Participation et abstention" width="default">
          <CommuneTurnout results={results} />
        </Section>

        <Section eyebrow={`${round === 1 ? "1er" : "2nd"} tour ${year}`} title="Résultats par candidat" width="default">
          <CommunePodium candidates={results.candidates} />
        </Section>

        {national && national.candidates.length > 0 && (
          <Section eyebrow="Comparaison" title="Écart avec le national" width="default">
            <CommuneVsNational candidates={results.candidates} national={national} scopeLabel={scopeLabel} />
          </Section>
        )}

        {!isDep && (
          <Section eyebrow="Comparaison" title="Commune, département et France" width="default">
            <CommuneComparison
              commune={geo.nom}
              results={results}
              department={departmentAgg ?? null}
              departmentName={geo.departement?.nom ?? results.nomDepartement ?? `Département ${geo.codeDepartement}`}
              national={national ?? null}
            />
          </Section>
        )}

        <div className="mx-auto max-w-6xl px-4 pb-4 sm:px-8">
          <DepensesPubliquesCard
            title={`Les finances de ${geo.nom}`}
            text={`Budget, dette par habitant et fiscalité locale de ${geo.nom}, comparés aux communes de même taille.`}
            href={depensesCommuneUrl(geo.nom, geo.code)}
            cta={`Voir les finances de ${geo.nom}`}
          />
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <SeoConnectorLinks context="commune" communeName={geo.nom} />
        </div>

        {evolutionData.length >= 2 && (
          <Section eyebrow="Historique" title="Évolution depuis 1995 (1er tour)" width="default">
            <CommuneEvolution data={evolutionData} />
          </Section>
        )}

        {geo?.centre?.coordinates && (
          <Section eyebrow="Territoire" title="Localisation" width="default">
            <CommuneMap lat={geo.centre.coordinates[1]} lon={geo.centre.coordinates[0]} nom={geo.nom} />
          </Section>
        )}

        {neighbours.length > 0 && (
          <Section eyebrow="Autour" title="Communes voisines" width="default">
            <CommuneNeighbours neighbours={neighbours} year={year} />
          </Section>
        )}

        <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-8">
          <Presidentielle2027Teaser />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default CommunePage;
