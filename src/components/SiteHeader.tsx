import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronDown, Menu, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ThemeToggle from "@/components/ThemeToggle";
import { DEFAULT_YEAR, PRESIDENTIAL_YEARS_DESC, PresidentialYear } from "@/lib/elections";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string };

/** Section 2027 en premier, puis les résultats historiques. */
const MAIN_ITEMS: NavItem[] = [
  { to: "/", label: "Accueil" },
  { to: "/presidentielle-2027", label: "Présidentielle 2027" },
  { to: "/parrainages", label: "Parrainages" },
  { to: "/sondages-presidentielle-2027", label: "Sondages 2027" },
  { to: "/resultats-presidentielle", label: "Résultats" },
  { to: "/comparer", label: "Comparer" },
];

/** Rubrique « Archives » : contenus du premier mandat 2017-2022. */
const ARCHIVE_ITEMS: NavItem[] = [
  { to: "/promesses-bilan", label: "Promesses vs bilan (2017-2022)" },
  { to: "/analyse", label: "Sondages 2022" },
];

function isActive(pathname: string, to: string): boolean {
  return to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
}

export default function SiteHeader() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduce = useReducedMotion();
  const archiveActive = ARCHIVE_ITEMS.some((i) => isActive(pathname, i.to));
  const yearParam = searchParams.get("year");
  const year = (yearParam ? Number(yearParam) : DEFAULT_YEAR) as PresidentialYear;

  const setYear = (v: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("year", v);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const yearSelect = (className: string) => (
    <Select value={String(year)} onValueChange={setYear}>
      <SelectTrigger className={className} aria-label="Année des données">
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
  );

  return (
    <header className="sticky top-0 z-40 h-[4.75rem] px-3 pt-3 sm:px-6">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Aller au contenu
      </a>
      <div
        className={cn(
          "glass mx-auto flex h-14 max-w-7xl items-center justify-between rounded-full pl-3 pr-2 transition-shadow duration-300 sm:pl-4",
          scrolled ? "shadow-lg" : "shadow-md",
        )}
      >
        <Link to="/" className="group flex items-center gap-2.5" aria-label="PrésiFrance, accueil">
          <img
            src="/logo.webp"
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-border transition-shadow group-hover:shadow-glow-blue"
          />
          <span className="font-heading text-lg font-extrabold tracking-tight text-foreground">
            Prési<span className="text-primary">France</span>
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
          {MAIN_ITEMS.map((item) => {
            const active = isActive(pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-primary/15 ring-1 ring-primary/30"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                archiveActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Archives <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ARCHIVE_ITEMS.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <Link to={item.to} aria-current={isActive(pathname, item.to) ? "page" : undefined}>
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-1.5">
          <div className="hidden sm:block">
            {yearSelect("h-9 w-[160px] rounded-full border-border bg-transparent text-xs font-bold uppercase tracking-wider")}
          </div>
          <ThemeToggle />

          <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full lg:hidden"
              aria-label="Ouvrir le menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <AnimatePresence>
              {mobileOpen && (
                <DialogPrimitive.Portal forceMount>
                  <DialogPrimitive.Content forceMount asChild aria-describedby={undefined}>
                    <motion.div
                      className="night-bg grain fixed inset-0 z-50 flex flex-col overflow-y-auto px-6 pb-10 pt-4"
                      initial={reduce ? false : { opacity: 0, y: -16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="flex h-14 items-center justify-between">
                        <DialogPrimitive.Title className="font-heading text-lg font-extrabold">
                          Prési<span className="text-primary">France</span>
                        </DialogPrimitive.Title>
                        <DialogPrimitive.Close asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-full" aria-label="Fermer le menu">
                            <X className="h-5 w-5" />
                          </Button>
                        </DialogPrimitive.Close>
                      </div>
                      <nav aria-label="Navigation mobile" className="mt-6 flex flex-col">
                        {MAIN_ITEMS.map((item, i) => {
                          const active = isActive(pathname, item.to);
                          return (
                            <motion.div
                              key={item.to}
                              initial={reduce ? false : { opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: reduce ? 0 : 0.06 * i + 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            >
                              <Link
                                to={item.to}
                                aria-current={active ? "page" : undefined}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                  "block border-b border-border/60 py-4 font-heading text-3xl font-bold tracking-tight transition-colors",
                                  active ? "text-primary" : "text-foreground hover:text-primary",
                                )}
                              >
                                {item.label}
                              </Link>
                            </motion.div>
                          );
                        })}
                      <p className="mb-1 mt-8 text-xs font-bold uppercase tracking-wider text-muted-foreground">Archives</p>
                        {ARCHIVE_ITEMS.map((item) => {
                          const active = isActive(pathname, item.to);
                          return (
                            <Link
                              key={item.to}
                              to={item.to}
                              aria-current={active ? "page" : undefined}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                "block border-b border-border/60 py-3 font-heading text-xl font-semibold tracking-tight transition-colors",
                                active ? "text-primary" : "text-foreground/80 hover:text-primary",
                              )}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </nav>
                      <div className="mt-10">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Année des données</p>
                        {yearSelect("w-full rounded-full border-border bg-transparent")}
                      </div>
                    </motion.div>
                  </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
              )}
            </AnimatePresence>
          </DialogPrimitive.Root>
        </div>
      </div>
    </header>
  );
}
