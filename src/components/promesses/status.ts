import {
  Check,
  CircleDashed,
  Clock,
  Minus,
  X,
  type LucideIcon,
} from "lucide-react";
import type { PromiseStatus } from "@/lib/api/macronPromisesApi";

export const STATUS_ORDER: PromiseStatus[] = [
  "tenu",
  "partiel",
  "non_tenu",
  "en_cours",
  "non_evalue",
];

export const STATUS_LABEL: Record<PromiseStatus, string> = {
  tenu: "Tenu",
  partiel: "Partiel",
  non_tenu: "Non tenu",
  en_cours: "En cours",
  non_evalue: "Non évalué",
};

export const STATUS_ICON: Record<PromiseStatus, LucideIcon> = {
  tenu: Check,
  partiel: Minus,
  non_tenu: X,
  en_cours: Clock,
  non_evalue: CircleDashed,
};

/** Couleurs (tokens) : fond de pastille, texte, bordure d'accent, remplissage SVG. */
export const STATUS_STYLE: Record<
  PromiseStatus,
  { badge: string; accent: string; fill: string }
> = {
  tenu: {
    badge: "bg-success/15 text-success border-success/40",
    accent: "before:bg-success",
    fill: "hsl(var(--success))",
  },
  partiel: {
    badge: "bg-warning/15 text-warning border-warning/40",
    accent: "before:bg-warning",
    fill: "hsl(var(--warning))",
  },
  non_tenu: {
    badge: "bg-tri-red/15 text-tri-red border-tri-red/40",
    accent: "before:bg-tri-red",
    fill: "hsl(var(--tri-red))",
  },
  en_cours: {
    badge: "bg-primary/15 text-primary border-primary/40",
    accent: "before:bg-primary",
    fill: "hsl(var(--primary))",
  },
  non_evalue: {
    badge: "bg-muted text-muted-foreground border-border",
    accent: "before:bg-muted-foreground",
    fill: "hsl(var(--muted-foreground))",
  },
};
