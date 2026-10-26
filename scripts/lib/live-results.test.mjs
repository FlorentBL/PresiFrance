import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { buildRoundFiles, decodeText, mergeStatus, parseMinistryCsv } from "./live-results.mjs";

const fx = (name) => decodeText(readFileSync(new URL(`../fixtures/live-2022/${name}.txt`, import.meta.url)));
const load = (t, mod = (s) => s) => ({
  national: parseMinistryCsv(mod(fx(`${t}-national`))),
  departements: parseMinistryCsv(mod(fx(`${t}-departements`))),
  communes: parseMinistryCsv(mod(fx(`${t}-communes`))),
});
const opts = (round, extra = {}) => ({ round, fetchedAt: "2022-04-10T22:00:00Z", source: { label: "test", url: null }, ...extra });

test("décode le Windows-1252 et lit les trois niveaux (1er tour 2022)", () => {
  const p = load("t1");
  assert.equal(p.national.level, "national");
  assert.equal(p.departements.level, "departement");
  assert.equal(p.communes.level, "commune");
  assert.equal(p.national.rows[0].inscrits, 48747826);
  assert.equal(p.national.rows[0].candidates.length, 12);
  const clem = p.communes.rows.find((r) => r.communeName === "L'Abergement-Clémenciat");
  assert.equal(clem.inscrits, 645);
  assert.equal(clem.candidates.find((c) => c.nom === "MACRON").voix, 150);
  assert.ok(p.departements.rows.some((r) => r.depName === "Saint-Martin/Saint-Barthélemy"));
});

test("normalise un tour complet vers des fichiers compacts", () => {
  const { summary, files } = buildRoundFiles(load("t1"), opts(1));
  assert.equal(summary.state, "complet-provisoire");
  assert.equal(summary.couvertureInscrits, 100);
  assert.deepEqual(Object.keys(files).sort(), [
    "t1/communes/01.json", "t1/communes/2A.json", "t1/communes/75.json", "t1/communes/ZA.json",
    "t1/departements.json", "t1/national.json",
  ]);
  const nat = files["t1/national.json"];
  assert.equal(nat.rows.FE[1], 48747826);
  assert.equal(nat.candidates.length, 12);
  assert.ok(files["t1/communes/75.json"].rows["75056"]);
  assert.ok(files["t1/communes/ZA.json"].rows["ZA101"]);
  assert.equal(files["t1/departements.json"].etat["01"], "Complet");
});

test("2nd tour : deux candidats", () => {
  const { files } = buildRoundFiles(load("t2"), opts(2));
  assert.equal(files["t2/national.json"].candidates.length, 2);
});

test("résultats partiels : seules les communes complètes sont publiées", () => {
  const partial = (s) => s.replace(/^(01;Ain;002;[^;]*;)Complet/m, "$1Partiel").replace(/^(75;Paris;056;[^;]*;)Complet/m, "$1Non saisi");
  const { summary, files } = buildRoundFiles(load("t1", partial), opts(1));
  assert.equal(summary.state, "partiel");
  assert.equal(summary.communesCompletes, summary.communesTotal - 2);
  assert.ok(summary.couvertureInscrits > 0 && summary.couvertureInscrits < 100);
  assert.equal(files["t1/communes/75.json"], undefined);
  assert.equal(files["t1/communes/01.json"].rows["01002"], undefined);
  assert.ok(files["t1/communes/01.json"].rows["01001"]);
});

test("aucune commune complète : état « avenir »", () => {
  const none = (s) => s.replace(/;Complet;/g, ";Non saisi;");
  assert.equal(buildRoundFiles(load("t1", none), opts(1)).summary.state, "avenir");
});

test("l'indicateur « définitif » ne vient que de l'opérateur", () => {
  assert.equal(buildRoundFiles(load("t1"), opts(1, { final: true })).summary.state, "definitif");
});

test("refuse un fichier incohérent ou un format inattendu", () => {
  const bad = (s) => s.replace("MACRON;Emmanuel;150;", "MACRON;Emmanuel;151;");
  assert.throws(() => buildRoundFiles({ ...load("t1"), communes: parseMinistryCsv(bad(fx("t1-communes"))) }, opts(1)), /somme des voix/);
  assert.throws(() => parseMinistryCsv("a;b\n1;2"), /Colonne/);
  assert.throws(() => buildRoundFiles({ ...load("t1"), national: load("t1").communes }, opts(1)), /dans l'ordre/);
});

test("statut : tour courant, couverture jamais en baisse, définitif verrouillé", () => {
  const sum = (state, c) => ({ state, couvertureInscrits: c, fetchedAt: "x", source: { label: "t", url: null } });
  let st = mergeStatus(null, 1, sum("partiel", 40));
  assert.equal(st.current, 1);
  st = mergeStatus(st, 1, sum("partiel", 55));
  assert.throws(() => mergeStatus(st, 1, sum("partiel", 50)), /baisse/);
  st = mergeStatus(st, 1, sum("definitif", 100));
  assert.throws(() => mergeStatus(st, 1, sum("partiel", 100)), /définitif/);
  st = mergeStatus(st, 2, sum("partiel", 10));
  assert.equal(st.current, 2);
  assert.equal(st.rounds.t1.state, "definitif");
});
