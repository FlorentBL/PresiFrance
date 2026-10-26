import { afterEach, describe, expect, it, vi } from "vitest";

import { getLiveCommunes, getLiveStatus, isLiveVisible, roundsWithResults, stateHeadline, type LiveRoundStatus, type LiveStatus } from "./live2027Api";

const round = (state: LiveRoundStatus["state"], c = 0): LiveRoundStatus => ({
  state, couvertureInscrits: c, communesCompletes: 0, communesTotal: 0, fetchedAt: "2027-04-18T20:30:00Z", source: { label: "x", url: null },
});

describe("live2027Api", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("n'affiche les liens que lorsqu'un tour a des résultats", () => {
    expect(isLiveVisible(undefined)).toBe(false);
    expect(isLiveVisible({ v: 1, election: 2027, current: null, rounds: {} })).toBe(false);
    expect(isLiveVisible({ v: 1, election: 2027, current: null, rounds: { t1: round("avenir") } })).toBe(false);
    expect(isLiveVisible({ v: 1, election: 2027, current: 1, rounds: { t1: round("partiel", 12) } })).toBe(true);
  });

  it("libellés d'état sans estimation", () => {
    expect(stateHeadline(round("partiel", 42.35))).toBe("Résultats partiels (42,4 % des inscrits)");
    expect(stateHeadline(round("complet-provisoire", 100))).toMatch(/provisoires complets/);
    expect(stateHeadline(round("definitif", 100))).toBe("Résultats définitifs");
  });

  it("liste les tours disponibles", () => {
    const s: LiveStatus = { v: 1, election: 2027, current: 2, rounds: { t1: round("definitif", 100), t2: round("partiel", 5) } };
    expect(roundsWithResults(s)).toEqual([1, 2]);
  });

  it("charge sans cache et tolère l'absence de communes", async () => {
    const fetchMock = vi.fn(async (url: string, _init?: RequestInit) =>
      url.includes("communes") ? new Response("", { status: 404 }) : new Response(JSON.stringify({ v: 1, rounds: {} }), { headers: { "content-type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    expect((await getLiveStatus()).v).toBe(1);
    expect(await getLiveCommunes(1, "75")).toBeNull();
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
  });
});
