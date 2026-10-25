/**
 * Calendrier de la présidentielle 2027.
 * `firstRoundDate` reste à `null` tant que la date n'est pas officielle (décret de convocation) :
 * l'accueil affiche alors « printemps 2027 » sans compte à rebours. Pour l'activer, renseigner
 * une date ISO (ex. "2027-04-xx") ET sa source/date de vérification ci-dessous.
 */
export const ELECTION_2027 = {
  label: "printemps 2027",
  /** Date ISO du 1er tour, uniquement si officielle. */
  firstRoundDate: null as string | null,
  /** Source de la date (URL ou texte) — obligatoire dès que firstRoundDate est renseignée. */
  source: null as string | null,
  /** Date de vérification (AAAA-MM-JJ). */
  verifiedOn: null as string | null,
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
