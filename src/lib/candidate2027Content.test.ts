// @vitest-environment node
import { describe, expect, it } from "vitest";

// @ts-expect-error module .mjs sans déclaration de types
import { candidateFaq as faqMjs, historyOf, relatedCandidates as relatedMjs, sponsorshipOf as sponsorshipMjs, summarizePolls as pollsMjs } from "../../scripts/lib/seo-content/candidate-2027.mjs";
import candidatsJson from "../../public/data/presidential/2027/candidats.json";
import nationalJson from "../../public/data/presidential/national-results.json";
import pollsJson from "../../public/data/presidential/polls-2027-round1.json";
import type { Polls2027Dataset } from "@/lib/api/polls2027Api";
import { buildCandidateHistory, type Candidate2027 } from "@/lib/api/presidential2027Api";
import { candidateFaq, relatedCandidates, sponsorshipOf, summarizePolls } from "./candidate2027Content";

const candidates = candidatsJson.candidats as Candidate2027[];
const polls = pollsJson as unknown as Polls2027Dataset;

describe("fiche candidat 2027 : parité entre le HTML prérendu et la page React", () => {
  it("produit la même FAQ, les mêmes sondages et les mêmes liens pour chaque candidat", () => {
    for (const c of candidates) {
      const history = buildCandidateHistory(c, nationalJson as never);
      expect(historyOf(c).map((h: { year: number; round: number }) => `${h.year}-${h.round}`), c.slug).toEqual(
        history.map((h) => `${h.year}-${h.round}`),
      );
      const ts = candidateFaq(c, { polls: summarizePolls(c, polls), history, sponsorship: sponsorshipOf(c, null) });
      const mjs = faqMjs(c, { polls: pollsMjs(c), history: historyOf(c), sponsorship: sponsorshipMjs(c, null) });
      expect(ts, c.slug).toEqual(mjs);
      const a = relatedCandidates(c, candidates, polls);
      const b = relatedMjs(c, candidates, polls);
      expect(a.byPolls.map((x) => x.slug), c.slug).toEqual(b.byPolls.map((x: { slug: string }) => x.slug));
      expect(a.neighbours.map((x) => x.slug), c.slug).toEqual(b.neighbours.map((x: { slug: string }) => x.slug));
    }
  });

  it("donne le message « aucun sondage » à un candidat qui n'est testé nulle part", () => {
    const untested = candidates.find((c) => summarizePolls(c, polls).pollCount === 0);
    expect(untested).toBeDefined();
    const faq = candidateFaq(untested!, { polls: summarizePolls(untested!, polls), history: [], sponsorship: { published: false } });
    expect(faq[1].a).toMatch(/Aucun des sondages/);
  });

  it("calcule les parrainages 2027 depuis le format du Conseil constitutionnel", () => {
    const data = { stats: [{ candidat: "LE PEN Marine", total: 500, departements: 70 }, { candidat: "ARTHAUD Nathalie", total: 3, departements: 2 }] };
    const lePen = candidates.find((c) => c.slug === "marine-le-pen")!;
    expect(sponsorshipOf(lePen, data)).toMatchObject({ published: true, total: 500, departements: 70 });
    expect(sponsorshipMjs(lePen, data)).toMatchObject({ published: true, total: 500, departements: 70 });
    expect(sponsorshipOf(candidates.find((c) => c.slug === "gabriel-attal")!, data)).toMatchObject({ published: true, total: 0 });
  });
});
