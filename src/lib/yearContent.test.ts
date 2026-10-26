// @vitest-environment node
import { describe, expect, it } from "vitest";

import nationalJson from "../../public/data/presidential/national-results.json";
// @ts-expect-error module .mjs sans déclaration de types
import { computeYearFacts } from "../../scripts/lib/seo-content/year-facts.mjs";
// @ts-expect-error module .mjs sans déclaration de types
import { hubFaq as hubMjs, yearFaq as faqMjs } from "../../scripts/lib/seo-content/years-content.mjs";
// @ts-expect-error module .mjs sans déclaration de types
import * as metaMjs from "../../scripts/lib/seo-content/year-meta.mjs";
import { HUB_DESCRIPTION, HUB_TITLE, YEAR_FACTS, hubFaq, yearDescription, yearFaq, yearTitle, type NationalByYear } from "./yearContent";

const national = nationalJson as unknown as NationalByYear;

describe("pages de résultats historiques : parité entre le HTML prérendu et la page React", () => {
  it("produit la même FAQ pour chaque année et pour le hub", () => {
    for (const year of Object.keys(national).map(Number)) {
      const faq = yearFaq(year, national);
      expect(faq.length, String(year)).toBeGreaterThanOrEqual(5);
      expect(faq, String(year)).toEqual(faqMjs(year, national, YEAR_FACTS[year]));
    }
    expect(hubFaq(national)).toEqual(hubMjs(national));
  });

  it("produit les mêmes titres et descriptions", () => {
    expect(yearTitle(2022, "Emmanuel Macron")).toBe(metaMjs.yearTitle(2022, "Emmanuel Macron"));
    expect(yearDescription(2022, "A", "B")).toBe(metaMjs.yearDescription(2022, "A", "B"));
    expect(HUB_TITLE).toBe(metaMjs.HUB_TITLE);
    expect(HUB_DESCRIPTION).toBe(metaMjs.HUB_DESCRIPTION);
  });

  it("réutilise des faits identiques à ceux calculés depuis public/data", () => {
    expect(YEAR_FACTS).toEqual(JSON.parse(JSON.stringify(computeYearFacts().years)));
  });
});
