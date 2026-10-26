// Constructeur de contenu prérendu : un constructeur par type de route.
// Pour ajouter un type : créer un module exportant (match, build) et l'enregistrer dans `builders`.
import { buildCommuneBody, communeRoutes } from "./communes.mjs";
import { buildDepartmentBody, matchDepartment } from "./departments.mjs";
import { buildStaticBody } from "./static-pages.mjs";
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
