import { DEFAULT_YEAR, PRESIDENTIAL_YEARS_DESC, type PresidentialYear } from "@/lib/elections";
import { SITE_URL } from "@/lib/site";

export type EmbedKind = "carte" | "commune";

export interface EmbedOptions {
  kind: EmbedKind;
  year: PresidentialYear;
  round?: 1 | 2;
  /** Code INSEE (5 caractères, ex. 44109 ou 2A004), requis pour kind = "commune". */
  code?: string;
  width?: string;
  height?: number;
}

export const EMBED_DEFAULT_HEIGHT = { carte: 520, commune: 620 } as const;

/** Année valide issue d'un paramètre d'URL, sinon l'année par défaut. */
export function parseEmbedYear(raw: string | null | undefined): PresidentialYear {
  const n = Number(raw);
  return (PRESIDENTIAL_YEARS_DESC as number[]).includes(n) ? (n as PresidentialYear) : DEFAULT_YEAR;
}

export function parseEmbedRound(raw: string | null | undefined): 1 | 2 {
  return raw === "2" ? 2 : 1;
}

/** Code commune INSEE : 5 caractères, 2A/2B pour la Corse. */
export function isValidCommuneCode(code: string | undefined): code is string {
  return !!code && /^(\d{5}|2[AB]\d{3})$/i.test(code);
}

export function buildEmbedPath(opts: EmbedOptions): string {
  if (opts.kind === "commune") {
    return `/embed/commune/${encodeURIComponent((opts.code ?? "").toUpperCase())}?year=${opts.year}`;
  }
  return `/embed/carte?year=${opts.year}&round=${opts.round ?? 1}`;
}

export function buildEmbedUrl(opts: EmbedOptions, origin: string = SITE_URL): string {
  return `${origin.replace(/\/+$/, "")}${buildEmbedPath(opts)}`;
}

const escapeAttr = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Code HTML <iframe> prêt à coller. */
export function buildIframeCode(opts: EmbedOptions, origin: string = SITE_URL): string {
  const height = opts.height ?? EMBED_DEFAULT_HEIGHT[opts.kind];
  const title = opts.kind === "carte" ? `Carte des résultats de la présidentielle ${opts.year} — PrésiFrance` : `Résultats de la présidentielle ${opts.year} — PrésiFrance`;
  return [
    `<iframe src="${escapeAttr(buildEmbedUrl(opts, origin))}"`,
    `  title="${escapeAttr(title)}"`,
    `  width="${escapeAttr(opts.width || "100%")}" height="${height}"`,
    `  style="border:0;max-width:100%" loading="lazy"`,
    `  referrerpolicy="strict-origin-when-cross-origin"></iframe>`,
  ].join("\n");
}
