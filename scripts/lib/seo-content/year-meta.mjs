// Titres et descriptions des pages /presidentielle-AAAA et /resultats-presidentielle (sans le suffixe « — PrésiFrance »).
// Aucun import : utilisable depuis seo-routes.mjs. Miroir TypeScript : src/lib/yearContent.ts.
export const yearTitle = (year, winner) => `Résultats présidentielle ${year} : ${winner} élu`;
export const yearDescription = (year, winner, runnerUp) =>
  `Résultats de la présidentielle ${year} : ${winner} élu face à ${runnerUp}. Scores des 2 tours, participation, abstention, résultats par département.`;

export const HUB_TITLE = "Résultats présidentielle : toutes les élections de 1965 à 2022";
export const HUB_DESCRIPTION =
  "Résultats de toutes les présidentielles de 1965 à 2022 : élu, scores des 2 tours, participation, abstention, résultats par département et par commune.";

