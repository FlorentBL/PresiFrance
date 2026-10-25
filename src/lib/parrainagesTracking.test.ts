import { describe, expect, it } from "vitest";
import type { ParrainageEntry, ParrainagesSnapshot } from "@/lib/api/parrainagesApi";
import {
  computeProgress,
  formatIsoDate,
  historyRows,
  isPendingYear,
  lastDeltas,
  lastPublicationOf,
  resolveDefaultYear,
} from "./parrainagesTracking";

const entry = (dep: string | null, date = "01/02/2022"): ParrainageEntry => ({
  candidat: "X",
  dep,
  nom: "",
  prenom: "",
  mandat: "",
  circonscription: "",
  date,
});

describe("parrainagesTracking", () => {
  it("chooses 2027 only when data exists", () => {
    expect(resolveDefaultYear({ years: [2017, 2022] })).toBe(2022);
    expect(resolveDefaultYear({ years: [2017, 2022, 2027] })).toBe(2027);
    expect(resolveDefaultYear(undefined)).toBe(2022);
  });

  it("flags 2027 as pending when announced or absent from the manifest", () => {
    expect(isPendingYear({ years: [2022], sources: {}, pending: [2027] }, 2027)).toBe(true);
    expect(isPendingYear({ years: [2022], sources: {} }, 2027)).toBe(true);
    expect(isPendingYear({ years: [2022, 2027], sources: {} }, 2027)).toBe(false);
    expect(isPendingYear({ years: [2022], sources: {} }, 2017)).toBe(false);
  });

  it("applies the 500 / 30 departements / 50 per departement rule", () => {
    const entries = [
      ...Array.from({ length: 60 }, () => entry("Aisne")),
      ...Array.from({ length: 29 }, (_, i) => entry(`D${i}`)),
    ];
    const p = computeProgress("X", entries);
    expect(p).toMatchObject({ total: 89, departements: 30, maxInDepartement: 60, countedTotal: 79, reached: false, remaining: 421 });

    const enough = Array.from({ length: 35 }, (_, d) => Array.from({ length: 15 }, () => entry(`D${d}`))).flat();
    expect(computeProgress("Y", enough)).toMatchObject({ total: 525, countedTotal: 525, reached: true, remaining: 0 });

    const fewDeps = Array.from({ length: 10 }, (_, d) => Array.from({ length: 50 }, () => entry(`D${d}`))).flat();
    expect(computeProgress("Z", fewDeps).reached).toBe(false);
  });

  it("formats dates and finds the latest publication", () => {
    expect(formatIsoDate("2022-02-15")).toBe("15 février 2022");
    expect(formatIsoDate(null)).toBeNull();
    expect(lastPublicationOf([entry("A", "01/02/2022"), entry("A", "15/02/2022"), entry("A", "")])).toBe("2022-02-15");
    expect(lastPublicationOf([])).toBeNull();
  });

  it("computes history deltas, newest first, and per-candidate gains", () => {
    const history: ParrainagesSnapshot[] = [
      { publishedAt: "2027-01-01", recordedAt: "a", total: 10, candidats: 2, departements: 3, stats: [["A", 6, 2], ["B", 4, 1]] },
      { publishedAt: "2027-01-08", recordedAt: "b", total: 25, candidats: 3, departements: 5, stats: [["A", 10, 3], ["B", 4, 1], ["C", 11, 2]] },
    ];
    const rows = historyRows(history);
    expect(rows.map((r) => [r.publishedAt, r.total, r.delta])).toEqual([
      ["2027-01-08", 25, 15],
      ["2027-01-01", 10, 10],
    ]);
    expect(lastDeltas(history)).toEqual({ A: 4, B: 0, C: 11 });
    expect(lastDeltas(history.slice(0, 1))).toEqual({});
  });
});
