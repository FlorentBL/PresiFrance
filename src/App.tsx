import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { PRESIDENTIAL_YEAR_SUMMARIES } from "@/lib/presidentialSeo";

const CommunePage = lazy(() => import("./pages/CommunePage"));
const ExplorationPage = lazy(() => import("./pages/ExplorationPage"));
const DepartmentExplorationPage = lazy(() => import("./pages/DepartmentExplorationPage"));
const ResultatsPresidentiellePage = lazy(() => import("./pages/ResultatsPresidentiellePage"));
const ResultatsParCommunePage = lazy(() => import("./pages/ResultatsParCommunePage"));
const CartePresidentiellePage = lazy(() => import("./pages/CartePresidentiellePage"));
const ParticipationPresidentiellePage = lazy(() => import("./pages/ParticipationPresidentiellePage"));
const AbstentionPresidentiellePage = lazy(() => import("./pages/AbstentionPresidentiellePage"));
const PresidentialYearPage = lazy(() => import("./pages/PresidentialYearPage"));
const ParrainagesPage = lazy(() => import("./pages/ParrainagesPage"));
const ComparerPage = lazy(() => import("./pages/ComparerPage"));
const AnalysePage = lazy(() => import("./pages/AnalysePage"));
const Sondages2027Page = lazy(() => import("./pages/Sondages2027Page"));
const PromessesBilanPage = lazy(() => import("./pages/PromessesBilanPage"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const PolitiqueConfidentialite = lazy(() => import("./pages/PolitiqueConfidentialite"));
const Presidentielle2027Page = lazy(() => import("./pages/Presidentielle2027Page"));
const Candidat2027Page = lazy(() => import("./pages/Candidat2027Page"));
const EmbedCartePage = lazy(() => import("./pages/EmbedCartePage"));
const EmbedCommunePage = lazy(() => import("./pages/EmbedCommunePage"));
const IntegrerPage = lazy(() => import("./pages/IntegrerPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Données publiées statiques : inutile de les recharger pendant la session.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity, gcTime: 30 * 60 * 1000, refetchOnWindowFocus: false, retry: 1 },
  },
});

function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="night-bg flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6"
    >
      <span className="font-heading text-3xl font-bold tracking-tight text-foreground">
        Prési<span className="text-primary">France</span>
      </span>
      <div className="tricolor-bar h-1 w-40 overflow-hidden rounded-full motion-safe:animate-pulse" aria-hidden="true" />
      <span className="sr-only">Chargement de la page…</span>
    </div>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" themes={["dark", "light"]} enableSystem={false}>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/resultats-presidentielle" element={<ResultatsPresidentiellePage />} />
            <Route path="/resultats-presidentielle-par-commune" element={<ResultatsParCommunePage />} />
            <Route path="/carte-presidentielle" element={<CartePresidentiellePage />} />
            <Route path="/participation-presidentielle" element={<ParticipationPresidentiellePage />} />
            <Route path="/abstention-presidentielle" element={<AbstentionPresidentiellePage />} />
            {PRESIDENTIAL_YEAR_SUMMARIES.map(({ year }) => (
              <Route key={year} path={`/presidentielle-${year}`} element={<PresidentialYearPage />} />
            ))}
            <Route path="/commune/:code" element={<CommunePage />} />
            <Route path="/explorer" element={<ExplorationPage />} />
            <Route path="/explorer/:depCode" element={<DepartmentExplorationPage />} />
            <Route path="/parrainages" element={<ParrainagesPage />} />
            <Route path="/comparer" element={<ComparerPage />} />
            <Route path="/analyse" element={<AnalysePage />} />
            <Route path="/sondages-presidentielle-2027" element={<Sondages2027Page />} />
            <Route path="/promesses-bilan" element={<PromessesBilanPage />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/politique-de-confidentialite" element={<PolitiqueConfidentialite />} />
            <Route path="/presidentielle-2027" element={<Presidentielle2027Page />} />
            <Route path="/presidentielle-2027/candidats/:slug" element={<Candidat2027Page />} />
            <Route path="/embed/carte" element={<EmbedCartePage />} />
            <Route path="/embed/commune/:code" element={<EmbedCommunePage />} />
            <Route path="/integrer" element={<IntegrerPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
