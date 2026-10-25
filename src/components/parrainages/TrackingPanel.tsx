import { CheckCircle2, Clock } from "lucide-react";
import { GlowCard } from "@/components/design";
import { displayName } from "@/components/parrainages/candidatName";
import {
  PARRAINAGES_RULE,
  formatIsoDate,
  type CandidateProgress,
  type HistoryRow,
} from "@/lib/parrainagesTracking";

const { threshold, minDepartements, maxPerDepartement } = PARRAINAGES_RULE;

export function RuleNote() {
  return (
    <p className="text-xs text-muted-foreground">
      Règle en vigueur : {threshold} présentations d'élus, issues d'au moins {minDepartements} départements ou
      collectivités d'outre-mer, sans que plus d'un dixième ({maxPerDepartement}) émanent d'un même département (
      <a
        href={PARRAINAGES_RULE.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:no-underline"
      >
        {PARRAINAGES_RULE.sourceLabel}
      </a>
      ). Seul le Conseil constitutionnel arrête la liste officielle des candidats ; le décompte ci-dessous est
      indicatif.
    </p>
  );
}

/** État « publication à venir » : aucune donnée 2027 n'est encore disponible. */
export function PendingNotice({ year }: { year: number }) {
  return (
    <GlowCard glow="blue" interactive={false}>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        Publication à venir
      </p>
      <h2 className="mt-3 font-heading text-xl font-bold">Les parrainages {year} ne sont pas encore publiés</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Le Conseil constitutionnel publie la liste des parrainages au fil de leur réception, pendant la période de
        présentation des candidatures. Cette page affichera le compteur de chaque candidat, le nombre de départements
        couverts et l'historique des publications dès que les données seront disponibles. En attendant, les
        parrainages de 2022 et de 2017 restent consultables.
      </p>
      <div className="mt-4">
        <RuleNote />
      </div>
    </GlowCard>
  );
}

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
    >
      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ProgressTable({
  rows,
  deltas,
  onSelect,
}: {
  rows: CandidateProgress[];
  deltas: Record<string, number>;
  onSelect: (candidat: string) => void;
}) {
  return (
    <GlowCard glow="red" interactive={false}>
      <h2 className="font-heading text-xl font-bold">Progression vers le seuil de {threshold}</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Parrainages comptés (plafonnés à {maxPerDepartement} par département), départements couverts sur{" "}
        {minDepartements} requis, et gain depuis la publication précédente.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Progression de chaque candidat vers le seuil de {threshold} parrainages</caption>
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="py-2 pr-3 font-semibold">Candidat</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Parrainages</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Départements</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Max / dép.</th>
              <th scope="col" className="py-2 font-semibold">Évolution</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const delta = deltas[r.candidat];
              return (
                <tr key={r.candidat} className="border-b border-border/50 align-middle">
                  <th scope="row" className="py-2 pr-3 font-medium">
                    <button type="button" onClick={() => onSelect(r.candidat)} className="text-left hover:underline">
                      {displayName(r.candidat)}
                    </button>
                    {r.reached && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Conditions réunies
                      </span>
                    )}
                  </th>
                  <td className="min-w-[150px] py-2 pr-3">
                    <span className="tabular-nums">
                      {r.countedTotal} / {threshold}
                    </span>
                    {r.countedTotal !== r.total && (
                      <span className="ml-1 text-xs text-muted-foreground">({r.total} publiés)</span>
                    )}
                    <Bar value={r.countedTotal} max={threshold} label={`${displayName(r.candidat)} : parrainages comptés`} />
                  </td>
                  <td className="min-w-[110px] py-2 pr-3">
                    <span className="tabular-nums">
                      {r.departements} / {minDepartements}
                    </span>
                    <Bar value={r.departements} max={minDepartements} label={`${displayName(r.candidat)} : départements couverts`} />
                  </td>
                  <td className="py-2 pr-3 tabular-nums">{r.maxInDepartement}</td>
                  <td className="py-2 tabular-nums text-muted-foreground">
                    {delta === undefined ? "—" : delta > 0 ? `+${delta}` : "0"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlowCard>
  );
}

export function HistoryTable({ rows }: { rows: HistoryRow[] }) {
  return (
    <GlowCard glow="white" interactive={false}>
      <h2 className="font-heading text-xl font-bold">Historique des publications</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Chaque ligne correspond à une publication successive du Conseil constitutionnel relevée par ce site.
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Historique indisponible.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Évolution du nombre de parrainages par publication</caption>
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="py-2 pr-3 font-semibold">Publication du</th>
                <th scope="col" className="py-2 pr-3 font-semibold">Parrainages</th>
                <th scope="col" className="py-2 pr-3 font-semibold">Évolution</th>
                <th scope="col" className="py-2 pr-3 font-semibold">Candidats</th>
                <th scope="col" className="py-2 font-semibold">Départements</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.recordedAt} className="border-b border-border/50">
                  <th scope="row" className="py-2 pr-3 font-medium">
                    {formatIsoDate(r.publishedAt) ?? "date à confirmer"}
                  </th>
                  <td className="py-2 pr-3 tabular-nums">{r.total}</td>
                  <td className="py-2 pr-3 tabular-nums text-muted-foreground">{r.delta > 0 ? `+${r.delta}` : r.delta}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.candidats}</td>
                  <td className="py-2 tabular-nums">{r.departements}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlowCard>
  );
}
