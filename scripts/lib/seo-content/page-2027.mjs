// Page /presidentielle-2027 et accueil : contenu prérendu (volet SEO 4).
import { presidentialYearSummaries } from "../../seo-routes.mjs";
import { eligibleCommunes, load2027 } from "./data.mjs";
import { buildFaq2027, frDate } from "./faq2027.mjs";
import { readFileSync } from "node:fs";
import { esc, fmtInt, link, page, table } from "./html.mjs";

/** Vrai si un tour a déjà des résultats publiés (public/data/live-2027/status.json) : le lien n'apparaît qu'alors. */
export function liveResultsVisible() {
  try {
    const status = JSON.parse(readFileSync(new URL("../../../public/data/live-2027/status.json", import.meta.url), "utf8"));
    return Object.values(status.rounds ?? {}).some((r) => r.state !== "avenir");
  } catch {
    return false;
  }
}

const LIVE_LINK = ["/presidentielle-2027/resultats", "Résultats en direct de la présidentielle 2027"];

const GROUPS = [
  ["declare", "Candidats déclarés"],
  ["pressenti", "Personnalités pressenties"],
  ["retire", "Candidatures retirées"],
];

const byName = (a, b) => a.nom.localeCompare(b.nom, "fr") || a.prenom.localeCompare(b.prenom, "fr");

function faqSection(faq) {
  const items = faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("");
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  // « < » échappé pour ne jamais fermer la balise script depuis une donnée.
  const json = JSON.stringify(ld).replaceAll("<", "\\u003c");
  return `<section><h2>Questions fréquentes</h2>${items}<script type="application/ld+json">${json}</script></section>`;
}

export function presidentielle2027Body() {
  const { candidats, calendrier } = load2027();
  const t1 = calendrier.evenements.find((e) => e.id === "t1");
  const t2 = calendrier.evenements.find((e) => e.id === "t2");

  const intro =
    t1?.date && t2?.date
      ? `L'élection présidentielle 2027 aura lieu le dimanche ${esc(frDate(t1.date))} pour le 1er tour et le dimanche ${esc(frDate(t2.date))} pour le 2nd tour (source : ${esc(t1.sourceLabel)}). Retrouvez ici les candidats déclarés, pressentis et retirés, le calendrier du scrutin, des réponses aux questions fréquentes et l'accès aux sondages, aux parrainages et aux résultats de votre commune.`
      : "Retrouvez ici les candidats déclarés, pressentis et retirés à l'élection présidentielle 2027, le calendrier du scrutin et l'accès aux sondages, aux parrainages et aux résultats de votre commune.";

  const events = calendrier.evenements.map((e) => [
    esc(e.label),
    esc(e.date ? frDate(e.date) : "date à confirmer"),
    e.statut === "officiel" ? "Officiel" : "À confirmer",
  ]);

  const groups = GROUPS.map(([statut, titre]) => {
    const list = candidats.candidats.filter((c) => c.statut === statut).sort(byName);
    if (!list.length) return "";
    const items = list
      .map((c) => {
        const detail = [c.parti, statut !== "retire" && c.dateDeclaration ? `déclaration : ${frDate(c.dateDeclaration)}` : null, statut === "retire" ? c.note : null]
          .filter(Boolean)
          .map(esc)
          .join(" · ");
        return `<li>${link(`/presidentielle-2027/candidats/${c.slug}`, `${c.prenom} ${c.nom}`)}${detail ? ` : ${detail}` : ""}</li>`;
      })
      .join("");
    return `<h3>${esc(titre)} (${list.length})</h3><ul>${items}</ul>`;
  }).join("");

  const more = `<section><h2>Suivre la campagne</h2><ul>
${liveResultsVisible() ? `<li>${link(...LIVE_LINK)}</li>\n` : ""}<li>${link("/sondages-presidentielle-2027", "Sondages de la présidentielle 2027")}</li>
<li>${link("/parrainages?year=2027", "Parrainages de la présidentielle 2027")}</li>
<li>${link("/resultats-presidentielle-par-commune", "Résultats de la présidentielle par commune")}</li>
<li>${link("/presidentielle-2022", "Résultats de la présidentielle 2022")}</li>
<li>${link("/presidentielle-2017", "Résultats de la présidentielle 2017")}</li>
</ul></section>`;

  return page({
    h1: "Présidentielle 2027 : date, candidats et calendrier",
    intro,
    sections: [
      `<section><h2>Les dates du scrutin</h2>${table("Calendrier de la présidentielle 2027", ["Étape", "Date", "Statut"], events)}</section>`,
      `<section><h2>Candidats à la présidentielle 2027</h2><p>${esc(candidats.meta.avertissement)}</p>${groups}</section>`,
      faqSection(buildFaq2027(candidats, calendrier)),
      more,
    ],
    source: `Liste vérifiée le ${esc(frDate(candidats.meta.dateVerification))} à partir de sources de presse citées sur chaque fiche ; calendrier vérifié le ${esc(frDate(calendrier.meta.dateVerification))}.`,
  });
}

export function homeBody() {
  const { candidats, calendrier } = load2027();
  const t1 = calendrier.evenements.find((e) => e.id === "t1");
  const t2 = calendrier.evenements.find((e) => e.id === "t2");
  const communes = eligibleCommunes().length;
  const dates =
    t1?.date && t2?.date
      ? ` Le 1er tour de la présidentielle 2027 aura lieu le ${esc(frDate(t1.date))} et le 2nd tour le ${esc(frDate(t2.date))}.`
      : "";
  const declared = candidats.candidats.filter((c) => c.statut === "declare").length;

  const elections = `<ul>${presidentialYearSummaries
    .map((s) => `<li>${link(`/presidentielle-${s.year}`, `Présidentielle ${s.year}`)} : ${esc(s.winner)} élu face à ${esc(s.runnerUp)}</li>`)
    .join("")}</ul>`;

  return page({
    h1: "Élection présidentielle en France : 2027 et résultats de 1965 à 2022",
    intro: `PrésiFrance réunit en données ouvertes l'élection présidentielle en France : le suivi de la présidentielle 2027 (candidats, sondages, parrainages) et les résultats de ${presidentialYearSummaries.length} élections présidentielles, de 1965 à 2022, par département et par commune.${dates}`,
    sections: [
      `<section><h2>Comment a voté ma commune ?</h2><p>Recherchez une commune pour afficher ses résultats à chaque présidentielle : scores des candidats, participation et abstention. ${esc(fmtInt(communes))} communes de 1 000 habitants et plus ont une fiche détaillée.</p><ul><li>${link("/resultats-presidentielle-par-commune", "Rechercher les résultats d'une commune")}</li><li>${link("/explorer", "Parcourir les résultats par département")}</li><li>${link("/comparer", "Comparer deux communes")}</li></ul></section>`,
      `<section><h2>Présidentielle 2027</h2><p>La liste compte ${declared} candidat${declared > 1 ? "s" : ""} déclaré${declared > 1 ? "s" : ""} au ${esc(frDate(candidats.meta.dateVerification))}. Elle n'a aucune valeur officielle.</p><ul><li>${link("/presidentielle-2027", "Présidentielle 2027 : date, candidats et calendrier")}</li><li>${link("/sondages-presidentielle-2027", "Sondages de la présidentielle 2027")}</li><li>${link("/parrainages?year=2027", "Parrainages de la présidentielle 2027")}</li>${liveResultsVisible() ? `<li>${link(...LIVE_LINK)}</li>` : ""}</ul></section>`,
      `<section><h2>Résultats des élections présidentielles depuis 1965</h2>${elections}<p>${link("/resultats-presidentielle", "Tous les résultats des présidentielles")} · ${link("/carte-presidentielle", "Carte du vote")} · ${link("/participation-presidentielle", "Participation")} · ${link("/abstention-presidentielle", "Abstention")}</p></section>`,
    ],
    source: "Sources : résultats officiels des élections présidentielles (ministère de l'Intérieur, Conseil constitutionnel, données ouvertes data.gouv.fr) ; communes : geo.api.gouv.fr ; calendrier : Service-public.fr.",
  });
}
