import { useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";

import faq from "@/content/sondages-faq.json";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { GlowCard, PageHero, Reveal, SegmentedControl, Section } from "@/components/design";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PollChart } from "@/components/analyse/PollChart";
import { PollLegend } from "@/components/analyse/PollLegend";
import { colorForPollCandidate } from "@/components/analyse/pollColors";
import {
  addDaysIso,
  averagesByCandidate,
  buildTrend,
  getPolls2027Round1,
  listScenarios,
  selectScores,
} from "@/lib/api/polls2027Api";

const WINDOW_OPTIONS = [
  { value: "15", label: "15 jours" },
  { value: "30", label: "30 jours" },
  { value: "60", label: "60 jours" },
];

const PERIOD_OPTIONS = [
  { value: "180", label: "6 mois" },
  { value: "365", label: "12 mois" },
  { value: "0", label: "Tout" },
];

const DEFAULT_VISIBLE_COUNT = 6;
const MIN_POLLS_FOR_CURVE = 2;
const POLLS_PER_PAGE = 20;

const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00.000Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

const formatFieldwork = (start: string, end: string) =>
  start === end ? formatDate(end) : `${formatDate(start)} – ${formatDate(end)}`;

const formatPct = (v: number) => `${v.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export default function Sondages2027Page() {
  const selectId = useId();
  const [scenarioKey, setScenarioKey] = useState("");
  const [windowDays, setWindowDays] = useState(30);
  const [periodDays, setPeriodDays] = useState(365);
  const [explicitVisible, setExplicitVisible] = useState<Set<string> | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [shownPolls, setShownPolls] = useState(POLLS_PER_PAGE);

  const { data: dataset, isLoading, isError } = useQuery({
    queryKey: ["polls", "2027", "t1"],
    queryFn: getPolls2027Round1,
    staleTime: 60 * 60 * 1000,
  });

  const scenarios = useMemo(() => (dataset ? listScenarios(dataset) : []), [dataset]);
  const labels = useMemo(
    () => new Map(dataset?.candidates.map((c) => [c.id, c.label]) ?? []),
    [dataset],
  );
  const entries = useMemo(
    () => (dataset ? selectScores(dataset, scenarioKey || null) : []),
    [dataset, scenarioKey],
  );

  const to = dataset?.meta.latestFieldworkEnd ?? null;
  const from = useMemo(() => {
    if (!dataset || !to) return null;
    if (periodDays === 0) return dataset.polls[0]?.fieldworkEnd ?? to;
    return addDaysIso(to, -periodDays);
  }, [dataset, to, periodDays]);

  const inPeriod = useMemo(
    () => (from && to ? entries.filter((e) => e.poll.fieldworkEnd >= from && e.poll.fieldworkEnd <= to) : []),
    [entries, from, to],
  );

  const candidateIds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of inPeriod) for (const id of Object.keys(e.scores)) counts.set(id, (counts.get(id) ?? 0) + 1);
    return [...counts.entries()].filter(([, n]) => n >= MIN_POLLS_FOR_CURVE).map(([id]) => id);
  }, [inPeriod]);

  const latest = useMemo(
    () => (to ? averagesByCandidate(entries, candidateIds, to, windowDays) : {}),
    [entries, candidateIds, to, windowDays],
  );

  const items = useMemo(
    () =>
      [...candidateIds]
        .sort((a, b) => (latest[b]?.value ?? -1) - (latest[a]?.value ?? -1))
        .map((id, i) => {
          const label = labels.get(id) ?? id;
          return { id, label, color: colorForPollCandidate(label, i) };
        }),
    [candidateIds, latest, labels],
  );

  const visible = useMemo(
    () =>
      explicitVisible
        ? new Set([...explicitVisible].filter((id) => candidateIds.includes(id)))
        : new Set(items.slice(0, DEFAULT_VISIBLE_COUNT).map((c) => c.id)),
    [explicitVisible, items, candidateIds],
  );

  const shownLines = useMemo(() => items.filter((c) => visible.has(c.id)), [items, visible]);

  const chartData = useMemo(() => {
    if (!from || !to || shownLines.length === 0) return [];
    const span = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000));
    return buildTrend(
      entries,
      shownLines.map((c) => c.id),
      windowDays,
      from,
      to,
      span > 200 ? 7 : 1,
    );
  }, [entries, shownLines, windowDays, from, to]);

  const averagesRows = useMemo(() => {
    if (!to) return [];
    const ids = [...new Set(entries.flatMap((e) => Object.keys(e.scores)))];
    const avgs = averagesByCandidate(entries, ids, to, windowDays);
    return Object.entries(avgs)
      .map(([id, a]) => ({ id, label: labels.get(id) ?? id, ...a }))
      .sort((a, b) => b.value - a.value);
  }, [entries, labels, to, windowDays]);

  const tablePolls = useMemo(
    () => [...inPeriod].sort((a, b) => b.poll.fieldworkEnd.localeCompare(a.poll.fieldworkEnd)),
    [inPeriod],
  );

  const toggleCandidate = (id: string) => {
    setExplicitVisible(() => {
      const next = new Set(visible);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setHighlighted(null);
  };

  const selectedScenario = scenarios.find((s) => s.key === scenarioKey) ?? null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Sondage présidentielle 2027 : dernier sondage et moyenne"
        description="Dernier sondage de la présidentielle 2027 (institut, dates, échantillon, scores), moyenne des sondages par candidat, marge d'erreur et réponses aux questions fréquentes."
        path="/sondages-presidentielle-2027"
      />
      <JsonLd
        path="/sondages-presidentielle-2027"
        breadcrumbs={[{ name: "Sondages présidentielle 2027", path: "/sondages-presidentielle-2027" }]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map(({ q, a }) => ({
              "@type": "Question",
              name: q,
              acceptedAnswer: { "@type": "Answer", text: a },
            })),
          }).replace(/</g, "\\u003c"),
        }}
      />
      <SiteHeader />

      <main id="contenu" tabIndex={-1} className="focus:outline-none flex-1">
        <PageHero
          eyebrow="Sondages · 2027"
          title="Sondage présidentielle 2027 : dernier sondage et moyenne des sondages"
          description={
            <>
              Agrégation des intentions de vote au 1er tour, d&apos;après les sondages publiés par les instituts.
              {dataset ? (
                <>
                  {" "}
                  Mise à jour des données : <strong className="text-foreground">{formatDate(dataset.meta.generatedAt)}</strong>.
                </>
              ) : null}
              {to ? (
                <>
                  {" "}
                  Dernier terrain pris en compte :{" "}
                  <strong className="text-foreground">{formatDate(to)}</strong>.
                </>
              ) : null}{" "}
              Les listes de candidats testées diffèrent d&apos;un sondage à l&apos;autre : la moyenne d&apos;un
              candidat ne porte que sur les sondages qui le testent. Ces données ne sont pas des prévisions.
            </>
          }
        />

        <Section width="wide" className="!pb-6">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground" role="status">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              Chargement des sondages…
            </div>
          )}

          {isError && (
            <p className="text-destructive text-center py-12" role="alert">
              Impossible de charger les sondages. Réessayez plus tard.
            </p>
          )}

          {dataset && to && (
            <Reveal>
              <GlowCard glow="blue" className="p-5 sm:p-8">
                <div className="mb-6 flex flex-col gap-5">
                  <div>
                    <h2 className="font-heading text-2xl font-semibold">Tendance des intentions de vote</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Chaque point est la moyenne, pondérée par la taille d&apos;échantillon, des sondages dont la fin
                      de terrain tombe dans la fenêtre glissante. Une moyenne n&apos;est calculée que pour les
                      candidats testés par au moins {MIN_POLLS_FOR_CURVE} sondages sur la période.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor={selectId} className="text-sm font-medium">
                        Hypothèse testée
                      </label>
                      <select
                        id={selectId}
                        value={scenarioKey}
                        onChange={(e) => {
                          setScenarioKey(e.target.value);
                          setExplicitVisible(null);
                          setHighlighted(null);
                        }}
                        className="min-h-10 max-w-full rounded-lg border border-border bg-card px-3 text-sm"
                      >
                        <option value="">Toutes les hypothèses — moyenne par candidat</option>
                        {scenarios.map((s, i) => (
                          <option key={s.key} value={s.key}>
                            Hypothèse {i + 1} — {s.ids.length} candidats, {s.pollCount} sondages
                          </option>
                        ))}
                      </select>
                    </div>
                    <SegmentedControl
                      label="Fenêtre glissante"
                      options={WINDOW_OPTIONS}
                      value={String(windowDays)}
                      onChange={(v) => setWindowDays(Number(v))}
                    />
                    <SegmentedControl
                      label="Période affichée"
                      options={PERIOD_OPTIONS}
                      value={String(periodDays)}
                      onChange={(v) => setPeriodDays(Number(v))}
                    />
                  </div>

                  {selectedScenario ? (
                    <p className="text-sm text-muted-foreground">
                      Candidats de cette hypothèse :{" "}
                      {selectedScenario.ids.map((id) => labels.get(id) ?? id).join(", ")}.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Sans hypothèse choisie, chaque sondage compte une fois par candidat (moyenne de ses hypothèses).
                    </p>
                  )}
                </div>

                {chartData.length > 0 ? (
                  <PollChart
                    data={chartData}
                    lines={shownLines}
                    highlighted={highlighted}
                    onHighlight={setHighlighted}
                    ariaLabel="Graphique de tendance des intentions de vote au 1er tour de 2027, par candidat"
                    yMax={50}
                  />
                ) : (
                  <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                    Sélectionnez au moins un candidat pour afficher les courbes.
                  </div>
                )}

                <div className="mt-6 border-t border-border pt-6">
                  <h3 className="mb-1 font-heading text-lg font-semibold">Candidats affichés</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Classés par moyenne actuelle. Cliquez sur un nom pour afficher ou masquer sa courbe.
                  </p>
                  <PollLegend
                    items={items}
                    visible={visible}
                    highlighted={highlighted}
                    onHighlight={setHighlighted}
                    onToggle={toggleCandidate}
                    onIsolate={(id) => {
                      setExplicitVisible(new Set([id]));
                      setHighlighted(null);
                    }}
                    onShowAll={() => setExplicitVisible(new Set(items.map((c) => c.id)))}
                  />
                </div>
              </GlowCard>
            </Reveal>
          )}
        </Section>

        {dataset && to && (
          <Section width="wide" className="!pt-6 !pb-6">
            <Reveal>
              <GlowCard className="p-5 sm:p-8">
                <h2 className="font-heading text-xl font-semibold">Moyennes par candidat</h2>
                <p className="mt-1 mb-4 text-sm text-muted-foreground">
                  Fenêtre de {windowDays} jours se terminant le {formatDate(to)}. Le nombre de sondages indique
                  combien de sondages testent le candidat dans la fenêtre.
                </p>
                <Table>
                  <caption className="sr-only">Moyenne des intentions de vote par candidat, avec nombre de sondages</caption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Candidat</TableHead>
                      <TableHead scope="col" className="text-right">Moyenne</TableHead>
                      <TableHead scope="col" className="text-right">Marge d&apos;erreur</TableHead>
                      <TableHead scope="col" className="text-right">Sondages</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {averagesRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">
                          Aucun sondage dans cette fenêtre.
                        </TableCell>
                      </TableRow>
                    )}
                    {averagesRows.map((r, i) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          <span
                            aria-hidden
                            className="mr-2 inline-block h-3 w-3 rounded-full align-middle"
                            style={{ backgroundColor: colorForPollCandidate(r.label, i) }}
                          />
                          {r.label}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatPct(r.value)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.margin === null ? "à confirmer" : `± ${r.margin.toLocaleString("fr-FR")} pt`}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{r.pollCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </GlowCard>
            </Reveal>
          </Section>
        )}

        {dataset && (
          <Section width="wide" className="!pt-6 !pb-6">
            <Reveal>
              <GlowCard className="p-5 sm:p-8">
                <h2 className="font-heading text-xl font-semibold">Tableau des sondages</h2>
                <p className="mt-1 mb-4 text-sm text-muted-foreground">
                  {tablePolls.length} sondages sur la période affichée. Le lien mène à la notice ou à l&apos;article
                  de référence cité par la source.
                </p>
                <Table>
                  <caption className="sr-only">Sondages de 1er tour de la présidentielle 2027</caption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Institut</TableHead>
                      <TableHead scope="col">Dates de terrain</TableHead>
                      <TableHead scope="col" className="text-right">Échantillon</TableHead>
                      <TableHead scope="col" className="text-right">Hypothèses</TableHead>
                      <TableHead scope="col">Notice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tablePolls.slice(0, shownPolls).map(({ poll }) => (
                      <TableRow key={poll.id}>
                        <TableCell className="font-medium">{poll.pollster}</TableCell>
                        <TableCell>{formatFieldwork(poll.fieldworkStart, poll.fieldworkEnd)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {poll.sampleSize ? poll.sampleSize.toLocaleString("fr-FR") : "à confirmer"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{poll.hypotheses.length}</TableCell>
                        <TableCell>
                          {poll.noticeUrl ? (
                            <a
                              href={poll.noticeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-10 items-center gap-1 text-primary underline-offset-4 hover:underline"
                            >
                              Notice
                              <span className="sr-only"> du sondage {poll.pollster} du {formatDate(poll.fieldworkEnd)} (nouvel onglet)</span>
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">à confirmer</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {tablePolls.length > shownPolls && (
                  <button
                    type="button"
                    onClick={() => setShownPolls((n) => n + POLLS_PER_PAGE)}
                    className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    Afficher plus de sondages
                  </button>
                )}
              </GlowCard>
            </Reveal>
          </Section>
        )}

        {dataset && (
          <Section width="wide" className="!pt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Reveal>
                <GlowCard glow="red" className="h-full p-6 sm:p-8">
                  <h2 className="font-heading text-xl font-semibold">Lire ces sondages</h2>
                  <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                    <p>
                      Un sondage est une photographie à un instant donné, pas une prévision. Les intentions de vote
                      comportent une marge d&apos;erreur : pour un échantillon de 1&nbsp;000 personnes, elle atteint
                      environ ± 3 points pour un score de 50&nbsp;% et environ ± 2,5 points pour 20&nbsp;%
                      (intervalle de confiance à 95&nbsp;%, calcul théorique d&apos;un échantillon aléatoire ; les
                      instituts utilisent des échantillons par quotas et des redressements).
                    </p>
                    <p>
                      Les sondages publiés sont soumis au contrôle de la{" "}
                      <a
                        href="https://www.commission-des-sondages.fr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Commission des sondages
                      </a>
                      , qui publie les notices méthodologiques et peut formuler des observations.
                    </p>
                    <p>
                      Cette agrégation est un outil pédagogique, non publié par un institut : elle n&apos;exprime
                      aucune préférence politique et retient tous les candidats testés.
                    </p>
                  </div>
                </GlowCard>
              </Reveal>

              <Reveal delay={0.08}>
                <GlowCard className="h-full p-6 sm:p-8">
                  <h2 className="font-heading text-xl font-semibold">Sources &amp; méthode</h2>
                  <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                    <ul className="list-disc space-y-1 pl-5">
                      {dataset.meta.sources.map((s) => (
                        <li key={s.url}>
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {s.label}
                          </a>
                          {s.license ? <span className="mt-0.5 block text-xs">{s.license}</span> : null}
                          {s.retrievedAt ? (
                            <span className="mt-0.5 block text-xs">Données relevées le {formatDate(s.retrievedAt)}.</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                    <p>
                      Les pourcentages « &lt; 0,5 % » sont comptés pour 0,25 point. Les dates et échantillons manquants
                      sont signalés « à confirmer ». Pour revenir à la campagne précédente, consultez{" "}
                      <Link to="/analyse" className="font-semibold text-primary underline-offset-4 hover:underline">
                        l&apos;archive Sondages 2022
                      </Link>
                      .
                    </p>
                  </div>
                </GlowCard>
              </Reveal>
            </div>
          </Section>
        )}

        <Section width="wide" className="!pt-6">
          <h2 className="font-heading text-xl font-semibold">Questions fréquentes sur les sondages</h2>
          <div className="mt-4 space-y-5 text-sm leading-relaxed text-muted-foreground">
            {faq.map(({ q, a }) => (
              <div key={q}>
                <h3 className="font-semibold text-foreground">{q}</h3>
                <p className="mt-1">{a}</p>
              </div>
            ))}
          </div>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
