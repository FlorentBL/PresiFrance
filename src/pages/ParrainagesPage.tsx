import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Users, BarChart3, MapPin, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import { PageHero, Section, SegmentedControl, GlowCard, AnimatedNumber, Reveal } from "@/components/design";
import { BarRow } from "@/components/parrainages/BarRow";
import { SponsorList } from "@/components/parrainages/SponsorList";
import { displayName } from "@/components/parrainages/candidatName";
import { getParrainagesManifest, getParrainagesByYear, getParrainagesByDep } from "@/lib/api/parrainagesApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ParrainagesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const yearParam = searchParams.get("year");
  const depParam = searchParams.get("dep") || "";
  const [searchCandidat, setSearchCandidat] = useState("");
  const [selectedCandidat, setSelectedCandidat] = useState<string | null>(null);

  const year = yearParam ? Number(yearParam) : 2022;

  const { data: manifest, isLoading: manifestLoading } = useQuery({
    queryKey: ["parrainages-manifest"],
    queryFn: getParrainagesManifest,
  });

  const { data: dataByYear, isLoading: dataLoading } = useQuery({
    queryKey: ["parrainages", year],
    queryFn: () => getParrainagesByYear(year),
    enabled: !!manifest?.years?.includes(year),
  });

  const { data: byDep } = useQuery({
    queryKey: ["parrainages-by-dep", year],
    queryFn: () => getParrainagesByDep(year),
    enabled: !!manifest?.years?.includes(year),
  });

  const availableYears = manifest?.years ?? [2022];
  const effectiveYear = availableYears.includes(year) ? year : availableYears[0];

  const depList = byDep ? Object.keys(byDep).sort((a, b) => a.localeCompare(b)) : [];
  const selectedDep = depParam && depList.includes(depParam) ? depParam : null;

  const stats = useMemo(() => dataByYear?.stats ?? [], [dataByYear]);
  const sortedByTotal = useMemo(() => {
    const q = searchCandidat.trim().toLowerCase();
    const list = q
      ? stats.filter((s) => s.candidat.toLowerCase().includes(q) || displayName(s.candidat).toLowerCase().includes(q))
      : stats;
    return [...list].sort((a, b) => b.total - a.total);
  }, [stats, searchCandidat]);

  const depData = selectedDep && byDep ? byDep[selectedDep] ?? [] : [];
  const parrainagesList = selectedCandidat && dataByYear?.byCandidat
    ? (selectedDep
        ? dataByYear.byCandidat[selectedCandidat]?.filter((e) => e.dep === selectedDep) ?? []
        : dataByYear.byCandidat[selectedCandidat] ?? []
      )
    : [];

  // Répartition par département du candidat sélectionné (top 12).
  const candidatDeps = useMemo(() => {
    if (!selectedCandidat || !dataByYear?.byCandidat) return [];
    const counts = new Map<string, number>();
    for (const e of dataByYear.byCandidat[selectedCandidat] ?? []) {
      const d = e.dep || "—";
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [selectedCandidat, dataByYear]);

  const isLoading = manifestLoading || dataLoading;

  if (isLoading && !dataByYear) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SEOHead path="/parrainages" />
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Chargement" />
        </div>
        <SiteFooter />
      </div>
    );
  }

  const nationalMax = sortedByTotal[0]?.total ?? 1;
  const depMax = depData[0]?.count ?? 1;

  const filters = (
    <div className="flex flex-wrap items-center gap-3">
      <SegmentedControl
        label="Année de l'élection"
        options={availableYears.map((y) => ({ value: y, label: String(y) }))}
        value={effectiveYear}
        onChange={(y) => {
          const next = new URLSearchParams(searchParams);
          next.set("year", String(y));
          next.delete("dep");
          setSearchParams(next);
          setSelectedCandidat(null);
        }}
      />
      <Select
        value={selectedDep || "all"}
        onValueChange={(v) => {
          const next = new URLSearchParams(searchParams);
          if (v === "all") next.delete("dep");
          else next.set("dep", v);
          setSearchParams(next);
        }}
      >
        <SelectTrigger className="h-11 w-full rounded-full bg-card/60 sm:w-[230px]" aria-label="Filtrer par département">
          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <SelectValue placeholder="Tous les départements" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les départements</SelectItem>
          {depList.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="relative w-full sm:w-[240px]">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          placeholder="Rechercher un candidat..."
          aria-label="Rechercher un candidat"
          value={searchCandidat}
          onChange={(e) => setSearchCandidat(e.target.value)}
          className="h-11 w-full rounded-full border border-input bg-card/60 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Parrainages présidentiels"
        description="Parrainages validés par le Conseil constitutionnel — recherche par département et par candidat."
        path="/parrainages"
      />
      <JsonLd path="/parrainages" breadcrumbs={[{ name: "Parrainages", path: "/parrainages" }]} />
      <SiteHeader />

      <main id="contenu" tabIndex={-1} className="focus:outline-none flex-1">
        <PageHero
          eyebrow="Conseil constitutionnel"
          title="Parrainages présidentiels"
          description="Les parrainages validés par le Conseil constitutionnel. 500 parrainages d'élus répartis sur au moins 30 départements sont nécessaires pour candidater."
          actions={filters}
        />

        {dataByYear && (
          <Section className="!pb-4">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Reveal>
                <GlowCard glow="blue" className="h-full">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    Total parrainages
                  </p>
                  <p className="mt-3 font-heading text-5xl font-extrabold tabular-nums">
                    <AnimatedNumber value={dataByYear.total} />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">parrainages validés</p>
                </GlowCard>
              </Reveal>
              <Reveal delay={0.08}>
                <GlowCard glow="red" className="h-full">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-tri-red">
                    <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                    Candidats
                  </p>
                  <p className="mt-3 font-heading text-5xl font-extrabold tabular-nums">
                    <AnimatedNumber value={dataByYear.candidats.length} />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">candidats parrainés</p>
                </GlowCard>
              </Reveal>
              <Reveal delay={0.16}>
                <GlowCard glow="white" className="h-full">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Source</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Conseil constitutionnel —{" "}
                    <a
                      href="https://www.data.gouv.fr/posts/donnees-liees-aux-elections-presidentielles"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:no-underline"
                    >
                      data.gouv.fr
                    </a>
                  </p>
                </GlowCard>
              </Reveal>
            </div>
          </Section>
        )}

        <Section className="!py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GlowCard glow="blue" interactive={false}>
              <h2 className="font-heading text-xl font-bold">
                {selectedDep ? "Parrainages par candidat" : "Classement des candidats"}
              </h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                {selectedDep
                  ? `Répartition dans ${selectedDep}`
                  : "Total de parrainages et nombre de départements couverts. Sélectionnez un candidat pour le détail."}
              </p>
              <div className="max-h-[520px] space-y-1 overflow-y-auto pr-1">
                {selectedDep ? (
                  depData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun parrainage dans ce département.</p>
                  ) : (
                    depData.map((item, i) => (
                      <BarRow
                        key={item.candidat}
                        candidat={item.candidat}
                        index={i}
                        value={item.count}
                        max={depMax}
                        onSelect={() => setSelectedCandidat(item.candidat)}
                        active={selectedCandidat === item.candidat}
                      />
                    ))
                  )
                ) : sortedByTotal.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun candidat ne correspond à la recherche.</p>
                ) : (
                  sortedByTotal.slice(0, 25).map((s, i) => (
                    <BarRow
                      key={s.candidat}
                      candidat={s.candidat}
                      index={i}
                      rank={i + 1}
                      value={s.total}
                      max={nationalMax}
                      hint={`${s.departements} dép.`}
                      onSelect={() => setSelectedCandidat(s.candidat)}
                      active={selectedCandidat === s.candidat}
                    />
                  ))
                )}
              </div>
            </GlowCard>

            <GlowCard glow="red" interactive={false}>
              <h2 className="font-heading text-xl font-bold">Répartition par département</h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                {selectedCandidat
                  ? `Les 12 départements qui ont le plus parrainé ${displayName(selectedCandidat)}.`
                  : "Choisissez un candidat dans le classement pour voir où il a trouvé ses parrains."}
              </p>
              {selectedCandidat ? (
                <div className="space-y-1">
                  {candidatDeps.map(([dep, n], i) => (
                    <BarRow key={dep} candidat={selectedCandidat} index={i} value={n} max={candidatDeps[0][1]} hint={dep} />
                  ))}
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">Aucun candidat sélectionné.</p>
              )}
            </GlowCard>
          </div>
        </Section>

        {dataByYear && (
          <Section className="!pt-8">
            <GlowCard glow="white" interactive={false}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-xl font-bold">Qui a parrainé qui ?</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cliquez sur un candidat dans le classement pour voir la liste des élus qui l'ont parrainé.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedCandidat || ""} onValueChange={(v) => setSelectedCandidat(v || null)}>
                    <SelectTrigger className="h-11 w-full rounded-full bg-card/60 sm:w-[270px]" aria-label="Choisir un candidat">
                      <SelectValue placeholder="Choisir un candidat..." />
                    </SelectTrigger>
                    <SelectContent>
                      {[...stats].sort((a, b) => b.total - a.total).map((s) => (
                        <SelectItem key={s.candidat} value={s.candidat}>
                          {displayName(s.candidat)} ({s.total})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCandidat && (
                    <button
                      type="button"
                      onClick={() => setSelectedCandidat(null)}
                      aria-label="Effacer la sélection"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-6">
                {selectedCandidat ? (
                  <>
                    <p className="mb-4 text-sm text-muted-foreground">
                      <strong className="text-foreground">{displayName(selectedCandidat)}</strong>
                      {selectedDep && ` — Département : ${selectedDep}`}
                      {" — "}
                      {parrainagesList.length} parrainage{parrainagesList.length > 1 ? "s" : ""}
                    </p>
                    <SponsorList entries={parrainagesList} />
                  </>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Sélectionnez un candidat pour afficher la liste des parrainages.
                  </p>
                )}
              </div>
            </GlowCard>

            <p className="mt-8 max-w-3xl text-xs text-muted-foreground">
              Données : Conseil constitutionnel. Le total des parrainages affiché ne préjuge pas de la validité de la
              candidature. Une candidature est retenue si au plus 50 parrainages proviennent d'un même département et si
              les parrainages couvrent au moins 30 départements.
            </p>
          </Section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
};

export default ParrainagesPage;
