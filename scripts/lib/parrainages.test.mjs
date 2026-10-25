// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { appendSnapshot, buildParrainages, parseFrDate, resolveSource, snapshotOf } from "./parrainages.mjs";

const sample = readFileSync(new URL("../fixtures/parrainages-sample-2022.csv", import.meta.url), "utf-8");

describe("build-parrainages lib", () => {
  it("parses the 2022 CSV format from the sample file", () => {
    const d = buildParrainages(2027, sample);
    expect(d.total).toBe(6);
    expect(d.candidats).toEqual(["TESTEUR Candidat A", "TESTEUR Candidat B"]);
    expect(d.departements).toBe(4);
    expect(d.lastPublication).toBe("2022-02-15");
    expect(d.stats).toEqual([
      { candidat: "TESTEUR Candidat A", total: 3, departements: 2 },
      { candidat: "TESTEUR Candidat B", total: 3, departements: 2 },
    ]);
    expect(d.byDep.Rhône["TESTEUR Candidat B"]).toBe(2);
  });

  it("returns null without content and handles BOM / comma separator", () => {
    expect(buildParrainages(2027, "")).toBeNull();
    const d = buildParrainages(2027, "﻿Nom,Département,Candidat,Date de publication\nA,Ain,Z,03/03/2027\n");
    expect(d.total).toBe(1);
    expect(d.lastPublication).toBe("2027-03-03");
  });

  it("parses dates", () => {
    expect(parseFrDate("5/3/2027")).toBe("2027-03-05");
    expect(parseFrDate("2027-03-05T10:00")).toBe("2027-03-05");
    expect(parseFrDate("n/a")).toBeNull();
  });

  it("only appends a snapshot when the publication changed", () => {
    const d = buildParrainages(2027, sample);
    const s1 = snapshotOf(d, "2027-01-01T00:00:00Z");
    const first = appendSnapshot([], s1);
    expect(first.added).toBe(true);
    expect(appendSnapshot(first.history, snapshotOf(d, "2027-01-02T00:00:00Z")).added).toBe(false);
    const more = buildParrainages(2027, sample + "M.;X;Y;Maire;C;Ain;TESTEUR Candidat A;22/02/2022\n");
    const second = appendSnapshot(first.history, snapshotOf(more, "2027-01-03T00:00:00Z"));
    expect(second.added).toBe(true);
    expect(second.history).toHaveLength(2);
  });

  it("resolves the source with CLI > env > default", () => {
    const defaults = { 2027: { path: "/d.csv", url: null } };
    expect(resolveSource(2027, defaults)).toMatchObject({ path: "/d.csv", url: null });
    expect(resolveSource(2027, defaults, { env: { PARRAINAGES_2027_URL: "https://e" } }).url).toBe("https://e");
    expect(resolveSource(2027, defaults, { env: { PARRAINAGES_2027_URL: "https://e" }, args: { url: "https://c" } }).url).toBe("https://c");
  });
});
