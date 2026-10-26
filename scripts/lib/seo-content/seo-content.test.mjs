// @vitest-environment node
import { describe, expect, it } from "vitest";

import { eligibleCommunes } from "./data.mjs";
import { formatSurname, wordCount } from "./html.mjs";
import { buildBody, generatedRoutes } from "./index.mjs";
import { seoPrerenderRoutes } from "../../seo-routes.mjs";

describe("seo content", () => {
  it("formats candidate surnames", () => {
    expect(formatSurname("DE GAULLE")).toBe("de Gaulle");
    expect(formatSurname("LE PEN")).toBe("Le Pen");
    expect(formatSurname("DUPONT-AIGNAN")).toBe("Dupont-Aignan");
  });

  it("generates one unique route and title per eligible commune", () => {
    const routes = generatedRoutes();
    expect(routes.length).toBe(eligibleCommunes().length);
    expect(routes.length).toBeGreaterThan(9000);
    expect(new Set(routes.map((r) => r.path)).size).toBe(routes.length);
    expect(new Set(routes.map((r) => r.title)).size).toBe(routes.length);
  });

  it("builds a commune page with H1, table and internal links", () => {
    const nantes = generatedRoutes().find((r) => r.path === "/commune/44109");
    expect(nantes.title).toBe("Résultats des élections à Nantes : présidentielles 1995-2022");
    const html = buildBody(nantes);
    expect(html.match(/<h1>/g)).toHaveLength(1);
    expect(html).toContain("<table>");
    expect(html).toContain('href="/explorer/44"');
    expect(wordCount(html)).toBeGreaterThanOrEqual(80);
  });

  it("gives every static route at least 80 visible words and one H1", () => {
    for (const route of seoPrerenderRoutes) {
      const html = buildBody(route);
      expect(html.match(/<h1>/g), route.path).toHaveLength(1);
      expect(wordCount(html), route.path).toBeGreaterThanOrEqual(80);
    }
  });

  it("builds the polls page with latest poll, average table, candidate links and FAQ", () => {
    const route = seoPrerenderRoutes.find((r) => r.path === "/sondages-presidentielle-2027");
    const html = buildBody(route);
    expect(html.match(/<h1>/g)).toHaveLength(1);
    expect(html).toContain("Sondage présidentielle 2027");
    expect(html).toContain("Dernier sondage de la présidentielle 2027");
    expect(html).toContain("Moyenne des sondages par candidat");
    expect(html).toContain('href="/presidentielle-2027/candidats/');
    expect(html).toContain("commission-des-sondages.fr");
    const ld = /<script type="application\/ld\+json">(.*?)<\/script>/s.exec(html);
    const data = JSON.parse(ld[1]);
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity.length).toBeGreaterThanOrEqual(4);
    expect(wordCount(html)).toBeGreaterThan(300);
  });
});
