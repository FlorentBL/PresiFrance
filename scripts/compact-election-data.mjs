/**
 * Converts legacy department files (public/data/presidential/{year}/t{round}/{dep}.json)
 * to the compact format in place. Files already compact are skipped.
 *
 * Run:
 *   node scripts/compact-election-data.mjs
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { encodeDepResults } from "./lib/compact-results.mjs";

const BASE = path.resolve(process.cwd(), "public", "data", "presidential");

let converted = 0;
let before = 0;
let after = 0;
for (const year of await readdir(BASE)) {
  if (!/^\d{4}$/.test(year)) continue;
  for (const round of await readdir(path.join(BASE, year))) {
    const dir = path.join(BASE, year, round);
    for (const name of await readdir(dir)) {
      const fp = path.join(dir, name);
      const raw = await readFile(fp, "utf8");
      const data = JSON.parse(raw);
      if (data.v) continue;
      const out = JSON.stringify(encodeDepResults(data));
      await writeFile(fp, out, "utf8");
      converted++;
      before += raw.length;
      after += out.length;
    }
  }
}
console.log(`[compact] ${converted} files, ${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB`);
