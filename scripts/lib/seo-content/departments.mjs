// Pages /explorer/<code> : tableau des résultats du département dans le HTML servi.
import { departmentNames, getDepartmentIntro } from "../../seo-routes.mjs";
import { COMMUNE_YEARS, LATEST_YEAR, eligibleCommunes, loadResults } from "./data.mjs";
import { candidateName, esc, fmtInt, fmtPct, link, page, table } from "./html.mjs";

const TOP_COMMUNES = 30;
const SOURCE =
  "Source : résultats officiels des élections présidentielles par commune (ministère de l'Intérieur, données ouvertes data.gouv.fr), additionnés pour le département. Les communes sans résultat publié sont exclues des totaux.";

function ranking(agg) {
  const list = [...agg.voix.entries()].map(([k, voix]) => {
    const [prenom, nom] = k.split("|");
    return { prenom, nom, voix };
  });
  return list.sort((a, b) => b.voix - a.voix);
}

function roundSection(name, year, round, agg) {
  const rows = ranking(agg).map((c) => [esc(candidateName(c.prenom, c.nom)), fmtInt(c.voix), fmtPct((c.voix / agg.exprimes) * 100)]);
  return `<section><h2>${round === 1 ? "Premier tour" : "Second tour"} de la présidentielle ${year} : ${esc(name)}</h2><p>Participation : ${fmtPct(
    (agg.votants / agg.inscrits) * 100,
  )} (${fmtInt(agg.votants)} votants pour ${fmtInt(agg.inscrits)} inscrits, ${fmtInt(agg.communes)} communes).</p>${table(
    `Résultats ${round === 1 ? "du premier" : "du second"} tour ${year} dans le département ${name}`,
    ["Candidat", "Voix", "% des exprimés"],
    rows,
  )}</section>`;
}

export function matchDepartment(path) {
  const m = /^\/explorer\/([0-9AB]{2,3})$/.exec(path);
  return m ? m[1] : null;
}

export function buildDepartmentBody(code) {
  const name = departmentNames[code] ?? code;
  const aggs = loadResults().byDepartment.get(code) ?? {};
  const sections = [];

  const latest = aggs[LATEST_YEAR];
  if (latest?.[1]?.exprimes) sections.push(roundSection(name, LATEST_YEAR, 1, latest[1]));
  if (latest?.[2]?.exprimes) sections.push(roundSection(name, LATEST_YEAR, 2, latest[2]));

  const leaderRows = [...COMMUNE_YEARS].reverse().flatMap((y) => {
    const a1 = aggs[y]?.[1];
    const a2 = aggs[y]?.[2];
    if (!a1?.exprimes) return [];
    const cell = (a) => {
      const [top] = a ? ranking(a) : [];
      if (!top || !a.exprimes) return "—";
      return `${esc(candidateName(top.prenom, top.nom))} (${fmtPct((top.voix / a.exprimes) * 100)})`;
    };
    return [[String(y), cell(a1), cell(a2)]];
  });
  if (leaderRows.length) {
    sections.push(
      `<section><h2>Candidat arrivé en tête depuis 1995 : ${esc(name)}</h2>${table(
        `Candidat arrivé en tête dans le département ${name}`,
        ["Année", "1er tour", "2ᵉ tour"],
        leaderRows,
      )}</section>`,
    );
  }

  const communes = eligibleCommunes()
    .filter((c) => c.dep === code)
    .sort((a, b) => b.population - a.population)
    .slice(0, TOP_COMMUNES);
  if (communes.length) {
    sections.push(
      `<section><h2>Principales communes de ${esc(name)}</h2><ul>${communes
        .map((c) => `<li>${link(`/commune/${c.code}`, `Résultats des élections à ${c.nom}`)} (${fmtInt(c.population)} habitants)</li>`)
        .join("")}</ul></section>`,
    );
  }
  sections.push(
    `<section><h2>Poursuivre l'exploration</h2><ul><li>${link("/explorer", "Tous les départements")}</li><li>${link("/presidentielle-2022", "Résultats nationaux de la présidentielle 2022")}</li></ul></section>`,
  );
  return page({ h1: `Résultats de la présidentielle : ${name}`, intro: esc(getDepartmentIntro(code)), sections, source: SOURCE });
}
