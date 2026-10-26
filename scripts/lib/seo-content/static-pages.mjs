// Pages statiques, accueil, hubs, présidentielle 2027 et fiches candidats 2027.
// Contenu de base : les volets SEO 2-4 (fiches candidats, sondages, page 2027) l'enrichiront ici.
import {
  departmentCodes,
  departmentNames,
  presidentialYearSummaries,
} from "../../seo-routes.mjs";
import { eligibleCommunes, load2027 } from "./data.mjs";
import { esc, fmtInt, link, linkList, page, table } from "./html.mjs";

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

const STATUT = { declare: "Candidature déclarée", pressenti: "Candidature pressentie", retire: "Candidature retirée" };

const frDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return `${d === 1 ? "1er" : d} ${months[m - 1]} ${y}`;
};

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

function homeBody(route) {
  const communes = eligibleCommunes().length;
  const intro = `${esc(ABOUT)} Le site compte ${presidentialYearSummaries.length} élections présidentielles et ${fmtInt(communes)} fiches de communes de 1 000 habitants et plus.`;
  return page({
    h1: "PrésiFrance : présidentielle 2027 et résultats de 1965 à 2022",
    intro,
    sections: [
      `<section><h2>Les élections présidentielles depuis 1965</h2>${electionsList()}</section>`,
      exploreLinks(route.path),
    ],
    source: SOURCE_DATA,
  });
}

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

function presidentielle2027Body(route) {
  const { candidats, calendrier } = load2027();
  const events = calendrier.evenements.map((e) => {
    const when = e.date ? frDate(e.date) : "date à confirmer";
    return [esc(e.label), esc(when), e.statut === "officiel" ? "Officiel" : "À confirmer"];
  });
  const list = candidats.candidats
    .map((c) => `<li>${link(`/presidentielle-2027/candidats/${c.slug}`, `${c.prenom} ${c.nom}`)} : ${esc(STATUT[c.statut] ?? c.statut)}</li>`)
    .join("");
  return page({
    h1: "Présidentielle 2027 : candidats et calendrier",
    intro: `${esc(route.description)} ${esc(candidats.meta.avertissement)}`,
    sections: [
      `<section><h2>Calendrier du scrutin</h2>${table("Calendrier de la présidentielle 2027", ["Étape", "Date", "Statut"], events)}</section>`,
      `<section><h2>Candidats déclarés et pressentis (ordre alphabétique)</h2><ul>${list}</ul></section>`,
      exploreLinks(route.path),
    ],
    source: `Liste vérifiée le ${esc(frDate(candidats.meta.dateVerification))} à partir de sources de presse citées sur chaque fiche ; calendrier vérifié le ${esc(frDate(calendrier.meta.dateVerification))}.`,
  });
}

function candidate2027Body(route) {
  const c = load2027().candidats.candidats.find((x) => `/presidentielle-2027/candidats/${x.slug}` === route.path);
  const lines = [
    `Parti ou mouvement : ${esc(c.parti || "non renseigné")}.`,
    `Statut : ${esc((STATUT[c.statut] ?? c.statut).toLowerCase())}${c.dateDeclaration ? ` (date de déclaration : ${esc(frDate(c.dateDeclaration))})` : ""}.`,
  ];
  return page({
    h1: `${c.prenom} ${c.nom} : fiche candidat à la présidentielle 2027`,
    intro: `${esc(c.prenom)} ${esc(c.nom)} figure dans la liste des candidats déclarés et pressentis à l'élection présidentielle de 2027. Cette liste est établie à partir de sources de presse et n'a aucune valeur officielle : la liste officielle sera publiée par le Conseil constitutionnel après validation des parrainages.`,
    sections: [
      `<section><h2>Informations</h2><ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul></section>`,
      `<section><h2>Pour aller plus loin</h2><ul><li>${link("/presidentielle-2027", "Tous les candidats et le calendrier de la présidentielle 2027")}</li><li>${link("/sondages-presidentielle-2027", "Sondages de la présidentielle 2027")}</li><li>${link("/parrainages", "Parrainages présidentiels")}</li></ul></section>`,
    ],
    source: `Source : ${esc(c.sourceLabel)}. Vérifié le ${esc(frDate(c.dateVerification))}.`,
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
]);

export function buildStaticBody(route) {
  if (route.path.startsWith("/presidentielle-2027/candidats/")) return candidate2027Body(route);
  return (specific.get(route.path) ?? genericBody)(route);
}
