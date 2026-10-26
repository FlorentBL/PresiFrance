// Utilitaires HTML partagés par les constructeurs de contenu prérendu.

const nf = new Intl.NumberFormat("fr-FR");
const pf = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export const fmtInt = (n) => nf.format(Math.round(n)).replace(/[  ]/g, " ");
export const fmtPct = (n) => `${pf.format(n)} %`;

/** « DE GAULLE » -> « de Gaulle », « LE PEN » -> « Le Pen », « DUPONT-AIGNAN » -> « Dupont-Aignan ». */
export function formatSurname(nom) {
  return nom
    .toLocaleLowerCase("fr")
    .replace(/(^|[\s'’-])(\p{L})/gu, (_, sep, ch) => sep + ch.toLocaleUpperCase("fr"))
    .replace(/(^| )(De|Du|Des)(?= )/g, (_, sp, w) => sp + w.toLowerCase())
    .replace(/(^| )D'/g, "$1d'");
}

export function candidateName(prenom, nom) {
  return `${prenom} ${formatSurname(nom)}`.trim();
}

/** Texte visible (hors balises) — sert à compter les mots. */
export function visibleText(html) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function wordCount(html) {
  const t = visibleText(html);
  return t ? t.split(" ").length : 0;
}

export function link(href, label) {
  return `<a href="${esc(href)}">${esc(label)}</a>`;
}

export function linkList(items) {
  return `<ul>${items.map(([href, label]) => `<li>${link(href, label)}</li>`).join("")}</ul>`;
}

/** tableau accessible : head = ["Col", ...], rows = [["cell", ...]] (cellules déjà échappées). */
export function table(caption, head, rows) {
  return `<table><caption>${esc(caption)}</caption><thead><tr>${head.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`)).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

/** Conteneur commun : <main> avec H1, corps et mention de source. */
export function page({ h1, intro, sections = [], source }) {
  return `<main class="prerender-content"><h1>${esc(h1)}</h1>${intro ? `<p>${intro}</p>` : ""}${sections.join("")}${
    source ? `<p><small>${source}</small></p>` : ""
  }</main>`;
}
