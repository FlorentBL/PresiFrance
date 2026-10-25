import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Loader2 } from "lucide-react";

import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import {
  GlowCard,
  PageHero,
  Reveal,
  SegmentedControl,
  Section,
} from "@/components/design";
import { PollChart } from "@/components/analyse/PollChart";
import { PollLegend } from "@/components/analyse/PollLegend";
import { colorForPollCandidate } from "@/components/analyse/pollColors";
import { buildSmoothedPollTrend, getPolls2022Round1 } from "@/lib/api/pollsApi";

const DEFAULT_VISIBLE = new Set([
  "macron",
  "le_pen",
  "melenchon",
  "zemmour",
  "pecresse",
]);

const WINDOW_OPTIONS = [
  { value: "7", label: "7 jours" },
  { value: "10", label: "10 jours" },
  { value: "14", label: "14 jours" },
];

export default function AnalysePage() {
  const [visible, setVisible] = useState<Set<string>>(
    () => new Set(DEFAULT_VISIBLE),
  );
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [windowDays, setWindowDays] = useState(10);

  const {
    data: dataset,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["polls", "2022", "t1"],
    queryFn: getPolls2022Round1,
    staleTime: 60 * 60 * 1000,
  });

  const items = useMemo(
    () =>
      dataset
        ? dataset.candidates.map((c, i) => ({
            id: c.id,
            label: c.label,
            color: colorForPollCandidate(c.label, i),
          }))
        : [],
    [dataset],
  );

  const chartData = useMemo(() => {
    if (!dataset) return [];
    const ids = items.map((c) => c.id).filter((id) => visible.has(id));
    if (ids.length === 0) return [];
    return buildSmoothedPollTrend(dataset, ids, windowDays);
  }, [dataset, items, visible, windowDays]);

  const shownLines = useMemo(
    () => items.filter((c) => visible.has(c.id)),
    [items, visible],
  );

  const toggleCandidate = (id: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setHighlighted(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Sondages présidentielle 2022 — 1er tour"
        description="Chronologie des intentions de vote au 1er tour (mars–avril 2022) : courbes lissées à partir des sondages publiés après la liste officielle des candidats."
        path="/analyse"
      />
      <JsonLd
        path="/analyse"
        breadcrumbs={[{ name: "Sondages 2022", path: "/analyse" }]}
      />
      <SiteHeader />

      <main id="contenu" tabIndex={-1} className="focus:outline-none flex-1">
        <PageHero
          eyebrow="Sondages · 2022"
          title="Chronologie des sondages — 1er tour"
          description={
            <>
              <strong className="text-foreground">Présidentielle 2022</strong>,{" "}
              <strong className="text-foreground">1er tour</strong> (10 avril).
              Période : du 7 mars au 10 avril, comme le tableau «&nbsp;Official
              campaign&nbsp;» sur Wikipédia (en) — pas le graphique LOESS
              2021–2022. Chaque point est une{" "}
              <strong className="text-foreground">moyenne pondérée</strong> des
              sondages dont la fin de terrain tombe dans les{" "}
              <strong className="text-foreground">
                {windowDays} derniers jours
              </strong>{" "}
              (poids = taille d&apos;échantillon si connue). Ce n&apos;est pas
              une LOESS : les formes peuvent différer du grand graphique
              Wikipédia.
            </>
          }
        />

        <Section width="wide" className="!pb-6">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              Chargement des sondages…
            </div>
          )}

          {isError && (
            <p className="text-destructive text-center py-12">
              Impossible de charger les sondages. Réessayez plus tard.
            </p>
          )}

          {dataset && (
            <Reveal>
              <GlowCard glow="blue" className="p-5 sm:p-8">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="font-heading text-2xl font-semibold">
                      Intentions de vote agrégées — 2022, 1er tour
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {dataset.meta.tableNote}
                    </p>
                  </div>
                  <SegmentedControl
                    label="Fenêtre de lissage"
                    options={WINDOW_OPTIONS}
                    value={String(windowDays)}
                    onChange={(v) => setWindowDays(Number(v))}
                  />
                </div>

                {chartData.length > 0 && shownLines.length > 0 ? (
                  <PollChart
                    data={chartData}
                    lines={shownLines}
                    highlighted={highlighted}
                    onHighlight={setHighlighted}
                    electionDate={dataset.meta.electionDate}
                  />
                ) : (
                  <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                    Sélectionnez au moins un candidat pour afficher les courbes.
                  </div>
                )}

                <div className="mt-6 border-t border-border pt-6">
                  <h3 className="mb-1 font-heading text-lg font-semibold">
                    Candidats affichés
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Survolez un nom pour mettre sa courbe en avant, cliquez pour
                    l&apos;afficher ou la masquer, ou isolez-la.
                  </p>
                  <PollLegend
                    items={items}
                    visible={visible}
                    highlighted={highlighted}
                    onHighlight={setHighlighted}
                    onToggle={toggleCandidate}
                    onIsolate={(id) => {
                      setVisible(new Set([id]));
                      setHighlighted(null);
                    }}
                    onShowAll={() =>
                      setVisible(new Set(items.map((c) => c.id)))
                    }
                  />
                </div>
              </GlowCard>
            </Reveal>
          )}
        </Section>

        {dataset && (
          <Section width="wide" className="!pt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Reveal>
                <GlowCard glow="red" className="h-full p-6 sm:p-8">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                      <ClipboardCheck
                        className="h-5 w-5 text-primary"
                        aria-hidden
                      />
                    </div>
                    <div>
                      <h2 className="font-heading text-xl font-semibold">
                        Promesses de campagne vs bilan réel
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        Mandat{" "}
                        <strong className="text-foreground">2017-2022</strong> :
                        exemples d’engagements du programme de 2017 et synthèse
                        de mise en œuvre, avec liens vers la presse de référence
                        (Les Décodeurs, franceinfo, LCP…). Ce n’est pas un
                        jugement officiel.
                      </p>
                      <Link
                        to="/promesses-bilan"
                        className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        Ouvrir le comparatif promesses / bilan →
                      </Link>
                    </div>
                  </div>
                </GlowCard>
              </Reveal>

              <Reveal delay={0.08}>
                <GlowCard className="h-full p-6 sm:p-8">
                  <h2 className="font-heading text-xl font-semibold">
                    Sources &amp; méthode
                  </h2>
                  <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                    <p>
                      Les pourcentages par ligne de sondage reprennent le
                      tableau «&nbsp;Official campaign&nbsp;» (section 2022) de
                      la page Wikipédia anglophone — pas le graphique
                      «&nbsp;Graphical summary&nbsp;» en tête de page, qui est
                      une régression locale (LOESS) sur une période et une base
                      de sondages plus larges. Ce n&apos;est pas une moyenne
                      publiée par un institut&nbsp;: c&apos;est une agrégation à
                      des fins pédagogiques.
                    </p>
                    <ul className="list-disc space-y-1 pl-5">
                      {dataset.meta.sources.map((s) => (
                        <li key={s.url}>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {s.label}
                          </a>
                          {s.license ? (
                            <span className="mt-0.5 block text-xs">
                              {s.license}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                </GlowCard>
              </Reveal>
            </div>
          </Section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
