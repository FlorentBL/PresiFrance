import { motion, useReducedMotion } from "framer-motion";
import { getCandidateColor } from "@/lib/candidateColors";
import { cn } from "@/lib/utils";
import { SIDE_STYLE } from "./CommuneSlot";

export type CandidateResult = { prenom: string; nom: string; voix: number; pourcentExprimes: number };

interface MirrorBarsProps {
  candidatesA: CandidateResult[];
  candidatesB: CandidateResult[];
  nameA: string;
  nameB: string;
}

const fmt = (n: number) => n.toFixed(1).replace(".", ",");

/** Barres miroir : la commune A part du centre vers la gauche, la B vers la droite, une ligne par candidat. */
export function MirrorBars({ candidatesA, candidatesB, nameA, nameB }: MirrorBarsProps) {
  const reduce = useReducedMotion();
  const key = (c: CandidateResult) => `${c.prenom} ${c.nom}`;
  const mapA = new Map(candidatesA.map((c) => [key(c), c]));
  const mapB = new Map(candidatesB.map((c) => [key(c), c]));
  const rows = [...new Set([...mapA.keys(), ...mapB.keys()])]
    .map((k, i) => {
      const a = mapA.get(k);
      const b = mapB.get(k);
      const c = a ?? b!;
      return {
        k,
        label: `${c.prenom} ${c.nom}`,
        pctA: a?.pourcentExprimes ?? 0,
        pctB: b?.pourcentExprimes ?? 0,
        color: getCandidateColor(c.prenom, c.nom, i),
      };
    })
    .sort((x, y) => y.pctA + y.pctB - (x.pctA + x.pctB));
  const max = Math.max(1, ...rows.flatMap((r) => [r.pctA, r.pctB]));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm font-semibold">
        <span className={cn("truncate", SIDE_STYLE.a.text)}>← {nameA}</span>
        <span className={cn("truncate text-right", SIDE_STYLE.b.text)}>{nameB} →</span>
      </div>
      <ul className="space-y-3">
        {rows.map((r, i) => {
          const diff = r.pctA - r.pctB;
          const gap =
            Math.abs(diff) < 0.05 ? "Égalité" : `+${fmt(Math.abs(diff))} pts à ${diff > 0 ? nameA : nameB}`;
          return (
            <li key={r.k}>
              <div className="mb-1 flex items-center justify-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} aria-hidden="true" />
                <span className="font-medium">{r.label}</span>
                <span className="hidden text-xs text-muted-foreground sm:inline">· {gap}</span>
              </div>
              <div className="grid grid-cols-[2.75rem_1fr_1fr_2.75rem] items-center gap-1.5 sm:grid-cols-[3.5rem_1fr_1fr_3.5rem]">
                <span className={cn("text-right text-xs font-bold tabular-nums sm:text-sm", SIDE_STYLE.a.text)}>
                  {fmt(r.pctA)}%
                </span>
                <div className="flex h-4 justify-end overflow-hidden rounded-l-full bg-muted/60">
                  <motion.div
                    className={cn("h-full w-full origin-right", SIDE_STYLE.a.bg)}
                    initial={{ scaleX: reduce ? r.pctA / max : 0 }}
                    whileInView={{ scaleX: r.pctA / max }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: reduce ? 0 : Math.min(i, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <div className="flex h-4 overflow-hidden rounded-r-full bg-muted/60">
                  <motion.div
                    className={cn("h-full w-full origin-left", SIDE_STYLE.b.bg)}
                    initial={{ scaleX: reduce ? r.pctB / max : 0 }}
                    whileInView={{ scaleX: r.pctB / max }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: reduce ? 0 : Math.min(i, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <span className={cn("text-xs font-bold tabular-nums sm:text-sm", SIDE_STYLE.b.text)}>{fmt(r.pctB)}%</span>
              </div>
              <p className="mt-0.5 text-center text-xs text-muted-foreground sm:hidden">{gap}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
