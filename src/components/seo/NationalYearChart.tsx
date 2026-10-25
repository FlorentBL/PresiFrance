import { useQuery } from "@tanstack/react-query";
import { useReducedMotion } from "framer-motion";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AnimatedNumber, GlowCard } from "@/components/design";
import { getNationalResults } from "@/lib/api/nationalResultsApi";
import { getCandidateColor } from "@/lib/candidateColors";
import type { PresidentialYear, Round } from "@/lib/elections";

interface TooltipPayload {
  payload?: { name: string; value: number; voix: number };
}

function GlassTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="glass rounded-xl border border-border px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-foreground">{row.name}</p>
      <p className="tabular-nums text-muted-foreground">
        {row.value.toLocaleString("fr-FR")} % des exprimés · {row.voix.toLocaleString("fr-FR")} voix
      </p>
    </div>
  );
}

/** Résultat national d'une année (graphique + participation). Rendu uniquement côté client, après chargement. */
export default function NationalYearChart({ year, round = 1 }: { year: PresidentialYear; round?: Round }) {
  const reduce = useReducedMotion();
  const { data } = useQuery({
    queryKey: ["national-results", year, round],
    queryFn: () => getNationalResults(year, round),
    staleTime: Infinity,
  });
  if (!data || data.candidates.length === 0) return null;

  const rows = data.candidates.slice(0, 8).map((c, i) => ({
    name: `${c.prenom} ${c.nom}`,
    value: c.pourcentExprimes,
    voix: c.voix,
    color: getCandidateColor(c.prenom, c.nom, i),
  }));

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_16rem]">
      <GlowCard interactive={false}>
        <h3 className="mb-4 text-lg font-semibold">Résultat national, 1er tour {year}</h3>
        <div className="h-[22rem] w-full" role="img" aria-label={`Scores nationaux au premier tour ${year}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" hide domain={[0, "dataMax"]} />
              <YAxis
                type="category"
                dataKey="name"
                width={132}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Tooltip content={<GlassTooltip />} cursor={{ fill: "hsl(var(--foreground) / 0.06)" }} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} isAnimationActive={!reduce} animationDuration={900} animationEasing="ease-out">
                {rows.map((r) => (
                  <Cell key={r.name} fill={r.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlowCard>
      <GlowCard glow="red" interactive={false} className="flex flex-col justify-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Participation</p>
        <p className="mt-2 font-heading text-5xl font-extrabold tabular-nums">
          <AnimatedNumber value={data.participation} decimals={1} suffix=" %" />
        </p>
        <p className="mt-2 text-sm text-muted-foreground">des inscrits au premier tour de {year}.</p>
      </GlowCard>
    </div>
  );
}
