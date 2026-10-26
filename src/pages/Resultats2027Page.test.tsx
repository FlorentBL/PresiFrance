import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Resultats2027Page from "./Resultats2027Page";
import fixture from "./__fixtures__/live-t1.json";

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/presidentielle-2027/resultats"]}>
        <Resultats2027Page />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });

function stubFetch(status: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const u = String(url);
      if (u.includes("status.json")) return json(status);
      if (u.includes("national")) return json(fixture.files.national);
      if (u.includes("departements")) return json(fixture.files.departements);
      if (u.includes("communes/01")) return json(fixture.files.communes01);
      return new Response("<html></html>", { headers: { "content-type": "text/html" } });
    }),
  );
}

beforeAll(() => {
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } });
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Resultats2027Page", () => {
  it("affiche « à venir » tant qu'aucun tour n'est publié", async () => {
    stubFetch({ v: 1, election: 2027, current: null, rounds: {} });
    renderPage();
    expect(await screen.findByText("Résultats à venir")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("affiche les résultats partiels avec pourcentage, horodatage et source", async () => {
    stubFetch(fixture.status);
    renderPage();
    expect(await screen.findByText(/Résultats partiels \(42,5 % des inscrits\)/)).toBeTruthy();
    expect(screen.getByText(/sans aucune estimation ni projection/)).toBeTruthy();
    expect(screen.getByText(/relevés le/)).toBeTruthy();
    expect(await screen.findByText("Emmanuel Macron")).toBeTruthy();
    expect(screen.getByText("Marine Le Pen")).toBeTruthy();
  });

  it("descend au département puis à la commune", async () => {
    stubFetch(fixture.status);
    renderPage();
    fireEvent.click(await screen.findByRole("radio", { name: "Commune" }));
    fireEvent.change(await screen.findByLabelText("Département"), { target: { value: "01" } });
    fireEvent.change(await screen.findByLabelText("Commune"), { target: { value: "01001" } });
    expect(await screen.findByText(/L'Abergement-Clémenciat : résultats du 1er tour/)).toBeTruthy();
  });
});
