// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public/_headers", () => {
  const headers = readFileSync(new URL("../public/_headers", import.meta.url), "utf8");

  it("n'autorise l'iframe tierce que sur /embed/*", () => {
    expect(headers).toMatch(/^\/\*\n\s+Content-Security-Policy: frame-ancestors 'self'/m);
    const embed = headers.split(/^\/embed\/\*\n/m)[1] ?? "";
    expect(embed).toContain("! Content-Security-Policy");
    expect(embed).toContain("Content-Security-Policy: frame-ancestors *");
    expect(embed).toContain("X-Robots-Tag: noindex");
    expect(headers.indexOf("frame-ancestors 'self'")).toBeLessThan(headers.indexOf("\n/embed/*\n"));
  });
});
