/**
 * Logique pure de construction des fichiers de parrainages (testée par vitest).
 * Format d'entrée : CSV du Conseil constitutionnel tel que publié en 2022
 * (colonnes Civilité;Nom;Prénom;Mandat;Circonscription;Département;Candidat;Date de publication).
 */

export function parseCSVLine(line, sep) {
  const parts = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === sep && !inQuotes) {
      parts.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  parts.push(current.trim());
  return parts;
}

export function parseCSV(content) {
  const clean = content.replace(/^﻿/, "");
  const lines = clean.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = parseCSVLine(lines[0], sep).map((h) => h.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).map((line) => {
    const parts = parseCSVLine(line, sep);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (parts[i] || "").replace(/^"|"$/g, "").trim();
    });
    return obj;
  });
  return { headers, rows };
}

function normalizeDep(dep) {
  if (!dep) return null;
  return String(dep).trim();
}

/** "dd/mm/yyyy" ou "yyyy-mm-dd" → "yyyy-mm-dd" ; null si illisible. */
export function parseFrDate(value) {
  if (!value) return null;
  const s = String(value).trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

export function buildParrainages(year, content) {
  if (!content) return null;
  const { rows } = parseCSV(content);

  const byCandidat = {};
  const byDep = {};
  const list = [];

  for (const row of rows) {
    const candidat = row.Candidat || row.candidat || row["Candidat-e parrainé-e"] || "";
    if (!candidat) continue;
    const dep = normalizeDep(row.Département || row.departement || row["Département/Collectivité"] || "");

    const entry = {
      candidat,
      dep,
      nom: row.Nom || row.nom || "",
      prenom: row.Prénom || row.prenom || "",
      mandat: row.Mandat || row.mandat || "",
      circonscription: row.Circonscription || row.circonscription || row["Commune ou circonscription"] || "",
      date: row["Date de publication"] || row["date de publication"] || "",
    };
    list.push(entry);

    (byCandidat[candidat] ??= []).push(entry);
    if (dep) {
      byDep[dep] ??= {};
      byDep[dep][candidat] = (byDep[dep][candidat] ?? 0) + 1;
    }
  }

  const candidats = Object.keys(byCandidat).sort();
  const stats = candidats.map((c) => ({
    candidat: c,
    total: byCandidat[c].length,
    departements: new Set(byCandidat[c].map((e) => e.dep).filter(Boolean)).size,
  }));
  const dates = list.map((e) => parseFrDate(e.date)).filter(Boolean).sort();

  return {
    year,
    total: list.length,
    departements: new Set(list.map((e) => e.dep).filter(Boolean)).size,
    lastPublication: dates.length ? dates[dates.length - 1] : null,
    candidats,
    stats,
    byCandidat,
    byDep,
    list,
  };
}

/** Instantané compact d'une publication, pour l'historique daté. */
export function snapshotOf(data, recordedAt) {
  return {
    publishedAt: data.lastPublication,
    recordedAt,
    total: data.total,
    candidats: data.candidats.length,
    departements: data.departements,
    stats: data.stats.map((s) => [s.candidat, s.total, s.departements]),
  };
}

/** Ajoute l'instantané si le contenu diffère du dernier. Retourne { history, added }. */
export function appendSnapshot(history, snapshot) {
  const prev = history[history.length - 1];
  if (prev && prev.total === snapshot.total && JSON.stringify(prev.stats) === JSON.stringify(snapshot.stats)) {
    return { history, added: false };
  }
  return { history: [...history, snapshot], added: true };
}

/**
 * Source d'une année : argument CLI (--file/--url) > variables PARRAINAGES_<année>_FILE/_URL > défaut.
 * L'URL 2027 n'est volontairement pas définie tant que le Conseil constitutionnel ne l'a pas publiée.
 */
export function resolveSource(year, defaults, { env = {}, args = {} } = {}) {
  const base = defaults[year] ?? {};
  return {
    path: args.file || env[`PARRAINAGES_${year}_FILE`] || base.path || null,
    url: args.url || env[`PARRAINAGES_${year}_URL`] || base.url || null,
    refresh: Boolean(base.refresh),
  };
}
