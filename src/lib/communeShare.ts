import type { CandidateResult, ElectionResult } from "@/lib/api/resultsApi";
import type { NationalResult } from "@/lib/api/nationalResultsApi";
import { SITE_URL } from "@/lib/site";
import { communeDescription, communeTitle } from "@/lib/scrutinsCore.mjs";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const fr = (n: number, d = 1) => n.toFixed(d).replace(".", ",");

export const fullName = (c: Pick<CandidateResult, "prenom" | "nom">): string => {
  const cap = (s: string) =>
    s.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
  return `${cap(c.prenom)} ${c.nom.charAt(0).toUpperCase()}${c.nom.slice(1).toLowerCase()}`.trim();
};

export function sameCandidate(a: Pick<CandidateResult, "nom">, b: Pick<CandidateResult, "nom">): boolean {
  return norm(a.nom) === norm(b.nom);
}

/** Candidat arrivé en tête dans les résultats, ou null. */
export const leader = (r: { candidates: CandidateResult[] } | null | undefined) => r?.candidates?.[0] ?? null;

export interface CommuneSummary {
  sentence: string;
  localWinner: CandidateResult | null;
  nationalWinnerName: string | null;
  sameAsNational: boolean | null;
  /** Écart (points) de participation commune − national. */
  turnoutGap: number | null;
}

/** Résumé factuel en une phrase : vainqueur local vs national, écart, participation. */
export function buildCommuneSummary(opts: {
  commune: string;
  year: number;
  round: 1 | 2;
  results: ElectionResult;
  national: NationalResult | null;
}): CommuneSummary {
  const { commune, year, round, results, national } = opts;
  const winner = leader(results);
  const turnout = results.votantsPourcent;
  const roundLabel = round === 1 ? "premier tour" : "second tour";
  if (!winner) {
    return { sentence: `Résultats détaillés indisponibles pour ${commune} en ${year}.`, localWinner: null, nationalWinnerName: null, sameAsNational: null, turnoutGap: null };
  }
  const natWinner = national?.candidates?.[0] ?? null;
  const turnoutGap = national ? turnout - national.participation : null;
  const where = results.niveau === "departement" ? `Dans le département (${results.nomDepartement})` : `À ${commune}`;
  let sentence = `${where}, ${fullName(winner)} arrive en tête au ${roundLabel} de la présidentielle ${year} avec ${fr(winner.pourcentExprimes)} % des suffrages exprimés`;
  let sameAsNational: boolean | null = null;
  if (natWinner) {
    sameAsNational = sameCandidate(winner, natWinner);
    const gap = winner.pourcentExprimes - natWinner.pourcentExprimes;
    if (sameAsNational) {
      const abs = Math.abs(gap);
      sentence += `, comme au niveau national (${fr(natWinner.pourcentExprimes)} %, soit ${abs < 0.05 ? "un score identique" : `${fr(abs)} point${abs >= 2 ? "s" : ""} de ${gap > 0 ? "plus" : "moins"}`})`;
    } else {
      sentence += `, alors que ${fullName(natWinner)} l'emporte au niveau national avec ${fr(natWinner.pourcentExprimes)} %`;
    }
  }
  sentence += `, pour une participation de ${fr(turnout)} %`;
  if (turnoutGap !== null && Math.abs(turnoutGap) >= 0.05) {
    sentence += ` (${fr(Math.abs(turnoutGap))} point${Math.abs(turnoutGap) >= 2 ? "s" : ""} de ${turnoutGap > 0 ? "plus" : "moins"} que la moyenne nationale)`;
  }
  return { sentence: `${sentence}.`, localWinner: winner, nationalWinnerName: natWinner ? fullName(natWinner) : null, sameAsNational, turnoutGap };
}

export function communeSeoTitle(nom: string): string {
  return communeTitle(nom);
}

/** `summary` : phrase de synthèse facultative placée en tête ; `scrutinIds` : scrutins (hors présidentielle) disponibles. */
export function communeSeoDescription(nom: string, summary?: string, scrutinIds: string[] = []): string {
  const base = communeDescription(nom, scrutinIds);
  return summary && summary.length + 1 + base.length < 320 ? `${summary} ${base}` : base;
}

export function communeShareUrl(code: string, year: number, round: number, origin: string = SITE_URL): string {
  return `${origin}/commune/${code}?year=${year}&round=${round}`;
}

export interface NeighbourInput {
  code: string;
  nom: string;
  population: number;
  centre?: { coordinates: [number, number] };
}

/** Distance orthodromique en km (haversine), coordonnées [lon, lat]. */
export function distanceKm(a: [number, number], b: [number, number]): number {
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad;
  const dLon = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Communes les plus proches (même département), hors la commune elle-même. */
export function nearestCommunes<T extends NeighbourInput>(
  self: { code: string; centre?: { coordinates: [number, number] } },
  all: T[],
  limit = 6
): Array<T & { km: number }> {
  const origin = self.centre?.coordinates;
  if (!origin) return [];
  return all
    .filter((c) => c.code !== self.code && c.centre?.coordinates)
    .map((c) => ({ ...c, km: distanceKm(origin, c.centre!.coordinates) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}

export interface ShareCardData {
  commune: string;
  year: number;
  round: 1 | 2;
  winnerName: string;
  winnerPct: number;
  winnerColor: string;
  turnout: number;
  nationalLine: string | null;
  top: Array<{ name: string; pct: number; color: string }>;
  url: string;
}

export function buildShareCardData(opts: {
  commune: string;
  year: number;
  round: 1 | 2;
  results: ElectionResult;
  national: NationalResult | null;
  colorOf: (c: CandidateResult, i: number) => string;
  url: string;
}): ShareCardData | null {
  const { results } = opts;
  const w = leader(results);
  if (!w) return null;
  const nat = opts.national?.candidates?.[0];
  return {
    commune: opts.commune,
    year: opts.year,
    round: opts.round,
    winnerName: fullName(w),
    winnerPct: w.pourcentExprimes,
    winnerColor: opts.colorOf(w, 0),
    turnout: results.votantsPourcent,
    nationalLine: nat ? `France : ${fullName(nat)} ${fr(nat.pourcentExprimes)} % · participation ${fr(opts.national!.participation)} %` : null,
    top: results.candidates.slice(0, 4).map((c, i) => ({ name: fullName(c), pct: c.pourcentExprimes, color: opts.colorOf(c, i) })),
    url: opts.url,
  };
}

/** Dessine la carte de partage 1200×630 (design « Nuit électorale »). */
export function drawShareCard(ctx: CanvasRenderingContext2D, d: ShareCardData, W = 1200, H = 630): void {
  const bg = "#0a0d18";
  const fg = "#eef0f5";
  const muted = "#a9b1c0";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // halos tricolores
  const blue = ctx.createRadialGradient(140, 0, 0, 140, 0, 620);
  blue.addColorStop(0, "rgba(61,129,255,0.30)");
  blue.addColorStop(1, "rgba(61,129,255,0)");
  ctx.fillStyle = blue;
  ctx.fillRect(0, 0, W, H);
  const red = ctx.createRadialGradient(W - 100, 0, 0, W - 100, 0, 520);
  red.addColorStop(0, "rgba(236,64,96,0.24)");
  red.addColorStop(1, "rgba(236,64,96,0)");
  ctx.fillStyle = red;
  ctx.fillRect(0, 0, W, H);

  const heading = '"Fraunces", Georgia, serif';
  const body = 'Inter, system-ui, sans-serif';
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = fg;
  ctx.font = `700 34px ${heading}`;
  ctx.fillText("Prési", 64, 74);
  const w1 = ctx.measureText("Prési").width;
  ctx.fillStyle = "#6eaaff";
  ctx.fillText("France", 64 + w1, 74);

  ctx.fillStyle = "#6eaaff";
  ctx.font = `600 20px ${body}`;
  ctx.fillText(`PRÉSIDENTIELLE ${d.year} · ${d.round === 1 ? "1ER TOUR" : "2ND TOUR"}`, 64, 140);

  ctx.fillStyle = fg;
  let size = 76;
  ctx.font = `800 ${size}px ${heading}`;
  while (ctx.measureText(d.commune).width > W - 128 && size > 36) {
    size -= 4;
    ctx.font = `800 ${size}px ${heading}`;
  }
  ctx.fillText(d.commune, 64, 225);

  ctx.fillStyle = muted;
  ctx.font = `500 24px ${body}`;
  ctx.fillText("Arrive en tête", 64, 285);
  ctx.fillStyle = d.winnerColor;
  ctx.font = `800 52px ${heading}`;
  ctx.fillText(`${d.winnerName} · ${fr(d.winnerPct)} %`, 64, 345);

  // barres top 4
  const barX = 64;
  const barW = 700;
  d.top.forEach((c, i) => {
    const y = 395 + i * 44;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(barX, y, barW, 14);
    ctx.fillStyle = c.color;
    ctx.fillRect(barX, y, Math.max(2, Math.min(100, c.pct) / 100 * barW), 14);
    ctx.fillStyle = fg;
    ctx.font = `500 20px ${body}`;
    ctx.fillText(c.name, barX + barW + 24, y + 14);
    ctx.fillStyle = muted;
    ctx.textAlign = "right";
    ctx.fillText(`${fr(c.pct)} %`, W - 64, y + 14);
    ctx.textAlign = "left";
  });

  ctx.fillStyle = muted;
  ctx.font = `500 22px ${body}`;
  ctx.fillText(`Participation ${fr(d.turnout)} %${d.nationalLine ? ` · ${d.nationalLine}` : ""}`.slice(0, 120), 64, 585);
  ctx.textAlign = "right";
  ctx.fillText(d.url.replace(/^https?:\/\//, "").replace(/\?.*$/, ""), W - 64, 585);
  ctx.textAlign = "left";

  // liseré tricolore
  const third = W / 3;
  ctx.fillStyle = "#3d81ff";
  ctx.fillRect(0, H - 8, third, 8);
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(third, H - 8, third, 8);
  ctx.fillStyle = "#ec4060";
  ctx.fillRect(third * 2, H - 8, third, 8);
}

export async function renderShareCardBlob(d: ShareCardData): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  try {
    await document.fonts?.load('800 40px "Fraunces"');
    await document.fonts?.load("500 20px Inter");
  } catch {
    /* polices système en repli */
  }
  drawShareCard(ctx, d);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

export function shareFilename(commune: string, year: number): string {
  const slug = commune.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `presifrance-${slug || "commune"}-${year}.png`;
}
