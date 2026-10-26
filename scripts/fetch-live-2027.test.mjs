import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const run = (...args) => spawnSync(process.execPath, [path.join(root, "scripts/fetch-live-2027.mjs"), ...args], { encoding: "utf8", cwd: root });

test("la configuration livrée est désactivée et sans URL codée en dur", () => {
  const cfg = JSON.parse(readFileSync(path.join(root, "scripts/live-2027.config.json"), "utf8"));
  assert.equal(cfg.enabled, false);
  assert.equal(cfg.final, false);
  for (const t of ["t1", "t2"]) for (const k of ["national", "departements", "communes"]) assert.equal(cfg.sources[t][k], null);
});

test("désactivé : ne fait rien, même sans --out (aucune écriture)", () => {
  const before = readFileSync(path.join(root, "public/data/live-2027/status.json"), "utf8");
  const r = run();
  assert.equal(r.status, 0);
  assert.match(r.stdout, /désactivé/);
  assert.equal(readFileSync(path.join(root, "public/data/live-2027/status.json"), "utf8"), before);
});

test("fixtures 2022 : écrit les fichiers, puis --reset revient à « à venir »", () => {
  const out = mkdtempSync(path.join(tmpdir(), "live-2027-"));
  try {
    const args = ["--input-dir", "scripts/fixtures/live-2022", "--out", out];
    assert.equal(run("--round", "1", "--prefix", "t1-", ...args).status, 0);
    assert.equal(run("--round", "2", "--prefix", "t2-", ...args).status, 0);
    const status = JSON.parse(readFileSync(path.join(out, "status.json"), "utf8"));
    assert.equal(status.current, 2);
    assert.equal(status.rounds.t1.state, "complet-provisoire");
    assert.ok(existsSync(path.join(out, "t2/national.json")));
    assert.equal(run("--round", "1", "--final", "--prefix", "t1-", ...args).status, 0);
    assert.equal(JSON.parse(readFileSync(path.join(out, "status.json"), "utf8")).rounds.t1.state, "definitif");
    assert.equal(run("--reset", "--out", out).status, 0);
    assert.deepEqual(JSON.parse(readFileSync(path.join(out, "status.json"), "utf8")).rounds, {});
    assert.equal(existsSync(path.join(out, "t1")), false);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("source illisible : sortie 3 et rien d'écrit", () => {
  const out = mkdtempSync(path.join(tmpdir(), "live-2027-"));
  try {
    const r = run("--round", "1", "--input-dir", "/nonexistent", "--out", out);
    assert.equal(r.status, 3);
    assert.equal(existsSync(path.join(out, "status.json")), false);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
