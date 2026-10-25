import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { colorFromLabel, useHomeMap } from "./homeData";

/** Grille hexagonale des départements métropolitains (ligne, colonne ; les lignes impaires sont décalées d'un demi-pas). */
const LAYOUT: string[][] = [
  [".....62 59"],
  ["....76 80 02 08"],
  ["..50 14 27 60 51 55 54 57"],
  ["29 22 35 61 78 95 93 77 10 52 88 67"],
  [".56 53 72 28 92 75 94 89 21 70 68"],
  [".44 49 41 45 91 58 71 39 25 90"],
  [".85 79 37 36 18 03 42 69 01 74"],
  [".17 86 87 23 63 43 07 38 73"],
  [".33 16 24 19 15 48 26 05"],
  [".40 47 46 12 30 84 04 06"],
  [".64 32 82 81 34 13 83 .2B"],
  [".65 31 09 11 66 ...2A"],
];

interface Tile {
  code: string;
  col: number;
  row: number;
}

function parseLayout(): Tile[] {
  const tiles: Tile[] = [];
  LAYOUT.forEach(([line], row) => {
    // Chaque point initial = une case vide ; « .XX » = case vide puis code.
    let col = 0;
    for (const token of line.split(" ")) {
      let t = token;
      while (t.startsWith(".")) {
        col += 1;
        t = t.slice(1);
      }
      if (t.length) {
        tiles.push({ code: t, col, row });
        col += 1;
      }
    }
  });
  return tiles;
}

const R = 17;
const W = Math.sqrt(3) * R;
const H = R * 1.5;
const HEX = Array.from({ length: 6 }, (_, i) => {
  const a = (Math.PI / 180) * (60 * i - 30);
  return `${(R * 0.94 * Math.cos(a)).toFixed(2)},${(R * 0.94 * Math.sin(a)).toFixed(2)}`;
}).join(" ");

interface FranceTileMapProps {
  year: number;
  className?: string;
}

/** Carte de France en tuiles hexagonales : chaque département prend la couleur du candidat arrivé en tête au 1er tour. */
export default function FranceTileMap({ year, className }: FranceTileMapProps) {
  const reduce = useReducedMotion();
  const { data } = useHomeMap();
  const [hover, setHover] = useState<string | null>(null);
  const tiles = useMemo(parseLayout, []);
  const yd = data?.years[String(year)];

  const width = Math.max(...tiles.map((t) => t.col + (t.row % 2 ? 0.5 : 0))) * W + W + 8;
  const height = (LAYOUT.length - 1) * H + 2 * R + 8;

  const legend = useMemo(() => {
    if (!yd) return [];
    const counts = new Map<number, number>();
    Object.values(yd.depts).forEach(([i]) => counts.set(i, (counts.get(i) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([i, n]) => ({ label: yd.candidates[i], n, i }));
  }, [yd]);

  const hovered = hover && yd?.depts[hover] ? yd.depts[hover] : null;

  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Carte de France en hexagones : candidat arrivé en tête dans chaque département au 1er tour de ${year}`}
        className="h-auto w-full drop-shadow-[0_0_40px_hsl(var(--tri-blue)/0.25)]"
      >
        {tiles.map((t, i) => {
          const x = 4 + R + (t.col + (t.row % 2 ? 0.5 : 0)) * W;
          const y = 4 + R + t.row * H;
          const entry = yd?.depts[t.code];
          const fill = entry && yd ? colorFromLabel(yd.candidates[entry[0]], entry[0]) : "hsl(var(--muted))";
          return (
            <g key={t.code} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
            <motion.g
              initial={reduce ? false : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: reduce ? 0 : 0.2 + i * 0.012, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              onPointerEnter={() => setHover(t.code)}
              onPointerLeave={() => setHover(null)}
            >
              <polygon
                points={HEX}
                fill={fill}
                stroke={hover === t.code ? "hsl(var(--foreground))" : "hsl(var(--foreground) / 0.35)"}
                strokeWidth={hover === t.code ? 2 : 1}
                style={{ transition: "fill 0.5s ease" }}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="8.5"
                fontWeight="600"
                fill="#fff"
                stroke="rgba(0,0,0,0.55)"
                strokeWidth="2.2"
                paintOrder="stroke"
                className="pointer-events-none select-none"
              >
                {t.code}
              </text>
            </motion.g>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-3 min-h-[3.5rem] text-center text-xs text-muted-foreground" aria-live="polite">
        {hovered && yd && hover ? (
          <span>
            <strong className="text-foreground">Département {hover}</strong> · {yd.candidates[hovered[0]]} en tête ({hovered[1].toFixed(1)} %)
          </span>
        ) : (
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {legend.map((l) => (
              <li key={l.label} className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full ring-1 ring-foreground/40" style={{ background: colorFromLabel(l.label, l.i) }} />
                {l.label} <span className="tabular-nums">({l.n})</span>
              </li>
            ))}
          </ul>
        )}
      </figcaption>
    </figure>
  );
}
