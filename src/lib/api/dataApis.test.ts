import { afterEach, describe, expect, it, vi } from "vitest";

import { getNationalResults } from "./nationalResultsApi";
import {
  getParrainagesByDep,
  getParrainagesByYear,
  getParrainagesManifest,
} from "./parrainagesApi";
import { buildSmoothedPollTrend, getPolls2022Round1, type PollsDataset } from "./pollsApi";

function mockFetchOnce(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(body),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("data API loaders", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads parrainages manifest and yearly datasets from public data URLs", async () => {
    const fetchMock = mockFetchOnce({ years: [2017, 2022], sources: { 2022: { total: 13000, candidats: 12 } } });

    await expect(getParrainagesManifest()).resolves.toEqual({
      years: [2017, 2022],
      sources: { 2022: { total: 13000, candidats: 12 } },
    });
    expect(fetchMock).toHaveBeenCalledWith("/data/parrainages/manifest.json");

    mockFetchOnce({ year: 2022, total: 1, candidats: [], stats: [], byCandidat: {} });
    await expect(getParrainagesByYear(2022)).resolves.toMatchObject({ year: 2022, total: 1 });

    mockFetchOnce({ "75": [{ candidat: "Candidate", count: 3 }] });
    await expect(getParrainagesByDep(2022)).resolves.toEqual({
      "75": [{ candidat: "Candidate", count: 3 }],
    });
  });

  it("returns null when national result data or round is missing", async () => {
    mockFetchOnce({
      "2022": {
        t1: { participation: 73.69, candidates: [{ prenom: "Emmanuel", nom: "Macron", voix: 9783058, pourcentExprimes: 27.85 }] },
      },
    });

    await expect(getNationalResults(2022, 1)).resolves.toMatchObject({ participation: 73.69 });

    mockFetchOnce({ "2022": {} });
    await expect(getNationalResults(2022, 2)).resolves.toBeNull();

    mockFetchOnce({}, false);
    await expect(getNationalResults(2022, 1)).resolves.toBeNull();
  });

  it("loads polls and builds weighted smoothed trends", async () => {
    const dataset: PollsDataset = {
      meta: {
        electionYear: 2022,
        round: 1,
        electionDate: "2022-04-03",
        sources: [],
      },
      candidates: [{ id: "macron", label: "Emmanuel Macron" }],
      polls: [
        { pollster: "A", fieldworkEnd: "2022-04-01", sampleSize: 1000, scores: { macron: 25 } },
        { pollster: "B", fieldworkEnd: "2022-04-02", sampleSize: 2000, scores: { macron: 28 } },
      ],
    };

    const fetchMock = mockFetchOnce(dataset);
    await expect(getPolls2022Round1()).resolves.toBe(dataset);
    expect(fetchMock).toHaveBeenCalledWith("/data/presidential/polls-2022-round1.json");

    const trend = buildSmoothedPollTrend(dataset, ["macron"], 2);

    expect(trend).toHaveLength(3);
    expect(trend[0].macron).toBe(25);
    expect(trend[1].macron).toBe(27);
    expect(trend[2].macron).toBe(28);
  });
});
