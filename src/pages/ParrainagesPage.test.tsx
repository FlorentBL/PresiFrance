import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/components/SiteHeader", () => ({ default: () => null }));
vi.mock("@/components/SiteFooter", () => ({ default: () => null }));
vi.mock("@/components/SEOHead", () => ({ default: () => null }));
vi.mock("@/components/JsonLd", () => ({ default: () => null }));
vi.mock("@/lib/api/parrainagesApi", () => ({
  getParrainagesManifest: vi.fn(),
  getParrainagesByYear: vi.fn(),
  getParrainagesByDep: vi.fn(),
  getParrainagesHistory: vi.fn(),
}));

import * as api from "@/lib/api/parrainagesApi";
import ParrainagesPage from "./ParrainagesPage";

const entry = (dep: string) => ({ candidat: "TESTEUR Candidat A", dep, nom: "N", prenom: "P", mandat: "Maire", circonscription: "C", date: "15/02/2027" });

class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
vi.stubGlobal("IntersectionObserver", NoopObserver);
vi.stubGlobal("ResizeObserver", NoopObserver);

function renderPage(url: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <ParrainagesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ParrainagesPage 2027", () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("shows the upcoming-publication state when 2027 has no data", async () => {
    vi.mocked(api.getParrainagesManifest).mockResolvedValue({ years: [2017, 2022], sources: {}, pending: [2027] });
    renderPage("/parrainages?year=2027");
    expect(await screen.findByText(/ne sont pas encore publiés/)).toBeTruthy();
    expect(api.getParrainagesByYear).not.toHaveBeenCalled();
  });

  it("shows the tracking mode by default when 2027 data exists", async () => {
    vi.mocked(api.getParrainagesManifest).mockResolvedValue({ years: [2022, 2027], sources: {} });
    vi.mocked(api.getParrainagesByYear).mockResolvedValue({
      year: 2027,
      total: 2,
      departements: 2,
      lastPublication: "2027-02-15",
      candidats: ["TESTEUR Candidat A"],
      stats: [{ candidat: "TESTEUR Candidat A", total: 2, departements: 2 }],
      byCandidat: { "TESTEUR Candidat A": [entry("Ain"), entry("Aisne")] },
    });
    vi.mocked(api.getParrainagesByDep).mockResolvedValue({});
    vi.mocked(api.getParrainagesHistory).mockResolvedValue([
      { publishedAt: "2027-02-15", recordedAt: "2027-02-16T00:00:00Z", total: 2, candidats: 1, departements: 2, stats: [["TESTEUR Candidat A", 2, 2]] },
    ]);
    renderPage("/parrainages");
    expect(await screen.findByText(/Progression vers le seuil de 500/)).toBeTruthy();
    expect(screen.getByTestId("parrainages-last-update").textContent).toContain("15 février 2027");
    expect(await screen.findByText("Historique des publications")).toBeTruthy();
    expect(api.getParrainagesByYear).toHaveBeenCalledWith(2027);
  });
});
