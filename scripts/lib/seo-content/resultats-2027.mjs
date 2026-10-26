// Page /presidentielle-2027/resultats : contenu prérendu. Le HTML décrit l'état connu au build
// (« à venir » tant que public/data/live-2027/status.json n'a aucun tour publié) ; React affiche ensuite
// les résultats en direct, rechargés toutes les minutes.
import { readFileSync } from "node:fs";
import { frDate } from "./faq2027.mjs";
import { load2027 } from "./data.mjs";
import { esc, link, page } from "./html.mjs";

function readStatus() {
  try {
    return JSON.parse(readFileSync(new URL("../../../public/data/live-2027/status.json", import.meta.url), "utf8"));
  } catch {
    return { rounds: {} };
  }
}

const LABELS = {
  partiel: (s) => `résultats partiels (${String(s.couvertureInscrits).replace(".", ",")} % des inscrits)`,
  "complet-provisoire": () => "résultats provisoires complets, en attente de la proclamation officielle",
  definitif: () => "résultats définitifs",
};

export function buildResultats2027Body(route) {
  const { calendrier } = load2027();
  const t1 = calendrier.evenements.find((e) => e.id === "t1");
  const t2 = calendrier.evenements.find((e) => e.id === "t2");
  const rounds = Object.entries(readStatus().rounds ?? {}).filter(([, r]) => r.state !== "avenir");
  const dates = t1?.date && t2?.date ? ` Le 1er tour a lieu le ${esc(frDate(t1.date))} et le 2nd tour le ${esc(frDate(t2.date))}.` : "";
  const state = rounds.length
    ? `<ul>${rounds
        .map(([k, r]) => `<li>${k === "t1" ? "1er tour" : "2nd tour"} : ${esc(LABELS[r.state](r))}, relevé le ${esc(new Date(r.fetchedAt).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }))} (heure de Paris).</li>`)
        .join("")}</ul>`
    : "<p>Résultats à venir : aucun résultat n'est encore publié. Cette page affichera les résultats provisoires dès leur diffusion par le ministère de l'Intérieur, le soir du scrutin.</p>";
  return page({
    h1: "Présidentielle 2027 : résultats en direct",
    intro: `${esc(route.description)}${dates} Aucune estimation n'est présentée comme un résultat : seuls les décomptes publiés sont repris, avec leur horodatage et leur source.`,
    sections: [
      `<section><h2>État des résultats</h2>${state}</section>`,
      `<section><h2>Comment lire cette page</h2><p>Les résultats sont d'abord partiels : le pourcentage affiché correspond à la part des inscrits des communes dont le décompte est terminé. Ils deviennent provisoires complets quand toutes les communes ont terminé, puis définitifs après la proclamation par le Conseil constitutionnel. Les niveaux national, département et commune sont disponibles.</p></section>`,
      `<section><h2>Autour de la présidentielle 2027</h2><ul><li>${link("/presidentielle-2027", "Présidentielle 2027 : date, candidats et calendrier")}</li><li>${link("/sondages-presidentielle-2027", "Sondages de la présidentielle 2027")}</li><li>${link("/presidentielle-2022", "Résultats de la présidentielle 2022")}</li></ul></section>`,
    ],
    source: "Source des résultats en direct : ministère de l'Intérieur, résultats de la soirée électorale (open data, Licence Ouverte 2.0).",
  });
}
