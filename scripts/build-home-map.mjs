// Génère public/data/presidential/home-map.json : candidat arrivé en tête (1er tour) par département et par année,
// plus le total de voix exprimées nationales. Alimente la carte de l'accueil (chargée paresseusement).
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("public/data/presidential");
const years = fs.readdirSync(root).filter((d) => /^\d{4}$/.test(d)).sort();
const out = { v: 1, years: {} };

for (const year of years) {
  const dir = path.join(root, year, "t1");
  if (!fs.existsSync(dir)) continue;
  const names = [];
  const depts = {};
  let exprimes = 0;
  for (const file of fs.readdirSync(dir)) {
    const code = file.replace(".json", "");
    if (!/^(\d{2}|2A|2B)$/.test(code) || code === "20") continue;
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    const labels = data.candidates.map(([nom, prenom]) => `${prenom ? prenom + " " : ""}${nom}`.trim());
    const totals = labels.map(() => 0);
    for (const row of Object.values(data.rows)) {
      exprimes += row[6];
      for (let i = 0; i < totals.length; i++) totals[i] += row[7 + i] || 0;
    }
    const sum = totals.reduce((a, b) => a + b, 0);
    if (!sum) continue;
    const best = totals.indexOf(Math.max(...totals));
    let idx = names.indexOf(labels[best]);
    if (idx < 0) idx = names.push(labels[best]) - 1;
    depts[code] = [idx, Math.round((totals[best] / sum) * 1000) / 10];
  }
  out.years[year] = { candidates: names, depts, exprimes };
}

fs.writeFileSync(path.join(root, "home-map.json"), JSON.stringify(out));
console.log("home-map.json", Object.keys(out.years).length, "années");
