import { describe, expect, it } from "vitest";

import { buildEmbedPath, buildEmbedUrl, buildIframeCode, isValidCommuneCode, parseEmbedRound, parseEmbedYear } from "./embed";

describe("embed helpers", () => {
  it("valide l'année et le tour avec repli", () => {
    expect(parseEmbedYear("2017")).toBe(2017);
    expect(parseEmbedYear("1999")).toBe(2022);
    expect(parseEmbedYear(null)).toBe(2022);
    expect(parseEmbedRound("2")).toBe(2);
    expect(parseEmbedRound("x")).toBe(1);
  });

  it("valide les codes commune INSEE", () => {
    expect(isValidCommuneCode("44109")).toBe(true);
    expect(isValidCommuneCode("2A004")).toBe(true);
    expect(isValidCommuneCode("4410")).toBe(false);
    expect(isValidCommuneCode("../x")).toBe(false);
    expect(isValidCommuneCode(undefined)).toBe(false);
  });

  it("construit les chemins d'embed", () => {
    expect(buildEmbedPath({ kind: "carte", year: 2022, round: 1 })).toBe("/embed/carte?year=2022&round=1");
    expect(buildEmbedPath({ kind: "commune", year: 2017, code: "2a004" })).toBe("/embed/commune/2A004?year=2017");
    expect(buildEmbedUrl({ kind: "carte", year: 2022 }, "https://presifrance.fr/")).toBe(
      "https://presifrance.fr/embed/carte?year=2022&round=1",
    );
  });

  it("génère un iframe accessible avec URL absolue et attributs échappés", () => {
    const html = buildIframeCode({ kind: "carte", year: 2022, height: 480 }, "https://presifrance.fr");
    expect(html).toContain('src="https://presifrance.fr/embed/carte?year=2022&amp;round=1"');
    expect(html).toContain('title="');
    expect(html).toContain('height="480"');
    expect(html).toContain('loading="lazy"');
  });
});
