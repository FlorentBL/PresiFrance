/**
 * Site partenaire DépensesPubliques.fr (budget, dette et fiscalité des communes).
 * Ses fiches commune sont en /commune/<nom-slugifié>-<code INSEE>, ses départements en
 * /departement/<code> : même slugification que son src/lib/slug.ts.
 */
export const DEPENSES_PUBLIQUES_URL = "https://depensespubliques.fr";
export const DEPENSES_PUBLIQUES_NAME = "DépensesPubliques.fr";

export function slugifyCommuneName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function depensesCommuneUrl(nom: string, code: string): string {
  const slug = slugifyCommuneName(nom);
  return `${DEPENSES_PUBLIQUES_URL}/commune/${slug ? `${slug}-${code}` : code}`;
}

export function depensesDepartementUrl(code: string): string {
  return `${DEPENSES_PUBLIQUES_URL}/departement/${code}`;
}

export const DEPENSES_DETTE_FRANCE_URL = `${DEPENSES_PUBLIQUES_URL}/dette-publique-france`;
