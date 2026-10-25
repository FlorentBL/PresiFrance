import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain ESM build helper without type declarations
import { encodeDepResults } from "../../../scripts/lib/compact-results.mjs";
import { decodeCompactRow, type CompactDepFile } from "./compactResults";
import paris2022 from "../../../public/data/presidential/2022/t1/75.json";

const sample = {
  "44109": {
    codeDepartement: "44",
    nomDepartement: "Loire-Atlantique",
    codeCommune: "44109",
    nomCommune: "Nantes",
    inscrits: 200,
    abstentions: 50,
    votants: 150,
    blancs: 6,
    nuls: 4,
    exprimes: 140,
    candidates: [
      { nom: "B", prenom: "Bob", voix: 90 },
      { nom: "A", prenom: "Alice", voix: 50 },
    ],
  },
  "44001": {
    codeDepartement: "44",
    nomDepartement: "Loire-Atlantique",
    codeCommune: "44001",
    nomCommune: "Abbaretz",
    inscrits: 10,
    abstentions: 0,
    votants: 10,
    blancs: 0,
    nuls: 0,
    exprimes: 10,
    candidates: [{ nom: "A", prenom: "Alice", voix: 10 }],
  },
};

describe("compact department results", () => {
  it("round-trips counts and recomputes percentages", () => {
    const file = JSON.parse(JSON.stringify(encodeDepResults(sample))) as CompactDepFile;
    const nantes = decodeCompactRow(file, "44109")!;
    expect(nantes.nomCommune).toBe("Nantes");
    expect(nantes.nomDepartement).toBe("Loire-Atlantique");
    expect(nantes.votantsPourcent).toBe(75);
    expect(nantes.candidates.map((c) => [c.nom, c.voix])).toEqual([["B", 90], ["A", 50]]);
    expect(nantes.candidates[1].pourcentExprimes).toBeCloseTo(35.71, 2);

    const abbaretz = decodeCompactRow(file, "44001")!;
    expect(abbaretz.candidates).toHaveLength(1);
    expect(decodeCompactRow(file, "99999")).toBeNull();
  });

  it("decodes the shipped Paris 2022 first-round file", () => {
    const file = paris2022 as unknown as CompactDepFile;
    expect(file.v).toBe(1);
    const paris = decodeCompactRow(file, "75056")!;
    expect(paris.candidates).toHaveLength(12);
    expect(paris.candidates[0].nom).toBe("MACRON");
  });
});
