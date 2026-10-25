/**
 * Regénère public/data/presidential/polls-2027-round1.json depuis la page Wikipédia EN
 * « Opinion polling for the 2027 French presidential election » (section « First round »).
 *
 * Les candidats testés diffèrent d'un sondage à l'autre : chaque ligne du tableau est une
 * hypothèse (liste de candidats testée) rattachée à un sondage (institut, dates, échantillon, notice).
 *
 * Usage :
 *   node scripts/build-polls-2027.mjs [--input réponse-api.json] [--year 2027]
 * Sans --input, la page est téléchargée (API MediaWiki « parse »).
 */
import fs from "fs";
import https from "https";

import { buildDataset } from "./lib/polls-2027.mjs";

const args = process.argv.slice(2);
const argValue = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
};

const YEAR = Number(argValue("--year") ?? 2027);
const INPUT = argValue("--input");
const PAGE = `Opinion_polling_for_the_${YEAR}_French_presidential_election`;
const WIKI_API = `https://en.wikipedia.org/w/api.php?action=parse&page=${PAGE}&prop=text&format=json`;
const WIKI_URL = `https://en.wikipedia.org/wiki/${PAGE}`;
const OUT = `public/data/presidential/polls-${YEAR}-round1.json`;

function fetchWiki() {
  return new Promise((resolve, reject) => {
    https
      .get(WIKI_API, { headers: { "User-Agent": "PresiFrance/1.0 (build script)" } }, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      })
      .on("error", reject);
  });
}

async function main() {
  const raw = INPUT ? fs.readFileSync(INPUT, "utf8") : await fetchWiki();
  const html = JSON.parse(raw).parse.text["*"];
  const { candidates, polls } = buildDataset(html);

  const payload = {
    meta: {
      electionYear: YEAR,
      round: 1,
      generatedAt: new Date().toISOString().slice(0, 10),
      latestFieldworkEnd: polls[polls.length - 1]?.fieldworkEnd ?? null,
      tableNote:
        "Intentions de vote au 1er tour : chaque sondage peut tester plusieurs hypothèses, c'est-à-dire des listes de candidats différentes.",
      sources: [
        {
          label: `Wikipédia (en) — Opinion polling for the ${YEAR} French presidential election`,
          url: WIKI_URL,
          license: "Texte Wikipédia sous licence CC BY-SA 4.0 ; les notices des instituts restent la référence.",
          retrievedAt: new Date().toISOString().slice(0, 10),
        },
      ],
    },
    candidates,
    polls,
  };

  fs.mkdirSync("public/data/presidential", { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload), "utf8");
  console.log(`Wrote ${polls.length} polls (${polls.reduce((n, p) => n + p.hypotheses.length, 0)} hypotheses, ${candidates.length} candidates) to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
