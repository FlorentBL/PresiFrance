// Pages statiques, accueil, hubs, présidentielle 2027 et fiches candidats 2027.
// Contenu de base : les volets SEO 2-4 (fiches candidats, sondages, page 2027) l'enrichiront ici.
import {
  departmentCodes,
  departmentNames,
  presidentialYearSummaries,
} from "../../seo-routes.mjs";
import { eligibleCommunes } from "./data.mjs";
import { buildSondagesBody } from "./sondages.mjs";
import { buildCandidate2027Body } from "./candidate-2027.mjs";
import { esc, fmtInt, link, linkList, page, table } from "./html.mjs";
import { homeBody, presidentielle2027Body } from "./page-2027.mjs";

const SOURCE_DATA =
  "Sources : résultats officiels des élections présidentielles (ministère de l'Intérieur, Conseil constitutionnel, données ouvertes data.gouv.fr) ; communes : geo.api.gouv.fr.";

const MAIN_LINKS = [
  ["/presidentielle-2027", "Présidentielle 2027 : candidats et calendrier"],
  ["/sondages-presidentielle-2027", "Sondages de la présidentielle 2027"],
  ["/resultats-presidentielle", "Résultats de toutes les présidentielles"],
  ["/explorer", "Résultats par département et par commune"],
  ["/parrainages", "Parrainages présidentiels"],
  ["/comparer", "Comparer deux communes"],
];

function electionsList() {
  return `<ul>${presidentialYearSummaries
    .map((s) => `<li>${link(`/presidentielle-${s.year}`, `Présidentielle ${s.year}`)} : ${esc(s.winner)} élu face à ${esc(s.runnerUp)}</li>`)
    .join("")}</ul>`;
}

function exploreLinks(selfPath) {
  return `<section><h2>Explorer PrésiFrance</h2>${linkList(MAIN_LINKS.filter(([href]) => href !== selfPath))}</section>`;
}

const ABOUT =
  "PrésiFrance réunit en données ouvertes les résultats de toutes les élections présidentielles françaises, de 1965 à 2022, avec le détail par département et par commune lorsqu'il est publié, ainsi que le suivi de la présidentielle de 2027 : candidats, sondages et parrainages.";

function resultsHubBody(route) {
  return page({
    h1: "Résultats des élections présidentielles françaises",
    intro: `${esc(route.description)} Choisissez une élection pour afficher les scores nationaux, puis descendez au département et à la commune.`,
    sections: [`<section><h2>Toutes les élections présidentielles</h2>${electionsList()}</section>`, exploreLinks(route.path)],
    source: SOURCE_DATA,
  });
}

function exploreBody(route) {
  const items = departmentCodes.map((c) => [`/explorer/${c}`, `${departmentNames[c]} (${c})`]);
  return page({
    h1: "Résultats de la présidentielle par département et par commune",
    intro: `${esc(route.description)} Sélectionnez un département pour consulter ses résultats et la liste de ses communes.`,
    sections: [`<section><h2>Les départements</h2>${linkList(items)}</section>`, exploreLinks(route.path)],
    source: SOURCE_DATA,
  });
}

function genericBody(route) {
  const h1 = route.title.replace(/\s+[—:-]\s+PrésiFrance$/, "");
  return page({
    h1,
    intro: `${esc(route.description)} ${esc(ABOUT)}`,
    sections: [exploreLinks(route.path)],
    source: SOURCE_DATA,
  });
}

const specific = new Map([
  ["/", homeBody],
  ["/resultats-presidentielle", resultsHubBody],
  ["/explorer", exploreBody],
  ["/presidentielle-2027", presidentielle2027Body],
  ["/sondages-presidentielle-2027", buildSondagesBody],
]);

export function buildStaticBody(route) {
  if (route.path.startsWith("/presidentielle-2027/candidats/")) return buildCandidate2027Body(route);
  return (specific.get(route.path) ?? genericBody)(route);
}
