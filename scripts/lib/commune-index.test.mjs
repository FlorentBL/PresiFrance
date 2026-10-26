// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildCommuneShards, depOfCode } from "./commune-index.mjs";

describe("index des communes (Worker)", () => {
  const shards = buildCommuneShards();

  it("couvre les communes de métropole et d'outre-mer avec résultats", () => {
    expect(shards.get("01").r["01001"][0]).toBe("L'Abergement-Clémenciat");
    expect(shards.get("971").r["97101"]).toBeDefined();
    expect(shards.get("976").r["97601"]).toBeDefined();
    expect([...shards.values()].reduce((n, s) => n + Object.keys(s.r).length, 0)).toBeGreaterThan(35000);
  });

  it("résume le 1er tour 2022 : index des deux premiers candidats et leurs voix", () => {
    const shard = shards.get("01");
    const [, inscrits, votants, exprimes, i1, v1, i2, v2] = shard.r["01001"];
    expect(inscrits).toBeGreaterThan(votants);
    expect(votants).toBeGreaterThan(exprimes);
    expect(v1).toBeGreaterThanOrEqual(v2);
    expect(shard.c[i1]).toBeTypeOf("string");
    expect(shard.c[i2]).toBeTypeOf("string");
  });

  it("ne garde ni l'étranger ni les collectivités d'outre-mer, et suffixe les noms en double", () => {
    expect([...shards.keys()].some((d) => d.startsWith("98") || d.startsWith("99"))).toBe(false);
    const names = new Map();
    for (const shard of shards.values()) for (const row of Object.values(shard.r)) names.set(row[0], (names.get(row[0]) ?? 0) + 1);
    expect([...names.values()].every((n) => n === 1)).toBe(true);
  });

  it("déduit le département du code INSEE", () => {
    expect(depOfCode("01001")).toBe("01");
    expect(depOfCode("2A004")).toBe("2A");
    expect(depOfCode("97101")).toBe("971");
  });
});
