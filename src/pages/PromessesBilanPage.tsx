import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Archive, Loader2 } from "lucide-react";

import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { GlowCard, PageHero, Reveal, Section } from "@/components/design";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PromiseCard } from "@/components/promesses/PromiseCard";
import { StatusGauge } from "@/components/promesses/StatusGauge";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  STATUS_STYLE,
} from "@/components/promesses/status";
import {
  getMacronPromisesBilan,
  type PromiseStatus,
} from "@/lib/api/macronPromisesApi";
import { cn } from "@/lib/utils";

export default function PromessesBilanPage() {
  const [themeFilter, setThemeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<PromiseStatus | "all">(
    "all",
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["macron-promises-bilan"],
    queryFn: getMacronPromisesBilan,
    staleTime: 60 * 60 * 1000,
  });

  const themes = useMemo(() => {
    if (!data) return [];
    const s = new Set(data.items.map((i) => i.theme));
    return [...s].sort((a, b) => a.localeCompare(b, "fr"));
  }, [data]);

  const counts = useMemo(() => {
    const c: Record<PromiseStatus, number> = {
      tenu: 0,
      partiel: 0,
      non_tenu: 0,
      en_cours: 0,
      non_evalue: 0,
    };
    if (data) for (const i of data.items) c[i.status] += 1;
    return c;
  }, [data]);

  const filteredItems = useMemo(() => {
    if (!data) return [];
    return data.items
      .filter(
        (i) =>
          (themeFilter === "all" || i.theme === themeFilter) &&
          (statusFilter === "all" || i.status === statusFilter),
      )
      .sort(
        (a, b) =>
          STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
      );
  }, [data, themeFilter, statusFilter]);

  const franceinfo = data?.referenceTallies?.find(
    (r) => r.id === "franceinfo-100-2022",
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Promesses 2017 vs bilan 2017-2022 (Macron)"
        description="Synthèse pédagogique : engagements de campagne 2017 et mise en œuvre sur le premier quinquennat, avec sources presse et méthodologie."
        path="/promesses-bilan"
      />
      <JsonLd
        path="/promesses-bilan"
        breadcrumbs={[{ name: "Promesses vs bilan", path: "/promesses-bilan" }]}
      />
      <SiteHeader />

      <main id="contenu" tabIndex={-1} className="focus:outline-none flex-1">
        <PageHero
          eyebrow="Analyse · mandat 2017-2022"
          title="Promesses de campagne et bilan"
          description={
            data ? (
              <>
                <span className="block font-medium text-foreground">
                  {data.meta.scope}
                </span>
                <span className="mt-3 block text-base">
                  {data.meta.disclaimer}
                </span>
                <span className="mt-3 block text-base">
                  {data.meta.methodologyNote}
                </span>
              </>
            ) : (
              "Chargement du texte d’introduction…"
            )
          }
          actions={
            <>
              <Link
                to="/"
                className="inline-flex min-h-10 items-center text-sm font-medium text-primary hover:underline"
              >
                ← Accueil
              </Link>
              <Link
                to="/analyse"
                className="inline-flex min-h-10 items-center text-sm font-medium text-primary hover:underline"
              >
                ← Sondages 2022
              </Link>
            </>
          }
        />

        <div role="note" className="border-b border-border bg-muted/60">
          <p className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm sm:px-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <Archive className="h-3.5 w-3.5" aria-hidden="true" />
              Archive
            </span>
            <span className="font-medium text-foreground">Archive — premier mandat 2017-2022</span>
            <span className="text-muted-foreground">
              Cette analyse porte sur le quinquennat écoulé ;{" "}
              <Link to="/presidentielle-2027" className="font-medium text-primary underline underline-offset-4">
                la campagne 2027
              </Link>{" "}
              est suivie dans sa propre rubrique.
            </span>
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            Chargement…
          </div>
        )}

        {isError && (
          <p className="text-destructive text-center py-12">
            Impossible de charger les données. Réessayez plus tard.
          </p>
        )}

        {data && (
          <>
            <Section
              width="wide"
              eyebrow="Vue d’ensemble"
              title={`Répartition agrégée (${data.items.length} mesures)`}
              className="!pb-6"
            >
              <div className="grid gap-6 lg:grid-cols-2">
                <Reveal>
                  <GlowCard glow="blue" className="h-full p-6 sm:p-8">
                    <StatusGauge counts={counts} total={data.items.length} />
                  </GlowCard>
                </Reveal>
                <Reveal delay={0.08}>
                  <GlowCard glow="white" className="h-full p-6 sm:p-8">
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>
                        <strong className="text-foreground">
                          {data.items.length} lignes
                        </strong>{" "}
                        dans le tableau = même décompte que l’audit{" "}
                        {franceinfo ? (
                          <a
                            href={franceinfo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline"
                          >
                            franceinfo (100 mesures phares)
                          </a>
                        ) : (
                          "franceinfo (100 mesures phares)"
                        )}
                        .
                      </p>
                      {data.referenceTallies &&
                      data.referenceTallies.length > 0 ? (
                        <div className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Autres bilans de référence (non représentés barre
                            par barre ici)
                          </p>
                          <ul className="space-y-2 text-xs text-muted-foreground">
                            {data.referenceTallies.map((ref) => {
                              const c = ref.counts;
                              const extra =
                                c.non_evalue != null && c.non_evalue > 0;
                              const sum =
                                c.tenu +
                                c.partiel +
                                c.non_tenu +
                                (c.non_evalue ?? 0);
                              return (
                                <li key={ref.id}>
                                  <a
                                    href={ref.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary font-medium hover:underline"
                                  >
                                    {ref.label}
                                  </a>
                                  <span className="block mt-0.5">
                                    <strong className="text-foreground">
                                      {c.tenu} tenues · {c.partiel} partielles ·{" "}
                                      {c.non_tenu} non tenues
                                      {extra
                                        ? ` · ${c.non_evalue} inévaluables`
                                        : ""}
                                    </strong>
                                    {sum > 0 ? (
                                      <span className="text-muted-foreground">
                                        {" "}
                                        — {sum} promesse{sum > 1 ? "s" : ""} au
                                        total
                                      </span>
                                    ) : null}
                                  </span>
                                  <span className="block mt-1 opacity-90">
                                    {ref.scope}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </GlowCard>
                </Reveal>
              </div>
            </Section>

            <Section
              width="wide"
              eyebrow="Sources"
              title="Sources principales (vue d’ensemble)"
              className="!py-6"
              description="Articles de référence pour le décompte global et la méthode — à lire avant d’interpréter le tableau."
            >
              <ul className="grid gap-3 text-sm sm:grid-cols-2">
                {data.globalReferences.map((r) => (
                  <li
                    key={r.url}
                    className="glass rounded-xl border border-border px-4 py-3"
                  >
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      {r.label}
                    </a>
                  </li>
                ))}
              </ul>
            </Section>

            <Section
              width="wide"
              eyebrow="Mesure par mesure"
              title="Comparer les mesures"
              description={
                <>
                  Filtrez par thème ou par statut. Pour l’inventaire complet des
                  ~400 promesses derrière l’article des <em>Décodeurs</em>,
                  ouvrez{" "}
                  <a
                    href="https://www.luipresident.fr/emmanuel-macron/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    Lui Président
                  </a>
                  .
                </>
              }
            >
              <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div
                  role="group"
                  aria-label="Filtrer par statut"
                  className="flex flex-wrap gap-2"
                >
                  {(
                    [
                      "all",
                      ...STATUS_ORDER.filter((s) => counts[s] > 0),
                    ] as const
                  ).map((s) => {
                    const active = statusFilter === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setStatusFilter(s)}
                        className={cn(
                          "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                          active
                            ? "border-primary bg-primary/15 text-foreground shadow-glow-blue"
                            : "border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {s !== "all" && (
                          <span
                            aria-hidden
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: STATUS_STYLE[s].fill }}
                          />
                        )}
                        {s === "all" ? "Tous les statuts" : STATUS_LABEL[s]}
                        <span className="tabular-nums">
                          {s === "all" ? data.items.length : counts[s]}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="w-full space-y-1.5 lg:w-72">
                  <Label htmlFor="filter-theme">Thème</Label>
                  <Select value={themeFilter} onValueChange={setThemeFilter}>
                    <SelectTrigger id="filter-theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les thèmes</SelectItem>
                      {themes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="sr-only" role="status">
                {filteredItems.length} mesure(s) affichée(s)
              </p>
              <ul className="grid gap-4 md:grid-cols-2">
                {filteredItems.map((item) => (
                  <PromiseCard key={item.id} item={item} />
                ))}
              </ul>
              {filteredItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aucun résultat avec ces filtres.
                </p>
              ) : null}
            </Section>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
