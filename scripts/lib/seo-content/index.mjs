// Constructeur de contenu prérendu : un constructeur par type de route.
// Pour ajouter un type : créer un module exportant (match, build) et l'enregistrer dans `builders`.
import { buildCandidate2027JsonLd, findCandidate } from "./candidate-2027.mjs";
import { buildCommuneBody, buildCommuneJsonLd, communeRoutes } from "./communes.mjs";
import { buildDepartmentBody, matchDepartment } from "./departments.mjs";
import { buildStaticBody } from "./static-pages.mjs";
import { yearsJsonLd } from "./years-content.mjs";
import { buildYearBody, matchYear } from "./years.mjs";

const builders = [
  { match: (route) => Boolean(route.commune), build: buildCommuneBody },
  { match: (route) => matchYear(route.path) !== null, build: (route) => buildYearBody(matchYear(route.path)) },
  { match: (route) => matchDepartment(route.path) !== null, build: (route) => buildDepartmentBody(matchDepartment(route.path)) },
];

/** HTML (<main>…) injecté dans #root pour la route ; React le remplace au montage. */
export function buildBody(route) {
  const builder = builders.find((b) => b.match(route));
  return builder ? builder.build(route) : buildStaticBody(route);
}

/** Routes générées à partir des données (fiches commune), en plus de seoPrerenderRoutes. */
export function generatedRoutes() {
  return communeRoutes();
}

function buildHomeJsonLd() {
  const siteUrl = String(process.env.SITE_URL || "https://presifrance.fr").replace(/\/+$/, "");
  return [
    { "@context": "https://schema.org", "@type": "WebSite", "@id": `${siteUrl}/#website`, name: "PrésiFrance", url: `${siteUrl}/`, inLanguage: "fr-FR" },
    { "@context": "https://schema.org", "@type": "Organization", "@id": `${siteUrl}/#organization`, name: "PrésiFrance", url: `${siteUrl}/`, logo: `${siteUrl}/logo.png` },
  ];
}

/** Objets JSON-LD (FAQPage…) à placer dans <head> pour la route ; [] si aucun. */
export function buildJsonLd(route) {
  if (route.path === "/") return buildHomeJsonLd();
  if (route.commune) return buildCommuneJsonLd(route);
  if (route.path.startsWith("/presidentielle-2027/candidats/") && findCandidate(route.path)) return buildCandidate2027JsonLd(route);
  return yearsJsonLd(route);
}
