// Génère public/data/geo/departements-paths.json : tracés SVG simplifiés des 96 départements métropolitains,
// pour la carte de l'accueil. Source : IGN Admin Express COG 2018 via gregoiredavid/france-geojson (Licence Ouverte).
// Usage : node scripts/build-france-map.mjs [chemin/vers/departements.geojson]
import fs from "node:fs";
import path from "node:path";

const SOURCE_URL =
  "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson";
const WIDTH = 1000;
const TOLERANCE = 1.1; // en unités du viewBox, après projection
const LAT0 = (46.5 * Math.PI) / 180;

async function loadSource() {
  const local = process.argv[2];
  if (local) return JSON.parse(fs.readFileSync(local, "utf8"));
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Téléchargement impossible (${res.status})`);
  return res.json();
}

/** Projection équirectangulaire corrigée à la latitude moyenne de la métropole. */
const project = ([lon, lat]) => [lon * Math.cos(LAT0), -lat];

/** Douglas-Peucker sur un contour fermé : coupé en deux au point le plus éloigné du premier. */
function simplifyRing(points, tol) {
  const [x0, y0] = points[0];
  let far = 0;
  points.forEach(([x, y], i) => {
    if (Math.hypot(x - x0, y - y0) > Math.hypot(points[far][0] - x0, points[far][1] - y0)) far = i;
  });
  return [...simplify(points.slice(0, far + 1), tol), ...simplify(points.slice(far), tol).slice(1)];
}

function simplify(points, tol) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    let max = 0;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * points[i][0] - dx * points[i][1] + bx * ay - by * ax) / len;
      if (d > max) {
        max = d;
        idx = i;
      }
    }
    if (max > tol && idx > 0) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

// La Corse est rapprochée du continent (encart) pour ne pas élargir la carte.
const CORSICA_SHIFT = [-1.0, 0.8];

const geo = await loadSource();
const rings = geo.features.map((f) => {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const shift = /^2[AB]$/.test(f.properties.code) ? CORSICA_SHIFT : [0, 0];
  const move = ([lon, lat]) => project([lon + shift[0], lat + shift[1]]);
  return { code: f.properties.code, nom: f.properties.nom, polys: polys.map((p) => p.map((ring) => ring.map(move))) };
});

let minX = Infinity;
let minY = Infinity;
let maxX = -Infinity;
let maxY = -Infinity;
for (const d of rings) for (const p of d.polys) for (const r of p) for (const [x, y] of r) {
  minX = Math.min(minX, x);
  minY = Math.min(minY, y);
  maxX = Math.max(maxX, x);
  maxY = Math.max(maxY, y);
}
const scale = WIDTH / (maxX - minX);
const height = Math.ceil((maxY - minY) * scale);

const depts = {};
for (const d of rings) {
  let dPath = "";
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const poly of d.polys) {
    for (const ring of poly) {
      const pts = simplifyRing(
        ring.map(([x, y]) => [(x - minX) * scale, (y - minY) * scale]),
        TOLERANCE,
      ).map(([x, y]) => [Math.round(x), Math.round(y)]);
      const dedup = pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
      if (dedup.length < 4) continue;
      let [px, py] = dedup[0];
      dPath += `M${px} ${py}`;
      let rel = "l";
      for (const [x, y] of dedup.slice(1, -1)) {
        rel += `${x - px} ${y - py} `;
        px = x;
        py = y;
      }
      dPath += rel.trim().replace(/ -/g, "-") + "z";
      for (const [x, y] of dedup) {
        sx += x;
        sy += y;
        n++;
      }
    }
  }
  depts[d.code] = { n: d.nom, d: dPath, c: [Math.round(sx / n), Math.round(sy / n)] };
}

const out = { v: 1, w: WIDTH, h: height, source: "IGN Admin Express COG 2018 (Licence Ouverte) via france-geojson", depts };
const dest = path.resolve("public/data/geo/departements-paths.json");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out));
console.log(`departements-paths.json : ${Object.keys(depts).length} départements, ${fs.statSync(dest).size} octets`);
