import { describe, expect, it } from "vitest";

import { buildDataset, parseFieldwork, parsePct, parseSample, slugify } from "./polls-2027.mjs";

const header = (names) =>
  `<tr><th rowspan="2">Polling firm</th><th rowspan="2">Fieldwork date</th><th rowspan="2">Sample size</th>${names
    .map((n) => `<th><div><a href="/wiki/x">${n}</a></div></th>`)
    .join("")}</tr><tr><th></th></tr>`;

const html = (rows) =>
  `<h2 id="First_round"></h2><table>${header(["Alice Un (LR)", "Bruno Deux"])}${rows}</table><h2 id="Second_round"></h2>`;

describe("build-polls-2027 parsing", () => {
  it("slugifies accented names", () => {
    expect(slugify("Édouard Philippe")).toBe("edouard_philippe");
  });

  it("parses percentages, markers and thresholds", () => {
    expect(parsePct("<b>17%</b>")).toBe(17);
    expect(parsePct("0.5%")).toBe(0.5);
    expect(parsePct("–")).toBeNull();
    expect(parsePct("&lt;0.5%")).toBe(0.25);
  });

  it("parses sample sizes with different thousand separators", () => {
    expect(parseSample("1,500")).toBe(1500);
    expect(parseSample("1.393")).toBe(1393);
    expect(parseSample("–")).toBeNull();
  });

  it("parses fieldwork ranges inside and across months", () => {
    expect(parseFieldwork('21–<span class="nowrap">22 Oct</span>&#32;2026')).toEqual({ start: "2026-10-21", end: "2026-10-22" });
    expect(parseFieldwork("28 Sep – 1 Oct 2026")).toEqual({ start: "2026-09-28", end: "2026-10-01" });
    expect(parseFieldwork("30 Dec 2025 – 2 Jan 2026")).toEqual({ start: "2025-12-30", end: "2026-01-02" });
    expect(parseFieldwork("30 Oct – 2 Nov 2026").start).toBe("2026-10-30");
    expect(parseFieldwork("garbage")).toBeNull();
  });

  it("groups rowspan rows into hypotheses of a single poll", () => {
    const rows = `
      <tr><td rowspan="2"><a class="external" href="https://example.org/notice">Ifop</a></td><td rowspan="2" data-sort-value="2026-10-22">21–22 Oct 2026</td><td rowspan="2">1,500</td><td>30%</td><td>20%</td></tr>
      <tr><td>31%</td><td>–</td></tr>
      <tr><td colspan="5">An event happened</td></tr>
      <tr><td>Elabe</td><td>1 Oct 2026</td><td>–</td><td>–</td><td>25%</td></tr>`;
    const { candidates, polls } = buildDataset(html(rows));
    expect(candidates.map((c) => c.label)).toEqual(["Alice Un", "Bruno Deux"]);
    expect(polls).toHaveLength(2);
    const elabe = polls[0];
    expect(elabe).toMatchObject({ pollster: "Elabe", sampleSize: null, noticeUrl: null, fieldworkEnd: "2026-10-01" });
    expect(elabe.hypotheses).toEqual([{ bruno_deux: 25 }]);
    const ifop = polls[1];
    expect(ifop).toMatchObject({ pollster: "Ifop", sampleSize: 1500, noticeUrl: "https://example.org/notice", fieldworkEnd: "2026-10-22" });
    expect(ifop.hypotheses).toEqual([
      { alice_un: 30, bruno_deux: 20 },
      { alice_un: 31 },
    ]);
  });

  it("fails clearly when the section is missing", () => {
    expect(() => buildDataset("<p>nothing</p>")).toThrow(/First round/);
  });
});
