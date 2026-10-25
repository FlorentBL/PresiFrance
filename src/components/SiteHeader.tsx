import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DEFAULT_YEAR, PRESIDENTIAL_YEARS_DESC, PresidentialYear } from "@/lib/elections";

export default function SiteHeader() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const yearParam = searchParams.get("year");
  const year = (yearParam ? Number(yearParam) : DEFAULT_YEAR) as PresidentialYear;

  const setYear = (v: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("year", v);
    setSearchParams(next, { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo.webp"
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-border/60 group-hover:ring-primary/30 transition-shadow"
          />
          <span className="text-xl font-black tracking-tight text-foreground">
            Prési<span className="text-primary">France</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Accueil</Link>
          <Link to="/resultats-presidentielle" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Résultats</Link>
          <Link to="/comparer" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Comparer</Link>
          <Link to="/parrainages" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Parrainages</Link>
          <Link to="/analyse" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Sondages 2022</Link>
          <Link to="/promesses-bilan" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Promesses / bilan</Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <Select value={String(year)} onValueChange={setYear}>
              <SelectTrigger className="h-9 w-[140px] border-primary/20 hover:border-primary/50 text-xs font-bold uppercase tracking-wider">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {PRESIDENTIAL_YEARS_DESC.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    Données {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Ouvrir le menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <SheetContent side="right" className="w-[min(100%,320px)]">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-6" onClick={() => setMobileOpen(false)}>
                <Link
                  to="/"
                  className="py-3 px-2 rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Accueil
                </Link>
                <Link
                  to="/resultats-presidentielle"
                  className="py-3 px-2 rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Résultats
                </Link>
                <Link
                  to="/comparer"
                  className="py-3 px-2 rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Comparer
                </Link>
                <Link
                  to="/parrainages"
                  className="py-3 px-2 rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Parrainages
                </Link>
                <Link
                  to="/analyse"
                  className="py-3 px-2 rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Sondages 2022
                </Link>
                <Link
                  to="/promesses-bilan"
                  className="py-3 px-2 rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Promesses / bilan
                </Link>
              </nav>
              <div className="mt-8 sm:hidden">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Année des données</p>
                <Select value={String(year)} onValueChange={(v) => { setYear(v); setMobileOpen(false); }}>
                  <SelectTrigger className="w-full border-primary/20">
                    <SelectValue placeholder="Année" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESIDENTIAL_YEARS_DESC.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
