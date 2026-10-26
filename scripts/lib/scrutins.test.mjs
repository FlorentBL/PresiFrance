// @vitest-environment node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";

import { buildTour, depOfCode, inseeCode, mergeByCommune, parseWideFile, entryKey, splitLine, toNumber } from "./scrutins.mjs";

const root = new URL("../", import.meta.url);
const sources = JSON.parse(readFileSync(new URL("scrutins-sources.json", root), "utf8"));

function fixture(scrutin, tour) {
  const ext = tour.url.split(".").pop();
  const buf = readFileSync(new URL(`fixtures/scrutins/${scrutin.id}-t${tour.tour}.${ext}`, root));
  return buf.toString(tour.encoding === "latin1" ? "latin1" : "utf8");
}

test("inseeCode normalise les codes publiés selon les fichiers", () => {
  assert.equal(inseeCode("01", "016"), "01016");
  assert.equal(inseeCode("1", "4"), "01004");
  assert.equal(inseeCode("1", "1001"), "01001");
  assert.equal(inseeCode("2A", "004"), "2A004");
  assert.equal(inseeCode("2A", "2A004"), "2A004");
  assert.equal(inseeCode("ZA", "101"), "97101");
  assert.equal(inseeCode("ZN", "801"), "98801");
  assert.equal(inseeCode("971", "97101"), "97101");
  assert.equal(inseeCode("ZZ", "001"), null);
  assert.equal(inseeCode("", "001"), null);
});

test("depOfCode : trois caractères pour l'outre-mer, deux sinon", () => {
  assert.equal(depOfCode("97101"), "971");
  assert.equal(depOfCode("98801"), "988");
  assert.equal(depOfCode("2A004"), "2A");
  assert.equal(depOfCode("75056"), "75");
});

test("splitLine respecte les guillemets et toNumber lit les formats français", () => {
  assert.deepEqual(splitLine('"a;b";c;"d ""e"""', ";"), ["a;b", "c", 'd "e"']);
  assert.equal(toNumber("55,08%"), 55.08);
  assert.equal(toNumber(""), null);
  assert.equal(toNumber("1 234"), 1234);
});

for (const scrutin of sources.scrutins) {
  for (const tour of scrutin.tours) {
    test(`${scrutin.id} tour ${tour.tour} : lecture de l'échantillon`, () => {
      const text = fixture(scrutin, tour);
      const rows = parseWideFile(text, { delimiter: tour.delimiter });
      assert.ok(rows.length >= 2, "au moins deux communes dans l'échantillon");
      for (const r of rows) {
        assert.match(r.code, /^(\d{5}|2[AB]\d{3})$/);
        assert.ok(r.nom && !r.nom.includes("�"), `nom lisible : ${r.nom}`);
        assert.ok(r.inscrits > 0 && r.votants <= r.inscrits);
        assert.ok(r.entries.length > 0);
        const sum = r.entries.reduce((a, e) => a + e.voix, 0);
        assert.equal(sum, r.exprimes, `${r.code} : somme des voix = exprimés`);
      }
    });

    test(`${scrutin.id} tour ${tour.tour} : fichiers compacts par département`, () => {
      const files = buildTour(scrutin, tour.tour, fixture(scrutin, tour), { delimiter: tour.delimiter });
      assert.ok(files.size >= 1);
      for (const [dep, file] of files) {
        assert.equal(file.v, 1);
        assert.equal(file.scrutin, scrutin.id);
        assert.equal(file.kind, scrutin.kind);
        for (const [code, row] of Object.entries(file.rows)) {
          assert.equal(depOfCode(code), dep);
          assert.equal(typeof row[0], "string");
          if (scrutin.kind === "local") {
            assert.equal(row.length, 8);
            const lists = row[7];
            assert.ok(lists.length > 0);
            assert.deepEqual(lists.map((l) => l[2]), [...lists.map((l) => l[2])].sort((a, b) => b - a));
            assert.equal(lists.reduce((a, l) => a + l[2], 0), row[6]);
          } else {
            assert.ok(row.length - 7 <= file.entries.length);
            assert.equal(row.slice(7).reduce((a, v) => a + (v ?? 0), 0), row[6]);
          }
        }
      }
    });
  }
}

test("législatives : les circonscriptions d'une même commune sont additionnées par nuance", () => {
  const head = ["Code département", "Libellé département", "Code commune", "Libellé commune", "Inscrits", "Abstentions", "Votants", "Blancs", "Nuls", "Exprimés", "Numéro de panneau 1", "Nuance candidat 1", "Nom candidat 1", "Prénom candidat 1", "Voix 1", "Numéro de panneau 2", "Nuance candidat 2", "Nom candidat 2", "Prénom candidat 2", "Voix 2"].join(";");
  const text = [head, "01;Ain;01001;Test;100;40;60;2;3;55;1;RN;A;B;30;2;ENS;C;D;25", "01;Ain;01001;Test;50;20;30;1;1;28;1;ENS;E;F;20;2;RN;G;H;8"].join("\n");
  const files = buildTour({ id: "t", kind: "nuance" }, 1, text);
  const file = files.get("01");
  assert.deepEqual(file.entries.map((e) => e[0]).sort(), ["ENS", "RN"]);
  const row = file.rows["01001"];
  assert.deepEqual(row.slice(0, 7), ["Test", 150, 60, 90, 3, 4, 83]);
  const byNuance = Object.fromEntries(file.entries.map((e, i) => [e[0], row[7 + i]]));
  assert.deepEqual(byNuance, { RN: 38, ENS: 45 });
});

test("Paris, Lyon et Marseille : les arrondissements sont regroupés sous le code de la commune", () => {
  const rows = [
    { code: "75101", nom: "Paris 1er", inscrits: 10, abstentions: 2, votants: 8, blancs: 0, nuls: 0, exprimes: 8, entries: [{ nuance: "RN", voix: 8 }] },
    { code: "75102", nom: "Paris 2e", inscrits: 20, abstentions: 4, votants: 16, blancs: 0, nuls: 0, exprimes: 16, entries: [{ nuance: "RN", voix: 16 }] },
  ];
  const [paris] = mergeByCommune(rows, { keyOf: entryKey("nuance") });
  assert.equal(paris.code, "75056");
  assert.equal(paris.nom, "Paris");
  assert.equal(paris.inscrits, 30);
  assert.equal(paris.entries[0].voix, 24);
});

test("l'option only limite aux communes demandées", () => {
  const scrutin = sources.scrutins.find((s) => s.id === "municipales-2026");
  const tour = scrutin.tours[0];
  const files = buildTour(scrutin, 1, fixture(scrutin, tour), { delimiter: tour.delimiter, only: new Set(["01004"]) });
  assert.deepEqual(Object.keys(files.get("01").rows), ["01004"]);
  assert.equal(files.size, 1);
});

test("l'en-tête incomplet est refusé", () => {
  assert.throws(() => parseWideFile("a;b;c\n1;2;3"), /introuvable/);
});

test("src/lib/scrutinsCore.mjs décrit les mêmes scrutins que scrutins-sources.json", async () => {
  const { SCRUTINS } = await import("../../src/lib/scrutinsCore.mjs");
  assert.deepEqual(
    SCRUTINS.map((s) => [s.id, s.kind, s.tours.join(",")]).sort(),
    sources.scrutins.map((s) => [s.id, s.kind, s.tours.map((t) => t.tour).join(",")]).sort(),
  );
});
