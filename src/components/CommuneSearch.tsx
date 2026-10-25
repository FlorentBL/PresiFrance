import { useState, useEffect, useRef, useId, useMemo } from "react";
import { Search, Loader2, MapPin, History, CornerDownLeft } from "lucide-react";
import { searchCommunes, GeoCommune } from "@/lib/api/geoApi";
import { getSearchHistory } from "@/lib/searchHistory";
import { cn } from "@/lib/utils";

interface CommuneSearchProps {
  onSelect: (commune: GeoCommune) => void;
  autoFocus?: boolean;
}

/** Surligne la partie recherchée dans un nom de commune. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const idx = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-primary/20 px-0.5 text-foreground">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

const CommuneSearch = ({ onSelect, autoFocus = false }: CommuneSearchProps) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [communeResults, setCommuneResults] = useState<GeoCommune[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (query.length < 2) {
      setCommuneResults([]);
      setLoading(false);
      return;
    }

    clearTimeout(debounceRef.current);
    let cancelled = false;
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const communes = await searchCommunes(query, 50);
        if (!cancelled) setCommuneResults(communes);
      } catch (e) {
        console.error("Search error:", e);
        if (!cancelled) setCommuneResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Fermeture au clic extérieur
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Récents : proposés quand le champ est vide
  const recents = useMemo<GeoCommune[]>(
    () =>
      open && query.length < 2
        ? getSearchHistory().map((h) => ({
            nom: h.nom,
            code: h.code,
            codesPostaux: [],
            codeDepartement: h.codeDepartement,
            codeRegion: "",
            population: h.population,
          }))
        : [],
    [open, query],
  );

  const showingRecents = query.length < 2 && recents.length > 0;
  const items = showingRecents ? recents : communeResults;
  const hasItems = items.length > 0;
  const expanded = open && hasItems;

  useEffect(() => setActive(-1), [items]);

  const choose = (commune: GeoCommune) => {
    onSelect(commune);
    setQuery(commune.nom);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown" && hasItems) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp" && hasItems) {
      e.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === "Enter" && expanded) {
      const target = items[active >= 0 ? active : 0];
      if (target) {
        e.preventDefault();
        choose(target);
      }
    }
  };

  useEffect(() => {
    if (active >= 0) document.getElementById(`${listId}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, listId]);

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-xl">
      <div className="relative">
        <label htmlFor={`${listId}-input`} className="sr-only">Rechercher une commune ou un code postal</label>
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          id={`${listId}-input`}
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Commune ou code postal…"
          className="glass w-full rounded-full border border-border py-3.5 pl-12 pr-14 font-body text-base text-foreground shadow-md placeholder:text-muted-foreground transition-all hover:border-primary/50 focus:border-primary focus:outline-none focus:shadow-glow-blue focus:ring-2 focus:ring-ring"
          role="combobox"
          aria-expanded={expanded}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
          autoComplete="off"
        />
        {loading ? (
          <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-label="Chargement" />
        ) : (
          <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:flex" aria-hidden="true">
            <CornerDownLeft className="h-3 w-3" />
          </kbd>
        )}
      </div>

      <ul
        id={listId}
        role="listbox"
        aria-label={showingRecents ? "Recherches récentes" : "Communes"}
        hidden={!expanded}
        className="glass absolute z-50 mt-2 max-h-80 w-full overflow-y-auto overflow-x-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-lg animate-in fade-in zoom-in-95 duration-200"
      >
        {expanded && showingRecents && (
          <li role="presentation" className="flex items-center gap-2 px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <History className="h-3 w-3" aria-hidden="true" /> Récents
          </li>
        )}
        {expanded &&
          items.map((commune, i) => (
            <li
              key={commune.code}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(commune)}
              className={cn(
                "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
                i === active ? "bg-accent" : "hover:bg-accent/60",
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <span className="truncate font-semibold text-foreground">
                  <Highlight text={commune.nom} query={showingRecents ? "" : query} />
                </span>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {[commune.codesPostaux?.[0], commune.codeDepartement].filter(Boolean).join(" — ")}
                </span>
              </span>
            </li>
          ))}
      </ul>

      {open && query.length >= 2 && !loading && !hasItems && (
        <div className="glass absolute z-50 mt-2 w-full rounded-2xl border border-border bg-popover p-4 text-sm text-muted-foreground shadow-lg" role="status">
          Aucun résultat pour « {query} ».
        </div>
      )}
    </div>
  );
};

export default CommuneSearch;
