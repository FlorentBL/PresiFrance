import { Eye, Focus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PollLegendItem {
  id: string;
  label: string;
  color: string;
}

interface PollLegendProps {
  items: PollLegendItem[];
  visible: Set<string>;
  highlighted: string | null;
  onHighlight: (id: string | null) => void;
  onToggle: (id: string) => void;
  onIsolate: (id: string) => void;
  onShowAll: () => void;
}

/** Légende interactive : survol/focus = mise en avant, clic = afficher/masquer, « seul » = isoler. */
export function PollLegend({
  items,
  visible,
  highlighted,
  onHighlight,
  onToggle,
  onIsolate,
  onShowAll,
}: PollLegendProps) {
  return (
    <div>
      <ul
        className="flex flex-wrap gap-2"
        onMouseLeave={() => onHighlight(null)}
      >
        {items.map((c) => {
          const on = visible.has(c.id);
          const dim = highlighted !== null && highlighted !== c.id && on;
          return (
            <li
              key={c.id}
              className={cn(
                "inline-flex items-center rounded-full border text-sm transition-all duration-200",
                on
                  ? "border-border bg-card/70"
                  : "border-dashed border-border bg-transparent",
                highlighted === c.id && "shadow-glow-blue border-primary/60",
                dim && "opacity-45",
              )}
              onMouseEnter={() => on && onHighlight(c.id)}
            >
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onToggle(c.id)}
                onFocus={() => on && onHighlight(c.id)}
                onBlur={() => onHighlight(null)}
                className="inline-flex min-h-10 items-center gap-2 rounded-l-full py-1.5 pl-3 pr-2 font-medium"
              >
                <span
                  aria-hidden
                  className="h-3 w-3 shrink-0 rounded-full ring-2 ring-background"
                  style={{
                    backgroundColor: on ? c.color : "transparent",
                    boxShadow: on ? undefined : `inset 0 0 0 2px ${c.color}`,
                  }}
                />
                <span
                  className={cn(
                    !on && "text-muted-foreground line-through decoration-1",
                  )}
                >
                  {c.label}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onIsolate(c.id)}
                aria-label={`Afficher uniquement ${c.label}`}
                title="Isoler cette courbe"
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-r-full border-l border-border/60 text-muted-foreground transition-colors hover:text-primary"
              >
                <Focus className="h-4 w-4" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={onShowAll}
        className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        <Eye className="h-4 w-4" aria-hidden />
        Tout afficher
      </button>
    </div>
  );
}
