// Écrit dist/data/communes/<dep>.json (postbuild) : index des communes lu par le Worker.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildCommuneShards } from "./lib/commune-index.mjs";

const outDir = path.resolve(process.cwd(), "dist/data/communes");
await mkdir(outDir, { recursive: true });
const shards = buildCommuneShards();
let communes = 0;
for (const [dep, shard] of shards) {
  communes += Object.keys(shard.r).length;
  await writeFile(path.join(outDir, `${dep}.json`), JSON.stringify(shard), "utf8");
}
console.log(`[commune-index] ${communes} communes dans ${shards.size} fichiers départementaux`);
