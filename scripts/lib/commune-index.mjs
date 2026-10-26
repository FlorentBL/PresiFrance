// Index compact des communes ayant des résultats présidentiels, découpé par département (dist/data/communes/<dep>.json).
// Le Worker (worker/index.js) s'en sert pour répondre 404 aux codes inexistants et pour habiller les fiches commune
// non prérendues (titre, description, canonique, résumé chiffré de la présidentielle 2022).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { departmentNames } from "../seo-routes.mjs";
import { COMMUNE_YEARS, LATEST_YEAR } from "./seo-content/data.mjs";
import { candidateName } from "./seo-content/html.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const presidentialDir = path.join(root, "public/data/presidential");

/**
 * Les DOM sont codés ZA101… dans les fichiers du ministère : le chiffre qui suit la lettre est celui du code INSEE (971…976).
 * Les collectivités d'outre-mer (ZN, ZP, ZW : codes INSEE 98x) et l'étranger (ZZ) n'ont pas de correspondance sûre : exclues.
 */
function inseeKey(key) {
  return /^Z[A-DMSX]\d{3}$/.test(key) ? `97${key[2]}${key.slice(3)}` : key;
}

export function depOfCode(code) {
  return code.startsWith("97") ? code.slice(0, 3) : code.slice(0, 2);
}

/**
 * Format d'une ligne : [nom d'affichage] si la commune n'a pas de résultats 2022,
 * sinon [nom d'affichage, inscrits, votants, exprimés, index 1er, voix 1er, index 2ᵉ, voix 2ᵉ] (1er tour 2022).
 * Renvoie Map département -> { d: nom du département, c: [candidats], r: { code: ligne } }.
 */
export function buildCommuneShards() {
  const base = new Map(); // code -> { nom, summary }
  for (const year of COMMUNE_YEARS) {
    const dir = path.join(presidentialDir, String(year), "t1");
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      const file = JSON.parse(readFileSync(path.join(dir, name), "utf8"));
      if (file.niveau === "departement") continue;
      for (const key of Object.keys(file.rows)) {
        const code = inseeKey(key);
        if (!/^\d[\dAB]\d{3}$/.test(code)) continue;
        // Outre-mer : codage ministériel différent selon les scrutins (ex. Mayotte en 975xx avant 2022), seul 2022 est fiable.
        if (code.startsWith("97") && year !== LATEST_YEAR) continue;
        const row = file.rows[key];
        const entry = base.get(code) ?? {};
        entry.nom = row[0]; // les années sont parcourues de la plus ancienne à la plus récente
        if (year === LATEST_YEAR) {
          const [, inscrits, , votants, , , exprimes] = row;
          const voix = [];
          for (let i = 7; i < row.length; i++) {
            if (row[i] === null || row[i] === undefined) continue;
            const [nom, prenom] = file.candidates[i - 7];
            voix.push({ label: candidateName(prenom, nom), voix: row[i] });
          }
          voix.sort((a, b) => b.voix - a.voix);
          if (inscrits > 0 && exprimes > 0 && voix.length >= 2) entry.summary = { inscrits, votants, exprimes, voix: voix.slice(0, 2) };
        }
        base.set(code, entry);
      }
    }
  }

  // Titres uniques : suffixe « (dép.) » quand le nom existe plusieurs fois en France, le code INSEE si cela ne suffit pas.
  const byName = new Map();
  const byNameDep = new Map();
  for (const [code, { nom }] of base) {
    byName.set(nom, (byName.get(nom) ?? 0) + 1);
    const k = `${nom}|${depOfCode(code)}`;
    byNameDep.set(k, (byNameDep.get(k) ?? 0) + 1);
  }

  const shards = new Map();
  for (const code of [...base.keys()].sort()) {
    const { nom, summary } = base.get(code);
    const dep = depOfCode(code);
    let shard = shards.get(dep);
    if (!shard) {
      shard = { d: departmentNames[dep] ?? dep, c: [], r: {} };
      shards.set(dep, shard);
    }
    let display = nom;
    if (byName.get(nom) > 1) display = byNameDep.get(`${nom}|${dep}`) > 1 ? `${nom} (${code})` : `${nom} (${dep})`;
    if (!summary) {
      shard.r[code] = [display];
      continue;
    }
    const idx = summary.voix.map((v) => {
      let i = shard.c.indexOf(v.label);
      if (i < 0) i = shard.c.push(v.label) - 1;
      return i;
    });
    shard.r[code] = [display, summary.inscrits, summary.votants, summary.exprimes, idx[0], summary.voix[0].voix, idx[1], summary.voix[1].voix];
  }
  return shards;
}
