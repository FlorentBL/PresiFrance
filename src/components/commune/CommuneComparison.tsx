import { GlowCard } from "@/components/design";
import type { ElectionResult } from "@/lib/api/resultsApi";
import type { NationalResult } from "@/lib/api/nationalResultsApi";
import { fullName } from "@/lib/communeShare";
import { fmtPct } from "./format";

interface Props {
  commune: string;
  results: ElectionResult;
  department: ElectionResult | null;
  departmentName: string;
  national: NationalResult | null;
}

/** Commune, département et France côte à côte : vainqueur, score, participation. */
export function CommuneComparison({ commune, results, department, departmentName, national }: Props) {
  const natLead = national?.candidates?.[0];
  const rows = [
    {
      label: commune,
      lead: results.candidates[0] ? { name: fullName(results.candidates[0]), pct: results.candidates[0].pourcentExprimes } : null,
      turnout: results.votantsPourcent,
    },
    department && {
      label: `Département · ${departmentName}`,
      lead: department.candidates[0] ? { name: fullName(department.candidates[0]), pct: department.candidates[0].pourcentExprimes } : null,
      turnout: department.votantsPourcent,
    },
    national && {
      label: "France entière",
      lead: natLead ? { name: fullName(natLead), pct: natLead.pourcentExprimes } : null,
      turnout: national.participation,
    },
  ].filter(Boolean) as Array<{ label: string; lead: { name: string; pct: number } | null; turnout: number }>;

  return (
    <GlowCard className="p-4 sm:p-6">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <caption className="sr-only">Comparaison de {commune} avec son département et la France</caption>
          <thead>
            <tr className="text-xs uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="pb-3 pr-4 font-semibold">Territoire</th>
              <th scope="col" className="pb-3 pr-4 font-semibold">Arrivé en tête</th>
              <th scope="col" className="pb-3 pr-4 text-right font-semibold">Score</th>
              <th scope="col" className="pb-3 text-right font-semibold">Participation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-border">
                <th scope="row" className="py-3 pr-4 font-semibold">{r.label}</th>
                <td className="py-3 pr-4">{r.lead?.name ?? "—"}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{r.lead ? fmtPct(r.lead.pct) : "—"}</td>
                <td className="py-3 text-right tabular-nums">{fmtPct(r.turnout)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlowCard>
  );
}

export default CommuneComparison;
