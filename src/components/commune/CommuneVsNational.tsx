import { CandidateAvatar, GlowCard, Reveal } from "@/components/design";
import { getCandidateColor } from "@/lib/candidateColors";
import type { CandidateResult } from "@/lib/api/resultsApi";
import type { NationalResult } from "@/lib/api/nationalResultsApi";
import { fmtPct, fmtSigned } from "./format";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

interface Props {
  candidates: CandidateResult[];
  national: NationalResult;
  scopeLabel: string;
}

/** Écart (en points) entre le score local et le score national de chaque candidat. */
export function CommuneVsNational({ candidates, national, scopeLabel }: Props) {
  const rows = candidates.slice(0, 8).map((c, i) => {
    const n = national.candidates.find((x) => norm(x.nom) === norm(c.nom));
    return { c, i, nat: n?.pourcentExprimes ?? null };
  });
  const maxDelta = Math.max(5, ...rows.map((r) => (r.nat === null ? 0 : Math.abs(r.c.pourcentExprimes - r.nat))));

  return (
    <GlowCard className="p-4 sm:p-6">
      <p className="mb-4 text-sm text-muted-foreground">
        Écart en points entre le score à {scopeLabel} et le score national (part des suffrages exprimés).
      </p>
      <ul className="space-y-3">
        {rows.map(({ c, i, nat }, idx) => {
          const color = getCandidateColor(c.prenom, c.nom, i);
          const delta = nat === null ? null : c.pourcentExprimes - nat;
          const width = delta === null ? 0 : (Math.abs(delta) / maxDelta) * 50;
          return (
            <Reveal as="li" key={`${c.nom}-${i}`} delay={Math.min(idx, 5) * 0.05}>
              <div className="grid grid-cols-[auto_1fr] items-center gap-3 sm:grid-cols-[14rem_1fr_9rem]">
                <div className="flex min-w-0 items-center gap-3 sm:col-span-1">
                  <CandidateAvatar prenom={c.prenom} nom={c.nom} color={color} size="sm" />
                  <span className="hidden truncate text-sm font-semibold sm:block">
                    {c.prenom} {c.nom}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold sm:hidden">
                    {c.prenom} {c.nom}
                  </p>
                  <div className="relative h-3 rounded-full bg-muted" role="img" aria-label={delta === null ? "Score national indisponible" : `${fmtSigned(delta)} points par rapport au national`}>
                    <span className="absolute inset-y-[-3px] left-1/2 w-px bg-foreground/40" aria-hidden="true" />
                    {delta !== null && (
                      <span
                        className="absolute inset-y-0 rounded-full"
                        style={{
                          width: `${width}%`,
                          left: delta >= 0 ? "50%" : `${50 - width}%`,
                          backgroundColor: color,
                        }}
                      />
                    )}
                  </div>
                </div>
                <p className="col-span-2 text-xs tabular-nums text-muted-foreground sm:col-span-1 sm:text-right">
                  <span className="font-bold text-foreground">{fmtPct(c.pourcentExprimes)}</span>
                  {nat !== null && delta !== null && (
                    <>
                      {" "}vs {fmtPct(nat)} ·{" "}
                      <span className={delta >= 0 ? "font-semibold text-success" : "font-semibold text-tri-red"}>{fmtSigned(delta)} pt</span>
                    </>
                  )}
                </p>
              </div>
            </Reveal>
          );
        })}
      </ul>
    </GlowCard>
  );
}

export default CommuneVsNational;
