// Pages /presidentielle-AAAA : tableau des résultats nationaux dans le HTML servi.
import { presidentialYearSummaries, presidentialYears } from "../../seo-routes.mjs";
import { buildYearPageBody } from "./years-content.mjs";
import { loadNational } from "./data.mjs";
import { candidateName, esc, fmtInt, fmtPct, link, page, table } from "./html.mjs";

const SOURCE =
  "Source : résultats officiels des élections présidentielles (ministère de l'Intérieur, Conseil constitutionnel ; données ouvertes data.gouv.fr). Pourcentages calculés sur les suffrages exprimés.";

function roundTable(year, round, data) {
  const rows = data.candidates.map((c) => [esc(candidateName(c.prenom, c.nom)), fmtInt(c.voix), fmtPct(c.pourcentExprimes)]);
  return `<section><h2>${round === 1 ? "Premier tour" : "Second tour"} de la présidentielle ${year}</h2>${
    data.participation != null ? `<p>Participation : ${fmtPct(data.participation)}.</p>` : ""
  }${table(`Résultats nationaux du ${round === 1 ? "premier" : "second"} tour ${year}`, ["Candidat", "Voix", "% des exprimés"], rows)}</section>`;
}

export function matchYear(path) {
  const m = /^\/presidentielle-(\d{4})$/.exec(path);
  return m && presidentialYears.includes(Number(m[1])) ? Number(m[1]) : null;
}

export function buildYearBody(year) {
  return buildYearPageBody(year) ?? buildBasicYearBody(year);
}

function buildBasicYearBody(year) {
  const summary = presidentialYearSummaries.find((s) => s.year === year);
  const national = loadNational()[year];
  const idx = presidentialYears.indexOf(year);
  const neighbours = [presidentialYears[idx + 1], presidentialYears[idx - 1]].filter(Boolean);
  const intro = summary
    ? `Résultats de l'élection présidentielle française de ${year} : ${esc(summary.winner)} est élu face à ${esc(summary.runnerUp)}. Cette page présente les scores nationaux de chaque candidat, la participation et mène aux résultats détaillés par département et par commune.`
    : `Résultats de l'élection présidentielle française de ${year} : scores nationaux de chaque candidat, participation et accès aux résultats par département et par commune.`;
  const sections = [
    national?.t1 ? roundTable(year, 1, national.t1) : "",
    national?.t2 ? roundTable(year, 2, national.t2) : "",
    `<section><h2>Poursuivre l'exploration</h2><ul><li>${link("/explorer", "Résultats par département et par commune")}</li><li>${link("/resultats-presidentielle", "Toutes les élections présidentielles")}</li>${neighbours
      .map((y) => `<li>${link(`/presidentielle-${y}`, `Présidentielle ${y}`)}</li>`)
      .join("")}</ul></section>`,
  ];
  return page({ h1: `Résultats de la présidentielle ${year}`, intro, sections, source: SOURCE });
}
