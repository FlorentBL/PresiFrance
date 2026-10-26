// @vitest-environment node
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const run = (...args) => spawnSync(process.execPath, [path.join(root, "scripts/fetch-live-2027.mjs"), ...args], { encoding: "utf8", cwd: root });

it("la configuration livrée est désactivée et sans URL codée en dur", () => {
  const cfg = JSON.parse(readFileSync(path.join(root, "scripts/live-2027.config.json"), "utf8"));
  expect(cfg.enabled).toBe(false);
  expect(cfg.final).toBe(false);
  for (const t of ["t1", "t2"]) for (const k of ["national", "departements", "communes"]) expect(cfg.sources[t][k]).toBe(null);
});

it("désactivé : ne fait rien, même sans --out (aucune écriture)", () => {
  const before = readFileSync(path.join(root, "public/data/live-2027/status.json"), "utf8");
  const r = run();
  expect(r.status).toBe(0);
  expect(r.stdout).toMatch(/désactivé/);
  expect(readFileSync(path.join(root, "public/data/live-2027/status.json"), "utf8")).toBe(before);
});

it("fixtures 2022 : écrit les fichiers, puis --reset revient à « à venir »", () => {
  const out = mkdtempSync(path.join(tmpdir(), "live-2027-"));
  try {
    const args = ["--input-dir", "scripts/fixtures/live-2022", "--out", out];
    expect(run("--round", "1", "--prefix", "t1-", ...args).status).toBe(0);
    expect(run("--round", "2", "--prefix", "t2-", ...args).status).toBe(0);
    const status = JSON.parse(readFileSync(path.join(out, "status.json"), "utf8"));
    expect(status.current).toBe(2);
    expect(status.rounds.t1.state).toBe("complet-provisoire");
    expect(existsSync(path.join(out, "t2/national.json"))).toBeTruthy();
    expect(run("--round", "1", "--final", "--prefix", "t1-", ...args).status).toBe(0);
    expect(JSON.parse(readFileSync(path.join(out, "status.json"), "utf8")).rounds.t1.state).toBe("definitif");
    expect(run("--reset", "--out", out).status).toBe(0);
    expect(JSON.parse(readFileSync(path.join(out, "status.json"), "utf8")).rounds).toEqual({});
    expect(existsSync(path.join(out, "t1"))).toBe(false);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

it("source illisible : sortie 3 et rien d'écrit", () => {
  const out = mkdtempSync(path.join(tmpdir(), "live-2027-"));
  try {
    const r = run("--round", "1", "--input-dir", "/nonexistent", "--out", out);
    expect(r.status).toBe(3);
    expect(existsSync(path.join(out, "status.json"))).toBe(false);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
