import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { GlowCard, AnimatedNumber } from "@/components/design";
import { cn } from "@/lib/utils";
import { SIDE_STYLE } from "./CommuneSlot";

interface VersusStatProps {
  title: string;
  icon: ReactNode;
  nameA: string;
  nameB: string;
  valueA: number;
  valueB: number;
  subA: string;
  subB: string;
}

/** Face-à-face d'un indicateur (%) : deux chiffres animés, barres miroir et écart en points. */
export function VersusStat({ title, icon, nameA, nameB, valueA, valueB, subA, subB }: VersusStatProps) {
  const reduce = useReducedMotion();
  const diff = valueA - valueB;
  const gap =
    Math.abs(diff) < 0.05
      ? "Égalité"
      : `${diff > 0 ? nameA : nameB} devant de ${Math.abs(diff).toFixed(1).replace(".", ",")} pts`;

  return (
    <GlowCard glow={diff >= 0 ? "blue" : "red"}>
      <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </p>
      <div className="grid grid-cols-2 gap-4">
        {(["a", "b"] as const).map((side) => {
          const value = side === "a" ? valueA : valueB;
          return (
            <div key={side} className={cn(side === "b" && "text-right")}>
              <p className="truncate text-xs text-muted-foreground">{side === "a" ? nameA : nameB}</p>
              <p className={cn("font-heading text-3xl font-extrabold tabular-nums sm:text-4xl", SIDE_STYLE[side].text)}>
                <AnimatedNumber value={value} decimals={1} suffix=" %" />
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">{side === "a" ? subA : subB}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex h-2.5 gap-1" aria-hidden="true">
        <div className="flex flex-1 justify-end overflow-hidden rounded-l-full bg-muted">
          <motion.div
            className={cn("h-full w-full origin-right", SIDE_STYLE.a.bg)}
            initial={{ scaleX: reduce ? valueA / 100 : 0 }}
            whileInView={{ scaleX: valueA / 100 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="flex flex-1 overflow-hidden rounded-r-full bg-muted">
          <motion.div
            className={cn("h-full w-full origin-left", SIDE_STYLE.b.bg)}
            initial={{ scaleX: reduce ? valueB / 100 : 0 }}
            whileInView={{ scaleX: valueB / 100 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
      <p className="mt-3 text-center text-sm font-medium">{gap}</p>
    </GlowCard>
  );
}
