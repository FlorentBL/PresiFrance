// Fiche candidat 2027 prérendue : statut sourcé, fonction (si sourcée), sondages, historique, parrainages, FAQ et JSON-LD.
// Tout est calculé depuis public/data ; aucun chiffre n'est saisi à la main. Même gabarit pour tous les candidats.
// La page React (src/pages/Candidat2027Page.tsx) affiche les mêmes informations ; src/lib/candidate2027Faq.test.ts vérifie la parité.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { load2027, loadNational } from "./data.mjs";
import { candidateName, esc, fmtInt, fmtPct, link, page, table } from "./html.mjs";

const root = path.resolve(import.meta.dirname, "../../..");
const SITE_URL = String(process.env.SITE_URL || "https://presifrance.fr").replace(/\/+$/, "");
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

export const POLL_WINDOW_DAYS = 30;
const CURVE_MAX_POINTS = 12;
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** AAAA-MM-JJ ou AAAA-MM -> « 22 octobre 2026 » / « octobre 2026 ». */
export function frDate(iso) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(iso ?? "");
  if (!m) return "date à confirmer";
  const [, y, mo, d] = m;
  return d ? `${Number(d) === 1 ? "1er" : Number(d)} ${MONTHS[Number(mo) - 1]} ${y}` : `${MONTHS[Number(mo) - 1]} ${y}`;
}

const STATUT_LABEL = { declare: "Candidat déclaré", pressenti: "Candidat pressenti", retire: "Candidature retirée" };

/** « de Olivier » -> « d'Olivier ». */
export const deName = (name) => (/^[AEIOUYÉÈÊÂÎÔHaeiouyéèêâîôh]/.test(name) ? `d'${name}` : `de ${name}`);

export const candidatePath = (slug) => `/presidentielle-2027/candidats/${slug}`;
export const candidateFullName = (c) => `${c.prenom} ${c.nom}`;
export const candidate2027Title = (c) => `${candidateFullName(c)} : candidature présidentielle 2027, sondages et parcours`;
export const candidate2027Description = (c) =>
  `${candidateFullName(c)} et la présidentielle 2027 : statut de la candidature, sondages de 1er tour, résultats aux présidentielles passées et parrainages, avec les sources.`;

const plain = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();

// ---------- sondages ----------

const addDays = (iso, delta) => {
  const d = new Date(`${iso}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
};
const round1 = (n) => Math.round(n * 10) / 10;

let pollsCache;
const loadPolls = () => (pollsCache ??= readJson(path.join(root, "public/data/presidential/polls-2027-round1.json")));

/** Calcul identique à src/lib/api/polls2027Api.ts (moyenne des hypothèses par sondage, puis moyenne glissante pondérée par l'échantillon). */
export function summarizePolls(candidate, dataset = loadPolls()) {
  const id = candidate.slug.replaceAll("-", "_");
  const entries = [];
  for (const poll of dataset.polls) {
    const values = poll.hypotheses.map((h) => h[id]).filter((v) => v !== undefined);
    if (values.length === 0) continue;
    entries.push({ poll, values, score: values.reduce((a, b) => a + b, 0) / values.length });
  }
  const to = dataset.meta.latestFieldworkEnd;
  const average = (date) => {
    const lo = addDays(date, -(POLL_WINDOW_DAYS - 1));
    let num = 0;
    let den = 0;
    let count = 0;
    for (const e of entries) {
      if (e.poll.fieldworkEnd < lo || e.poll.fieldworkEnd > date) continue;
      const w = e.poll.sampleSize > 0 ? e.poll.sampleSize : 1;
      num += e.score * w;
      den += w;
      count += 1;
    }
    return den === 0 ? null : { value: round1(num / den), pollCount: count };
  };
  const latest = entries.length ? entries.reduce((a, b) => (b.poll.fieldworkEnd >= a.poll.fieldworkEnd ? b : a)) : null;
  const curve = [];
  if (to && entries.length) {
    const first = entries.reduce((a, b) => (b.poll.fieldworkEnd < a ? b.poll.fieldworkEnd : a), entries[0].poll.fieldworkEnd);
    for (let k = 0; k < CURVE_MAX_POINTS; k++) {
      const date = addDays(to, -POLL_WINDOW_DAYS * k);
      if (date < first) break;
      const avg = average(date);
      if (avg) curve.unshift({ date, ...avg });
    }
  }
  return {
    pollCount: entries.length,
    asOf: to,
    recent: to ? average(to) : null,
    latest: latest && {
      pollster: latest.poll.pollster,
      fieldworkEnd: latest.poll.fieldworkEnd,
      noticeUrl: latest.poll.noticeUrl,
      min: Math.min(...latest.values),
      max: Math.max(...latest.values),
      score: round1(latest.score),
      hypotheses: latest.values.length,
    },
    curve,
    sources: dataset.meta.sources,
  };
}

const num = (n) => String(n).replace(".", ",");
const pctText = (n) => `${num(n)} %`;

function latestSentence(s) {
  const l = s.latest;
  const range = l.min === l.max ? pctText(round1(l.score)) : `entre ${pctText(round1(l.min))} et ${pctText(round1(l.max))} selon l'hypothèse testée`;
  return `le dernier sondage qui le teste (${l.pollster}, terrain terminé le ${frDate(l.fieldworkEnd)}) lui donne ${range}`;
}

export function pollsAnswer(c, s) {
  const name = candidateFullName(c);
  if (!s.pollCount) {
    return `Aucun des sondages de 1er tour de la présidentielle 2027 recensés par PrésiFrance (données relevées le ${frDate(s.sources[0]?.retrievedAt ?? s.asOf)}) ne teste ${name} : il n'existe donc pas de moyenne ni de courbe le concernant.`;
  }
  const parts = [`${name} est testé dans ${s.pollCount} sondage${s.pollCount > 1 ? "s" : ""} de 1er tour de la présidentielle 2027 recensés par PrésiFrance.`];
  if (s.recent) {
    parts.push(
      `Sur les ${POLL_WINDOW_DAYS} jours qui précèdent le ${frDate(s.asOf)}, sa moyenne est de ${pctText(s.recent.value)} des intentions de vote (${s.recent.pollCount} sondage${s.recent.pollCount > 1 ? "s" : ""}, moyenne pondérée par la taille des échantillons).`,
    );
  } else {
    parts.push(`Aucun sondage ne le teste sur les ${POLL_WINDOW_DAYS} jours qui précèdent le ${frDate(s.asOf)}, aucune moyenne récente n'est donc calculée.`);
  }
  parts.push(`${latestSentence(s).replace(/^le/, "Le")}.`);
  return parts.join(" ");
}

// ---------- historique ----------

export function historyOf(c, national = loadNational()) {
  const target = plain(`${c.prenom} ${c.nom}`);
  const out = [];
  for (const year of Object.keys(national).sort((a, b) => Number(b) - Number(a))) {
    for (const round of [1, 2]) {
      const found = national[year]?.[`t${round}`]?.candidates.find((x) => plain(`${x.prenom} ${x.nom}`) === target);
      if (found) out.push({ year: Number(year), round, pourcentExprimes: found.pourcentExprimes, voix: found.voix });
    }
  }
  return out;
}

export function historyAnswer(c, history) {
  const name = candidateFullName(c);
  if (!history.length) {
    return `${name} n'apparaît dans les résultats nationaux d'aucune élection présidentielle de 1965 à 2022 publiés par PrésiFrance (recherche par nom).`;
  }
  const first = history.filter((h) => h.round === 1);
  const txt = first.map((h) => `${pctText(h.pourcentExprimes)} en ${h.year}`).join(", ");
  const second = history.filter((h) => h.round === 2).map((h) => `${h.year} (${pctText(h.pourcentExprimes)})`);
  return `${name} a été candidat à ${first.length} élection${first.length > 1 ? "s" : ""} présidentielle${first.length > 1 ? "s" : ""} (1er tour : ${txt}).${
    second.length ? ` ${name} a aussi figuré au second tour en ${second.join(", ")}.` : ""
  }`;
}

// ---------- parrainages ----------

export function loadSponsorship2027() {
  const file = path.join(root, "public/data/parrainages/2027.json");
  return existsSync(file) ? readJson(file) : null;
}

/** { published: false } tant que le Conseil constitutionnel n'a rien publié ; sinon total et départements du candidat. */
export function sponsorshipOf(c, data = loadSponsorship2027()) {
  if (!data) return { published: false };
  const target = plain(`${c.prenom} ${c.nom}`);
  const hit = (data.stats ?? []).find((s) => {
    // « NOM Prénom » : les mots en capitales (LE PEN, DE VILLEPIN) forment le nom, le reste le prénom.
    const words = s.candidat.trim().split(/\s+/);
    const idx = words.findIndex((w) => w !== w.toUpperCase());
    if (idx < 1) return plain(words.join(" ")) === target || plain([...words.slice(1), words[0]].join(" ")) === target;
    return plain(`${words.slice(idx).join(" ")} ${words.slice(0, idx).join(" ")}`) === target;
  });
  return hit ? { published: true, total: hit.total, departements: hit.departements, asOf: data.generatedAt ?? null } : { published: true, total: 0, departements: 0, asOf: data.generatedAt ?? null };
}

export function sponsorshipAnswer(c, sp) {
  const name = candidateFullName(c);
  if (!sp.published) {
    return `Les parrainages de la présidentielle 2027 ne sont pas encore publiés dans les données de PrésiFrance : le Conseil constitutionnel n'a pas mis en ligne de liste à ce jour. Cette réponse sera complétée dès sa publication.`;
  }
  if (!sp.total) return `Aucun parrainage publié pour ${name} dans la dernière liste du Conseil constitutionnel intégrée par PrésiFrance${sp.asOf ? ` (${frDate(sp.asOf)})` : ""}.`;
  return `${name} compte ${fmtInt(sp.total)} parrainage${sp.total > 1 ? "s" : ""} publié${sp.total > 1 ? "s" : ""} par le Conseil constitutionnel, dans ${sp.departements} département${sp.departements > 1 ? "s" : ""}${sp.asOf ? ` (liste du ${frDate(sp.asOf)})` : ""}.`;
}

// ---------- statut ----------

export function candidacyAnswer(c) {
  const name = candidateFullName(c);
  const tail = ` Source : ${c.sourceLabel}, vérifiée le ${frDate(c.dateVerification)}. Cette liste est établie à partir de sources de presse et n'a aucune valeur officielle : la liste officielle sera publiée par le Conseil constitutionnel après validation des parrainages.`;
  const note = c.note ? ` ${c.note.replace(/\.?$/, ".")}` : "";
  if (c.statut === "declare") {
    return `Oui, ${name} figure parmi les candidats déclarés à l'élection présidentielle de 2027${c.dateDeclaration ? `, depuis le ${frDate(c.dateDeclaration)}` : ""}${c.parti && c.parti !== "à confirmer" ? ` (${c.parti})` : ""}.${note}${tail}`;
  }
  if (c.statut === "retire") {
    return `Non, la candidature ${deName(name)} à l'élection présidentielle de 2027 est signalée comme retirée.${note}${tail}`;
  }
  return `${name} figure parmi les personnalités pressenties pour l'élection présidentielle de 2027, mais sa candidature n'est pas déclarée à la date de vérification.${note}${tail}`;
}

export function historyFaqAnswer(c) {
  return historyAnswer(c, historyOf(c));
}

export function candidateFaq(c, ctx = {}) {
  const name = candidateFullName(c);
  return [
    { q: `${name} est-il candidat en 2027 ?`, a: candidacyAnswer(c) },
    { q: `Que disent les sondages sur ${name} ?`, a: pollsAnswer(c, ctx.polls ?? summarizePolls(c)) },
    { q: `Quels sont les résultats ${deName(name)} aux élections présidentielles passées ?`, a: historyAnswer(c, ctx.history ?? historyOf(c)) },
    { q: `${name} a-t-il obtenu des parrainages pour 2027 ?`, a: sponsorshipAnswer(c, ctx.sponsorship ?? sponsorshipOf(c)) },
  ];
}

// ---------- autres candidats ----------

/** 3 candidats les plus testés dans les sondages (critère unique pour toutes les fiches) + 3 voisins en ordre alphabétique. */
export function relatedCandidates(c, all = load2027().candidats.candidats, dataset = loadPolls()) {
  const others = all.filter((x) => x.slug !== c.slug);
  const counts = new Map(all.map((x) => [x.slug, summarizePolls(x, dataset).pollCount]));
  const byPolls = others
    .filter((x) => x.statut !== "retire" && counts.get(x.slug) > 0)
    .sort((a, b) => counts.get(b.slug) - counts.get(a.slug) || a.nom.localeCompare(b.nom, "fr"))
    .slice(0, 3);
  const sorted = [...all].sort((a, b) => a.nom.localeCompare(b.nom, "fr") || a.prenom.localeCompare(b.prenom, "fr"));
  const i = sorted.findIndex((x) => x.slug === c.slug);
  const neighbours = [];
  for (let k = 1; neighbours.length < 3 && k < sorted.length; k++) {
    const x = sorted[(i + k) % sorted.length];
    if (!byPolls.some((p) => p.slug === x.slug)) neighbours.push(x);
  }
  return { byPolls, neighbours };
}

// ---------- rendu ----------

function curveSvg(name, curve) {
  const W = 480;
  const H = 140;
  const pad = { l: 36, r: 12, t: 12, b: 24 };
  const max = Math.max(5, Math.ceil(Math.max(...curve.map((p) => p.value)) / 5) * 5);
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / (curve.length - 1);
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const pts = curve.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const desc = `Moyenne glissante sur ${POLL_WINDOW_DAYS} jours des intentions de vote pour ${name}, du ${frDate(curve[0].date)} au ${frDate(curve.at(-1).date)} : de ${pctText(curve[0].value)} à ${pctText(curve.at(-1).value)}.`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="courbe-titre courbe-desc" width="100%" style="max-width:${W}px;height:auto"><title id="courbe-titre">Courbe des sondages ${esc(deName(name))}</title><desc id="courbe-desc">${esc(desc)}</desc><line x1="${pad.l}" y1="${y(0)}" x2="${W - pad.r}" y2="${y(0)}" stroke="currentColor" stroke-opacity="0.3"/><text x="${pad.l - 4}" y="${y(0) + 4}" font-size="10" text-anchor="end" fill="currentColor">0 %</text><text x="${pad.l - 4}" y="${y(max) + 4}" font-size="10" text-anchor="end" fill="currentColor">${max} %</text><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2"/>${curve
    .map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="3" fill="currentColor"/>`)
    .join("")}<text x="${pad.l}" y="${H - 6}" font-size="10" fill="currentColor">${esc(frDate(curve[0].date))}</text><text x="${W - pad.r}" y="${H - 6}" font-size="10" text-anchor="end" fill="currentColor">${esc(frDate(curve.at(-1).date))}</text></svg>`;
}

function pollsSection(c, s) {
  const name = candidateFullName(c);
  const src = s.sources.map((x) => link(x.url, x.label)).join(", ");
  const head = `<h2>Sondages de la présidentielle 2027 : ${esc(name)}</h2>`;
  const foot = `<p><small>Source : ${src} ; notices des instituts. Les listes de candidats testées diffèrent d'un sondage à l'autre : pour chaque sondage, le score retenu est la moyenne des hypothèses où le candidat figure. Moyenne glissante de ${POLL_WINDOW_DAYS} jours pondérée par la taille des échantillons. Détail et courbes de tous les candidats : ${link("/sondages-presidentielle-2027", "sondages de la présidentielle 2027")}.</small></p>`;
  if (!s.pollCount) return `<section>${head}<p>${esc(pollsAnswer(c, s))}</p>${foot}</section>`;
  const stats = [
    ["Nombre de sondages qui le testent", fmtInt(s.pollCount)],
    [`Moyenne récente (${POLL_WINDOW_DAYS} jours avant le ${frDate(s.asOf)})`, s.recent ? `${pctText(s.recent.value)} (${s.recent.pollCount} sondage${s.recent.pollCount > 1 ? "s" : ""})` : "aucun sondage sur la période"],
    [
      "Dernier sondage",
      `${s.latest.pollster}, terrain terminé le ${frDate(s.latest.fieldworkEnd)} : ${
        s.latest.min === s.latest.max ? pctText(round1(s.latest.score)) : `${pctText(round1(s.latest.min))} à ${pctText(round1(s.latest.max))} selon l'hypothèse`
      }`,
    ],
  ];
  const dl = `<dl>${stats.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`;
  const notice = s.latest.noticeUrl ? `<p>${link(s.latest.noticeUrl, "Notice du dernier sondage")}</p>` : "";
  const curve =
    s.curve.length >= 2
      ? `<h3>Évolution de la moyenne</h3>${curveSvg(name, s.curve)}${table(
          `Moyenne glissante de ${POLL_WINDOW_DAYS} jours, ${name}`,
          ["Au", "Moyenne", "Sondages"],
          s.curve.map((p) => [esc(frDate(p.date)), esc(pctText(p.value)), String(p.pollCount)]),
        )}`
      : `<p>Moins de deux périodes de ${POLL_WINDOW_DAYS} jours comportent un sondage qui le teste : aucune courbe n'est tracée.</p>`;
  return `<section>${head}${dl}${notice}${curve}${foot}</section>`;
}

function historySection(c, history) {
  const name = candidateFullName(c);
  const body = history.length
    ? table(
        `Résultats nationaux ${deName(name)} aux élections présidentielles`,
        ["Élection", "Tour", "% des exprimés", "Voix"],
        history.map((h) => [link(`/presidentielle-${h.year}`, `Présidentielle ${h.year}`), String(h.round), fmtPct(h.pourcentExprimes), fmtInt(h.voix)]),
      )
    : `<p>${esc(historyAnswer(c, history))}</p>`;
  return `<section><h2>Parcours électoral : ${esc(name)} aux présidentielles</h2>${body}<p><small>Source : résultats officiels des élections présidentielles (ministère de l'Intérieur, Conseil constitutionnel). Recherche par nom dans les résultats nationaux de 1965 à 2022.</small></p></section>`;
}

function sponsorshipSection(c, sp) {
  return `<section><h2>Parrainages 2027</h2><p>${esc(sponsorshipAnswer(c, sp))}</p><p>${link("/parrainages?year=2027", "Parrainages 2027 : suivi détaillé")}</p></section>`;
}

function infoSection(c) {
  const rows = [
    ["Statut", `${STATUT_LABEL[c.statut] ?? c.statut}${c.dateDeclaration ? `, depuis le ${frDate(c.dateDeclaration)}` : ""} (vérifié le ${frDate(c.dateVerification)})`],
    ["Parti ou soutien", c.parti || "non renseigné"],
  ];
  if (c.fonction?.libelle) {
    rows.push(["Fonction", `${c.fonction.libelle} (source : ${c.fonction.sourceLabel}, vérifiée le ${frDate(c.fonction.dateVerification)})`]);
  }
  if (c.note) rows.push(["Précision", c.note]);
  const fonctionLink = c.fonction?.sourceUrl ? `<li>${link(c.fonction.sourceUrl, `Source de la fonction : ${c.fonction.sourceLabel}`)}</li>` : "";
  return `<section><h2>Statut de la candidature</h2><dl>${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl><ul><li>${link(c.sourceUrl, `Source du statut : ${c.sourceLabel}`)}</li>${fonctionLink}</ul></section>`;
}

function relatedSection(c) {
  const { byPolls, neighbours } = relatedCandidates(c);
  const li = (x) => `<li>${link(candidatePath(x.slug), candidateFullName(x))}</li>`;
  return `<section><h2>Autres candidats à la présidentielle 2027</h2>${
    byPolls.length ? `<h3>Les plus testés dans les sondages</h3><ul>${byPolls.map(li).join("")}</ul>` : ""
  }<h3>Autres fiches (ordre alphabétique)</h3><ul>${neighbours.map(li).join("")}</ul><p>${link("/presidentielle-2027", "Tous les candidats et le calendrier de la présidentielle 2027")} · ${link("/sondages-presidentielle-2027", "Sondages de la présidentielle 2027")}</p></section>`;
}

export const findCandidate = (routePath) => load2027().candidats.candidats.find((x) => candidatePath(x.slug) === routePath);

export function buildCandidate2027Body(route) {
  const c = findCandidate(route.path);
  const name = candidateFullName(c);
  const polls = summarizePolls(c);
  const history = historyOf(c);
  const sponsorship = sponsorshipOf(c);
  const faq = candidateFaq(c, { polls, history, sponsorship });
  return page({
    h1: name,
    intro: `${esc(name)} et la présidentielle de 2027 : statut de la candidature, sondages de 1er tour, résultats aux élections présidentielles passées et parrainages. Chaque information est sourcée et datée ; la liste des candidats est établie à partir de sources de presse et n'a aucune valeur officielle.`,
    sections: [
      infoSection(c),
      pollsSection(c, polls),
      historySection(c, history),
      sponsorshipSection(c, sponsorship),
      `<section><h2>Questions fréquentes sur ${esc(name)}</h2>${faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}</section>`,
      relatedSection(c),
    ],
    source: `Statut vérifié le ${esc(frDate(c.dateVerification))}. Sondages relevés le ${esc(frDate(polls.sources[0]?.retrievedAt ?? polls.asOf))}. Résultats : ministère de l'Intérieur et Conseil constitutionnel.`,
  });
}

/** Objets JSON-LD injectés dans <head> (le fil d'Ariane et WebSite sont posés côté client par le composant JsonLd). */
export function buildCandidate2027JsonLd(route) {
  const c = findCandidate(route.path);
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${SITE_URL}${route.path}#faq`,
      mainEntity: candidateFaq(c).map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];
}
