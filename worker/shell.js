// Habillage du gabarit HTML (dist/app-shell.html) : métadonnées SEO et contenu de repli. Aucune dépendance (Worker + Node).
export const SITE_URL = "https://presifrance.fr";
/** Chemin interne du gabarit HTML (dist/app-shell.html, jamais publié : le Worker répond 404 à cette adresse). */
export const SHELL_PATH = "/app-shell";

const escapeHtml = (value) =>
  String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const pct = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtPct = (n) => `${pct.format(n)} %`;

function upsertMeta(html, selector, tag) {
  const re = new RegExp(`<meta\\s+${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^>]*>`, "i");
  return re.test(html) ? html.replace(re, () => tag) : html.replace("</head>", () => `  ${tag}\n</head>`);
}

/**
 * @param {string} shell gabarit HTML (balise #root vide, aucune canonique)
 * @param {{ title: string, description: string, canonical?: string, noindex?: boolean, bodyHtml: string }} page
 */
export function renderShell(shell, { title, description, canonical, noindex, bodyHtml }) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  let html = shell.replace(/<title>.*?<\/title>/is, () => `<title>${t}</title>`);
  html = upsertMeta(html, 'name="description"', `<meta name="description" content="${d}" />`);
  html = upsertMeta(html, 'property="og:title"', `<meta property="og:title" content="${t}" />`);
  html = upsertMeta(html, 'property="og:description"', `<meta property="og:description" content="${d}" />`);
  html = upsertMeta(html, 'name="twitter:title"', `<meta name="twitter:title" content="${t}" />`);
  html = upsertMeta(html, 'name="twitter:description"', `<meta name="twitter:description" content="${d}" />`);
  if (canonical) {
    const url = escapeHtml(`${SITE_URL}${canonical}`);
    html = upsertMeta(html, 'property="og:url"', `<meta property="og:url" content="${url}" />`);
    html = html.replace("</head>", () => `  <link rel="canonical" href="${url}" />\n</head>`);
  }
  if (noindex) html = html.replace("</head>", () => `  <meta name="robots" content="noindex, follow" />\n</head>`);
  return html.replace('<div id="root"></div>', () => `<div id="root">${bodyHtml}</div>`);
}

/** Contenu de la page 404 (React affiche la page 404 du site au montage et remplace ce repli). */
export function notFoundPage() {
  return {
    title: "Page introuvable — PrésiFrance",
    description: "La page demandée n'existe pas.",
    noindex: true,
    bodyHtml:
      '<main><h1>Page introuvable</h1><p>L\'adresse demandée n\'existe pas sur PrésiFrance.</p><p><a href="/">Retour à l\'accueil</a> · <a href="/resultats-presidentielle">Résultats des présidentielles</a> · <a href="/explorer">Explorer par département</a></p></main>',
  };
}

/** Page d'attente (collectivité d'outre-mer ou commune sans résultats) : servie sans canonique, hors index. */
export function genericAppPage() {
  return {
    title: "Résultats des élections présidentielles par commune — PrésiFrance",
    description: "Résultats des élections présidentielles par commune : scores des candidats, participation et abstention.",
    noindex: true,
    bodyHtml: '<main><h1>Résultats des élections présidentielles par commune</h1><p><a href="/explorer">Explorer par département</a></p></main>',
  };
}

/**
 * Fiche d'une commune non prérendue, d'après une ligne de l'index départemental (voir scripts/lib/commune-index.mjs).
 * Sans résultats 2022 : titre et canonique propres, mais hors index (noindex).
 */
export function communePage(code, dep, shard) {
  const row = shard.r[code];
  const name = row[0];
  const depName = shard.d;
  const title = `Résultats des élections à ${name}`;
  const canonical = `/commune/${code}`;
  const intro = `${name} est une commune du département ${depName} (code INSEE ${code}). La fiche présente les résultats de la présidentielle et, lorsque la commune y figure, ceux des législatives et des européennes.`;
  const links = `<p><a href="/explorer/${escapeHtml(dep)}">Communes du département ${escapeHtml(depName)}</a> · <a href="/resultats-presidentielle-par-commune">Chercher une autre commune</a> · <a href="/">Accueil PrésiFrance</a></p>`;

  if (row.length < 8) {
    return {
      title,
      description: `${name} (${depName}) : résultats des élections présidentielles de la commune. Données officielles.`,
      canonical,
      noindex: true,
      bodyHtml: `<main><h1>${escapeHtml(`Résultats des élections à ${name}`)}</h1><p>${escapeHtml(intro)}</p>${links}</main>`,
    };
  }
  const [, inscrits, votants, exprimes, i1, v1, i2, v2] = row;
  const first = shard.c[i1];
  const second = shard.c[i2];
  const firstPct = fmtPct((v1 / exprimes) * 100);
  const secondPct = fmtPct((v2 / exprimes) * 100);
  const turnout = fmtPct((votants / inscrits) * 100);
  const sentence = `Au premier tour de la présidentielle 2022, ${first} arrive en tête à ${name} avec ${firstPct} des suffrages exprimés, devant ${second} (${secondPct}). La participation y est de ${turnout}.`;
  return {
    title,
    description: `${name} (${depName}) : résultats de la présidentielle 2022. ${first} arrive en tête (${firstPct}) au 1er tour, participation ${turnout}. Données officielles.`,
    canonical,
    noindex: false,
    bodyHtml: `<main><h1>${escapeHtml(`Résultats des élections à ${name}`)}</h1><p>${escapeHtml(intro)}</p><h2>${escapeHtml(`Présidentielle 2022 à ${name}`)}</h2><p>${escapeHtml(sentence)}</p>${links}</main>`,
  };
}
