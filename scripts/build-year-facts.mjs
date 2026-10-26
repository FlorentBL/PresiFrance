// Régénère src/content/years-facts.json depuis public/data (npm run build:year-facts).
import { writeFileSync } from "node:fs";
import path from "node:path";

import { computeYearFacts } from "./lib/seo-content/year-facts.mjs";

const out = path.resolve(import.meta.dirname, "../src/content/years-facts.json");
const facts = computeYearFacts();
const lines = Object.entries(facts.years).map(([y, f]) => `  "${y}": ${JSON.stringify(f)}`);
writeFileSync(out, `{\n "years": {\n${lines.join(",\n")}\n },\n "topCommunes": ${JSON.stringify(facts.topCommunes)}\n}\n`);
console.log(`[year-facts] écrit ${out}`);
