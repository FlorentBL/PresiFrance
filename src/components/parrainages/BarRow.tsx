import { motion, useReducedMotion } from "framer-motion";
import { CandidateAvatar } from "@/components/design";
import { cn } from "@/lib/utils";
import { colorOf, displayName, splitCandidat } from "./candidatName";

interface BarRowProps {
  candidat: string;
  index: number;
  value: number;
  max: number;
  rank?: number;
  hint?: string;
  active?: boolean;
  onSelect?: () => void;
}

/** Ligne de classement : avatar, nom, barre animée à la couleur du candidat, valeur. Cliquable si `onSelect`. */
export function BarRow({ candidat, index, value, max, rank, hint, active, onSelect }: BarRowProps) {
  const reduce = useReducedMotion();
  const color = colorOf(candidat, index);
  const { prenom, nom } = splitCandidat(candidat);
  const ratio = max > 0 ? value / max : 0;

  const body = (
    <>
      {rank !== undefined && <span className="w-5 shrink-0 text-xs font-bold tabular-nums text-muted-foreground">{rank}</span>}
      <CandidateAvatar prenom={prenom} nom={nom} color={color} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium">{displayName(candidat)}</span>
          <span className="shrink-0 text-sm font-bold tabular-nums">
            {value.toLocaleString("fr-FR")}
            {hint && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{hint}</span>}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted/70" aria-hidden="true">
          <motion.div
            className="h-full origin-left rounded-full"
            style={{ backgroundColor: color }}
            initial={{ scaleX: reduce ? ratio : 0 }}
            whileInView={{ scaleX: ratio }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: reduce ? 0 : Math.min(index, 10) * 0.04, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </>
  );

  const cls = "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left";
  if (!onSelect) return <div className={cls}>{body}</div>;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(cls, "min-h-[44px] transition-colors hover:bg-muted/50", active && "bg-primary/10 ring-1 ring-primary/40")}
    >
      {body}
    </button>
  );
}
