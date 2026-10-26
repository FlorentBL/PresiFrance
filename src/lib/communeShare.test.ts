import { describe, expect, it, vi } from "vitest";
import type { ElectionResult } from "@/lib/api/resultsApi";
import { aggregateCompactFile, type CompactDepFile } from "@/lib/api/compactResults";
import {
  buildCommuneSummary,
  buildShareCardData,
  communeSeoDescription,
  communeSeoTitle,
  communeShareUrl,
  distanceKm,
  drawShareCard,
  fullName,
  nearestCommunes,
  shareFilename,
} from "./communeShare";

const base = {
  codeDepartement: "44", nomDepartement: "Loire-Atlantique", codeCommune: "44109", nomCommune: "Nantes",
  inscrits: 100, abstentions: 20, abstentionsPourcent: 20, votants: 80, votantsPourcent: 80,
  blancs: 0, blancsPourcentInscrits: 0, blancsPourcentVotants: 0, nuls: 0, nulsPourcentInscrits: 0, nulsPourcentVotants: 0,
  exprimes: 80, exprimesPourcentInscrits: 80, exprimesPourcentVotants: 100,
} as const;

const results = (lead: [string, string, number]): ElectionResult => ({
  ...base,
  candidates: [
    { prenom: lead[0], nom: lead[1], voix: 40, pourcentInscrits: 40, pourcentExprimes: lead[2] },
    { prenom: "Marine", nom: "LE PEN", voix: 10, pourcentInscrits: 10, pourcentExprimes: 12 },
  ],
});

const national = {
  participation: 73.7,
  candidates: [{ prenom: "Emmanuel", nom: "MACRON", pourcentExprimes: 27.8, voix: 1 }],
};

describe("buildCommuneSummary", () => {
  it("mentions the same national winner, the gap and the turnout", () => {
    const s = buildCommuneSummary({ commune: "Nantes", year: 2022, round: 1, results: results(["Emmanuel", "MACRON", 30.5]), national });
    expect(s.sameAsNational).toBe(true);
    expect(s.sentence).toContain("À Nantes, Emmanuel Macron arrive en tête");
    expect(s.sentence).toContain("30,5 %");
    expect(s.sentence).toContain("2,7 points de plus");
    expect(s.sentence).toContain("participation de 80,0 %");
    expect(s.sentence).toContain("6,3 points de plus que la moyenne nationale");
  });

  it("flags a different local winner", () => {
    const s = buildCommuneSummary({ commune: "Nantes", year: 2022, round: 1, results: results(["Jean-Luc", "MÉLENCHON", 31]), national });
    expect(s.sameAsNational).toBe(false);
    expect(s.sentence).toContain("Jean-Luc Mélenchon arrive en tête");
    expect(s.sentence).toContain("Emmanuel Macron l'emporte au niveau national avec 27,8 %");
  });

  it("works without national data and without candidates", () => {
    expect(buildCommuneSummary({ commune: "X", year: 2022, round: 2, results: results(["A", "B", 50]), national: null }).sentence).toContain("second tour");
    expect(buildCommuneSummary({ commune: "X", year: 2022, round: 1, results: { ...base, candidates: [] }, national }).sentence).toContain("indisponibles");
  });
});

describe("seo and urls", () => {
  it("builds title, description and url", () => {
    expect(communeSeoTitle("Nantes")).toBe("Résultats des élections à Nantes");
    expect(communeSeoDescription("Nantes")).toContain("Nantes");
    expect(communeSeoDescription("Nantes", "Résumé.").startsWith("Résumé.")).toBe(true);
    expect(communeSeoDescription("Nantes", undefined, ["municipales-2026", "legislatives-2024"])).toContain("législatives 2024 et municipales 2026");
    expect(communeShareUrl("44109", 2022, 1, "https://x.test")).toBe("https://x.test/commune/44109?year=2022&round=1");
    expect(shareFilename("Saint-Étienne", 2022)).toBe("presifrance-saint-etienne-2022.png");
    expect(fullName({ prenom: "JEAN-LUC", nom: "MÉLENCHON" })).toBe("Jean-Luc Mélenchon");
  });
});

describe("neighbours", () => {
  it("orders by distance and excludes self", () => {
    const mk = (code: string, lon: number) => ({ code, nom: code, population: 1, centre: { coordinates: [lon, 47] as [number, number] } });
    const res = nearestCommunes(mk("a", 0), [mk("a", 0), mk("c", 0.3), mk("b", 0.1), { code: "n", nom: "n", population: 1 }], 2);
    expect(res.map((r) => r.code)).toEqual(["b", "c"]);
    expect(distanceKm([0, 47], [0.1, 47])).toBeGreaterThan(7);
    expect(nearestCommunes({ code: "a" }, [mk("b", 0)])).toEqual([]);
  });
});

describe("aggregateCompactFile", () => {
  const file: CompactDepFile = {
    v: 1,
    candidates: [["A", "Alice"], ["B", "Bob"]],
    dep: ["44", "Loire-Atlantique"],
    rows: { "44001": ["X", 100, 20, 80, 2, 3, 75, 50, 25], "44002": ["Y", 50, 10, 40, 1, 1, 38, 8, 30] },
  };
  it("sums communes and recomputes percentages", () => {
    const agg = aggregateCompactFile(file)!;
    expect(agg.inscrits).toBe(150);
    expect(agg.votantsPourcent).toBeCloseTo(80, 5);
    expect(agg.candidates.map((c) => [c.nom, c.voix])).toEqual([["A", 58], ["B", 55]]);
    expect(agg.candidates[0].pourcentExprimes).toBeCloseTo((58 / 113) * 100, 5);
  });
  it("returns null for department-level or empty files", () => {
    expect(aggregateCompactFile({ ...file, niveau: "departement" })).toBeNull();
    expect(aggregateCompactFile({ ...file, rows: {} })).toBeNull();
  });
});

describe("share card", () => {
  it("builds data and draws without error on a canvas context", () => {
    const card = buildShareCardData({
      commune: "Nantes", year: 2022, round: 1, results: results(["Emmanuel", "MACRON", 30.5]), national,
      colorOf: () => "#3aa0ff", url: "https://presifrance.fr/commune/44109",
    })!;
    expect(card.winnerName).toBe("Emmanuel Macron");
    expect(card.top).toHaveLength(2);
    expect(card.nationalLine).toContain("73,7 %");
    const ctx = new Proxy({ measureText: () => ({ width: 100 }), createRadialGradient: () => ({ addColorStop: vi.fn() }), fillText: vi.fn() }, {
      get: (t, k) => (k in t ? (t as Record<string | symbol, unknown>)[k] : vi.fn()),
      set: () => true,
    }) as unknown as CanvasRenderingContext2D;
    expect(() => drawShareCard(ctx, card)).not.toThrow();
    expect(ctx.fillText).toHaveBeenCalledWith("Nantes", 64, 225);
  });
  it("returns null without a leader", () => {
    expect(buildShareCardData({ commune: "X", year: 2022, round: 1, results: { ...base, candidates: [] }, national: null, colorOf: () => "", url: "" })).toBeNull();
  });
});
