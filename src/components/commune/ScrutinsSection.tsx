import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Section, SegmentedControl } from "@/components/design";
import {
  SCRUTINS,
  coverageLabel,
  coveredIds,
  fmtInt,
  fmtPct,
  leadSentence,
  scrutinById,
  tourLabel,
  type ScrutinResults,
} from "@/lib/scrutinsCore.mjs";

const TOP_LINES = 8;

interface Props {
  /** Nom affiché : « Nantes » pour une commune, « dans le département de la Loire-Atlantique » si `aggregate`. */
  name: string;
  results: ScrutinResults | undefined;
  loading?: boolean;
  /** Département : résultats additionnés des communes, municipales regroupées par nuance. */
  aggregate?: boolean;
  faq?: { q: string; a: string }[];
}

/** Législatives, européennes et municipales d'une commune ou d'un département : un scrutin et un tour à la fois. */
export function ScrutinsSection({ name, results, loading, aggregate = false, faq = [] }: Props) {
  const ids = coveredIds(results);
  const [chosen, setChosen] = useState<string | null>(null);
  const [chosenTour, setChosenTour] = useState<number>(1);
  const [showAll, setShowAll] = useState(false);

  const heading = aggregate ? "Autres scrutins dans le département" : `Autres élections à ${name}`;

  if (loading && !ids.length) {
    return (
      <Section id="autres-scrutins" eyebrow="Autres scrutins" title={heading} width="default">
        <div className="flex items-center gap-3 text-muted-foreground" role="status">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Chargement des scrutins…
        </div>
      </Section>
    );
  }
  if (!ids.length) return null;

  const scrutin = scrutinById(chosen && ids.includes(chosen) ? chosen : ids[0])!;
  const tours = scrutin.tours.filter((t) => results?.[scrutin.id]?.[t]);
  const tour = tours.includes(chosenTour) ? chosenTour : tours[0];
  const result = results![scrutin.id]![tour]!;
  const shown = showAll ? result.lines : result.lines.slice(0, TOP_LINES);
  const max = Math.max(...result.lines.map((l) => l.pct), 1);
  const sentence = leadSentence(scrutin, tour, name, result, { aggregate });
  const blancsNuls = result.blancs + result.nuls;
  const heading2 = scrutin.tours.length > 1 ? `${scrutin.label} : ${tourLabel(scrutin, tour).toLowerCase()}` : scrutin.label;

  return (
    <Section
      id="autres-scrutins"
      eyebrow="Autres scrutins"
      title={heading}
      description={`${aggregate ? "Résultats du département" : "Résultats de la commune"} aux ${coverageLabel(ids)}, d'après les données officielles du ministère de l'Intérieur.`}
      width="default"
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SegmentedControl<string>
          label="Scrutin"
          value={scrutin.id}
          onChange={(id) => {
            setChosen(id);
            setShowAll(false);
          }}
          options={SCRUTINS.filter((s) => ids.includes(s.id)).map((s) => ({ value: s.id, label: s.label }))}
        />
        {tours.length > 1 && (
          <SegmentedControl<number>
            label="Tour de scrutin"
            value={tour}
            onChange={setChosenTour}
            size="sm"
            options={tours.map((t) => ({ value: t, label: tourLabel(scrutin, t) }))}
          />
        )}
      </div>

      <h3 className="font-heading text-xl font-semibold">{heading2}</h3>
      {sentence && <p className="mt-2 max-w-3xl text-muted-foreground">{sentence}</p>}

      <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ["Participation", fmtPct(result.participation), `${fmtInt(result.votants)} votants sur ${fmtInt(result.inscrits)} inscrits`],
          ["Abstention", fmtPct(100 - result.participation), `${fmtInt(result.abstentions)} inscrits n'ont pas voté`],
          ["Blancs et nuls", fmtInt(blancsNuls), `${fmtInt(result.blancs)} blancs, ${fmtInt(result.nuls)} nuls`],
        ].map(([term, value, detail]) => (
          <div key={term} className="rounded-2xl border border-border bg-card/60 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{term}</dt>
            <dd className="mt-1 font-heading text-2xl font-extrabold tabular-nums">{value}</dd>
            <dd className="text-xs text-muted-foreground">{detail}</dd>
          </div>
        ))}
      </dl>

      <ol className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card/60 px-2 sm:px-4" aria-label={`Résultats : ${heading2}`}>
        {shown.map((l, i) => (
          <li key={l.key + i} className="flex items-center gap-3 py-3 sm:gap-4">
            <span className="w-6 shrink-0 text-center text-xs font-bold tabular-nums text-muted-foreground">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-semibold">{l.label}</p>
              {(l.detail || l.nuanceLabel) && (
                <p className="break-words text-xs text-muted-foreground">
                  {[l.detail, l.nuanceLabel].filter(Boolean).join(" · ")}
                  {l.sieges ? ` · ${l.sieges} siège${l.sieges > 1 ? "s" : ""} au conseil municipal` : ""}
                </p>
              )}
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className={`h-full rounded-full ${i === 0 ? "bg-primary" : "bg-foreground/40"}`} style={{ width: `${(l.pct / max) * 100}%` }} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold tabular-nums">{fmtPct(l.pct)}</p>
              <p className="text-[11px] tabular-nums text-muted-foreground">{fmtInt(l.voix)} voix</p>
            </div>
          </li>
        ))}
      </ol>
      {result.lines.length > TOP_LINES && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          className="mt-3 inline-flex min-h-[44px] items-center rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          {showAll ? "Réduire la liste" : `Afficher les ${result.lines.length - TOP_LINES} autres résultats`}
        </button>
      )}

      <p className="mt-4 max-w-3xl text-xs text-muted-foreground">
        {scrutin.kind === "nuance" && "Législatives : voix additionnées par nuance politique sur les circonscriptions qui recoupent le territoire. "}
        {scrutin.kind === "local" && aggregate && "Municipales : communes de 1 000 habitants et plus, listes regroupées par nuance. "}
        {scrutin.kind === "local" && !aggregate && "Municipales : communes de 1 000 habitants et plus, scrutin de liste. "}
        Pourcentages calculés sur les suffrages exprimés. Source : ministère de l'Intérieur, data.gouv.fr.
      </p>

      {faq.length > 0 && (
        <div className="mt-10 max-w-3xl">
          <h3 className="font-heading text-xl font-semibold">Questions fréquentes</h3>
          <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card/60">
            {faq.map(({ q, a }) => (
              <details key={q} className="group px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold">{q}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

export default ScrutinsSection;
