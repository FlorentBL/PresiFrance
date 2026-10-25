import { CandidateAvatar, GlowCard, Reveal } from "@/components/design";
import { getCandidateColor } from "@/lib/candidateColors";
import type { CandidateResult } from "@/lib/api/resultsApi";
import { fmtInt, fmtPct } from "./format";

const PODIUM_ORDER = [1, 0, 2]; // 2e, 1er, 3e (visuel)
const HEIGHTS = ["h-24 sm:h-32", "h-32 sm:h-44", "h-20 sm:h-24"];

/** Podium des trois premiers + classement complet. */
export function CommunePodium({ candidates }: { candidates: CandidateResult[] }) {
  const top = candidates.slice(0, 3);
  const rest = candidates.slice(3);
  const max = Math.max(...candidates.map((c) => c.pourcentExprimes), 1);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 items-end gap-2 sm:gap-6" role="list" aria-label="Podium des trois premiers candidats">
        {PODIUM_ORDER.map((rank, col) => {
          const c = top[rank];
          if (!c) return <div key={col} />;
          const color = getCandidateColor(c.prenom, c.nom, rank);
          return (
            <Reveal key={`${c.nom}-${rank}`} delay={0.08 * col} className="flex flex-col items-center text-center" >
              <div role="listitem" className="flex w-full flex-col items-center">
                <CandidateAvatar prenom={c.prenom} nom={c.nom} color={color} size={rank === 0 ? "lg" : "md"} />
                <p className="mt-3 text-xs font-semibold leading-tight sm:text-sm">{c.prenom}</p>
                <p className="text-sm font-bold uppercase leading-tight tracking-wide sm:text-base">{c.nom}</p>
                <p className="mt-1 font-heading text-xl font-extrabold tabular-nums sm:text-3xl" style={{ color }}>
                  {fmtPct(c.pourcentExprimes)}
                </p>
                <p className="text-[11px] tabular-nums text-muted-foreground sm:text-xs">{fmtInt(c.voix)} voix</p>
                <div
                  className={`mt-3 flex w-full items-start justify-center rounded-t-2xl border border-b-0 border-border pt-2 ${HEIGHTS[rank]}`}
                  style={{ background: `linear-gradient(180deg, ${color}33, transparent)` }}
                  aria-hidden="true"
                >
                  <span className="font-heading text-2xl font-extrabold text-foreground/80 sm:text-4xl">{rank + 1}</span>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      {rest.length > 0 && (
        <GlowCard className="p-2 sm:p-4">
          <ol className="divide-y divide-border" start={4}>
            {rest.map((c, i) => {
              const color = getCandidateColor(c.prenom, c.nom, i + 3);
              return (
                <li key={`${c.nom}-${i}`} className="flex items-center gap-3 px-2 py-3 sm:gap-4">
                  <span className="w-6 text-center text-xs font-bold tabular-nums text-muted-foreground">{i + 4}</span>
                  <CandidateAvatar prenom={c.prenom} nom={c.nom} color={color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {c.prenom} {c.nom}
                    </p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                      <div className="h-full rounded-full" style={{ width: `${(c.pourcentExprimes / max) * 100}%`, backgroundColor: color }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums">{fmtPct(c.pourcentExprimes)}</p>
                    <p className="text-[11px] tabular-nums text-muted-foreground">{fmtInt(c.voix)} voix</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </GlowCard>
      )}
    </div>
  );
}

export default CommunePodium;
