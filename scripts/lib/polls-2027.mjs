const MONTH = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

export function stripTags(s) {
  return s
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<sup[\s\S]*?<\/sup>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(name) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function parsePct(cellHtml) {
  const t = stripTags(cellHtml).replace(",", ".");
  if (!t || /^[–—?-]$/.test(t)) return null;
  if (/^<\s*0?\.?5/.test(t)) return 0.25;
  if (/^<\s*1/.test(t)) return 0.5;
  const m = t.match(/(\d+(?:\.\d+)?)\s*%/);
  return m ? Number(m[1]) : null;
}

export function parseSample(cellHtml) {
  const t = stripTags(cellHtml).replace(/\s/g, "");
  if (!t || /^[–—?-]$/.test(t)) return null;
  const n = parseInt(t.replace(/[.,](?=\d{3}\b)/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

const iso = (y, m, d) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);

export function parseFieldwork(cellHtml) {
  const sortValue = cellHtml.match(/data-sort-value="(\d{4}-\d{2}-\d{2})"/)?.[1] ?? null;
  const text = stripTags(cellHtml).replace(/[–—]/g, "-");
  const parts = text.split("-").map((p) => p.trim());
  const parse = (p) => {
    const m = p.match(/^(\d{1,2})(?:\s+([A-Za-z]{3}))?(?:\s+(\d{4}))?$/);
    if (!m) return null;
    return { d: Number(m[1]), mon: m[2] ? MONTH[m[2]] : undefined, y: m[3] ? Number(m[3]) : undefined };
  };
  const last = parse(parts[parts.length - 1]);
  if (!last || last.mon === undefined || !last.y) return sortValue ? { start: sortValue, end: sortValue } : null;
  const end = iso(last.y, last.mon, last.d);
  let start = end;
  if (parts.length > 1) {
    const first = parse(parts[0]);
    if (first) {
      let mon = first.mon ?? last.mon;
      let y = first.y ?? last.y;
      if (first.mon === undefined && first.d > last.d) {
        mon -= 1;
        if (mon < 0) {
          mon = 11;
          y -= 1;
        }
      }
      if (first.mon !== undefined && first.y === undefined && mon > last.mon) y -= 1;
      start = iso(y, mon, first.d);
    }
  }
  return { start, end: sortValue ?? end };
}

function extractCells(trHtml) {
  const cells = [];
  const re = /<(t[dh])([^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(trHtml)) !== null) {
    cells.push({
      html: m[3],
      rowspan: Number(m[2].match(/rowspan="?(\d+)/)?.[1] ?? 1),
      colspan: Number(m[2].match(/colspan="?(\d+)/)?.[1] ?? 1),
    });
  }
  return cells;
}

const LEAD_COLUMNS = 3;

export function parseTable(tableHtml) {
  const trs = tableHtml.split(/<tr[^>]*>/i).slice(1);
  const header = extractCells(trs[0]).map((c) => stripTags(c.html).replace(/\s*\([^)]*\)\s*$/, ""));
  const names = header.slice(LEAD_COLUMNS);
  const width = LEAD_COLUMNS + names.length;
  const pending = new Array(width).fill(null);
  const rows = [];

  for (const tr of trs.slice(1)) {
    const cells = extractCells(tr);
    if (cells.some((c) => c.colspan > 1)) continue;
    const full = new Array(width).fill(null);
    let ci = 0;
    for (let col = 0; col < width; col += 1) {
      if (pending[col] && pending[col].left > 0) {
        full[col] = pending[col].cell;
        pending[col].left -= 1;
        continue;
      }
      const cell = cells[ci];
      ci += 1;
      if (!cell) break;
      full[col] = cell;
      if (cell.rowspan > 1) pending[col] = { cell, left: cell.rowspan - 1 };
    }
    if (ci !== cells.length || full.some((c) => c === null)) continue;
    rows.push(full);
  }
  return { names, rows };
}

export function buildDataset(html) {
  const start = html.indexOf('id="First_round"');
  const end = html.indexOf('id="Second_round"');
  if (start === -1 || end === -1) throw new Error("Section « First round » introuvable");
  const section = html.slice(start, end);
  const tables = [...section.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) => m[0]);
  if (tables.length === 0) throw new Error("Aucun tableau trouvé");

  const labels = new Map();
  const polls = new Map();

  for (const tableHtml of tables) {
    const { names, rows } = parseTable(tableHtml);
    const ids = names.map((n) => slugify(n));
    names.forEach((n, i) => labels.set(ids[i], n));

    for (const row of rows) {
      const pollster = stripTags(row[0].html);
      const url = row[0].html.match(/<a[^>]+href="(https?:\/\/[^"]+)"/i)?.[1] ?? null;
      const fw = parseFieldwork(row[1].html);
      if (!pollster || !fw) continue;
      if (/election/i.test(pollster)) continue;
      const scores = {};
      names.forEach((_, i) => {
        const v = parsePct(row[LEAD_COLUMNS + i].html);
        if (v !== null) scores[ids[i]] = v;
      });
      if (Object.keys(scores).length === 0) continue;

      const key = `${pollster}|${fw.start}|${fw.end}|${url ?? ""}`;
      let poll = polls.get(key);
      if (!poll) {
        poll = {
          id: `${slugify(pollster)}-${fw.end}`,
          pollster,
          fieldworkStart: fw.start,
          fieldworkEnd: fw.end,
          sampleSize: parseSample(row[2].html),
          noticeUrl: url,
          hypotheses: [],
        };
        polls.set(key, poll);
      }
      poll.hypotheses.push(scores);
    }
  }

  const list = [...polls.values()].sort(
    (a, b) => a.fieldworkEnd.localeCompare(b.fieldworkEnd) || a.pollster.localeCompare(b.pollster),
  );
  const seen = new Map();
  for (const p of list) {
    const n = (seen.get(p.id) ?? 0) + 1;
    seen.set(p.id, n);
    if (n > 1) p.id = `${p.id}-${n}`;
  }

  const used = new Set(list.flatMap((p) => p.hypotheses.flatMap((h) => Object.keys(h))));
  const candidates = [...used]
    .map((id) => ({ id, label: labels.get(id) }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));

  return { candidates, polls: list };
}
