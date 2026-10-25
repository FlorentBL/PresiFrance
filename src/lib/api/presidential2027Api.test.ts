import { afterEach, describe, expect, it, vi } from "vitest";

import candidatsJson from "../../../public/data/presidential/2027/candidats.json";
import calendrierJson from "../../../public/data/presidential/2027/calendrier.json";
import {
  buildCandidateHistory,
  findCandidateBySlug,
  formatPartialDate,
  getCalendar2027,
  getCandidates2027,
  sortCandidatesAlphabetically,
} from "./presidential2027Api";

const files: Record<string, any> = { // eslint-disable-line @typescript-eslint/no-explicit-any
  "2027/candidats.json": candidatsJson,
  "2027/calendrier.json": calendrierJson,
};
const read = (f: string) => files[f];

describe("données présidentielle 2027", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("chaque candidat a un slug unique, une source https et une date de vérification", () => {
    const { candidats } = read("2027/candidats.json");
    expect(candidats.length).toBeGreaterThan(0);
    expect(new Set(candidats.map((c: { slug: string }) => c.slug)).size).toBe(candidats.length);
    for (const c of candidats) {
      expect(c.slug).toMatch(/^[a-z0-9-]+$/);
      expect(["declare", "pressenti", "retire"]).toContain(c.statut);
      expect(c.sourceUrl).toMatch(/^https:\/\//);
      expect(c.dateVerification).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(c.dateDeclaration === null || /^\d{4}-\d{2}(-\d{2})?$/.test(c.dateDeclaration)).toBe(true);
    }
  });

  it("le calendrier ne contient une date que pour les événements officiels sourcés", () => {
    const { evenements } = read("2027/calendrier.json");
    for (const e of evenements) {
      if (e.statut === "a_confirmer") expect(e.date).toBeNull();
      if (e.date) {
        expect(e.statut).toBe("officiel");
        expect(e.sourceUrl).toMatch(/^https:\/\//);
      }
    }
    expect(evenements.find((e: { id: string }) => e.id === "t1").date).toBe("2027-04-18");
    expect(evenements.find((e: { id: string }) => e.id === "t2").date).toBe("2027-05-02");
  });

  it("charge et trie les candidats par ordre alphabétique", async () => {
    const data = read("2027/candidats.json");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => data }));
    const res = await getCandidates2027();
    const noms = res.candidats.map((c) => `${c.nom} ${c.prenom}`);
    expect(noms).toEqual([...noms].sort((a, b) => a.localeCompare(b, "fr")));
    expect(findCandidateBySlug(res.candidats, res.candidats[0].slug)).toBe(res.candidats[0]);
    expect(findCandidateBySlug(res.candidats, "inconnu")).toBeUndefined();
  });

  it("échoue proprement si le fichier est indisponible", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(getCandidates2027()).rejects.toThrow();
    await expect(getCalendar2027()).rejects.toThrow();
  });

  it("formate les dates complètes, partielles et manquantes", () => {
    expect(formatPartialDate("2026-05-22")).toBe("22 mai 2026");
    expect(formatPartialDate("2026-09-01")).toBe("1er septembre 2026");
    expect(formatPartialDate("2026-04")).toBe("avril 2026");
    expect(formatPartialDate(null)).toBe("à confirmer");
  });

  it("retrouve l'historique par nom sans tenir compte des accents", () => {
    const national = {
      "2022": { t1: { candidates: [{ prenom: "Jean-Luc", nom: "MÉLENCHON", pourcentExprimes: 21.95, voix: 7712520 }] } },
    };
    expect(buildCandidateHistory({ prenom: "Jean-Luc", nom: "Mélenchon" }, national)).toEqual([
      { year: 2022, round: 1, pourcentExprimes: 21.95, voix: 7712520 },
    ]);
    expect(buildCandidateHistory({ prenom: "Gabriel", nom: "Attal" }, national)).toEqual([]);
  });

  it("trie sans muter l'entrée", () => {
    const input = [{ nom: "Zed", prenom: "A" }, { nom: "Abe", prenom: "B" }];
    expect(sortCandidatesAlphabetically(input)[0].nom).toBe("Abe");
    expect(input[0].nom).toBe("Zed");
  });
});
