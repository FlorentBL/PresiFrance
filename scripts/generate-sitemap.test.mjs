// @vitest-environment node
import { describe, expect, it } from "vitest";

import { chunkSitemap, escapeXml, isoDate } from "./generate-sitemap.js";

describe("generate sitemap helpers", () => {
  it("escapes XML-sensitive characters in locations", () => {
    expect(escapeXml(`https://presifrance.fr/search?a=1&b="<x>"`)).toBe(
      "https://presifrance.fr/search?a=1&amp;b=&quot;&lt;x&gt;&quot;",
    );
  });

  it("removes milliseconds from ISO timestamps", () => {
    expect(isoDate(new Date("2026-06-01T10:20:30.456Z"))).toBe("2026-06-01T10:20:30Z");
  });

  it("splits long sitemap route lists into chunks", () => {
    const chunks = chunkSitemap([1, 2, 3, 4, 5], 2);

    expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
  });
});
