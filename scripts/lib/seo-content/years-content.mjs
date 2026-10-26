// Textes des pages /presidentielle-AAAA et /resultats-presidentielle : synthèse, FAQ et JSON-LD FAQPage.
// Tous les chiffres viennent de national-results.json et de years-facts ; aucun n'est saisi à la main.
// Miroir TypeScript : src/lib/yearContent.ts (yearContent.test.ts vérifie la parité) : modifier les deux ensemble.
import { departmentNames, presidentialYears } from "../../seo-routes.mjs";
import { loadNational } from "./data.mjs";
import { computeYearFacts } from "./year-facts.mjs";
import { candidateName, esc, fmtInt, fmtPct, link, linkList, page, table } from "./html.mjs";

const SITE_URL = String(process.env.SITE_URL || "https://presifrance.fr").replace(/\/+$/, "");
export const SOURCE =
  "Source : résultats officiels des élections présidentielles (ministère de l'Intérieur, Conseil constitutionnel ; données ouvertes data.gouv.fr). Pourcentages calculés sur les suffrages exprimés.";

let factsCache;
const facts = () => (factsCache ??= computeYearFacts());

export const yearsAsc = () => [...presidentialYears].sort((a, b) => a - b);
export const roundLabel = (r) => (r === 1 ? "1er tour" : "2nd tour");
const name = (c) => candidateName(c.prenom, c.nom);
const abst = (participation) => 100 - participation;
const plain = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const sameCandidate = (a, b) => plain(a.nom) === plain(b.nom) && plain(a.prenom) === plain(b.prenom);

/** Données d'une année : élu, finaliste, scores des deux tours. null si le 2nd tour manque. */
export function yearSummary(year, national = loadNational()) {
  const t1 = national[year]?.t1;
  const t2 = national[year]?.t2;
  if (!t1 || !t2 || t2.candidates.length < 2) return null;
  const [winner, runnerUp] = t2.candidates;
  return { year, t1, t2, winner, runnerUp, winnerT1: t1.candidates.find((c) => sameCandidate(c, winner)) };
}

/** @returns {{ q: string, a: string }[]} réponses en texte brut. */
export function yearFaq(year, national = loadNational(), yf = facts().years[year]) {
  const s = yearSummary(year, national);
  if (!s) return [];
  const { t1, t2, winner, runnerUp, winnerT1 } = s;
  const faq = [];
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

/** FAQ du hub /resultats-presidentielle : synthèse de toutes les élections. */
export function hubFaq(national = loadNational()) {
  const rows = yearsAsc().map((y) => yearSummary(y, national)).filter(Boolean);
  if (rows.length === 0) return [];
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

export function faqJsonLd(path, faq) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${SITE_URL}${path}#faq`,
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];
}

// ---------- HTML ----------

function roundSection(year, round, data) {
  const rows = data.candidates.map((c) => [esc(name(c)), fmtInt(c.voix), fmtPct(c.pourcentExprimes)]);
  return `<section><h2>Résultats du ${roundLabel(round)} de la présidentielle ${year}</h2><p>Participation : ${fmtPct(data.participation)} ; abstention : ${fmtPct(abst(data.participation))}.</p>${table(
    `Résultats nationaux du ${roundLabel(round)} ${year}`,
    ["Candidat", "Voix", "% des exprimés"],
    rows,
  )}</section>`;
}

function topCommunesLinks() {
  return `<section><h2>Résultats dans les grandes communes</h2><p>Les résultats des présidentielles sont aussi consultables dans les plus grandes communes de France :</p>${linkList(
    facts().topCommunes.map((c) => [`/commune/${c.code}`, `Résultats à ${c.nom}`]),
  )}</section>`;
}

function faqSection(faq) {
  return `<section><h2>Questions fréquentes</h2>${faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}</section>`;
}

function otherYears(year) {
  return `<section><h2>Les autres élections présidentielles</h2>${linkList(
    yearsAsc()
      .filter((y) => y !== year)
      .map((y) => [`/presidentielle-${y}`, `Résultats de la présidentielle ${y}`]),
  )}<p>${link("/resultats-presidentielle", "Toutes les élections présidentielles")}</p></section>`;
}

export function buildYearPageBody(year) {
  const s = yearSummary(year);
  const yf = facts().years[year];
  if (!s || !yf) return null;
  const { t1, t2, winner, runnerUp } = s;
  const intro = `${esc(name(winner))} a été élu président de la République lors de l'élection présidentielle de ${year}, avec ${fmtPct(winner.pourcentExprimes)} des suffrages exprimés au 2nd tour face à ${esc(name(runnerUp))} (${fmtPct(runnerUp.pourcentExprimes)}). ${yf.candidatsT1} candidats se présentaient au 1er tour, où la participation a été de ${fmtPct(t1.participation)} (abstention : ${fmtPct(abst(t1.participation))}) ; au 2nd tour, elle a été de ${fmtPct(t2.participation)} (abstention : ${fmtPct(abst(t2.participation))}).`;
  const depLinks = yf.deps.map((c) => [`/explorer/${c}`, `${departmentNames[c]} (${c})`]);
  const faq = yearFaq(year, undefined, yf);
  const sections = [
    roundSection(year, 1, t1),
    roundSection(year, 2, t2),
    `<section><h2>Résultats de la présidentielle ${year} par département</h2><p>Choisissez un département pour afficher les scores des candidats, la participation et l'abstention locales.</p>${linkList(depLinks)}</section>`,
    topCommunesLinks(),
    faqSection(faq),
    otherYears(year),
  ];
  return page({ h1: `Résultats de l'élection présidentielle ${year}`, intro, sections, source: esc(SOURCE) });
}

export function buildHubBody(route) {
  const rows = yearsAsc().map((y) => yearSummary(y)).filter(Boolean).reverse();
  const tableRows = rows.map((r) => [
    link(`/presidentielle-${r.year}`, String(r.year)),
    esc(name(r.winner)),
    fmtPct(r.winner.pourcentExprimes),
    esc(name(r.runnerUp)),
    fmtPct(r.runnerUp.pourcentExprimes),
    fmtPct(r.t1.participation),
    fmtPct(r.t2.participation),
    String(facts().years[r.year]?.candidatsT1 ?? ""),
  ]);
  const faq = hubFaq();
  const sections = [
    `<section><h2>Résultats de chaque élection présidentielle</h2>${table(
      "Élu, finaliste, participation et nombre de candidats par présidentielle",
      ["Année", "Élu", "Score au 2nd tour", "Finaliste", "Score du finaliste", "Participation 1er tour", "Participation 2nd tour", "Candidats au 1er tour"],
      tableRows,
    )}</section>`,
    `<section><h2>Résultats par année</h2>${linkList(rows.map((r) => [`/presidentielle-${r.year}`, `Résultats de la présidentielle ${r.year} : ${name(r.winner)} élu`]))}</section>`,
    `<section><h2>Résultats par département et par commune</h2><p>${link("/explorer", "Parcourez tous les départements")} pour consulter les résultats locaux, ou ${link("/resultats-presidentielle-par-commune", "recherchez une commune")}.</p>${linkList(
      ["75", "13", "69", "31", "06", "44", "34", "67", "33", "59"].map((c) => [`/explorer/${c}`, `${departmentNames[c]} (${c})`]),
    )}</section>`,
    topCommunesLinks(),
    faqSection(faq),
  ];
  const intro = `${esc(route.description)} Choisissez une élection pour afficher les scores nationaux du 1er et du 2nd tour, puis descendez au département et à la commune.`;
  return page({ h1: "Résultats de l'élection présidentielle en France, de 1965 à 2022", intro, sections, source: esc(SOURCE) });
}

export function yearsJsonLd(route) {
  const m = /^\/presidentielle-(\d{4})$/.exec(route.path);
  if (m) {
    const faq = yearFaq(Number(m[1]));
    return faq.length ? faqJsonLd(route.path, faq) : [];
  }
  if (route.path === "/resultats-presidentielle") return faqJsonLd(route.path, hubFaq());
  return [];
}
