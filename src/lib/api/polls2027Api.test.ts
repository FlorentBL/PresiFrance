// @vitest-environment node
// @ts-expect-error module .mjs du prérendu sans déclaration de types
import { averages as prerenderAverages } from "../../../scripts/lib/seo-content/sondages.mjs";
import realDataset from "../../../public/data/presidential/polls-2027-round1.json";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  averageAt,
  averagesByCandidate,
  buildTrend,
  getPolls2027Round1,
  hypothesisKey,
  listScenarios,
  marginOfError,
  selectScores,
  type Polls2027Dataset,
} from "./polls2027Api";

const dataset: Polls2027Dataset = {
  meta: {
    electionYear: 2027,
    round: 1,
    generatedAt: "2026-10-25",
    latestFieldworkEnd: "2026-10-20",
    sources: [],
  },
  candidates: [
    { id: "a", label: "Alice Un" },
    { id: "b", label: "Bruno Deux" },
    { id: "c", label: "Claire Trois" },
  ],
  polls: [
    {
      id: "p1",
      pollster: "Ifop",
      fieldworkStart: "2026-10-01",
      fieldworkEnd: "2026-10-02",
      sampleSize: 1000,
      noticeUrl: "https://example.org/p1",
      hypotheses: [
        { a: 30, b: 20 },
        { a: 32, b: 18, c: 10 },
      ],
    },
    {
      id: "p2",
      pollster: "Elabe",
      fieldworkStart: "2026-10-10",
      fieldworkEnd: "2026-10-12",
      sampleSize: 3000,
      noticeUrl: null,
      hypotheses: [{ a: 34, b: 22 }],
    },
    {
      id: "p3",
      pollster: "Odoxa",
      fieldworkStart: "2026-10-18",
      fieldworkEnd: "2026-10-20",
      sampleSize: null,
      noticeUrl: null,
      hypotheses: [{ a: 31, b: 19 }],
    },
  ],
};

describe("polls 2027", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the dataset from the public data URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(dataset) });
    vi.stubGlobal("fetch", fetchMock);
    await expect(getPolls2027Round1()).resolves.toEqual(dataset);
    expect(fetchMock).toHaveBeenCalledWith("/data/presidential/polls-2027-round1.json");
  });

  it("rejects when the dataset cannot be loaded", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(getPolls2027Round1()).rejects.toThrow();
  });

  it("builds a stable key per tested candidate list", () => {
    expect(hypothesisKey({ b: 1, a: 2 })).toBe("a|b");
  });

  it("groups hypotheses by candidate list and counts distinct polls", () => {
    const scenarios = listScenarios(dataset, 1);
    expect(scenarios[0]).toEqual({ key: "a|b", ids: ["a", "b"], pollCount: 3 });
    expect(scenarios.find((s) => s.key === "a|b|c")?.pollCount).toBe(1);
    expect(listScenarios(dataset, 2).map((s) => s.key)).toEqual(["a|b"]);
  });

  it("averages hypotheses per candidate when no scenario is selected", () => {
    const [first] = selectScores(dataset, null);
    expect(first.scores.a).toBe(31);
    expect(first.scores.b).toBe(19);
    expect(first.scores.c).toBe(10);
  });

  it("keeps only the matching hypothesis when a scenario is selected", () => {
    const entries = selectScores(dataset, "a|b");
    expect(entries).toHaveLength(3);
    expect(entries[0].scores).toEqual({ a: 30, b: 20 });
    expect(selectScores(dataset, "a|b|c")).toHaveLength(1);
  });

  it("weights polls by sample size and counts only polls testing the candidate", () => {
    const entries = selectScores(dataset, null);
    const a = averageAt(entries, "a", "2026-10-12", 30);
    expect(a?.pollCount).toBe(2);
    expect(a?.value).toBe(33.3);
    const c = averageAt(entries, "c", "2026-10-20", 30);
    expect(c).toMatchObject({ value: 10, pollCount: 1 });
    expect(averageAt(entries, "c", "2026-09-01", 30)).toBeNull();
  });

  it("only uses polls inside the sliding window", () => {
    const entries = selectScores(dataset, null);
    expect(averageAt(entries, "a", "2026-10-20", 5)).toMatchObject({ value: 31, pollCount: 1 });
    expect(averagesByCandidate(entries, ["a", "c"], "2026-10-20", 5)).not.toHaveProperty("c");
  });

  it("computes the 95% margin of error from the sample size", () => {
    expect(marginOfError(50, 1000)).toBe(3.1);
    expect(marginOfError(20, 1500)).toBe(2);
    expect(marginOfError(20, null)).toBeNull();
  });

  it("builds a trend ending on the requested date", () => {
    const entries = selectScores(dataset, "a|b");
    const rows = buildTrend(entries, ["a"], 10, "2026-10-01", "2026-10-20", 7);
    expect(rows[0].date).toBe("2026-10-01");
    expect(rows[rows.length - 1].date).toBe("2026-10-20");
    expect(rows[rows.length - 1].a).toBeDefined();
    expect(rows.every((r, i) => i === 0 || r.date > rows[i - 1].date)).toBe(true);
  });

  it("matches the averages computed for the prerendered page", () => {
    const real = realDataset as unknown as Polls2027Dataset;
    const to = real.meta.latestFieldworkEnd as string;
    const entries = selectScores(real, null);
    const ids = [...new Set(entries.flatMap((e) => Object.keys(e.scores)))];
    const expected = averagesByCandidate(entries, ids, to, 30);
    const actual = prerenderAverages(real) as Map<string, unknown>;
    expect(actual.size).toBe(Object.keys(expected).length);
    for (const [id, a] of Object.entries(expected)) expect(actual.get(id)).toEqual(a);
  });
});
