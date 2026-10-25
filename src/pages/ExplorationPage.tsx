import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Search } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { GlowCard, PageHero, Reveal, Section, SegmentedControl } from "@/components/design";
import { DEPARTMENTS } from "@/lib/departments";

type Scope = "all" | "metro" | "outremer";
type Sort = "code" | "nom";

const isOutreMer = (code: string) => code.startsWith("97");
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const ExplorationPage = () => {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [sort, setSort] = useState<Sort>("code");

  const list = useMemo(() => {
    const q = norm(query.trim());
    const filtered = DEPARTMENTS.filter((d) => {
      if (scope === "metro" && isOutreMer(d.code)) return false;
      if (scope === "outremer" && !isOutreMer(d.code)) return false;
      return !q || norm(d.nom).includes(q) || d.code.toLowerCase().startsWith(q);
    });
    return sort === "nom" ? [...filtered].sort((a, b) => a.nom.localeCompare(b.nom, "fr")) : filtered;
  }, [query, scope, sort]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Exploration des Communes de France"
        description="Parcourez les résultats électoraux de toutes les communes de France par département. Accédez aux données officielles de la présidentielle 2022."
      />

      <SiteHeader />

      <main className="flex-1">
        <PageHero
          eyebrow="Répertoire national"
          title="Explorez les communes de France"
          description="Retrouvez les résultats détaillés de l'élection présidentielle 2022 pour chacune des 35 000 communes, classées par département."
        />

        <Section width="wide" className="!pt-10 sm:!pt-12">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <label htmlFor="dep-filter" className="sr-only">Filtrer les départements par nom ou numéro</label>
              <input
                id="dep-filter"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrer par nom ou numéro…"
                autoComplete="off"
                className="glass h-12 w-full rounded-full border border-border pl-11 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SegmentedControl<Scope>
                label="Périmètre"
                size="sm"
                value={scope}
                onChange={setScope}
                options={[
                  { value: "all", label: "Tous" },
                  { value: "metro", label: "Métropole" },
                  { value: "outremer", label: "Outre-mer" },
                ]}
              />
              <SegmentedControl<Sort>
                label="Tri"
                size="sm"
                value={sort}
                onChange={setSort}
                options={[
                  { value: "code", label: "Par numéro" },
                  { value: "nom", label: "A → Z" },
                ]}
              />
            </div>
          </div>

          <p className="mb-6 text-sm font-medium text-muted-foreground" role="status" aria-live="polite">
            {list.length} département{list.length > 1 ? "s" : ""}
          </p>

          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((dep, i) => (
              <Reveal as="li" key={dep.code} delay={Math.min(i % 8, 7) * 0.03} y={14}>
                <Link to={`/explorer/${dep.code}`} className="group block h-full rounded-2xl focus-visible:outline-none">
                  <GlowCard interactive className="h-full">
                    <div className="flex items-center gap-4 p-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-primary/10 font-heading text-lg font-bold tabular-nums text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        {dep.code}
                      </span>
                      <span className="min-w-0 flex-1 text-base font-semibold leading-tight">{dep.nom}</span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                    </div>
                  </GlowCard>
                </Link>
              </Reveal>
            ))}
          </ul>

          {list.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">
              Aucun département ne correspond à votre recherche.
            </div>
          )}
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default ExplorationPage;
