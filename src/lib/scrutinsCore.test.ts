import { describe, expect, it } from "vitest";

import {
  aggregateScrutinFile,
  communeDescription,
  communeScrutinsFaq,
  coverageLabel,
  decodeScrutinRow,
  leadSentence,
  scrutinById,
  summaryRows,
  type ScrutinFile,
  type ScrutinResults,
} from "./scrutinsCore.mjs";

const nuanceFile: ScrutinFile = {
  v: 1,
  scrutin: "legislatives-2024",
  tour: 1,
  kind: "nuance",
  entries: [["RN", "Rassemblement national"], ["UG", "Union de la gauche"], ["ENS", "Ensemble (majorité présidentielle)"]],
  rows: { "01001": ["Alpha", 1000, 400, 600, 10, 10, 580, 300, 200, 80], "01002": ["Beta", 500, 200, 300, 5, 5, 290, null, 190, 100] },
};

const localFile: ScrutinFile = {
  v: 1,
  scrutin: "municipales-2026",
  tour: 1,
  kind: "local",
  rows: {
    "01004": ["Gamma", 2000, 800, 1200, 20, 20, 1160, [["UNIS POUR GAMMA", "LDVD", 700, 20, "Daniel FABRE"], ["GAMMA CITOYENNE", "LDVG", 460, 7, "Anne MARTIN"]]],
    "01005": ["Delta", 1500, 500, 1000, 10, 10, 980, [["DELTA 2026", "LDVD", 500, 20, "Paul DURAND"], ["DELTA DEMAIN", "", 480, 9, "Luc PETIT"]]],
  },
};

describe("scrutinsCore", () => {
  it("décode une ligne de nuances, triée par voix avec pourcentages sur les exprimés", () => {
    const r = decodeScrutinRow(nuanceFile, "01001")!;
    expect(r.lines.map((l) => l.key)).toEqual(["RN", "UG", "ENS"]);
    expect(r.lines[0].pct).toBeCloseTo((300 / 580) * 100);
    expect(r.participation).toBeCloseTo(60);
    expect(decodeScrutinRow(nuanceFile, "99999")).toBeNull();
  });

  it("ignore les voix absentes et additionne les communes d'un département", () => {
    const agg = aggregateScrutinFile(nuanceFile);
    expect(agg.communes).toBe(2);
    expect(agg.exprimes).toBe(870);
    expect(agg.lines.find((l) => l.key === "RN")!.voix).toBe(300);
    expect(agg.lines.find((l) => l.key === "UG")!.voix).toBe(390);
  });

  it("regroupe les listes municipales par nuance à l'échelle du département", () => {
    const agg = aggregateScrutinFile(localFile);
    const keys = agg.lines.map((l) => l.label);
    expect(agg.lines[0].voix).toBe(1200);
    expect(keys).toContain("Sans étiquette");
    expect(keys).toContain("Liste divers droite");
  });

  it("lit les listes locales avec tête de liste et nuance", () => {
    const r = decodeScrutinRow(localFile, "01004")!;
    expect(r.lines[0]).toMatchObject({ label: "UNIS POUR GAMMA", detail: "Daniel Fabre", nuance: "LDVD", sieges: 20 });
  });

  it("formule la phrase de synthèse et la couverture", () => {
    const r = decodeScrutinRow(nuanceFile, "01001")!;
    const sentence = leadSentence(scrutinById("legislatives-2024")!, 1, "Alpha", r);
    expect(sentence).toContain("Aux législatives 2024 (premier tour)");
    expect(sentence).toContain("Rassemblement national");
    expect(sentence).toContain("à Alpha");
    expect(coverageLabel(["municipales-2026", "legislatives-2022", "legislatives-2024", "europeennes-2019"])).toBe(
      "législatives 2022 et 2024, européennes 2019 et municipales 2026",
    );
    expect(communeDescription("Alpha", [])).not.toContain("législatives");
  });

  it("n'invente pas de réponses quand aucun scrutin n'est disponible", () => {
    expect(communeScrutinsFaq("Alpha", {})).toEqual([]);
    const results: ScrutinResults = {
      "legislatives-2024": { 1: decodeScrutinRow(nuanceFile, "01001") },
      "municipales-2026": { 1: decodeScrutinRow(localFile, "01004") },
    };
    const faq = communeScrutinsFaq("Alpha", results);
    expect(faq.length).toBeGreaterThanOrEqual(4);
    expect(faq.some((f) => f.q.includes("municipales 2026"))).toBe(true);
    expect(faq.every((f) => !f.a.includes("undefined"))).toBe(true);
    expect(summaryRows(results)).toHaveLength(2);
  });
});
