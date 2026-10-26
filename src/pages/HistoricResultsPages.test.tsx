import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import PresidentialYearPage from "./PresidentialYearPage";
import ResultatsPresidentiellePage from "./ResultatsPresidentiellePage";
import national from "../../public/data/presidential/national-results.json";

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/presidentielle-1981" element={<PresidentialYearPage />} />
          <Route path="/resultats-presidentielle" element={<ResultatsPresidentiellePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeAll(() => {
  const observer = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
  vi.stubGlobal("IntersectionObserver", observer);
  vi.stubGlobal("ResizeObserver", observer);
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, media: q, addEventListener: () => {}, removeEventListener: () => {} }));
  vi.stubGlobal("fetch", async () => new Response(JSON.stringify(national), { status: 200 }));
});

afterEach(cleanup);

describe("pages de résultats historiques", () => {
  it("affiche H1, tableaux des deux tours, FAQ et liens sur /presidentielle-1981", async () => {
    renderAt("/presidentielle-1981");
    expect((await screen.findAllByRole("heading", { level: 1 }))[0].textContent).toContain("Résultats de l'élection présidentielle 1981");
    expect(await screen.findByText("Qui a gagné l'élection présidentielle 1981 ?")).toBeTruthy();
    expect(screen.getByText("Résultats du 1er tour de la présidentielle 1981")).toBeTruthy();
    expect(screen.getByText("Résultats du 2nd tour de la présidentielle 1981")).toBeTruthy();
    expect(document.querySelector('a[href="/explorer/75"]')).toBeTruthy();
    expect(document.querySelector('a[href="/commune/75056"]')).toBeTruthy();
  });

  it("affiche le tableau de toutes les élections et la FAQ sur le hub", async () => {
    renderAt("/resultats-presidentielle");
    expect(await screen.findByText("Résultats de chaque élection présidentielle")).toBeTruthy();
    expect(await screen.findByText("Qui a gagné les dernières élections présidentielles ?")).toBeTruthy();
    expect(document.querySelector('script[type="application/ld+json"]')?.textContent).toContain("FAQPage");
  });
});
