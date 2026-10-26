import { describe, expect, it } from "vitest";

import { depensesCommuneUrl, depensesDepartementUrl, slugifyCommuneName } from "./partnerSites";

describe("liens DépensesPubliques.fr", () => {
  it("reprend la slugification du site partenaire", () => {
    expect(slugifyCommuneName("Saint-Ouen-sur-Seine")).toBe("saint-ouen-sur-seine");
    expect(slugifyCommuneName("L'Haÿ-les-Roses")).toBe("l-hay-les-roses");
    expect(slugifyCommuneName("Ajaccio")).toBe("ajaccio");
  });

  it("construit les URL commune et département", () => {
    expect(depensesCommuneUrl("Paris", "75056")).toBe("https://depensespubliques.fr/commune/paris-75056");
    expect(depensesCommuneUrl("Ajaccio", "2A004")).toBe("https://depensespubliques.fr/commune/ajaccio-2A004");
    expect(depensesDepartementUrl("971")).toBe("https://depensespubliques.fr/departement/971");
  });
});
