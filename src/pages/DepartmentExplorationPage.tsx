import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, MapPin, Search, Loader2 } from "lucide-react";
import { PageHero, Section } from "@/components/design";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import SeoConnectorLinks from "@/components/SeoConnectorLinks";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getDepartmentCommunes, GeoCommuneWithCoords } from "@/lib/api/geoApi";
import { getDepartmentIntro } from "@/lib/departmentSeo";
import { getDepartmentName } from "@/lib/departments";

const DepartmentExplorationPage = () => {
  const { depCode } = useParams<{ depCode: string }>();
  const [communes, setCommunes] = useState<GeoCommuneWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (depCode) {
      setLoading(true);
      getDepartmentCommunes(depCode).then((data) => {
        // Sort by name
        const sorted = [...data].sort((a, b) => a.nom.localeCompare(b.nom));
        setCommunes(sorted);
        setLoading(false);
      });
    }
  }, [depCode]);

  const filteredCommunes = communes.filter((c) =>
    c.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.includes(searchQuery)
  );
  const departmentName = getDepartmentName(depCode);
  const departmentIntro = getDepartmentIntro(depCode);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={`Résultats présidentielle : ${departmentName}`}
        description={`Liste des communes pour le département ${departmentName}. Retrouvez les résultats de l'élection présidentielle par ville, village et commune.`}
        path={depCode ? `/explorer/${depCode}` : "/explorer"}
      />
      <JsonLd
        path={depCode ? `/explorer/${depCode}` : "/explorer"}
        breadcrumbs={[
          { name: "Explorer par commune", path: "/explorer" },
          { name: departmentName, path: depCode ? `/explorer/${depCode}` : "/explorer" },
        ]}
      />

      <SiteHeader />

      <main className="flex-1">
        <PageHero
          eyebrow={`Département ${depCode}`}
          title={`Communes du ${departmentName}`}
          description={departmentIntro}
          actions={
            <Link
              to="/explorer"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Retour à la liste des départements
            </Link>
          }
        />

        <Section width="wide" className="!pt-10 sm:!pt-12">
          <div className="relative mb-6 w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="commune-filter" className="sr-only">Rechercher une commune du département</label>
            <input
              id="commune-filter"
              type="search"
              placeholder="Rechercher une commune..."
              autoComplete="off"
              className="glass h-12 w-full rounded-full border border-border pl-11 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground" role="status">
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
              <p>Chargement des communes...</p>
            </div>
          ) : (
            <div>
              <p className="mb-6 text-sm font-medium text-muted-foreground" role="status" aria-live="polite">
                {filteredCommunes.length} commune{filteredCommunes.length > 1 && "s"} trouvée{filteredCommunes.length > 1 && "s"}
              </p>

              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCommunes.map((commune) => (
                  <li key={commune.code}>
                    <Link
                      to={`/commune/${commune.code}`}
                      className="group flex min-h-[44px] items-center justify-between gap-2 rounded-xl border border-border bg-card/60 px-3 py-2.5 transition-colors hover:border-primary/50 hover:bg-accent"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
                        <span className="truncate text-sm font-medium">{commune.nom}</span>
                      </span>
                      <span className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                        {commune.code}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              {filteredCommunes.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">
                  Aucune commune ne correspond à votre recherche.
                </div>
              )}
            </div>
          )}

          <div className="mt-12">
            <SeoConnectorLinks context="department" departmentName={departmentName} />
          </div>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default DepartmentExplorationPage;
