import { describe, expect, it } from "vitest";

import {
  departmentRoutes,
  getDepartmentIntro,
  seoPrerenderRoutes,
  presidentialYearRoutes,
  staticRoutes,
} from "./seo-routes.mjs";

describe("seo routes", () => {
  it("exposes strategic static hubs before generated commune URLs", () => {
    expect(staticRoutes).toContain("/");
    expect(staticRoutes).toContain("/resultats-presidentielle");
    expect(staticRoutes).toContain("/resultats-presidentielle-par-commune");
    expect(staticRoutes).toContain("/carte-presidentielle");
    expect(staticRoutes).toContain("/participation-presidentielle");
    expect(staticRoutes).toContain("/abstention-presidentielle");
    expect(staticRoutes).toContain("/presidentielle-2022");
    expect(staticRoutes).toContain("/explorer");
  });

  it("lists department hub routes for sitemap discovery", () => {
    expect(departmentRoutes).toContain("/explorer/75");
    expect(departmentRoutes).toContain("/explorer/971");
    expect(departmentRoutes.length).toBeGreaterThan(95);
  });

  it("lists presidential year hubs in reverse chronological order", () => {
    expect(presidentialYearRoutes.slice(0, 3)).toEqual([
      "/presidentielle-2022",
      "/presidentielle-2017",
      "/presidentielle-2012",
    ]);
  });

  it("prepares route-specific HTML metadata for strategic SEO routes", () => {
    const parisDepartment = seoPrerenderRoutes.find((route) => route.path === "/explorer/75");
    const presidential2022 = seoPrerenderRoutes.find((route) => route.path === "/presidentielle-2022");
    const communeConnector = seoPrerenderRoutes.find((route) => route.path === "/resultats-presidentielle-par-commune");
    const mapConnector = seoPrerenderRoutes.find((route) => route.path === "/carte-presidentielle");
    const turnoutConnector = seoPrerenderRoutes.find((route) => route.path === "/participation-presidentielle");
    const abstentionConnector = seoPrerenderRoutes.find((route) => route.path === "/abstention-presidentielle");

    expect(parisDepartment?.title).toContain("Paris");
    expect(parisDepartment?.title).not.toContain("le Paris");
    expect(parisDepartment?.description).toContain("communes");
    expect(parisDepartment?.description).not.toContain("du Paris");
    expect(presidential2022?.title).toContain("2022");
    expect(communeConnector?.title).toContain("par commune");
    expect(communeConnector?.description).toContain("commune");
    expect(mapConnector?.title).toContain("Carte");
    expect(turnoutConnector?.description).toContain("participation");
    expect(abstentionConnector?.description).toContain("abstention");
    expect(seoPrerenderRoutes.length).toBeGreaterThan(110);
  });

  it("creates useful department intros with source and commune intent", () => {
    const intro = getDepartmentIntro("75");

    expect(intro).toContain("Paris");
    expect(intro).toContain("commune");
    expect(intro).toContain("données officielles");
    expect(intro.length).toBeGreaterThan(240);
  });

  it("indexes /integrer and keeps embeds out of sitemap and prerender", () => {
    expect(staticRoutes).toContain("/integrer");
    expect(seoPrerenderRoutes.some((route) => route.path === "/integrer")).toBe(true);
    expect([...staticRoutes, ...seoPrerenderRoutes.map((r) => r.path)].some((p) => p.startsWith("/embed"))).toBe(false);
  });
});
