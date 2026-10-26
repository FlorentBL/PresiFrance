// Textes et calculs de la fiche candidat 2027 (sondages, historique, parrainages, FAQ).
// Miroir de scripts/lib/seo-content/candidate-2027.mjs, qui écrit les mêmes textes dans le HTML prérendu :
// src/lib/candidate2027Content.test.ts vérifie que les deux restent identiques.
import {
  averageAt,
  addDaysIso,
  selectScores,
  type Polls2027Dataset,
  type Polls2027Source,
} from "@/lib/api/polls2027Api";
import {
  formatPartialDate,
  type Candidate2027,
  type CandidateHistoryEntry,
} from "@/lib/api/presidential2027Api";

export const POLL_WINDOW_DAYS = 30;
const CURVE_MAX_POINTS = 12;

const round1 = (n: number) => Math.round(n * 10) / 10;
const num = (n: number) => String(n).replace(".", ",");
export const pctText = (n: number) => `${num(n)} %`;
const frInt = (n: number) => Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ");

export const candidateFullName = (c: Pick<Candidate2027, "prenom" | "nom">) => `${c.prenom} ${c.nom}`;
export const deName = (name: string) => (/^[AEIOUYÉÈÊÂÎÔHaeiouyéèêâîôh]/.test(name) ? `d'${name}` : `de ${name}`);
const plain = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();

export interface PollSummary {
  pollCount: number;
  asOf: string | null;
  recent: { value: number; pollCount: number } | null;
  latest: {
    pollster: string;
    fieldworkEnd: string;
    noticeUrl: string | null;
    min: number;
    max: number;
    score: number;
    hypotheses: number;
  } | null;
  curve: { date: string; value: number; pollCount: number }[];
  sources: Polls2027Source[];
}

export function summarizePolls(candidate: Pick<Candidate2027, "slug">, dataset: Polls2027Dataset): PollSummary {
  const id = candidate.slug.replace(/-/g, "_");
  const entries = selectScores(dataset, null).filter((e) => e.scores[id] !== undefined);
  const to = dataset.meta.latestFieldworkEnd;
  const avg = (date: string) => {
    const a = averageAt(entries, id, date, POLL_WINDOW_DAYS);
    return a ? { value: a.value, pollCount: a.pollCount } : null;
  };
  let latestPoll = entries[0]?.poll;
  for (const e of entries) if (e.poll.fieldworkEnd >= latestPoll.fieldworkEnd) latestPoll = e.poll;
  const values = latestPoll ? latestPoll.hypotheses.map((h) => h[id]).filter((v) => v !== undefined) : [];
  const curve: PollSummary["curve"] = [];
  if (to && entries.length) {
    const first = entries.reduce((a, e) => (e.poll.fieldworkEnd < a ? e.poll.fieldworkEnd : a), entries[0].poll.fieldworkEnd);
    for (let k = 0; k < CURVE_MAX_POINTS; k++) {
      const date = addDaysIso(to, -POLL_WINDOW_DAYS * k);
      if (date < first) break;
      const a = avg(date);
      if (a) curve.unshift({ date, ...a });
    }
  }
  return {
    pollCount: entries.length,
    asOf: to,
    recent: to ? avg(to) : null,
    latest: latestPoll
      ? {
          pollster: latestPoll.pollster,
          fieldworkEnd: latestPoll.fieldworkEnd,
          noticeUrl: latestPoll.noticeUrl,
          min: Math.min(...values),
          max: Math.max(...values),
          score: round1(values.reduce((a, b) => a + b, 0) / values.length),
          hypotheses: values.length,
        }
      : null,
    curve,
    sources: dataset.meta.sources,
  };
}

export function pollsAnswer(c: Candidate2027, s: PollSummary): string {
  const name = candidateFullName(c);
  if (!s.pollCount || !s.latest) {
    return `Aucun des sondages de 1er tour de la présidentielle 2027 recensés par PrésiFrance (données relevées le ${formatPartialDate(s.sources[0]?.retrievedAt ?? s.asOf)}) ne teste ${name} : il n'existe donc pas de moyenne ni de courbe le concernant.`;
  }
  const l = s.latest;
  const plural = (n: number) => (n > 1 ? "s" : "");
  const parts = [`${name} est testé dans ${s.pollCount} sondage${plural(s.pollCount)} de 1er tour de la présidentielle 2027 recensés par PrésiFrance.`];
  parts.push(
    s.recent
      ? `Sur les ${POLL_WINDOW_DAYS} jours qui précèdent le ${formatPartialDate(s.asOf)}, sa moyenne est de ${pctText(s.recent.value)} des intentions de vote (${s.recent.pollCount} sondage${plural(s.recent.pollCount)}, moyenne pondérée par la taille des échantillons).`
      : `Aucun sondage ne le teste sur les ${POLL_WINDOW_DAYS} jours qui précèdent le ${formatPartialDate(s.asOf)}, aucune moyenne récente n'est donc calculée.`,
  );
  const range = l.min === l.max ? pctText(round1(l.score)) : `entre ${pctText(round1(l.min))} et ${pctText(round1(l.max))} selon l'hypothèse testée`;
  parts.push(`Le dernier sondage qui le teste (${l.pollster}, terrain terminé le ${formatPartialDate(l.fieldworkEnd)}) lui donne ${range}.`);
  return parts.join(" ");
}

export function historyAnswer(c: Candidate2027, history: CandidateHistoryEntry[]): string {
  const name = candidateFullName(c);
  if (!history.length) {
    return `${name} n'apparaît dans les résultats nationaux d'aucune élection présidentielle de 1965 à 2022 publiés par PrésiFrance (recherche par nom).`;
  }
  const first = history.filter((h) => h.round === 1);
  const txt = first.map((h) => `${pctText(h.pourcentExprimes)} en ${h.year}`).join(", ");
  const second = history.filter((h) => h.round === 2).map((h) => `${h.year} (${pctText(h.pourcentExprimes)})`);
  const s = first.length > 1 ? "s" : "";
  return `${name} a été candidat à ${first.length} élection${s} présidentielle${s} (1er tour : ${txt}).${
    second.length ? ` ${name} a aussi figuré au second tour en ${second.join(", ")}.` : ""
  }`;
}

export interface SponsorshipStats {
  stats?: { candidat: string; total: number; departements: number }[];
  generatedAt?: string;
}
export type Sponsorship = { published: false } | { published: true; total: number; departements: number; asOf: string | null };

export function sponsorshipOf(c: Candidate2027, data: SponsorshipStats | null): Sponsorship {
  if (!data) return { published: false };
  const target = plain(`${c.prenom} ${c.nom}`);
  const hit = (data.stats ?? []).find((s) => {
    const words = s.candidat.trim().split(/\s+/);
    const idx = words.findIndex((w) => w !== w.toUpperCase());
    if (idx < 1) return plain(words.join(" ")) === target || plain([...words.slice(1), words[0]].join(" ")) === target;
    return plain(`${words.slice(idx).join(" ")} ${words.slice(0, idx).join(" ")}`) === target;
  });
  return { published: true, total: hit?.total ?? 0, departements: hit?.departements ?? 0, asOf: data.generatedAt ?? null };
}

export function sponsorshipAnswer(c: Candidate2027, sp: Sponsorship): string {
  const name = candidateFullName(c);
  if (!sp.published) {
    return "Les parrainages de la présidentielle 2027 ne sont pas encore publiés dans les données de PrésiFrance : le Conseil constitutionnel n'a pas mis en ligne de liste à ce jour. Cette réponse sera complétée dès sa publication.";
  }
  const when = sp.asOf ? ` (${formatPartialDate(sp.asOf)})` : "";
  if (!sp.total) return `Aucun parrainage publié pour ${name} dans la dernière liste du Conseil constitutionnel intégrée par PrésiFrance${when}.`;
  const s = sp.total > 1 ? "s" : "";
  return `${name} compte ${frInt(sp.total)} parrainage${s} publié${s} par le Conseil constitutionnel, dans ${sp.departements} département${sp.departements > 1 ? "s" : ""}${sp.asOf ? ` (liste du ${formatPartialDate(sp.asOf)})` : ""}.`;
}

export function candidacyAnswer(c: Candidate2027): string {
  const name = candidateFullName(c);
  const tail = ` Source : ${c.sourceLabel}, vérifiée le ${formatPartialDate(c.dateVerification)}. Cette liste est établie à partir de sources de presse et n'a aucune valeur officielle : la liste officielle sera publiée par le Conseil constitutionnel après validation des parrainages.`;
  const note = c.note ? ` ${c.note.replace(/\.?$/, ".")}` : "";
  if (c.statut === "declare") {
    return `Oui, ${name} figure parmi les candidats déclarés à l'élection présidentielle de 2027${c.dateDeclaration ? `, depuis le ${formatPartialDate(c.dateDeclaration)}` : ""}${c.parti && c.parti !== "à confirmer" ? ` (${c.parti})` : ""}.${note}${tail}`;
  }
  if (c.statut === "retire") {
    return `Non, la candidature ${deName(name)} à l'élection présidentielle de 2027 est signalée comme retirée.${note}${tail}`;
  }
  return `${name} figure parmi les personnalités pressenties pour l'élection présidentielle de 2027, mais sa candidature n'est pas déclarée à la date de vérification.${note}${tail}`;
}

export interface FaqItem {
  q: string;
  a: string;
}

export function candidateFaq(
  c: Candidate2027,
  ctx: { polls: PollSummary; history: CandidateHistoryEntry[]; sponsorship: Sponsorship },
): FaqItem[] {
  const name = candidateFullName(c);
  return [
    { q: `${name} est-il candidat en 2027 ?`, a: candidacyAnswer(c) },
    { q: `Que disent les sondages sur ${name} ?`, a: pollsAnswer(c, ctx.polls) },
    { q: `Quels sont les résultats ${deName(name)} aux élections présidentielles passées ?`, a: historyAnswer(c, ctx.history) },
    { q: `${name} a-t-il obtenu des parrainages pour 2027 ?`, a: sponsorshipAnswer(c, ctx.sponsorship) },
  ];
}

/** 3 candidats les plus testés (hors retirés) + 3 voisins alphabétiques : mêmes critères pour toutes les fiches. */
export function relatedCandidates(c: Candidate2027, all: readonly Candidate2027[], dataset: Polls2027Dataset) {
  const counts = new Map(all.map((x) => [x.slug, summarizePolls(x, dataset).pollCount]));
  const byPolls = all
    .filter((x) => x.slug !== c.slug && x.statut !== "retire" && (counts.get(x.slug) ?? 0) > 0)
    .sort((a, b) => (counts.get(b.slug) ?? 0) - (counts.get(a.slug) ?? 0) || a.nom.localeCompare(b.nom, "fr"))
    .slice(0, 3);
  const sorted = [...all].sort((a, b) => a.nom.localeCompare(b.nom, "fr") || a.prenom.localeCompare(b.prenom, "fr"));
  const i = sorted.findIndex((x) => x.slug === c.slug);
  const neighbours: Candidate2027[] = [];
  for (let k = 1; neighbours.length < 3 && k < sorted.length; k++) {
    const x = sorted[(i + k) % sorted.length];
    if (!byPolls.some((p) => p.slug === x.slug)) neighbours.push(x);
  }
  return { byPolls, neighbours };
}
