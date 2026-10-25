import { lazy, Suspense } from "react";
import { Clock, MapPin } from "lucide-react";
import { PageHero } from "@/components/design";
import CommuneSearch from "@/components/CommuneSearch";
import type { GeoCommune } from "@/lib/api/geoApi";
import type { HistoryEntry } from "@/lib/searchHistory";

const FranceTileMap = lazy(() => import("./FranceTileMap"));

interface HomeHeroProps {
  year: number;
  history: HistoryEntry[];
  onSelect: (commune: GeoCommune) => void;
  onOpenHistory: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
}

function MapSlot({ year, className }: { year: number; className?: string }) {
  return (
    <Suspense fallback={<div className={className} style={{ aspectRatio: "1 / 1" }} aria-hidden="true" />}>
      <FranceTileMap year={year} className={className} />
    </Suspense>
  );
}

/** Hero plein écran : titre XXL, recherche de commune centrale, historique et carte de France animée. */
export default function HomeHero({ year, history, onSelect, onOpenHistory, onClearHistory }: HomeHeroProps) {
  return (
    <>
      <PageHero
        size="xxl"
        eyebrow="Données officielles · Open Data · 1965 → 2022"
        title={
          <>
            Le vote de <span className="text-gradient-tricolor">chaque commune</span>, en pleine lumière
          </>
        }
        description="Résultats détaillés, participation et parrainages des élections présidentielles françaises, de 1965 à 2022."
        actions={
          <div className="w-full max-w-xl space-y-4">
            <CommuneSearch onSelect={onSelect} />
            {history.length > 0 && (
              <div className="flex flex-wrap items-center gap-2" aria-label="Recherches récentes">
                <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                {history.map((entry) => (
                  <button
                    key={entry.code}
                    type="button"
                    onClick={() => onOpenHistory(entry)}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {entry.nom}
                    <span className="text-xs text-muted-foreground">({entry.codeDepartement})</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={onClearHistory}
                  aria-label="Effacer l'historique de recherche"
                  className="min-h-10 min-w-10 text-lg text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        }
        aside={<MapSlot year={year} className="w-[28rem] xl:w-[32rem]" />}
      />
      <div className="mx-auto -mt-6 max-w-md px-6 pb-10 lg:hidden">
        <MapSlot year={year} />
      </div>
    </>
  );
}
