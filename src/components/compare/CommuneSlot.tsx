import { Link } from "react-router-dom";
import { MapPin, X } from "lucide-react";
import CommuneSearch from "@/components/CommuneSearch";
import type { GeoCommune } from "@/lib/api/geoApi";
import { cn } from "@/lib/utils";

export type Side = "a" | "b";

export const SIDE_STYLE = {
  a: { text: "text-primary", bg: "bg-primary", soft: "bg-primary/10", border: "border-primary/40", glow: "shadow-glow-blue" },
  b: { text: "text-tri-red", bg: "bg-tri-red", soft: "bg-tri-red/10", border: "border-tri-red/40", glow: "shadow-glow-red" },
} as const;

interface CommuneSlotProps {
  side: Side;
  label: string;
  commune?: GeoCommune;
  year: number;
  onSelect: (c: GeoCommune) => void;
  onClear: () => void;
}

/** Emplacement d'une commune du face-à-face : recherche ou carte de la commune choisie. */
export function CommuneSlot({ side, label, commune, year, onSelect, onClear }: CommuneSlotProps) {
  const s = SIDE_STYLE[side];
  return (
    <div>
      <p className={cn("mb-2 text-xs font-semibold uppercase tracking-[0.2em]", s.text)}>{label}</p>
      {commune ? (
        <div className={cn("flex items-center justify-between gap-3 rounded-2xl border p-4", s.border, s.soft, s.glow)}>
          <Link to={`/commune/${commune.code}?year=${year}`} className="flex min-w-0 items-center gap-3 hover:opacity-80">
            <MapPin className={cn("h-5 w-5 shrink-0", s.text)} aria-hidden="true" />
            <div className="min-w-0">
              <p className="truncate font-heading text-xl font-bold">{commune.nom}</p>
              <p className="text-sm text-muted-foreground">
                {commune.codeDepartement} • {commune.population?.toLocaleString("fr-FR")} hab.
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClear}
            aria-label={`Changer la commune (${commune.nom})`}
            className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full border border-border px-3 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Changer
          </button>
        </div>
      ) : (
        <CommuneSearch onSelect={onSelect} />
      )}
    </div>
  );
}
