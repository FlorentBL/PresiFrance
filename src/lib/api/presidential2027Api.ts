export type CandidateStatus = "declare" | "pressenti" | "retire";

export interface Candidate2027 {
  slug: string;
  prenom: string;
  nom: string;
  /** Parti ou soutien, « à confirmer » si inconnu. */
  parti: string;
  statut: CandidateStatus;
  /** Date ISO complète (AAAA-MM-JJ) ou partielle (AAAA-MM) ; null = à confirmer. */
  dateDeclaration: string | null;
  sourceUrl: string;
  sourceLabel: string;
  dateVerification: string;
  note?: string;
}

export interface Candidates2027Dataset {
  meta: { election: number; avertissement: string; dateVerification: string };
  candidats: Candidate2027[];
}

export interface CalendarEvent2027 {
  id: string;
  label: string;
  /** ISO AAAA-MM-JJ ; null = à confirmer. */
  date: string | null;
  dateFin: string | null;
  statut: "officiel" | "a_confirmer";
  detail: string;
  sourceUrl: string | null;
  sourceLabel: string | null;
  dateVerification: string;
}

export interface Calendar2027Dataset {
  meta: { election: number; dateVerification: string };
  evenements: CalendarEvent2027[];
}

export const STATUS_LABEL: Record<CandidateStatus, string> = {
  declare: "Déclaré",
  pressenti: "Pressenti",
  retire: "Retiré",
};

const STATUS_ORDER: readonly CandidateStatus[] = ["declare", "pressenti", "retire"];

export const STATUS_GROUP_TITLE: Record<CandidateStatus, string> = {
  declare: "Candidats déclarés",
  pressenti: "Personnalités pressenties",
  retire: "Candidatures retirées",
};

/** Regroupe par statut (déclarés, pressentis, retirés) en conservant l'ordre reçu ; groupes vides omis. */
export function groupCandidatesByStatus<T extends { statut: CandidateStatus }>(
  list: readonly T[],
): { statut: CandidateStatus; candidats: T[] }[] {
  return STATUS_ORDER.map((statut) => ({ statut, candidats: list.filter((c) => c.statut === statut) })).filter(
    (g) => g.candidats.length > 0,
  );
}

/** Ordre alphabétique strict (nom puis prénom), identique pour tous les candidats. */
export function sortCandidatesAlphabetically<T extends { nom: string; prenom: string }>(list: readonly T[]): T[] {
  return [...list].sort(
    (a, b) => a.nom.localeCompare(b.nom, "fr") || a.prenom.localeCompare(b.prenom, "fr"),
  );
}

export async function getCandidates2027(): Promise<Candidates2027Dataset> {
  const res = await fetch("/data/presidential/2027/candidats.json");
  if (!res.ok) throw new Error("Impossible de charger les candidats 2027.");
  const data = (await res.json()) as Candidates2027Dataset;
  return { ...data, candidats: sortCandidatesAlphabetically(data.candidats) };
}

export async function getCalendar2027(): Promise<Calendar2027Dataset> {
  const res = await fetch("/data/presidential/2027/calendrier.json");
  if (!res.ok) throw new Error("Impossible de charger le calendrier 2027.");
  return res.json() as Promise<Calendar2027Dataset>;
}

export function findCandidateBySlug(list: readonly Candidate2027[], slug: string | undefined): Candidate2027 | undefined {
  return list.find((c) => c.slug === slug);
}

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** Formate une date ISO complète ou partielle ; null → « à confirmer ». */
export function formatPartialDate(iso: string | null | undefined): string {
  if (!iso) return "à confirmer";
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(iso);
  if (!m) return "à confirmer";
  const [, y, mo, d] = m;
  const month = MONTHS[Number(mo) - 1];
  if (!month) return "à confirmer";
  if (!d) return `${month} ${y}`;
  return `${Number(d) === 1 ? "1er" : Number(d)} ${month} ${y}`;
}

export interface CandidateHistoryEntry {
  year: number;
  round: 1 | 2;
  pourcentExprimes: number;
  voix: number;
}

type NationalFile = Record<
  string,
  Record<string, { candidates: { prenom: string; nom: string; pourcentExprimes: number; voix: number }[] }>
>;

const normalize = (prenom: string, nom: string) =>
  `${prenom} ${nom}`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Résultats nationaux passés d'un candidat, retrouvés par nom dans national-results.json. */
export function buildCandidateHistory(
  candidate: Pick<Candidate2027, "prenom" | "nom">,
  data: NationalFile,
): CandidateHistoryEntry[] {
  const target = normalize(candidate.prenom, candidate.nom);
  const out: CandidateHistoryEntry[] = [];
  for (const year of Object.keys(data).sort((a, b) => Number(b) - Number(a))) {
    for (const round of [1, 2] as const) {
      const found = data[year]?.[`t${round}`]?.candidates.find((c) => normalize(c.prenom, c.nom) === target);
      if (found) {
        out.push({ year: Number(year), round, pourcentExprimes: found.pourcentExprimes, voix: found.voix });
      }
    }
  }
  return out;
}

export async function getCandidateHistory(
  candidate: Pick<Candidate2027, "prenom" | "nom">,
): Promise<CandidateHistoryEntry[]> {
  const res = await fetch("/data/presidential/national-results.json");
  if (!res.ok) return [];
  return buildCandidateHistory(candidate, (await res.json()) as NationalFile);
}
