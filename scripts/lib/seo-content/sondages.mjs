// Page /sondages-presidentielle-2027 : dernier sondage, moyenne par candidat, FAQ (+ JSON-LD FAQPage).
// Le calcul de la moyenne reprend celui de src/lib/api/polls2027Api.ts (fenêtre glissante de 30 jours,
// pondération par l'échantillon, toutes hypothèses) ; un test (polls2027Api.test.ts) vérifie que les deux concordent.
import { readFileSync } from "node:fs";
import path from "node:path";

import { load2027 } from "./data.mjs";
import { esc, link, linkList, page, table } from "./html.mjs";

const root = path.resolve(import.meta.dirname, "../../..");
const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));

export const WINDOW_DAYS = 30;
const nfPct = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const pct = (v) => `${nfPct.format(v).replace(/[  ]/g, " ")} %`;
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export const frDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d === 1 ? "1er" : d} ${MONTHS[m - 1]} ${y}`;
};

function fieldwork(start, end) {
  if (start === end) return `le ${frDate(end)}`;
  return `du ${frDate(start)} au ${frDate(end)}`;
}

function addDays(iso, delta) {
  const d = new Date(`${iso}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

const hypothesisKey = (h) => Object.keys(h).sort().join("|");

export function marginOfError(percent, sampleSize) {
  if (!sampleSize || sampleSize <= 0) return null;
  const p = Math.min(Math.max(percent, 0), 100) / 100;
  return Math.round(1.96 * Math.sqrt((p * (1 - p)) / sampleSize) * 1000) / 10;
}

/** Moyenne de chaque candidat à la date `date` sur `windowDays` jours (pondérée par l'échantillon). */
export function averages(dataset, date = dataset.meta.latestFieldworkEnd, windowDays = WINDOW_DAYS) {
  const lo = addDays(date, -(windowDays - 1));
  const acc = new Map();
  for (const poll of dataset.polls) {
    if (poll.fieldworkEnd < lo || poll.fieldworkEnd > date || poll.hypotheses.length === 0) continue;
    // score du sondage = moyenne des hypothèses qui testent le candidat
    const sums = new Map();
    for (const h of poll.hypotheses) {
      for (const [id, v] of Object.entries(h)) {
        const s = sums.get(id) ?? { total: 0, n: 0 };
        s.total += v;
        s.n += 1;
        sums.set(id, s);
      }
    }
    const w = poll.sampleSize > 0 ? poll.sampleSize : 1;
    for (const [id, s] of sums) {
      const a = acc.get(id) ?? { num: 0, den: 0, count: 0, sampleTotal: 0 };
      a.num += (s.total / s.n) * w;
      a.den += w;
      a.count += 1;
      a.sampleTotal += poll.sampleSize ?? 0;
      acc.set(id, a);
    }
  }
  const out = new Map();
  for (const [id, a] of acc) {
    const value = Math.round((a.num / a.den) * 10) / 10;
    out.set(id, {
      value,
      pollCount: a.count,
      margin: marginOfError(value, a.sampleTotal > 0 ? Math.round(a.sampleTotal / a.count) : null),
    });
  }
  return out;
}

/** Dernier sondage (fin de terrain la plus récente) et son hypothèse principale. */
export function latestPoll(dataset) {
  const poll = [...dataset.polls].sort(
    (a, b) => b.fieldworkEnd.localeCompare(a.fieldworkEnd) || b.fieldworkStart.localeCompare(a.fieldworkStart),
  )[0];
  if (!poll) return null;
  // Hypothèse principale : celle dont la liste de candidats est testée par le plus grand nombre de sondages
  // des WINDOW_DAYS derniers jours (à égalité, la première du sondage).
  const lo = addDays(poll.fieldworkEnd, -(WINDOW_DAYS - 1));
  const freq = new Map();
  for (const p of dataset.polls.filter((x) => x.fieldworkEnd >= lo)) for (const k of new Set(p.hypotheses.map(hypothesisKey))) freq.set(k, (freq.get(k) ?? 0) + 1);
  const hypothesis = poll.hypotheses.reduce((best, h) => (!best || (freq.get(hypothesisKey(h)) ?? 0) > (freq.get(hypothesisKey(best)) ?? 0) ? h : best), null);
  return { poll, hypothesis };
}

const plain = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z]+/g, " ").trim();

/** Nom affiché -> chemin de la fiche candidat 2027 (correspondance par nom, null sans fiche). */
function candidateLinker() {
  const byName = new Map(load2027().candidats.candidats.map((c) => [plain(`${c.prenom} ${c.nom}`), `/presidentielle-2027/candidats/${c.slug}`]));
  return (label) => byName.get(plain(label)) ?? null;
}

export function sondagesFaq() {
  return readJson("src/content/sondages-faq.json");
}

export function sondagesFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: sondagesFaq().map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

export function buildSondagesBody() {
  const dataset = readJson("public/data/presidential/polls-2027-round1.json");
  const labels = new Map(dataset.candidates.map((c) => [c.id, c.label]));
  const linkFor = candidateLinker();
  const latest = latestPoll(dataset);
  const to = dataset.meta.latestFieldworkEnd;
  const nameCell = (id) => {
    const label = labels.get(id) ?? id;
    const href = linkFor(label);
    return href ? link(href, label) : esc(label);
  };

  const sections = [];
  if (latest) {
    const { poll, hypothesis } = latest;
    const rows = Object.entries(hypothesis)
      .sort((a, b) => b[1] - a[1])
      .map(([id, v]) => [nameCell(id), esc(pct(v))]);
    const notice = poll.noticeUrl ? ` <a href="${esc(poll.noticeUrl)}" rel="noopener noreferrer">Notice du sondage</a>.` : "";
    sections.push(
      `<section><h2>Dernier sondage de la présidentielle 2027</h2><p>Institut : <strong>${esc(poll.pollster)}</strong>. Terrain ${esc(fieldwork(poll.fieldworkStart, poll.fieldworkEnd))}${
        poll.sampleSize ? `, échantillon de ${esc(String(poll.sampleSize).replace(/\B(?=(\d{3})+$)/g, " "))} personnes` : ""
      }.${notice} Intentions de vote au 1er tour pour l'hypothèse la plus souvent testée ces 30 derniers jours${
        poll.hypotheses.length > 1 ? ` (ce sondage teste ${poll.hypotheses.length} hypothèses)` : ""
      } :</p>${table(`Intentions de vote, dernier sondage (${poll.pollster}, fin de terrain ${frDate(poll.fieldworkEnd)})`, ["Candidat", "Intentions de vote"], rows)}</section>`,
    );
  }

  const avg = averages(dataset);
  const avgRows = [...avg.entries()]
    .sort((a, b) => b[1].value - a[1].value || (labels.get(a[0]) ?? a[0]).localeCompare(labels.get(b[0]) ?? b[0], "fr"))
    .map(([id, a]) => [nameCell(id), esc(pct(a.value)), esc(a.margin == null ? "n.c." : `± ${nfPct.format(a.margin)} point${a.margin >= 2 ? "s" : ""}`), String(a.pollCount)]);
  sections.push(
    `<section><h2>Moyenne des sondages par candidat</h2><p>Moyenne des intentions de vote au 1er tour sur les ${WINDOW_DAYS} jours précédant le ${esc(frDate(to))}, pondérée par la taille des échantillons. Chaque moyenne ne porte que sur les sondages qui testent le candidat.</p>${table(
      `Moyenne des sondages de la présidentielle 2027 au ${frDate(to)}`,
      ["Candidat", "Moyenne", "Marge d'erreur", "Sondages"],
      avgRows,
    )}</section>`,
  );

  const faq = sondagesFaq();
  sections.push(`<section><h2>Questions fréquentes sur les sondages</h2>${faq.map(({ q, a }) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("")}</section>`);
  sections.push(
    `<section><h2>Explorer PrésiFrance</h2>${linkList([
      ["/presidentielle-2027", "Présidentielle 2027 : candidats et calendrier"],
      ["/parrainages", "Parrainages présidentiels"],
      ["/analyse", "Archive des sondages de la présidentielle 2022"],
    ])}</section>`,
  );
  sections.push(`<script type="application/ld+json">${JSON.stringify(sondagesFaqJsonLd()).replaceAll("<", "\\u003c")}</script>`);

  const sources = dataset.meta.sources.map((s) => esc(s.label)).join(" ; ");
  return page({
    h1: "Sondage présidentielle 2027 : dernier sondage et moyenne des sondages",
    intro: `Mise à jour des données : ${esc(frDate(dataset.meta.generatedAt))}. Cette page réunit les sondages d'intentions de vote au 1er tour de l'élection présidentielle de 2027 : le dernier sondage publié, la moyenne par candidat et les explications pour les lire. Les sondages ne sont pas des prévisions et la liste des candidats n'est pas officielle.`,
    sections,
    source: `Sources : ${sources}. Données mises à jour le ${esc(frDate(dataset.meta.generatedAt))} ; dernière fin de terrain prise en compte : ${esc(frDate(to))}.`,
  });
}
