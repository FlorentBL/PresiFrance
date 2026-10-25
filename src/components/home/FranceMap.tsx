import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { colorFromLabel, useFrancePaths, useHomeMap } from "./homeData";

interface FranceMapProps {
  year: number;
  className?: string;
}

/**
 * Carte géographique des départements : couleur du candidat arrivé en tête au 1er tour,
 * teinte d'autant plus soutenue que son score est élevé. Apparition en vague depuis Paris.
 */
export default function FranceMap({ year, className }: FranceMapProps) {
  const reduce = useReducedMotion();
  const { data: geo } = useFrancePaths();
  const { data } = useHomeMap();
  const [active, setActive] = useState<string | null>(null);
  const yd = data?.years[String(year)];

  const entries = useMemo(() => (geo ? Object.entries(geo.depts) : []), [geo]);

  const delays = useMemo(() => {
    const origin = geo?.depts["75"]?.c ?? [0, 0];
    const out: Record<string, number> = {};
    for (const [code, d] of entries) out[code] = Math.hypot(d.c[0] - origin[0], d.c[1] - origin[1]) / 900;
    return out;
  }, [entries, geo]);

  const [minScore, maxScore] = useMemo(() => {
    const scores = yd ? Object.values(yd.depts).map(([, s]) => s) : [];
    return scores.length ? [Math.min(...scores), Math.max(...scores)] : [0, 1];
  }, [yd]);

  const legend = useMemo(() => {
    if (!yd) return [];
    const counts = new Map<number, number>();
    Object.values(yd.depts).forEach(([i]) => counts.set(i, (counts.get(i) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([i, n]) => ({ label: yd.candidates[i], n, i }));
  }, [yd]);

  const activeDept = active && geo ? geo.depts[active] : null;
  const activeEntry = active && yd ? yd.depts[active] : null;
  // Position de la bulle en % du conteneur (le viewBox a 10 unités de marge).
  const tip =
    activeDept && geo
      ? { x: ((activeDept.c[0] + 10) / (geo.w + 20)) * 100, y: ((activeDept.c[1] + 10) / (geo.h + 20)) * 100 }
      : null;

  return (
    <figure className={className}>
      <div className="relative" onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[8%] rounded-full bg-[radial-gradient(circle,hsl(var(--tri-blue)/0.28),transparent_70%)] blur-2xl"
        />
        {geo ? (
          <svg
            viewBox={`-10 -10 ${geo.w + 20} ${geo.h + 20}`}
            role="img"
            aria-label={`Carte des départements : candidat arrivé en tête au 1er tour de ${year}`}
            className="relative h-auto w-full touch-manipulation"
          >
            {entries.map(([code, d]) => {
              const entry = yd?.depts[code];
              const fill = entry && yd ? colorFromLabel(yd.candidates[entry[0]], entry[0]) : "hsl(var(--muted))";
              const strength = entry ? (entry[1] - minScore) / Math.max(maxScore - minScore, 1) : 0;
              return (
                <motion.path
                  key={code}
                  d={d.d}
                  initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: reduce ? 0 : 0.15 + delays[code], ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    fill,
                    fillOpacity: active && active !== code ? 0.35 : 0.5 + strength * 0.5,
                    transformBox: "fill-box",
                    transformOrigin: "center",
                    transition: "fill 0.6s ease, fill-opacity 0.25s ease",
                  }}
                  stroke="hsl(var(--background))"
                  strokeWidth={1.2}
                  strokeLinejoin="round"
                  className="cursor-pointer"
                  onPointerEnter={(e) => e.pointerType === "mouse" && setActive(code)}
                  onClick={() => setActive((cur) => (cur === code ? null : code))}
                />
              );
            })}
            {activeDept && (
              <path
                d={activeDept.d}
                fill="none"
                stroke="hsl(var(--foreground))"
                strokeWidth={2.5}
                strokeLinejoin="round"
                pointerEvents="none"
              />
            )}
          </svg>
        ) : (
          <div style={{ aspectRatio: "1 / 0.95" }} aria-hidden="true" />
        )}

        {activeDept && active && tip && (
          <div
            role="status"
            className="glass absolute z-10 w-max max-w-[15rem] rounded-xl border border-border px-3.5 py-2.5 text-left text-xs shadow-lg"
            style={{
              left: `${tip.x}%`,
              top: `${tip.y}%`,
              transform: `translate(${tip.x < 30 ? "-15%" : tip.x > 70 ? "-85%" : "-50%"}, ${tip.y < 30 ? "18px" : "calc(-100% - 14px)"})`,
            }}
          >
            <p className="font-heading text-sm font-bold text-foreground">
              {activeDept.n} <span className="font-sans text-xs font-normal text-muted-foreground">({active})</span>
            </p>
            {activeEntry && yd && (
              <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: colorFromLabel(yd.candidates[activeEntry[0]], activeEntry[0]) }}
                />
                {yd.candidates[activeEntry[0]]}
                <span className="tabular-nums font-semibold text-foreground">{activeEntry[1].toLocaleString("fr-FR")} %</span>
              </p>
            )}
            <Link
              to={`/explorer/${active}?year=${year}`}
              className="mt-1 inline-flex min-h-8 items-center gap-1 font-medium text-primary hover:underline"
            >
              Explorer <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>

      <figcaption className="mt-4 text-center text-sm text-muted-foreground">
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {legend.map((l) => (
            <li key={l.label} className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: colorFromLabel(l.label, l.i) }} />
              {l.label} <span className="tabular-nums">({l.n})</span>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-xs">
          En tête au 1er tour {year} · teinte plus soutenue = score plus élevé · touchez un département
        </p>
      </figcaption>
    </figure>
  );
}
