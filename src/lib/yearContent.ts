import factsJson from "@/content/years-facts.json";
import type { NationalCandidateResult, NationalResult } from "@/lib/api/nationalResultsApi";
import type { FaqItem } from "@/lib/faq2027";

// Miroir de scripts/lib/seo-content/years-content.mjs et year-meta.mjs (HTML prérendu) : garder les textes identiques.
// yearContent.test.ts vérifie la parité. Aucun chiffre saisi à la main : tout vient de national-results.json et years-facts.json.

export type NationalByYear = Record<string, { t1?: NationalResult; t2?: NationalResult }>;
export interface YearFacts {
  candidatsT1: number;
  communeLevel: boolean;
  deps: string[];
}

export const YEAR_FACTS = factsJson.years as Record<string, YearFacts>;
export const TOP_COMMUNES = factsJson.topCommunes as { code: string; nom: string }[];

const nf = new Intl.NumberFormat("fr-FR");
const pf = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const fmtInt = (n: number) => nf.format(Math.round(n)).replace(/[\u202f\u00a0]/g, "\u00a0");
export const fmtPct = (n: number) => `${pf.format(n)}\u00a0%`;

export function formatSurname(nom: string) {
  return nom
    .toLocaleLowerCase("fr")
    .replace(/(^|[\s'’-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase("fr"))
    .replace(/(^| )(De|Du|Des)(?= )/g, (_, sp: string, w: string) => sp + w.toLowerCase())
    .replace(/(^| )D'/g, "$1d'");
}
export const candidateName = (c: { prenom: string; nom: string }) => `${c.prenom} ${formatSurname(c.nom)}`.trim();

const abst = (participation: number) => 100 - participation;
const plain = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const same = (a: NationalCandidateResult, b: NationalCandidateResult) => plain(a.nom) === plain(b.nom) && plain(a.prenom) === plain(b.prenom);

export const yearTitle = (year: number, winner: string) => `Résultats présidentielle ${year} : ${winner} élu`;
export const yearDescription = (year: number, winner: string, runnerUp: string) =>
  `Résultats de la présidentielle ${year} : ${winner} élu face à ${runnerUp}. Scores des 2 tours, participation, abstention, résultats par département.`;
export const HUB_TITLE = "Résultats présidentielle : toutes les élections de 1965 à 2022";
export const HUB_DESCRIPTION =
  "Résultats de toutes les présidentielles de 1965 à 2022 : élu, scores des 2 tours, participation, abstention, résultats par département et par commune.";

export interface YearSummary {
  year: number;
  t1: NationalResult;
  t2: NationalResult;
  winner: NationalCandidateResult;
  runnerUp: NationalCandidateResult;
  winnerT1?: NationalCandidateResult;
}

export function yearSummary(year: number, national: NationalByYear): YearSummary | null {
  const t1 = national[year]?.t1;
  const t2 = national[year]?.t2;
  if (!t1 || !t2 || t2.candidates.length < 2) return null;
  const [winner, runnerUp] = t2.candidates;
  return { year, t1, t2, winner, runnerUp, winnerT1: t1.candidates.find((c) => same(c, winner)) };
}

export const yearsAsc = (national: NationalByYear) =>
  Object.keys(national)
    .map(Number)
    .sort((a, b) => a - b);

export function yearFaq(year: number, national: NationalByYear, yf: YearFacts | undefined = YEAR_FACTS[year]): FaqItem[] {
  const s = yearSummary(year, national);
  if (!s) return [];
  const { t1, t2, winner, runnerUp, winnerT1 } = s;
  const name = candidateName;
  const faq: FaqItem[] = [];
  faq.push({
    q: `Qui a gagné l'élection présidentielle ${year} ?`,
    a: `${name(winner)} a été élu président de la République au 2nd tour de la présidentielle ${year}, avec ${fmtPct(winner.pourcentExprimes)} des suffrages exprimés (${fmtInt(winner.voix)} voix), face à ${name(runnerUp)} (${fmtPct(runnerUp.pourcentExprimes)}, ${fmtInt(runnerUp.voix)} voix).`,
  });
  const [first, second, third] = t1.candidates;
  const rest = [second, third].filter(Boolean).map((c) => `${name(c)} (${fmtPct(c.pourcentExprimes)})`);
  faq.push({
    q: `Quel score au 1er tour de la présidentielle ${year} ?`,
    a: `Au 1er tour, ${name(first)} est arrivé en tête avec ${fmtPct(first.pourcentExprimes)} des suffrages exprimés (${fmtInt(first.voix)} voix)${rest.length ? `, devant ${rest.join(" et ")}` : ""}.${
      winnerT1 ? ` ${name(winner)}, élu au 2nd tour, y avait obtenu ${fmtPct(winnerT1.pourcentExprimes)} (${fmtInt(winnerT1.voix)} voix).` : ""
    }`,
  });
  faq.push({
    q: `Quelle a été la participation à la présidentielle ${year} ?`,
    a: `La participation nationale a été de ${fmtPct(t1.participation)} au 1er tour (abstention : ${fmtPct(abst(t1.participation))}) et de ${fmtPct(t2.participation)} au 2nd tour (abstention : ${fmtPct(abst(t2.participation))}).`,
  });
  if (yf) {
    faq.push({
      q: `Combien de candidats se présentaient en ${year} ?`,
      a: `${yf.candidatsT1} candidats étaient en lice au 1er tour de la présidentielle ${year}. Les deux arrivés en tête, ${name(t2.candidates[0])} et ${name(t2.candidates[1])}, se sont affrontés au 2nd tour.`,
    });
    faq.push({
      q: `Où trouver les résultats de la présidentielle ${year} par département et par commune ?`,
      a: yf.communeLevel
        ? `PrésiFrance publie les résultats de ${year} département par département et commune par commune : choisissez un département dans la liste de cette page, puis une commune, pour voir les scores de chaque candidat, la participation et l'abstention locales.`
        : `PrésiFrance publie les résultats de ${year} département par département : choisissez un département dans la liste de cette page pour voir les scores de chaque candidat, la participation et l'abstention locales.`,
    });
  }
  return faq;
}

export function hubFaq(national: NationalByYear): FaqItem[] {
  const rows = yearsAsc(national)
    .map((y) => yearSummary(y, national))
    .filter((r): r is YearSummary => r !== null);
  if (rows.length === 0) return [];
  const name = candidateName;
  const last = rows[rows.length - 1];
  const high = rows.reduce((a, b) => (b.t1.participation > a.t1.participation ? b : a));
  const low = rows.reduce((a, b) => (b.t1.participation < a.t1.participation ? b : a));
  return [
    {
      q: "Qui a gagné les dernières élections présidentielles ?",
      a: `La dernière élection présidentielle dont les résultats sont publiés est celle de ${last.year} : ${name(last.winner)} l'a emportée au 2nd tour avec ${fmtPct(last.winner.pourcentExprimes)} des suffrages exprimés, face à ${name(last.runnerUp)} (${fmtPct(last.runnerUp.pourcentExprimes)}). ${rows
        .slice(-4, -1)
        .reverse()
        .map((r) => `En ${r.year}, ${name(r.winner)} avait été élu face à ${name(r.runnerUp)}.`)
        .join(" ")}`,
    },
    {
      q: "Combien d'élections présidentielles sont présentées sur PrésiFrance ?",
      a: `PrésiFrance présente les résultats de ${rows.length} élections présidentielles, de ${rows[0].year} à ${last.year}, avec les scores du 1er et du 2nd tour, la participation et l'abstention nationales. La présidentielle de 1965 est la première élue au suffrage universel direct sous la Ve République.`,
    },
    {
      q: "Quelle présidentielle a eu la participation la plus forte ?",
      a: `Au 1er tour, la participation la plus élevée est celle de ${high.year} (${fmtPct(high.t1.participation)}) et la plus faible celle de ${low.year} (${fmtPct(low.t1.participation)}), selon les résultats nationaux publiés par le ministère de l'Intérieur.`,
    },
    {
      q: "Comment est élu le président de la République ?",
      a: "Le Président de la République est élu au suffrage universel direct, au scrutin majoritaire à deux tours (article 7 de la Constitution). Est élu au 1er tour le candidat qui obtient la majorité absolue des suffrages exprimés. Sinon, un 2nd tour oppose les deux candidats arrivés en tête, deux semaines plus tard.",
    },
    {
      q: "Où trouver les résultats par département et par commune ?",
      a: "Choisissez une élection dans la liste de cette page, puis un département : PrésiFrance affiche les scores de chaque candidat, la participation et l'abstention, et donne accès aux communes du département.",
    },
  ];
}

export function yearIntro(year: number, national: NationalByYear, yf: YearFacts | undefined = YEAR_FACTS[year]): string | null {
  const s = yearSummary(year, national);
  if (!s || !yf) return null;
  const { t1, t2, winner, runnerUp } = s;
  return `${candidateName(winner)} a été élu président de la République lors de l'élection présidentielle de ${year}, avec ${fmtPct(winner.pourcentExprimes)} des suffrages exprimés au 2nd tour face à ${candidateName(runnerUp)} (${fmtPct(runnerUp.pourcentExprimes)}). ${yf.candidatsT1} candidats se présentaient au 1er tour, où la participation a été de ${fmtPct(t1.participation)} (abstention : ${fmtPct(abst(t1.participation))}) ; au 2nd tour, elle a été de ${fmtPct(t2.participation)} (abstention : ${fmtPct(abst(t2.participation))}).`;
}

export const abstention = abst;
