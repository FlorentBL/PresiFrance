// Fiches /commune/<code> : routes, métadonnées et contenu prérendu (communes de 1 000 habitants et plus).
import { departmentNames } from "../../seo-routes.mjs";
import {
  SCRUTINS,
  communeDescription,
  communeScrutinsFaq,
  communeTitle,
  coverageLabel,
  coveredIds,
  leadSentence,
  summaryRows,
} from "../../../src/lib/scrutinsCore.mjs";
import { COMMUNE_YEARS, LATEST_YEAR, eligibleCommunes, loadResults, loadScrutins } from "./data.mjs";
import { candidateName, esc, fmtInt, fmtPct, link, page, table } from "./html.mjs";

const NEIGHBOURS = 6;
const SOURCE =
  "Sources : résultats officiels des élections présidentielles, législatives, européennes et municipales (ministère de l'Intérieur, données ouvertes data.gouv.fr), populations légales de l'INSEE via geo.api.gouv.fr.";


function distance(a, b) {
  const dx = (a.lon - b.lon) * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
  const dy = a.lat - b.lat;
  return dx * dx + dy * dy;
}

let ctxCache;
function context() {
  if (ctxCache) return ctxCache;
  const communes = eligibleCommunes();
  const nameCount = new Map();
  for (const c of communes) nameCount.set(c.nom, (nameCount.get(c.nom) ?? 0) + 1);
  const byDep = new Map();
  for (const c of communes) byDep.set(c.dep, [...(byDep.get(c.dep) ?? []), c]);
  ctxCache = { communes, nameCount, byDep };
  return ctxCache;
}

/** Nom d'affichage : suffixé du département quand le nom existe plusieurs fois (titres uniques). */
function displayName(c, nameCount) {
  return nameCount.get(c.nom) > 1 ? `${c.nom} (${c.dep})` : c.nom;
}

function leaderLine(result) {
  const [first, second] = result.candidates;
  return {
    first,
    second,
    firstPct: (first.voix / result.exprimes) * 100,
    secondPct: second ? (second.voix / result.exprimes) * 100 : null,
    turnout: (result.votants / result.inscrits) * 100,
  };
}

function leaderCell(result) {
  if (!result?.candidates?.length || !result.exprimes) return "—";
  const l = leaderLine(result);
  return `${esc(candidateName(l.first.prenom, l.first.nom))} (${fmtPct(l.firstPct)})`;
}

function summarySentences(name, years) {
  const r1 = years[LATEST_YEAR]?.[1];
  const r2 = years[LATEST_YEAR]?.[2];
  const parts = [];
  if (r1?.candidates?.length > 1) {
    const l = leaderLine(r1);
    parts.push(
      `Au premier tour de la présidentielle 2022, ${candidateName(l.first.prenom, l.first.nom)} arrive en tête à ${name} avec ${fmtPct(l.firstPct)} des suffrages exprimés, devant ${candidateName(l.second.prenom, l.second.nom)} (${fmtPct(l.secondPct)}). La participation y est de ${fmtPct(l.turnout)}.`,
    );
  }
  if (r2?.candidates?.length > 1) {
    const l = leaderLine(r2);
    parts.push(
      `Au second tour, ${candidateName(l.first.prenom, l.first.nom)} recueille ${fmtPct(l.firstPct)} des suffrages exprimés contre ${fmtPct(l.secondPct)} pour ${candidateName(l.second.prenom, l.second.nom)}, avec une participation de ${fmtPct(l.turnout)}.`,
    );
  }
  return parts;
}

const scrutinsOf = (code) => loadScrutins().byCommune.get(code);

/** Scrutins hors présidentielle d'une commune de la page : phrases du dernier tour de chaque scrutin et tableau de synthèse. */
function scrutinsSections(name, results) {
  const ids = coveredIds(results);
  if (!ids.length) return [];
  const sentences = SCRUTINS.filter((s) => ids.includes(s.id)).flatMap((s) => {
    const tour = [...s.tours].reverse().find((t) => results[s.id]?.[t]);
    return [`<p>${esc(leadSentence(s, tour, name, results[s.id][tour]))}</p>`];
  });
  const rows = summaryRows(results).map((r) => [esc(r.label), esc(r.lead), fmtPct(r.pct), fmtPct(r.participation)]);
  const faq = communeScrutinsFaq(name, results);
  return [
    `<section><h2>Législatives, européennes et municipales à ${esc(name)}</h2><p>${esc(`Résultats de ${name} aux ${coverageLabel(ids)}.`)}</p>${sentences.join("")}${table(
      `Liste ou nuance arrivée en tête à ${name}, par scrutin`,
      ["Scrutin", "En tête", "Part des exprimés", "Participation"],
      rows,
    )}</section>`,
    `<section><h2>Questions fréquentes sur les élections à ${esc(name)}</h2>${faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}</section>`,
  ];
}

export function communeRoutes() {
  const { communes, nameCount } = context();
  return communes.map((c) => {
    const name = displayName(c, nameCount);
    return {
      path: `/commune/${c.code}`,
      title: communeTitle(name),
      description: communeDescription(name, coveredIds(scrutinsOf(c.code))),
      commune: c,
    };
  });
}

/** JSON-LD FAQPage de la fiche (questions bâties sur les scrutins disponibles), [] si trop peu de données. */
export function buildCommuneJsonLd(route) {
  const { nameCount } = context();
  const faq = communeScrutinsFaq(displayName(route.commune, nameCount), scrutinsOf(route.commune.code));
  if (faq.length < 2) return [];
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];
}

export function buildCommuneBody(route) {
  const { nameCount, byDep, communes } = context();
  const c = route.commune;
  const { byCommune } = loadResults();
  const years = byCommune.get(c.code);
  const name = displayName(c, nameCount);
  const depName = departmentNames[c.dep] ?? c.dep;

  const rows = [...COMMUNE_YEARS].reverse().map((y) => {
    const r1 = years[y]?.[1];
    const r2 = years[y]?.[2];
    return [
      String(y),
      leaderCell(r1),
      leaderCell(r2),
      r1?.inscrits ? fmtPct((r1.votants / r1.inscrits) * 100) : "—",
    ];
  });

  const sameDep = (byDep.get(c.dep) ?? []).filter((n) => n.code !== c.code);
  const pool = sameDep.length >= NEIGHBOURS ? sameDep : communes.filter((n) => n.code !== c.code && n.dep === c.dep);
  const neighbours = pool.sort((a, b) => distance(c, a) - distance(c, b)).slice(0, NEIGHBOURS);

  const results = scrutinsOf(c.code);
  const coverage = coverageLabel(coveredIds(results));
  const intro = `${esc(name)} est une commune du département ${esc(depName)} (code INSEE ${esc(c.code)}) qui compte ${fmtInt(c.population)} habitants. Cette page rassemble les résultats de l'élection présidentielle dans la commune de 1995 à 2022${coverage ? ` et ceux des ${esc(coverage)}` : ""} : candidat ou liste arrivé en tête à chaque tour, part des suffrages exprimés et participation.`;
  const summary = summarySentences(name, years).map((s) => `<p>${esc(s)}</p>`).join("");

  const sections = [
    `<section><h2>Résultats de la présidentielle 2022 à ${esc(name)}</h2>${summary}</section>`,
    `<section><h2>Les présidentielles de 1995 à 2022 à ${esc(name)}</h2>${table(
      `Candidat arrivé en tête à ${name}, par élection présidentielle`,
      ["Année", "En tête au 1er tour", "En tête au 2ᵉ tour", "Participation au 1er tour"],
      rows,
    )}</section>`,
    `<section><h2>Explorer autour de ${esc(name)}</h2><ul><li>${link(`/explorer/${c.dep}`, `Communes du département ${depName}`)}</li>${neighbours
      .map((n) => `<li>${link(`/commune/${n.code}`, `Résultats des élections à ${displayName(n, nameCount)}`)}</li>`)
      .join("")}<li>${link("/presidentielle-2022", "Résultats nationaux de la présidentielle 2022")}</li></ul></section>`,
  ];
  sections.splice(2, 0, ...scrutinsSections(name, results));
  return page({ h1: communeTitle(name), intro, sections, source: SOURCE });
}
