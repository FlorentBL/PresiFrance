import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CandidateAvatar, GlowCard, Reveal } from "@/components/design";
import { getCandidateColor } from "@/lib/candidateColors";
import type { ElectionResult } from "@/lib/api/resultsApi";
import { fmtPct } from "./format";

export type EvolutionPoint = { year: number } & ElectionResult;

const AXIS = { fontSize: 12, fill: "hsl(var(--muted-foreground))" };

/** Participation + vainqueur local sur plusieurs élections. */
export function CommuneEvolution({ data }: { data: EvolutionPoint[] }) {
  const series = data.map((d) => ({ year: String(d.year), participation: d.votantsPourcent, abstention: d.abstentionsPourcent }));
  return (
    <div className="space-y-6">
      <GlowCard className="p-4 sm:p-6">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Participation et abstention (1er tour)</h3>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="year" tick={AXIS} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={AXIS} tickLine={false} axisLine={false} width={44} domain={[0, 100]} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-lg">
                      <p className="font-bold">{label}</p>
                      <p className="tabular-nums text-primary">Participation {fmtPct(Number(payload[0].payload.participation))}</p>
                      <p className="tabular-nums text-tri-red">Abstention {fmtPct(Number(payload[0].payload.abstention))}</p>
                    </div>
                  ) : null
                }
              />
              <Line type="monotone" dataKey="participation" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="abstention" stroke="hsl(var(--tri-red))" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 flex justify-center gap-6 text-xs text-muted-foreground">
          <span><span className="mr-1 inline-block h-0.5 w-4 bg-primary align-middle" />Participation</span>
          <span><span className="mr-1 inline-block h-0.5 w-4 bg-tri-red align-middle" />Abstention</span>
        </p>
      </GlowCard>

      <div>
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Vainqueur local par élection</h3>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {data.map((d, idx) => {
            const c = d.candidates[0];
            if (!c) return null;
            const color = getCandidateColor(c.prenom, c.nom, 0);
            return (
              <Reveal as="li" key={d.year} delay={idx * 0.06}>
                <GlowCard className="h-full p-4">
                  <p className="text-xs font-bold tabular-nums text-muted-foreground">{d.year}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <CandidateAvatar prenom={c.prenom} nom={c.nom} color={color} size="sm" />
                    <p className="text-sm font-bold leading-tight">{c.prenom} {c.nom}</p>
                  </div>
                  <p className="mt-2 font-heading text-xl font-extrabold tabular-nums">{fmtPct(c.pourcentExprimes)}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <div className="h-full rounded-full" style={{ width: `${c.pourcentExprimes}%`, backgroundColor: color }} />
                  </div>
                </GlowCard>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default CommuneEvolution;
