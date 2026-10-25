import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { EmbedFrame } from "@/components/embed/EmbedFrame";
import { colorFromLabel, useFrancePaths, useHomeMap } from "@/components/home/homeData";
import { parseEmbedRound, parseEmbedYear } from "@/lib/embed";

/** Carte des départements intégrable : candidat arrivé en tête au 1er tour (seul niveau publié). */
export default function EmbedCartePage() {
  const [params] = useSearchParams();
  const year = parseEmbedYear(params.get("year"));
  const round = parseEmbedRound(params.get("round"));
  const { data: geo } = useFrancePaths();
  const { data } = useHomeMap();
  const yd = data?.years[String(year)];

  const legend = useMemo(() => {
    if (!yd) return [];
    const counts = new Map<number, number>();
    Object.values(yd.depts).forEach(([i]) => counts.set(i, (counts.get(i) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([i, n]) => ({ label: yd.candidates[i], n, i }));
  }, [yd]);

  const [min, max] = useMemo(() => {
    const s = yd ? Object.values(yd.depts).map(([, v]) => v) : [];
    return s.length ? [Math.min(...s), Math.max(...s)] : [0, 1];
  }, [yd]);

  return (
    <EmbedFrame title={`Présidentielle ${year} : candidat en tête par département`} sourcePath={`/presidentielle-${year}`}>
      {geo && yd ? (
        <svg
          viewBox={`-10 -10 ${geo.w + 20} ${geo.h + 20}`}
          role="img"
          aria-label={`Carte des départements : candidat arrivé en tête au 1er tour de ${year}`}
          className="mx-auto h-auto max-h-[70vh] w-full"
        >
          {Object.entries(geo.depts).map(([code, d]) => {
            const e = yd.depts[code];
            const strength = e ? (e[1] - min) / Math.max(max - min, 1) : 0;
            return (
              <path
                key={code}
                d={d.d}
                fill={e ? colorFromLabel(yd.candidates[e[0]], e[0]) : "hsl(var(--muted))"}
                fillOpacity={0.5 + strength * 0.5}
                stroke="hsl(var(--background))"
                strokeWidth={1.2}
                strokeLinejoin="round"
              >
                <title>{e ? `${d.n} (${code}) : ${yd.candidates[e[0]]}, ${e[1].toLocaleString("fr-FR")} %` : d.n}</title>
              </path>
            );
          })}
        </svg>
      ) : (
        <div role="status" className="py-16 text-center text-sm text-muted-foreground">Chargement de la carte…</div>
      )}
      <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {legend.map((l) => (
          <li key={l.label} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: colorFromLabel(l.label, l.i) }} />
            {l.label} ({l.n})
          </li>
        ))}
      </ul>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        En tête au 1er tour{round === 2 ? " (la carte du 2nd tour n'est pas disponible)" : ""} · départements métropolitains
      </p>
    </EmbedFrame>
  );
}
