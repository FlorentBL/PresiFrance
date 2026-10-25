import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useReducedMotion } from "framer-motion";
import type { PollChartRow } from "@/lib/api/pollsApi";
import type { PollLegendItem } from "./PollLegend";

interface PollChartProps {
  data: PollChartRow[];
  lines: PollLegendItem[];
  highlighted: string | null;
  onHighlight: (id: string | null) => void;
  electionDate?: string;
  ariaLabel?: string;
  yMax?: number;
}

/** Courbes de sondages animées (tracé progressif) ; la courbe survolée passe devant, les autres s'estompent. */
export function PollChart({
  data,
  lines,
  highlighted,
  onHighlight,
  electionDate,
  ariaLabel = "Graphique des intentions de vote au 1er tour de 2022, par candidat",
  yMax = 36,
}: PollChartProps) {
  const reduce = useReducedMotion();
  const electionTick = electionDate ? data.find((r) => r.date === electionDate)?.labelShort : undefined;
  // la courbe mise en avant est dessinée en dernier (au premier plan)
  const ordered = [...lines].sort(
    (a, b) => Number(a.id === highlighted) - Number(b.id === highlighted),
  );

  return (
    <div
      className="h-[340px] w-full min-w-0 sm:h-[440px]"
      role="img"
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
          onMouseLeave={() => onHighlight(null)}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.6}
          />
          <XAxis
            dataKey="labelShort"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, yMax]}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            width={40}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
            }}
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload as
                { date?: string } | undefined;
              return row?.date
                ? new Date(`${row.date}T12:00:00.000Z`).toLocaleDateString(
                    "fr-FR",
                    {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )
                : "";
            }}
            formatter={(value, name) =>
              typeof value === "number"
                ? [`${value}%`, name]
                : [String(value ?? ""), name]
            }
          />
          {electionTick ? (
            <ReferenceLine
              x={electionTick}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              label={{
                value: "1er tour",
                position: "top",
                fill: "hsl(var(--muted-foreground))",
                fontSize: 11,
              }}
            />
          ) : null}
          {ordered.map((c) => {
            const active = highlighted === c.id;
            const dim = highlighted !== null && !active;
            return (
              <Line
                key={c.id}
                type="monotone"
                dataKey={c.id}
                name={c.label}
                stroke={c.color}
                strokeWidth={active ? 4 : 2.25}
                strokeOpacity={dim ? 0.18 : 1}
                dot={false}
                activeDot={{ r: 5 }}
                connectNulls
                isAnimationActive={!reduce}
                animationDuration={1200}
                animationEasing="ease-out"
                onMouseEnter={() => onHighlight(c.id)}
                style={{ transition: "stroke-opacity 0.2s, stroke-width 0.2s" }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
