// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

import { buildRoundFiles, decodeText, mergeStatus, parseMinistryCsv } from "./live-results.mjs";

const fx = (name) => decodeText(readFileSync(new URL(`../fixtures/live-2022/${name}.txt`, import.meta.url)));
const load = (t, mod = (s) => s) => ({
  national: parseMinistryCsv(mod(fx(`${t}-national`))),
  departements: parseMinistryCsv(mod(fx(`${t}-departements`))),
  communes: parseMinistryCsv(mod(fx(`${t}-communes`))),
});
const opts = (round, extra = {}) => ({ round, fetchedAt: "2022-04-10T22:00:00Z", source: { label: "test", url: null }, ...extra });

it("décode le Windows-1252 et lit les trois niveaux (1er tour 2022)", () => {
  const p = load("t1");
  expect(p.national.level).toBe("national");
  expect(p.departements.level).toBe("departement");
  expect(p.communes.level).toBe("commune");
  expect(p.national.rows[0].inscrits).toBe(48747826);
  expect(p.national.rows[0].candidates.length).toBe(12);
  const clem = p.communes.rows.find((r) => r.communeName === "L'Abergement-Clémenciat");
  expect(clem.inscrits).toBe(645);
  expect(clem.candidates.find((c) => c.nom === "MACRON").voix).toBe(150);
  expect(p.departements.rows.some((r) => r.depName === "Saint-Martin/Saint-Barthélemy")).toBeTruthy();
});

it("normalise un tour complet vers des fichiers compacts", () => {
  const { summary, files } = buildRoundFiles(load("t1"), opts(1));
  expect(summary.state).toBe("complet-provisoire");
  expect(summary.couvertureInscrits).toBe(100);
  expect(Object.keys(files).sort()).toEqual([
    "t1/communes/01.json", "t1/communes/2A.json", "t1/communes/75.json", "t1/communes/ZA.json",
    "t1/departements.json", "t1/national.json",
  ]);
  const nat = files["t1/national.json"];
  expect(nat.rows.FE[1]).toBe(48747826);
  expect(nat.candidates.length).toBe(12);
  expect(files["t1/communes/75.json"].rows["75056"]).toBeTruthy();
  expect(files["t1/communes/ZA.json"].rows["ZA101"]).toBeTruthy();
  expect(files["t1/departements.json"].etat["01"]).toBe("Complet");
});

it("2nd tour : deux candidats", () => {
  const { files } = buildRoundFiles(load("t2"), opts(2));
  expect(files["t2/national.json"].candidates.length).toBe(2);
});

it("résultats partiels : seules les communes complètes sont publiées", () => {
  const partial = (s) => s.replace(/^(01;Ain;002;[^;]*;)Complet/m, "$1Partiel").replace(/^(75;Paris;056;[^;]*;)Complet/m, "$1Non saisi");
  const { summary, files } = buildRoundFiles(load("t1", partial), opts(1));
  expect(summary.state).toBe("partiel");
  expect(summary.communesCompletes).toBe(summary.communesTotal - 2);
  expect(summary.couvertureInscrits > 0 && summary.couvertureInscrits < 100).toBeTruthy();
  expect(files["t1/communes/75.json"]).toBe(undefined);
  expect(files["t1/communes/01.json"].rows["01002"]).toBe(undefined);
  expect(files["t1/communes/01.json"].rows["01001"]).toBeTruthy();
});

it("aucune commune complète : état « avenir »", () => {
  const none = (s) => s.replace(/;Complet;/g, ";Non saisi;");
  expect(buildRoundFiles(load("t1", none), opts(1)).summary.state).toBe("avenir");
});

it("l'indicateur « définitif » ne vient que de l'opérateur", () => {
  expect(buildRoundFiles(load("t1"), opts(1, { final: true })).summary.state).toBe("definitif");
});

it("refuse un fichier incohérent ou un format inattendu", () => {
  const bad = (s) => s.replace("MACRON;Emmanuel;150;", "MACRON;Emmanuel;151;");
  expect(() => buildRoundFiles({ ...load("t1"), communes: parseMinistryCsv(bad(fx("t1-communes"))) }, opts(1))).toThrow(/somme des voix/);
  expect(() => parseMinistryCsv("a;b\n1;2")).toThrow(/Colonne/);
  expect(() => buildRoundFiles({ ...load("t1"), national: load("t1").communes }, opts(1))).toThrow(/dans l'ordre/);
});

it("statut : tour courant, couverture jamais en baisse, définitif verrouillé", () => {
  const sum = (state, c) => ({ state, couvertureInscrits: c, fetchedAt: "x", source: { label: "t", url: null } });
  let st = mergeStatus(null, 1, sum("partiel", 40));
  expect(st.current).toBe(1);
  st = mergeStatus(st, 1, sum("partiel", 55));
  expect(() => mergeStatus(st, 1, sum("partiel", 50))).toThrow(/baisse/);
  st = mergeStatus(st, 1, sum("definitif", 100));
  expect(() => mergeStatus(st, 1, sum("partiel", 100))).toThrow(/définitif/);
  st = mergeStatus(st, 2, sum("partiel", 10));
  expect(st.current).toBe(2);
  expect(st.rounds.t1.state).toBe("definitif");
});
