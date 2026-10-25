import { motion, useReducedMotion } from "framer-motion";
import type { MacronPromiseItem } from "@/lib/api/macronPromisesApi";
import { cn } from "@/lib/utils";
import { STATUS_ICON, STATUS_LABEL, STATUS_STYLE } from "./status";

/** Carte d'une mesure : liseré de couleur selon le statut, pastille icône + libellé (jamais la couleur seule). */
export function PromiseCard({ item }: { item: MacronPromiseItem }) {
  const reduce = useReducedMotion();
  const Icon = STATUS_ICON[item.status];
  const style = STATUS_STYLE[item.status];
  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "glass relative overflow-hidden rounded-2xl border border-border p-5 pl-6 shadow-sm transition-shadow hover:shadow-md",
        "before:absolute before:inset-y-0 before:left-0 before:w-1.5",
        style.accent,
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
            style.badge,
          )}
        >
          <Icon className="h-3 w-3" aria-hidden />
          {STATUS_LABEL[item.status]}
        </span>
        <span className="text-xs font-semibold text-muted-foreground">
          {item.theme}
        </span>
      </div>
      <p className="mb-2 text-sm font-semibold leading-snug text-foreground sm:text-base">
        {item.promise}
      </p>
      <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
        {item.note}
      </p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {item.sources.map((s) => (
          <li key={s.url}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </motion.li>
  );
}
