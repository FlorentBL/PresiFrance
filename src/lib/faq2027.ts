import type { Calendar2027Dataset, Candidates2027Dataset } from "@/lib/api/presidential2027Api";

// Miroir de scripts/lib/seo-content/faq2027.mjs (HTML prérendu) : garder les deux textes identiques.

export interface FaqItem {
  q: string;
  a: string;
}

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export const frDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d === 1 ? "1er" : d} ${MONTHS[m - 1]} ${y}`;
};

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

export function buildFaq2027(candidats: Candidates2027Dataset, calendrier: Calendar2027Dataset): FaqItem[] {
  const ev = (id: string) => calendrier.evenements.find((e) => e.id === id);
  const t1 = ev("t1");
  const t2 = ev("t2");
  const faq: FaqItem[] = [];

  if (t1?.date && t2?.date) {
    faq.push({
      q: "Quelle est la date de l'élection présidentielle 2027 ?",
      a: `Le 1er tour a lieu le dimanche ${frDate(t1.date)} et le 2nd tour le dimanche ${frDate(t2.date)}. Ces dates ont été arrêtées par le Conseil des ministres du 1er juillet 2026 (source : ${t1.sourceLabel}, vérifié le ${frDate(t1.dateVerification)}). Dans plusieurs collectivités d'outre-mer, le vote a lieu la veille, le samedi.`,
    });
  }

  const count = (s: string) => candidats.candidats.filter((c) => c.statut === s).length;
  const declared = count("declare");
  const pressentis = count("pressenti");
  const retires = count("retire");
  faq.push({
    q: "Combien de candidats sont déclarés pour la présidentielle 2027 ?",
    a: `Au ${frDate(candidats.meta.dateVerification)}, notre liste compte ${plural(declared, "candidat déclaré", "candidats déclarés")}, ${plural(pressentis, "personnalité pressentie", "personnalités pressenties")} et ${plural(retires, "candidature retirée", "candidatures retirées")}. Cette liste est établie à partir de sources de presse et n'a aucune valeur officielle : la liste officielle est publiée par le Conseil constitutionnel après validation des parrainages.`,
  });

  faq.push({
    q: "Qui peut être candidat et comment fonctionnent les parrainages ?",
    a: "Pour se présenter, un candidat doit réunir 500 présentations (parrainages) d'élus, issues d'au moins 30 départements ou collectivités d'outre-mer, sans que plus d'un dixième des signataires dépende du même département ou de la même collectivité (loi n° 62-1292 du 6 novembre 1962, article 3). Le Conseil constitutionnel contrôle et publie ces parrainages, puis arrête la liste officielle des candidats. Le calendrier de cette collecte n'est pas encore confirmé.",
  });

  faq.push({
    q: "Quel est le mode de scrutin de l'élection présidentielle ?",
    a: "Le Président de la République est élu au suffrage universel direct, au scrutin majoritaire à deux tours (article 7 de la Constitution). Est élu au 1er tour le candidat qui obtient la majorité absolue des suffrages exprimés. Sinon, un 2nd tour oppose les deux candidats arrivés en tête, deux semaines plus tard.",
  });

  return faq;
}
