import { Clock, MapPin } from "lucide-react";
import { PageHero } from "@/components/design";
import CommuneSearch from "@/components/CommuneSearch";
import type { GeoCommune } from "@/lib/api/geoApi";
import type { HistoryEntry } from "@/lib/searchHistory";
import { ElectionCountdown } from "./Home2027";

interface HomeHeroProps {
  history: HistoryEntry[];
  onSelect: (commune: GeoCommune) => void;
  onOpenHistory: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
}

/** Hero plein écran « Présidentielle 2027 » : recherche de commune « Comment a voté ma commune ? », historique et échéance. */
export default function HomeHero({ history, onSelect, onOpenHistory, onClearHistory }: HomeHeroProps) {
  return (
    <>
      <PageHero
        size="xxl"
        eyebrow="Élection présidentielle · printemps 2027"
        title={
          <>
            Présidentielle <span className="text-gradient-tricolor">2027</span>
          </>
        }
        description="Élection présidentielle en France : candidats, parrainages et sondages de la campagne 2027, et résultats officiels de toutes les présidentielles depuis 1965, commune par commune."
        actions={
          <div className="w-full max-w-xl space-y-4">
            <p id="recherche-commune" className="text-sm font-semibold text-foreground">Comment a voté ma commune ?</p>
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
        aside={<ElectionCountdown />}
      />
    </>
  );
}
