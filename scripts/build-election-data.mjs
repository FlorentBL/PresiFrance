/**
 * Build commune-level presidential election data into /public so the site
 * can work offline and support multiple years fast.
 *
 * Strategy:
 * - Prefer official "subcom" TXT resources (stream parse; latin1; semicolon separated)
 * - Mark unsupported formats as unavailable in the manifest.
 *
 * Outputs:
 *   public/data/presidential/manifest.json
 *   public/data/presidential/{year}/t{round}/{dep}.json (compact format, see scripts/lib/compact-results.mjs)
 *
 * Run:
 *   node scripts/build-election-data.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { encodeDepResults } from "./lib/compact-results.mjs";

const API_BASE = "https://www.data.gouv.fr/api/1";
const OUT_BASE = path.resolve(process.cwd(), "public", "data", "presidential");

// Fallback: Sciences Po CDSP dataset for 1981/1988 (communes > 9000 hab)
const CDSP_DATASET_ID = "54aeb906c751df6643de6534";

const YEARS = [2022, 2017, 2012, 2007, 2002, 1995, 1988, 1981, 1974, 1969, 1965];
const ROUNDS = [1, 2];

function parseFrNumber(value) {
  if (value === null || value === undefined) return 0;
  const s = String(value).trim();
  if (!s) return 0;
  const normalized = s.replace(/\s/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

const DEP_CODE_2012 = { ZA: "971", ZB: "972", ZC: "973", ZD: "974", ZE: "976", "2A": "2A", "2B": "2B" };

function inseeFromDepCom(dep, comNum) {
  // dep may be 2 or 3 digits; com is numeric without leading zeros in some files
  const com = String(comNum).padStart(dep.length === 3 ? 2 : 3, "0");
  return `${dep}${com}`;
}

function inseeFromDepCom2012(depRaw, comNum) {
  const dep = DEP_CODE_2012[depRaw] || depRaw;
  const com = String(comNum).padStart(dep.length === 3 ? 2 : 3, "0");
  return `${dep}${com}`;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function searchDatasets(q, pageSize = 25) {
  const url = `${API_BASE}/datasets/?q=${encodeURIComponent(q)}&page_size=${pageSize}`;
  const j = await fetchJson(url);
  return j.data || [];
}

function extractYear(s) {
  const m = String(s).match(/\b(19\d{2}|20\d{2})\b/);
  return m ? Number(m[1]) : null;
}

async function findDataset(year, round) {
  const roundLabel = round === 1 ? "1er tour" : "2nd tour";
  const burvot = (d) =>
    String(d?.title || "").toLowerCase().includes("bureaux de vote") ||
    String(d?.title || "").toLowerCase().includes("burvot") ||
    String(d?.title || "").toLowerCase().includes("bureaux-de-vote");
  const subcom = (d) =>
    String(d?.title || "").toLowerCase().includes("subcom") ||
    (String(d?.title || "").toLowerCase().includes("commune") && !burvot(d));

  const queries = [
    `election presidentielle ${year} resultats definitifs ${roundLabel} bureaux de vote`,
    `election presidentielle ${year} resultats definitifs ${roundLabel} burvot`,
    `election presidentielle ${year} resultats par bureaux de vote`,
    `election presidentielle ${year} resultats bureaux de vote`,
    `election presidentielle ${year} resultats definitifs ${roundLabel}`,
    `élection présidentielle ${year} résultats définitifs ${roundLabel}`,
    `election presidentielle ${year} resultats ${roundLabel}`,
    `election presidentielle ${year} resultats`,
  ];

  for (const q of queries) {
    const results = await searchDatasets(q, 25);
    const y = (d) => extractYear(d?.title) === year;
    const mi = (d) => d?.organization?.acronym === "MI";
    const hasRound = (d) => {
      const t = String(d?.title || "").toLowerCase();
      return t.includes(roundLabel) || t.includes("tours 1 et 2") || t.includes("tour 1 et 2") || t.includes("t1t2");
    };

    // Prefer datasets with burvot/subcom (commune-level or aggregatable)
    const hit =
      results.find((d) => mi(d) && y(d) && hasRound(d) && (burvot(d) || subcom(d))) ||
      results.find((d) => mi(d) && y(d) && hasRound(d)) ||
      results.find((d) => y(d) && hasRound(d) && (burvot(d) || subcom(d))) ||
      results.find((d) => y(d) && hasRound(d)) ||
      results.find((d) => mi(d) && y(d)) ||
      results.find((d) => y(d)) ||
      null;
    if (hit) return hit;
  }
  return null;
}

function pickBestResource(resources, round, year) {
  const wantsSubcom = (t) =>
    String(t || "").toLowerCase().includes("subcom") ||
    (String(t || "").toLowerCase().includes("commune") && !String(t || "").toLowerCase().includes("bureau"));

  const wantsBurvot = (t) => {
    const lower = String(t || "").toLowerCase();
    return (
      lower.includes("burvot") ||
      lower.includes("bvot") ||
      lower.includes("bureaux de vote") ||
      lower.includes("bureaux-de-vote")
    );
  };

  // 1995 Gocolo CSV: base + candidat per round
  const tourNum = round === 1 ? "1" : "2";
  const base1995 = resources.find(
    (r) =>
      String(r.format || "").toLowerCase() === "csv" &&
      String(r.title || "").toLowerCase().includes(`tour${tourNum}`) &&
      String(r.title || "").toLowerCase().includes("base")
  );
  const candidat1995 = resources.find(
    (r) =>
      String(r.format || "").toLowerCase() === "csv" &&
      String(r.title || "").toLowerCase().includes(`tour${tourNum}`) &&
      String(r.title || "").toLowerCase().includes("candidat")
  );
  if (base1995?.url && candidat1995?.url) {
    return { kind: "1995_csv", baseUrl: base1995.url, candidatUrl: candidat1995.url, resource: base1995 };
  }

  // CDSP 1965/1969/1974: circonscription format, aggregate by département
  const cdspCirc = resources.find(
    (r) =>
      String(r.format || "").toLowerCase() === "csv" &&
      String(r.title || "").includes(String(year)) &&
      (String(r.title || "").toLowerCase().includes("circonscription") || String(r.title || "").toLowerCase().includes("circ")) &&
      (round === 1 ? String(r.title || "").toLowerCase().includes("1er tour") : String(r.title || "").toLowerCase().includes("2nd tour"))
  );
  if (cdspCirc?.url) {
    return { kind: "cdsp_circ_csv", url: cdspCirc.url, resource: cdspCirc };
  }

  // CDSP 1988/1981: commp9000 format (communes > 9000 hab), wide CSV
  const cdspComm = resources.find(
    (r) =>
      String(r.format || "").toLowerCase() === "csv" &&
      String(r.title || "").includes(String(year)) &&
      (String(r.title || "").toLowerCase().includes("commp9000") || String(r.title || "").toLowerCase().includes("9000")) &&
      (round === 1 ? String(r.title || "").toLowerCase().includes("1er tour") : String(r.title || "").toLowerCase().includes("2nd tour"))
  );
  if (cdspComm?.url) {
    return { kind: "cdsp_commp9000_csv", url: cdspComm.url, resource: cdspComm };
  }

  // Prefer MI "subcom" TXT (one row per commune)
  const subcom = resources.find(
    (r) =>
      wantsSubcom(r.title) &&
      String(r.format || "").toLowerCase() === "txt" &&
      String(r.url || "").includes("static.data.gouv.fr") &&
      String(r.title || "").toLowerCase().includes(`t${round}`)
  );
  if (subcom) return { kind: "subcom_txt", url: subcom.url, resource: subcom };

  // 2002/2007/2012 format: one file with both tours (PRxx_Bvot_T1T2), one row per candidate per bureau
  const isBurvotT1T2Combined = (r) => {
    const t = String(r.title || "").toUpperCase();
    const u = String(r.url || "").toUpperCase();
    return /PR(02|07|12)/.test(t) || /PR(02|07|12)/.test(u) ||
      (String(r.title || "").toLowerCase().includes("t1t2") && wantsBurvot(r.title));
  };
  const burvot2012 = resources.find(
    (r) =>
      wantsBurvot(r.title) &&
      String(r.format || "").toLowerCase() === "txt" &&
      String(r.url || "").includes("static.data.gouv.fr") &&
      isBurvotT1T2Combined(r)
  );
  if (burvot2012) return { kind: "burvot2012_txt", url: burvot2012.url, resource: burvot2012 };

  // Fallback: "burvot" TXT (one row per bureau; we aggregate by commune) — 2017, 2022 format
  const roundMatch = (t) => {
    const lower = String(t || "").toLowerCase();
    return round === 1 ? lower.includes("t1") || lower.includes("1er tour") : lower.includes("t2") || lower.includes("2nd tour");
  };
  const burvot = resources.find(
    (r) =>
      wantsBurvot(r.title) &&
      String(r.format || "").toLowerCase() === "txt" &&
      String(r.url || "").includes("static.data.gouv.fr") &&
      roundMatch(r.title)
  );
  if (burvot) return { kind: "burvot_txt", url: burvot.url, resource: burvot };


  // Last resort: any file
  const any = resources[0];
  if (any?.url) return { kind: "unknown", url: any.url, resource: any };
  return null;
}

function addToDepMap(depMap, dep, insee, result) {
  if (!depMap[dep]) depMap[dep] = {};
  depMap[dep][insee] = result;
}

function toResultObject(base, candidates) {
  candidates.sort((a, b) => b.voix - a.voix);
  return { ...base, candidates };
}

async function buildFromSubcomTxt(url) {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Cannot fetch ${url} (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder("latin1");
  let buffer = "";
  let isHeader = true;

  const depMap = {};
  const stats = { communes: 0, deps: 0 };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      const line = raw.replace(/\r$/, "");
      if (!line) continue;
      if (isHeader) {
        isHeader = false;
        continue;
      }

      const parts = line.split(";");
      if (parts.length < 26) continue;

      const dep = String(parts[0] || "").padStart(2, "0");
      const codeCommuneRaw = String(parts[2] || "");
      const comNum = Number(codeCommuneRaw);
      if (!dep || !Number.isFinite(comNum)) continue;

      const insee = inseeFromDepCom(dep, comNum);
      const base = {
        codeDepartement: dep,
        nomDepartement: String(parts[1] || ""),
        codeCommune: insee,
        nomCommune: String(parts[3] || "Commune"),
        inscrits: Math.round(parseFrNumber(parts[5])),
        abstentions: Math.round(parseFrNumber(parts[6])),
        abstentionsPourcent: parseFrNumber(parts[7]),
        votants: Math.round(parseFrNumber(parts[8])),
        votantsPourcent: parseFrNumber(parts[9]),
        blancs: Math.round(parseFrNumber(parts[10])),
        blancsPourcentInscrits: parseFrNumber(parts[11]),
        blancsPourcentVotants: parseFrNumber(parts[12]),
        nuls: Math.round(parseFrNumber(parts[13])),
        nulsPourcentInscrits: parseFrNumber(parts[14]),
        nulsPourcentVotants: parseFrNumber(parts[15]),
        exprimes: Math.round(parseFrNumber(parts[16])),
        exprimesPourcentInscrits: parseFrNumber(parts[17]),
        exprimesPourcentVotants: parseFrNumber(parts[18]),
      };

      const candidates = [];
      for (let i = 19; i + 6 < parts.length; i += 7) {
        const nom = String(parts[i + 2] || "").trim();
        const prenom = String(parts[i + 3] || "").trim();
        if (!nom) continue;
        candidates.push({
          nom,
          prenom,
          voix: Math.round(parseFrNumber(parts[i + 4])),
          pourcentInscrits: parseFrNumber(parts[i + 5]),
          pourcentExprimes: parseFrNumber(parts[i + 6]),
        });
      }

      addToDepMap(depMap, dep, insee, toResultObject(base, candidates));
      stats.communes++;
    }
  }

  stats.deps = Object.keys(depMap).length;
  return { depMap, stats };
}

/**
 * Parse "burvot" TXT: one row per bureau, same columns as subcom but with Code du b.vote.
 * Aggregate by (dep, com) to get commune-level results.
 */
async function buildFromBurvotTxt(url) {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Cannot fetch ${url} (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder("latin1");
  let buffer = "";
  let isHeader = true;

  // key: "dep|insee" -> { base, inscrits, abstentions, votants, blancs, nuls, exprimes, candidates: Map<"prenom nom", {nom,prenom,voix}> }
  const agg = new Map();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      const line = raw.replace(/\r$/, "");
      if (!line) continue;
      if (isHeader) {
        isHeader = false;
        continue;
      }

      const parts = line.split(";");
      if (parts.length < 28) continue;

      const dep = String(parts[0] || "").padStart(2, "0");
      const codeCom = String(parts[4] || "").trim();
      const comNum = parseInt(codeCom, 10);
      if (!dep || !Number.isFinite(comNum)) continue;

      const insee = inseeFromDepCom(dep, comNum);
      const key = `${dep}|${insee}`;

      const ins = Math.round(parseFrNumber(parts[7]));
      const abs = Math.round(parseFrNumber(parts[8]));
      const vot = Math.round(parseFrNumber(parts[10]));
      const bla = Math.round(parseFrNumber(parts[12]));
      const nul = Math.round(parseFrNumber(parts[15]));
      const exp = Math.round(parseFrNumber(parts[18]));

      if (!agg.has(key)) {
        agg.set(key, {
          base: {
            codeDepartement: dep,
            nomDepartement: String(parts[1] || ""),
            codeCommune: insee,
            nomCommune: String(parts[5] || "Commune"),
          },
          inscrits: 0,
          abstentions: 0,
          votants: 0,
          blancs: 0,
          nuls: 0,
          exprimes: 0,
          candidates: new Map(),
        });
      }
      const row = agg.get(key);
      row.inscrits += ins;
      row.abstentions += abs;
      row.votants += vot;
      row.blancs += bla;
      row.nuls += nul;
      row.exprimes += exp;

      for (let i = 21; i + 6 < parts.length; i += 7) {
        const nom = String(parts[i + 2] || "").trim();
        const prenom = String(parts[i + 3] || "").trim();
        if (!nom) continue;
        const voix = Math.round(parseFrNumber(parts[i + 4]));
        const ckey = `${prenom} ${nom}`;
        if (!row.candidates.has(ckey)) row.candidates.set(ckey, { nom, prenom, voix: 0 });
        row.candidates.get(ckey).voix += voix;
      }
    }
  }

  const depMap = {};
  let communes = 0;
  for (const [key, row] of agg) {
    const [dep] = key.split("|");
    const insee = row.base.codeCommune;
    const totalIns = row.inscrits;
    const totalExp = row.exprimes;

    const candidates = Array.from(row.candidates.values()).map((c) => ({
      ...c,
      pourcentInscrits: totalIns > 0 ? (c.voix / totalIns) * 100 : 0,
      pourcentExprimes: totalExp > 0 ? (c.voix / totalExp) * 100 : 0,
    }));

    const result = toResultObject(
      {
        ...row.base,
        inscrits: row.inscrits,
        abstentions: row.abstentions,
        abstentionsPourcent: totalIns > 0 ? (row.abstentions / totalIns) * 100 : 0,
        votants: row.votants,
        votantsPourcent: totalIns > 0 ? (row.votants / totalIns) * 100 : 0,
        blancs: row.blancs,
        blancsPourcentInscrits: totalIns > 0 ? (row.blancs / totalIns) * 100 : 0,
        blancsPourcentVotants: row.votants > 0 ? (row.blancs / row.votants) * 100 : 0,
        nuls: row.nuls,
        nulsPourcentInscrits: totalIns > 0 ? (row.nuls / totalIns) * 100 : 0,
        nulsPourcentVotants: row.votants > 0 ? (row.nuls / row.votants) * 100 : 0,
        exprimes: row.exprimes,
        exprimesPourcentInscrits: totalIns > 0 ? (row.exprimes / totalIns) * 100 : 0,
        exprimesPourcentVotants: row.votants > 0 ? (row.exprimes / row.votants) * 100 : 0,
      },
      candidates
    );
    addToDepMap(depMap, dep, insee, result);
    communes++;
  }

  return { depMap, stats: { communes, deps: Object.keys(depMap).length } };
}

/**
 * Parse 2002/2007/2012 PRxx_Bvot_T1T2 format: one row per (bureau, candidate), both tours in one file.
 * 2007: tour;dep;com;nom;bv;inscrits;votants;exprimes;panneau;Nom;Prenom;abrev;voix (13 cols)
 * 2012: tour;dep;com;nom;?;?;bv;inscrits;votants;exprimes;panneau;Nom;Prenom;abrev;voix (15 cols)
 */
async function buildFromBurvot2012Txt(url, round) {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Cannot fetch ${url} (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder("latin1");
  let buffer = "";

  const tourFilter = String(round);
  const bvSeen = new Set();
  const agg = new Map();

  // Detect format from first data line: 2007 has 13 cols, 2012 has 15
  let format2007 = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      const line = raw.replace(/\r$/, "");
      if (!line || line.startsWith("--")) continue;

      const parts = line.split(";");
      if (format2007 === null && parts.length >= 13 && parts[0] === tourFilter) {
        format2007 = parts.length <= 13;
      }
      const minLen = format2007 ? 13 : 15;
      if (parts.length < minLen) continue;
      if (parts[0] !== tourFilter) continue;

      const depRaw = String(parts[1] || "").trim();
      const comNum = parseInt(parts[2], 10);
      if (!depRaw || !Number.isFinite(comNum)) continue;

      const dep = DEP_CODE_2012[depRaw] || depRaw;
      const insee = inseeFromDepCom2012(depRaw, comNum);

      const idxBv = format2007 ? 4 : 6;
      const idxIns = format2007 ? 5 : 7;
      const idxVot = format2007 ? 6 : 8;
      const idxExp = format2007 ? 7 : 9;
      const idxNom = format2007 ? 9 : 11;
      const idxPrenom = format2007 ? 10 : 12;
      const idxVoix = format2007 ? 12 : 14;

      const bv = String(parts[idxBv] || "");
      const bvKey = `${dep}|${insee}|${bv}`;

      const inscrits = Math.round(parseFrNumber(parts[idxIns]));
      const votants = Math.round(parseFrNumber(parts[idxVot]));
      const exprimes = Math.round(parseFrNumber(parts[idxExp]));
      const nom = String(parts[idxNom] || "").trim();
      const prenom = String(parts[idxPrenom] || "").trim();
      const voix = Math.round(parseFrNumber(parts[idxVoix]));

      if (!bvSeen.has(bvKey)) {
        bvSeen.add(bvKey);
        const key = `${dep}|${insee}`;
        if (!agg.has(key)) {
          agg.set(key, {
            base: {
              codeDepartement: dep,
              nomDepartement: "",
              codeCommune: insee,
              nomCommune: String(parts[3] || "Commune"),
            },
            inscrits: 0,
            abstentions: 0,
            votants: 0,
            blancs: 0,
            nuls: 0,
            exprimes: 0,
            candidates: new Map(),
          });
        }
        const row = agg.get(key);
        row.inscrits += inscrits;
        row.abstentions += inscrits - votants;
        row.votants += votants;
        row.exprimes += exprimes;
      }

      if (nom) {
        const ckey = `${prenom} ${nom}`;
        const row = agg.get(`${dep}|${insee}`);
        if (!row.candidates.has(ckey)) row.candidates.set(ckey, { nom, prenom, voix: 0 });
        row.candidates.get(ckey).voix += voix;
      }
    }
  }

  const depMap = {};
  let communes = 0;
  for (const [key, row] of agg) {
    const [dep] = key.split("|");
    const insee = row.base.codeCommune;
    const totalIns = row.inscrits;
    const totalExp = row.exprimes;

    const candidates = Array.from(row.candidates.values()).map((c) => ({
      ...c,
      pourcentInscrits: totalIns > 0 ? (c.voix / totalIns) * 100 : 0,
      pourcentExprimes: totalExp > 0 ? (c.voix / totalExp) * 100 : 0,
    }));

    const result = toResultObject(
      {
        ...row.base,
        inscrits: row.inscrits,
        abstentions: row.abstentions,
        abstentionsPourcent: totalIns > 0 ? (row.abstentions / totalIns) * 100 : 0,
        votants: row.votants,
        votantsPourcent: totalIns > 0 ? (row.votants / totalIns) * 100 : 0,
        blancs: 0,
        blancsPourcentInscrits: 0,
        blancsPourcentVotants: 0,
        nuls: 0,
        nulsPourcentInscrits: 0,
        nulsPourcentVotants: 0,
        exprimes: row.exprimes,
        exprimesPourcentInscrits: totalIns > 0 ? (row.exprimes / totalIns) * 100 : 0,
        exprimesPourcentVotants: row.votants > 0 ? (row.exprimes / row.votants) * 100 : 0,
      },
      candidates
    );
    addToDepMap(depMap, dep, insee, result);
    communes++;
  }

  return { depMap, stats: { communes, deps: Object.keys(depMap).length } };
}

/**
 * Parse 1995 Gocolo CSV: base (commune stats) + candidat (per-candidate voix).
 * base: id, COM, inscrits, abstentions, votants, blancsnul, exprimes...
 * candidat: id, commune_id, nom, prenom, voix...
 */
function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else if (c !== "\n" && c !== "\r") {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

async function buildFrom1995Csv(baseUrl, candidatUrl) {
  const [baseRes, candidatRes] = await Promise.all([fetch(baseUrl), fetch(candidatUrl)]);
  if (!baseRes.ok || !candidatRes.ok) throw new Error(`Cannot fetch 1995 CSV (${baseRes.status}/${candidatRes.status})`);

  const baseText = await baseRes.text();
  const candidatText = await candidatRes.text();

  const baseLines = baseText.split(/\r?\n/).filter((l) => l.trim());
  const candidatLines = candidatText.split(/\r?\n/).filter((l) => l.trim());

  const baseHeader = parseCsvLine(baseLines[0]);
  const candidatHeader = parseCsvLine(candidatLines[0]);

  const idxId = baseHeader.findIndex((h) => h.toLowerCase() === "id");
  const idxCom = baseHeader.findIndex((h) => h.toUpperCase() === "COM");
  const idxIns = baseHeader.findIndex((h) => h.toLowerCase().includes("inscrit"));
  const idxAbs = baseHeader.findIndex((h) => h.toLowerCase().includes("abstention"));
  const idxVot = baseHeader.findIndex((h) => h.toLowerCase().includes("votant"));
  const idxBlancNul = baseHeader.findIndex((h) => h.toLowerCase().includes("blancsnul"));
  const idxExp = baseHeader.findIndex((h) => h.toLowerCase().includes("exprim"));

  const cIdxCommuneId = candidatHeader.findIndex((h) => h.toLowerCase() === "commune_id");
  const cIdxNom = candidatHeader.findIndex((h) => h.toLowerCase() === "nom");
  const cIdxPrenom = candidatHeader.findIndex((h) => h.toLowerCase() === "prenom");
  const cIdxVoix = candidatHeader.findIndex((h) => h.toLowerCase() === "voix");

  if (idxCom < 0 || idxIns < 0 || cIdxCommuneId < 0 || cIdxNom < 0 || cIdxVoix < 0) {
    throw new Error("1995 CSV: missing required columns");
  }

  const baseById = new Map();
  for (let i = 1; i < baseLines.length; i++) {
    const parts = parseCsvLine(baseLines[i]);
    const id = String(parts[idxId] ?? "").trim();
    const com = String(parts[idxCom] ?? "").trim();
    if (!id || !com) continue;
    baseById.set(id, {
      com,
      inscrits: Math.round(parseFrNumber(parts[idxIns])),
      abstentions: Math.round(parseFrNumber(parts[idxAbs])),
      votants: Math.round(parseFrNumber(parts[idxVot])),
      blancsnul: Math.round(parseFrNumber(parts[idxBlancNul] ?? 0)),
      exprimes: Math.round(parseFrNumber(parts[idxExp])),
    });
  }

  const candidatesByCommuneId = new Map();
  for (let i = 1; i < candidatLines.length; i++) {
    const parts = parseCsvLine(candidatLines[i]);
    const communeId = String(parts[cIdxCommuneId] ?? "").trim();
    const nom = String(parts[cIdxNom] ?? "").trim();
    const prenom = String(parts[cIdxPrenom] ?? "").trim();
    const voix = Math.round(parseFrNumber(parts[cIdxVoix]));
    if (!communeId || !nom) continue;
    if (!candidatesByCommuneId.has(communeId)) candidatesByCommuneId.set(communeId, []);
    candidatesByCommuneId.get(communeId).push({ nom, prenom, voix });
  }

  const depMap = {};
  let communes = 0;
  for (const [id, base] of baseById) {
    const com = base.com;
    const dep = com.length <= 5 ? com.slice(0, 2) : com.slice(0, 3);

    const candidates = (candidatesByCommuneId.get(id) || []).reduce((acc, c) => {
      const existing = acc.find((x) => x.nom === c.nom && x.prenom === c.prenom);
      if (existing) existing.voix += c.voix;
      else acc.push({ ...c });
      return acc;
    }, []);

    const totalIns = base.inscrits;
    const totalExp = base.exprimes;
    candidates.forEach((c) => {
      c.pourcentInscrits = totalIns > 0 ? (c.voix / totalIns) * 100 : 0;
      c.pourcentExprimes = totalExp > 0 ? (c.voix / totalExp) * 100 : 0;
    });
    candidates.sort((a, b) => b.voix - a.voix);

    const result = toResultObject(
      {
        codeDepartement: dep,
        nomDepartement: "",
        codeCommune: com,
        nomCommune: "",
        inscrits: base.inscrits,
        abstentions: base.abstentions,
        abstentionsPourcent: totalIns > 0 ? (base.abstentions / totalIns) * 100 : 0,
        votants: base.votants,
        votantsPourcent: totalIns > 0 ? (base.votants / totalIns) * 100 : 0,
        blancs: Math.floor(base.blancsnul / 2),
        blancsPourcentInscrits: totalIns > 0 ? (base.blancsnul / 2 / totalIns) * 100 : 0,
        blancsPourcentVotants: base.votants > 0 ? (base.blancsnul / 2 / base.votants) * 100 : 0,
        nuls: base.blancsnul - Math.floor(base.blancsnul / 2),
        nulsPourcentInscrits: totalIns > 0 ? ((base.blancsnul - Math.floor(base.blancsnul / 2)) / totalIns) * 100 : 0,
        nulsPourcentVotants: base.votants > 0 ? ((base.blancsnul - Math.floor(base.blancsnul / 2)) / base.votants) * 100 : 0,
        exprimes: base.exprimes,
        exprimesPourcentInscrits: totalIns > 0 ? (base.exprimes / totalIns) * 100 : 0,
        exprimesPourcentVotants: base.votants > 0 ? (base.exprimes / base.votants) * 100 : 0,
      },
      candidates
    );
    addToDepMap(depMap, dep, com, result);
    communes++;
  }

  return { depMap, stats: { communes, deps: Object.keys(depMap).length } };
}

/**
 * Parse CDSP circonscription format: aggregate by département.
 * Header: Code dép, Département, circonscription, Inscrits, Votants, Exprimés, Blancs et nuls, CANDIDAT (PARTI), ...
 * Output: one result per département (keyed by dep code for lookup)
 */
async function buildFromCdspCircCsv(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Cannot fetch ${url} (${res.status})`);
  const text = await res.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length < 2) return { depMap: {}, stats: { communes: 0, deps: 0 } };

  const header = parseCsvLine(lines[0]);
  const idxDep = header.findIndex((h) => String(h).toLowerCase().includes("code") && String(h).toLowerCase().includes("partement"));
  const idxDepNom = header.findIndex((h) => {
    const l = String(h).toLowerCase();
    return l.includes("partement") && !l.includes("code");
  });
  const idxIns = header.findIndex((h) => String(h).toLowerCase().includes("inscrit"));
  const idxVot = header.findIndex((h) => String(h).toLowerCase().includes("votant"));
  const idxExp = header.findIndex((h) => String(h).toLowerCase().includes("exprim"));
  const idxBlancNul = header.findIndex((h) => String(h).toLowerCase().includes("blanc"));

  if (idxDep < 0 || idxIns < 0) throw new Error("CDSP circ CSV: missing required columns");

  const agg = new Map();
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCsvLine(lines[i]);
    const dep = String(parts[idxDep] ?? "").padStart(2, "0");
    if (!dep) continue;

    const inscrits = Math.round(parseFrNumber(parts[idxIns]));
    const votants = Math.round(parseFrNumber(parts[idxVot]));
    const exprimes = Math.round(parseFrNumber(parts[idxExp]));
    const blancsNuls = Math.round(parseFrNumber(parts[idxBlancNul] ?? 0));

    if (!agg.has(dep)) {
      agg.set(dep, {
        inscrits: 0,
        votants: 0,
        exprimes: 0,
        blancsNuls: 0,
        nomDepartement: String(parts[idxDepNom] ?? ""),
        candidates: new Map(),
      });
    }
    const row = agg.get(dep);
    row.inscrits += inscrits;
    row.votants += votants;
    row.exprimes += exprimes;
    row.blancsNuls += blancsNuls;

    for (let c = 7; c < parts.length && c < header.length; c++) {
      const colName = String(header[c] ?? "").trim();
      if (!colName) continue;
      const voix = Math.round(parseFrNumber(parts[c]));
      const nomMatch = colName.match(/^([A-Za-zÀ-ÿ\s'-]+)\s*\(/);
      const nom = nomMatch ? nomMatch[1].trim().toUpperCase() : colName;
      if (!row.candidates.has(nom)) row.candidates.set(nom, { nom, prenom: "", voix: 0 });
      row.candidates.get(nom).voix += voix;
    }
  }

  const depMap = {};
  for (const [dep, row] of agg) {
    const totalIns = row.inscrits;
    const totalExp = row.exprimes;
    const candidates = Array.from(row.candidates.values()).map((c) => ({
      ...c,
      pourcentInscrits: totalIns > 0 ? (c.voix / totalIns) * 100 : 0,
      pourcentExprimes: totalExp > 0 ? (c.voix / totalExp) * 100 : 0,
    }));

    const result = toResultObject(
      {
        codeDepartement: dep,
        nomDepartement: row.nomDepartement,
        codeCommune: dep,
        nomCommune: "",
        inscrits: row.inscrits,
        abstentions: row.inscrits - row.votants,
        abstentionsPourcent: totalIns > 0 ? ((row.inscrits - row.votants) / totalIns) * 100 : 0,
        votants: row.votants,
        votantsPourcent: totalIns > 0 ? (row.votants / totalIns) * 100 : 0,
        blancs: Math.floor(row.blancsNuls / 2),
        blancsPourcentInscrits: totalIns > 0 ? (row.blancsNuls / 2 / totalIns) * 100 : 0,
        blancsPourcentVotants: row.votants > 0 ? (row.blancsNuls / 2 / row.votants) * 100 : 0,
        nuls: row.blancsNuls - Math.floor(row.blancsNuls / 2),
        nulsPourcentInscrits: totalIns > 0 ? ((row.blancsNuls - Math.floor(row.blancsNuls / 2)) / totalIns) * 100 : 0,
        nulsPourcentVotants: row.votants > 0 ? ((row.blancsNuls - Math.floor(row.blancsNuls / 2)) / row.votants) * 100 : 0,
        exprimes: row.exprimes,
        exprimesPourcentInscrits: totalIns > 0 ? (row.exprimes / totalIns) * 100 : 0,
        exprimesPourcentVotants: row.votants > 0 ? (row.exprimes / row.votants) * 100 : 0,
        niveau: "departement",
      },
      candidates
    );
    depMap[dep] = { [dep]: result };
  }

  return { depMap, stats: { communes: 0, deps: Object.keys(depMap).length } };
}

/**
 * Parse CDSP commp9000 format: wide CSV, one row per commune, candidates as columns.
 * Header: Code dép, Département, Numéro commune, commune, Inscrits, Votants, Exprimés, CANDIDAT (PARTI), ...
 */
async function buildFromCdspCommP9000Csv(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Cannot fetch ${url} (${res.status})`);
  const text = await res.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length < 2) return { depMap: {}, stats: { communes: 0, deps: 0 } };

  const header = parseCsvLine(lines[0]);
  const idxDep = header.findIndex((h) => String(h).toLowerCase().includes("code") && String(h).toLowerCase().includes("partement"));
  const idxCom = header.findIndex((h) => String(h).toLowerCase().includes("num") && String(h).toLowerCase().includes("commune"));
  const idxCommune = header.findIndex((h) => String(h).toLowerCase() === "commune");
  const idxIns = header.findIndex((h) => String(h).toLowerCase().includes("inscrit"));
  const idxVot = header.findIndex((h) => String(h).toLowerCase().includes("votant"));
  const idxExp = header.findIndex((h) => String(h).toLowerCase().includes("exprim"));

  if (idxDep < 0 || idxCom < 0 || idxIns < 0) throw new Error("CDSP CSV: missing required columns");

  const depMap = {};
  let communes = 0;

  for (let i = 1; i < lines.length; i++) {
    const parts = parseCsvLine(lines[i]);
    const dep = String(parts[idxDep] ?? "").padStart(2, "0");
    const comNum = parseInt(parts[idxCom], 10);
    if (!dep || !Number.isFinite(comNum)) continue;

    const insee = `${dep}${String(comNum).padStart(3, "0")}`;
    const inscrits = Math.round(parseFrNumber(parts[idxIns]));
    const votants = Math.round(parseFrNumber(parts[idxVot]));
    const exprimes = Math.round(parseFrNumber(parts[idxExp]));

    const candidates = [];
    for (let c = 7; c < parts.length && c < header.length; c++) {
      const colName = String(header[c] ?? "").trim();
      if (!colName) continue;
      const voix = Math.round(parseFrNumber(parts[c]));
      const nomMatch = colName.match(/^([A-Za-zÀ-ÿ\s'-]+)\s*\(/);
      const nom = nomMatch ? nomMatch[1].trim().toUpperCase() : colName;
      const prenom = "";
      candidates.push({ nom, prenom, voix, pourcentInscrits: inscrits > 0 ? (voix / inscrits) * 100 : 0, pourcentExprimes: exprimes > 0 ? (voix / exprimes) * 100 : 0 });
    }

    const result = toResultObject(
      {
        codeDepartement: dep,
        nomDepartement: String(parts[1] ?? ""),
        codeCommune: insee,
        nomCommune: String(parts[idxCommune] ?? "Commune"),
        inscrits,
        abstentions: inscrits - votants,
        abstentionsPourcent: inscrits > 0 ? ((inscrits - votants) / inscrits) * 100 : 0,
        votants,
        votantsPourcent: inscrits > 0 ? (votants / inscrits) * 100 : 0,
        blancs: 0,
        blancsPourcentInscrits: 0,
        blancsPourcentVotants: 0,
        nuls: 0,
        nulsPourcentInscrits: 0,
        nulsPourcentVotants: 0,
        exprimes,
        exprimesPourcentInscrits: inscrits > 0 ? (exprimes / inscrits) * 100 : 0,
        exprimesPourcentVotants: votants > 0 ? (exprimes / votants) * 100 : 0,
      },
      candidates
    );
    addToDepMap(depMap, dep, insee, result);
    communes++;
  }

  return { depMap, stats: { communes, deps: Object.keys(depMap).length } };
}

async function writeDepFiles(year, round, depMap) {
  const dir = path.join(OUT_BASE, String(year), `t${round}`);
  await mkdir(dir, { recursive: true });

  const deps = Object.keys(depMap);
  for (const dep of deps) {
    const fp = path.join(dir, `${dep}.json`);
    await writeFile(fp, JSON.stringify(encodeDepResults(depMap[dep])), "utf8");
  }
  return deps;
}

async function main() {
  await mkdir(OUT_BASE, { recursive: true });

  const manifest = { generatedAt: new Date().toISOString(), years: {} };

  for (const year of YEARS) {
    manifest.years[year] = {};
    for (const round of ROUNDS) {
      let ds = await findDataset(year, round);
      let resources = ds?.resources || [];

      // 1965/1969/1974: always use CDSP (circonscription -> département)
      // 1981/1988: use CDSP if primary dataset has no commune data
      if ([1965, 1969, 1974].includes(year) || ([1981, 1988].includes(year) && (!ds || !resources.some((r) => String(r.title || "").toLowerCase().includes("9000") || String(r.title || "").toLowerCase().includes("circ"))))) {
        try {
          const cdsp = await fetchJson(`${API_BASE}/datasets/${CDSP_DATASET_ID}/`);
          if (cdsp?.resources?.length) {
            ds = ds || cdsp;
            resources = cdsp.resources;
          }
        } catch (_) {}
      }

      if (!ds) {
        manifest.years[year][`t${round}`] = { available: false, reason: "dataset_not_found" };
        continue;
      }

      const chosen = pickBestResource(resources, round, year);
      if (!chosen) {
        manifest.years[year][`t${round}`] = { available: false, reason: "no_resources", dataset: { id: ds.id, slug: ds.slug } };
        continue;
      }

      let depMap = {};
      let stats = { communes: 0, deps: 0 };
      let warning = null;

      try {
        if (chosen.kind === "subcom_txt") {
          ({ depMap, stats } = await buildFromSubcomTxt(chosen.url));
        } else if (chosen.kind === "burvot_txt") {
          ({ depMap, stats } = await buildFromBurvotTxt(chosen.url));
        } else if (chosen.kind === "burvot2012_txt") {
          ({ depMap, stats } = await buildFromBurvot2012Txt(chosen.url, round));
        } else if (chosen.kind === "1995_csv") {
          ({ depMap, stats } = await buildFrom1995Csv(chosen.baseUrl, chosen.candidatUrl));
        } else if (chosen.kind === "cdsp_commp9000_csv") {
          ({ depMap, stats } = await buildFromCdspCommP9000Csv(chosen.url));
        } else if (chosen.kind === "cdsp_circ_csv") {
          ({ depMap, stats } = await buildFromCdspCircCsv(chosen.url));
        } else {
          warning = `unsupported_resource_kind:${chosen.kind}`;
        }
      } catch (e) {
        manifest.years[year][`t${round}`] = {
          available: false,
          reason: "build_error",
          error: String(e?.message || e),
          dataset: { id: ds.id, slug: ds.slug, title: ds.title },
        };
        continue;
      }

      const deps = await writeDepFiles(year, round, depMap);
      manifest.years[year][`t${round}`] = {
        available: deps.length > 0,
        kind: chosen.kind,
        url: chosen.baseUrl || chosen.url,
        deps,
        stats,
        warning,
        dataset: { id: ds.id, slug: ds.slug, title: ds.title },
      };
    }
  }

  await writeFile(path.join(OUT_BASE, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  console.log(`[election-data] wrote ${path.relative(process.cwd(), path.join(OUT_BASE, "manifest.json"))}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

