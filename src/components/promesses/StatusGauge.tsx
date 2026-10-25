import { motion, useReducedMotion } from "framer-motion";
import { AnimatedNumber } from "@/components/design";
import type { PromiseStatus } from "@/lib/api/macronPromisesApi";
import { STATUS_LABEL, STATUS_ORDER, STATUS_STYLE } from "./status";

interface StatusGaugeProps {
  counts: Record<PromiseStatus, number>;
  total: number;
}

const R = 90;
const ARC = Math.PI * R; // demi-cercle

/** Jauge globale en demi-cercle : un arc par statut, tracé animé à l'entrée dans le viewport. */
export function StatusGauge({ counts, total }: StatusGaugeProps) {
  const reduce = useReducedMotion();
  let offset = 0;
  const pctTenu = total > 0 ? (counts.tenu / total) * 100 : 0;
  const summary = STATUS_ORDER.filter((s) => counts[s] > 0)
    .map((s) => `${counts[s]} ${STATUS_LABEL[s].toLowerCase()}`)
    .join(", ");

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[420px]">
        <svg
          viewBox="0 0 220 125"
          className="w-full"
          role="img"
          aria-label={`Répartition de ${total} mesures : ${summary}`}
        >
          <path
            d="M 20 110 A 90 90 0 0 1 200 110"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={16}
            strokeLinecap="butt"
          />
          {STATUS_ORDER.filter((s) => counts[s] > 0).map((s, i) => {
            const len = (counts[s] / total) * ARC;
            const start = offset;
            offset += len;
            return (
              <motion.path
                key={s}
                d="M 20 110 A 90 90 0 0 1 200 110"
                fill="none"
                stroke={STATUS_STYLE[s].fill}
                strokeWidth={16}
                strokeDasharray={`${Math.max(len - 1.5, 0)} ${ARC}`}
                strokeDashoffset={-start}
                initial={
                  reduce
                    ? false
                    : { opacity: 0, strokeDasharray: `0 ${ARC}` }
                }
                whileInView={{
                  opacity: 1,
                  strokeDasharray: `${Math.max(len - 1.5, 0)} ${ARC}`,
                }}
                viewport={{ once: true }}
                transition={{
                  duration: 1.1,
                  delay: 0.15 * i,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center">
          <p className="font-heading text-5xl font-extrabold tabular-nums sm:text-6xl">
            <AnimatedNumber value={Math.round(pctTenu)} suffix=" %" />
          </p>
          <p className="text-sm text-muted-foreground">
            des {total} mesures tenues
          </p>
        </div>
      </div>
      <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
        {STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => (
          <li key={s} className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: STATUS_STYLE[s].fill }}
            />
            <span className="text-muted-foreground">{STATUS_LABEL[s]}</span>
            <strong className="tabular-nums">{counts[s]}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
