// Autres scrutins par commune et par département (législatives, européennes, municipales) : lecture des fichiers
// compacts de public/data/scrutins (scripts/lib/scrutins.mjs) et textes affichés ou prérendus.
// Module partagé : l'interface React (src/lib/api/scrutinsApi.ts) et le prérendu HTML (scripts/lib/seo-content)
// l'importent tous deux, de sorte que les textes restent identiques. Types : scrutinsCore.d.mts.
import nuances from "../content/nuances.json" with { type: "json" };

/** Du plus récent au plus ancien (ordre d'affichage). `type` regroupe les années d'un même scrutin. */
export const SCRUTINS = [
  { id: "municipales-2026", type: "municipales", year: 2026, label: "Municipales 2026", short: "municipales 2026", kind: "local", tours: [1, 2] },
  { id: "legislatives-2024", type: "legislatives", year: 2024, label: "Législatives 2024", short: "législatives 2024", kind: "nuance", tours: [1, 2] },
  { id: "europeennes-2024", type: "europeennes", year: 2024, label: "Européennes 2024", short: "européennes 2024", kind: "list", tours: [1] },
  { id: "municipales-2020", type: "municipales", year: 2020, label: "Municipales 2020", short: "municipales 2020", kind: "local", tours: [1, 2] },
  { id: "europeennes-2019", type: "europeennes", year: 2019, label: "Européennes 2019", short: "européennes 2019", kind: "list", tours: [1] },
  { id: "legislatives-2022", type: "legislatives", year: 2022, label: "Législatives 2022", short: "législatives 2022", kind: "nuance", tours: [1, 2] },
];

export const SCRUTIN_FILE_VERSION = "s1";

export const scrutinById = (id) => SCRUTINS.find((s) => s.id === id);

export const tourLabel = (scrutin, tour) => (scrutin.tours.length === 1 ? "Tour unique" : tour === 1 ? "1er tour" : "2nd tour");

const TYPE_LABELS = { legislatives: "législatives", europeennes: "européennes", municipales: "municipales" };
const TYPE_ORDER = ["legislatives", "europeennes", "municipales"];

/** « législatives 2022 et 2024, européennes 2019 et 2024 et municipales 2020 et 2026 » pour les ids donnés. */
export function coverageLabel(ids) {
  const groups = TYPE_ORDER.map((type) => {
    const years = SCRUTINS.filter((s) => s.type === type && ids.includes(s.id))
      .map((s) => s.year)
      .sort((a, b) => a - b);
    if (!years.length) return null;
    const list = years.length === 1 ? String(years[0]) : `${years.slice(0, -1).join(", ")} et ${years[years.length - 1]}`;
    return `${TYPE_LABELS[type]} ${list}`;
  }).filter(Boolean);
  if (groups.length <= 1) return groups[0] ?? "";
  return `${groups.slice(0, -1).join(", ")} et ${groups[groups.length - 1]}`;
}

const nf = new Intl.NumberFormat("fr-FR");
const pf = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const fmtInt = (n) => nf.format(Math.round(n)).replace(/[\u202f\u00a0]/g, "\u00a0");
export const fmtPct = (n) => `${pf.format(n)}\u00a0%`;

export const nuanceLabel = (code) => (code && code !== "_source" && nuances[code]) || "";

/**
 * Tête de liste lisible. Fichiers 2019 : « BARDELLA Jordan » (nom en capitales d'abord) -> « Jordan Bardella ».
 * Fichiers municipaux (assemblés par le pipeline) : « Daniel FABRE » -> « Daniel Fabre ».
 */
export function formatHead(raw) {
  const words = String(raw ?? "").trim().split(/\s+/).filter(Boolean);
  const isUpper = (w) => w === w.toLocaleUpperCase("fr") && /\p{L}/u.test(w);
  const title = (w) => w.toLocaleLowerCase("fr").replace(/(^|[\s'’-])(\p{L})/gu, (_, sep, ch) => sep + ch.toLocaleUpperCase("fr"));
  if (!words.length) return "";
  const lead = [];
  while (words.length && isUpper(words[0])) lead.push(words.shift());
  if (lead.length && words.length) return [...words, ...lead.map(title)].join(" ");
  return [...lead, ...words].map((w) => (isUpper(w) ? title(w) : w)).join(" ");
}

const safeDiv = (a, b) => (b > 0 ? (a / b) * 100 : 0);

function finish(base, lines) {
  lines.sort((a, b) => b.voix - a.voix);
  for (const l of lines) l.pct = safeDiv(l.voix, base.exprimes);
  return { ...base, participation: safeDiv(base.votants, base.inscrits), lines };
}

function counts(row) {
  const [nomCommune, inscrits, abstentions, votants, blancs, nuls, exprimes] = row;
  return { nomCommune, inscrits, abstentions, votants, blancs, nuls, exprimes };
}

/** Libellé de liste européenne : l'intitulé complet quand il reste court, l'abrégé (parfois cryptique en 2024) sinon. */
const listLabel = (e) => (e[1] && e[1].length <= 60 ? e[1] : e[0]);

function fixedLines(file, row) {
  const lines = [];
  for (let i = 7; i < row.length; i++) {
    const voix = row[i];
    if (voix === null || voix === undefined) continue;
    const e = file.entries[i - 7];
    lines.push(
      file.kind === "nuance"
        ? { key: e[0], label: e[1], voix }
        : { key: e[0], label: listLabel(e), detail: formatHead(e[3]), full: e[1], nuance: e[2], voix },
    );
  }
  return lines;
}

function localLines(row) {
  return (row[7] ?? []).map(([label, nuance, voix, sieges, tete]) => ({
    key: label,
    label,
    detail: formatHead(tete),
    nuance,
    nuanceLabel: nuanceLabel(nuance),
    sieges,
    voix,
  }));
}

/** Résultat d'une commune : { nomCommune, inscrits, … exprimes, participation, lines: [{ label, voix, pct, … }] } ou null. */
export function decodeScrutinRow(file, code) {
  const row = file?.rows?.[code];
  if (!row) return null;
  return finish(counts(row), file.kind === "local" ? localLines(row) : fixedLines(file, row));
}

/**
 * Agrégat d'un département : somme des communes du fichier. Pour les municipales, les listes locales n'ayant pas de
 * sens à cette échelle, les voix sont regroupées par nuance (ou « Sans étiquette »).
 */
export function aggregateScrutinFile(file) {
  const total = { nomCommune: null, inscrits: 0, abstentions: 0, votants: 0, blancs: 0, nuls: 0, exprimes: 0 };
  const sums = new Map();
  let communes = 0;
  for (const row of Object.values(file.rows)) {
    communes += 1;
    const c = counts(row);
    for (const f of ["inscrits", "abstentions", "votants", "blancs", "nuls", "exprimes"]) total[f] += c[f];
    if (file.kind === "local") {
      for (const [, nuance, voix] of row[7] ?? []) {
        const key = nuance || "";
        sums.set(key, (sums.get(key) ?? 0) + voix);
      }
    } else {
      for (let i = 7; i < row.length; i++) if (row[i] != null) sums.set(i - 7, (sums.get(i - 7) ?? 0) + row[i]);
    }
  }
  const lines = [...sums].map(([k, voix]) => {
    if (file.kind === "local") return { key: k || "SE", label: nuanceLabel(k) || (k ? k : "Sans étiquette"), voix };
    const e = file.entries[k];
    return file.kind === "nuance" ? { key: e[0], label: e[1], voix } : { key: e[0], label: listLabel(e), detail: formatHead(e[3]), voix };
  });
  return { ...finish(total, lines), communes };
}

const lineName = (scrutin, line) => {
  if (scrutin.kind === "nuance") return `la nuance « ${line.label} »`;
  if (scrutin.kind === "list") return `la liste « ${line.label} »${line.detail ? ` (tête de liste : ${line.detail})` : ""}`;
  return `la liste « ${line.label} »${line.detail ? ` conduite par ${line.detail}` : ""}`;
};


/** Phrase de synthèse d'un tour ; `name` est le nom de la commune ou « le département X » si `aggregate`. */
export function leadSentence(scrutin, tour, name, result, { aggregate = false } = {}) {
  const [first, second] = result.lines;
  if (!first || result.exprimes <= 0) return "";
  const where = aggregate ? name : `à ${name}`;
  const tourPart = scrutin.tours.length > 1 ? ` (${tourLabel(scrutin, tour).replace("1er", "premier").replace("2nd", "second")})` : "";
  let text = `Aux ${scrutin.short}${tourPart}, ${lineName(scrutin, first)} arrive en tête ${where} avec ${fmtPct(first.pct)} des suffrages exprimés`;
  if (second) text += `, devant ${lineName(scrutin, second)} (${fmtPct(second.pct)})`;
  text += `. La participation est de ${fmtPct(result.participation)}.`;
  return text;
}

/** Scrutins pour lesquels au moins un tour est disponible : ids dans l'ordre d'affichage. */
export function coveredIds(results) {
  return SCRUTINS.filter((s) => s.tours.some((t) => results?.[s.id]?.[t])).map((s) => s.id);
}

/** Lignes de synthèse : une par scrutin et par tour disponible (pour le tableau prérendu). */
export function summaryRows(results) {
  const rows = [];
  for (const s of SCRUTINS) {
    for (const t of s.tours) {
      const r = results?.[s.id]?.[t];
      if (!r?.lines?.length || r.exprimes <= 0) continue;
      const first = r.lines[0];
      rows.push({
        scrutin: s,
        tour: t,
        label: scrutinTourTitle(s, t),
        lead: first.detail ? `${first.label} (${first.detail})` : first.label,
        pct: first.pct,
        participation: r.participation,
      });
    }
  }
  return rows;
}

export const scrutinTourTitle = (scrutin, tour) => (scrutin.tours.length === 1 ? scrutin.label : `${scrutin.label}, ${tourLabel(scrutin, tour)}`);

/** Questions-réponses d'une fiche commune, bâties sur les résultats réellement disponibles (3 à 5 questions, [] si aucune). */
export function communeScrutinsFaq(name, results) {
  const ids = coveredIds(results);
  if (!ids.length) return [];
  const faq = [];
  faq.push({
    q: `Quels résultats électoraux trouve-t-on pour ${name} ?`,
    a: `PrésiFrance présente pour ${name} les résultats de l'élection présidentielle depuis 1995 et, selon les données publiées par le ministère de l'Intérieur, ${coverageLabel(ids)} : liste ou candidat arrivé en tête à chaque tour, part des suffrages exprimés et participation.`,
  });
  const latestOf = (type) => SCRUTINS.find((s) => s.type === type && ids.includes(s.id));
  const questions = [
    ["municipales", (s) => `Quelle liste est arrivée en tête aux ${s.short} à ${name} ?`],
    ["europeennes", (s) => `Quel a été le résultat des ${s.short} à ${name} ?`],
    ["legislatives", (s) => `Comment ${name} a-t-elle voté aux ${s.short} ?`],
  ];
  for (const [type, question] of questions) {
    const s = latestOf(type);
    if (!s) continue;
    const parts = [...s.tours]
      .reverse()
      .map((t) => results[s.id]?.[t])
      .map((r, i) => (r ? leadSentence(s, [...s.tours].reverse()[i], name, r) : ""))
      .filter(Boolean);
    if (parts.length) faq.push({ q: question(s), a: parts.join(" ") });
  }
  faq.push({
    q: "D'où viennent ces résultats ?",
    a: "Ils proviennent des fichiers officiels du ministère de l'Intérieur publiés sur data.gouv.fr. Les municipales ne sont présentées que pour les communes de 1 000 habitants et plus, où le scrutin est de liste, et un tour n'apparaît que si la commune y a voté.",
  });
  return faq;
}


/** Titre des fiches commune (prérendu, Worker et interface). */
export const communeTitle = (name) => `Résultats des élections à ${name}`;

/** Meta description : présidentielles puis scrutins disponibles (ids). */
export function communeDescription(name, ids = []) {
  const others = coverageLabel(ids);
  const scope = others ? `des présidentielles (1995-2022), ${others}` : "des présidentielles de 1995 à 2022";
  return `${name} : résultats ${scope}. Candidat ou liste en tête, participation et scores à chaque tour. Données officielles.`;
}
