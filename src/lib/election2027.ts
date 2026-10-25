/**
 * Calendrier de la présidentielle 2027.
 * Le compte à rebours de l'accueil n'apparaît que si `firstRoundDate` ET `source` sont renseignées ;
 * sinon l'accueil affiche « printemps 2027 ». Garder ces dates alignées sur
 * public/data/presidential/2027/calendrier.json.
 */
export const ELECTION_2027 = {
  label: "printemps 2027",
  /** Date ISO du 1er tour, uniquement si officielle. */
  firstRoundDate: "2027-04-18" as string | null,
  /** Source de la date (URL ou texte) — obligatoire dès que firstRoundDate est renseignée. */
  source: "https://www.service-public.gouv.fr/particuliers/actualites/A15053?lang=fr" as string | null,
  /** Date de vérification (AAAA-MM-JJ). */
  verifiedOn: "2026-10-25" as string | null,
};

/** Jours restants avant le 1er tour, ou null si la date n'est pas officielle/sourcée ou déjà passée. */
export function daysUntilFirstRound(now: Date = new Date()): number | null {
  const { firstRoundDate, source } = ELECTION_2027;
  if (!firstRoundDate || !source) return null;
  const target = new Date(`${firstRoundDate}T00:00:00+02:00`).getTime();
  if (Number.isNaN(target)) return null;
  const days = Math.ceil((target - now.getTime()) / 86_400_000);
  return days >= 0 ? days : null;
}
