import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Sondages2027Page from "./Sondages2027Page";
import AnalysePage from "./AnalysePage";
import dataset from "../../public/data/presidential/polls-2027-round1.json";
import dataset2022 from "../../public/data/presidential/polls-2022-round1.json";


function renderPage(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeAll(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: false,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  }));
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => ({
      ok: true,
      json: async () => (String(url).includes("2027") ? dataset : dataset2022),
    })),
  );
});

afterEach(cleanup);

describe("Sondages2027Page", () => {
  it("shows averages with poll counts, the polls table with notices and the legal mentions", async () => {
    renderPage(<Sondages2027Page />);
    expect(await screen.findByRole("heading", { name: "Moyennes par candidat" })).toBeTruthy();

    const averages = screen.getByRole("table", { name: /Moyenne des intentions de vote/ });
    expect(within(averages).getAllByRole("row").length).toBeGreaterThan(5);

    const polls = screen.getByRole("table", { name: /Sondages de 1er tour/ });
    expect(within(polls).getAllByRole("link").length).toBeGreaterThan(0);

    expect(screen.getByRole("link", { name: "Commission des sondages" }).getAttribute("href")).toBe(
      "https://www.commission-des-sondages.fr",
    );
    expect(screen.getAllByText(/marge d.erreur/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /archive Sondages 2022/ }).getAttribute("href")).toBe("/analyse");
  });

  it("restricts the candidates to the chosen hypothesis", async () => {
    renderPage(<Sondages2027Page />);
    await screen.findByRole("heading", { name: "Moyennes par candidat" });
    const select = screen.getByLabelText("Hypothèse testée") as HTMLSelectElement;
    expect(select.options.length).toBeGreaterThan(1);
    const before = within(screen.getByRole("table", { name: /Moyenne des intentions de vote/ })).getAllByRole("row").length;
    fireEvent.change(select, { target: { value: select.options[1].value } });
    const after = within(screen.getByRole("table", { name: /Moyenne des intentions de vote/ })).getAllByRole("row").length;
    expect(after).toBeLessThanOrEqual(before);
    expect(screen.getByText(/Candidats de cette hypothèse/)).toBeTruthy();
  });
});

describe("AnalysePage archive", () => {
  it("is labelled as a 2022 archive and links to the 2027 page", async () => {
    renderPage(<AnalysePage />);
    expect(screen.getByRole("heading", { level: 1, name: /Sondages 2022.*archive/ })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /sondages de la présidentielle 2027/ }).getAttribute("href"),
    ).toBe("/sondages-presidentielle-2027");
  });
});
