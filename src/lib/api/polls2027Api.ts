export interface Polls2027Source {
  label: string;
  url: string;
  license?: string;
  retrievedAt?: string;
}

export interface Polls2027Meta {
  electionYear: number;
  round: number;
  generatedAt: string;
  latestFieldworkEnd: string | null;
  tableNote?: string;
  sources: Polls2027Source[];
}

export interface Polls2027Candidate {
  id: string;
  label: string;
}

export type Hypothesis = Record<string, number>;

export interface Poll2027 {
  id: string;
  pollster: string;
  fieldworkStart: string;
  fieldworkEnd: string;
  sampleSize: number | null;
  noticeUrl: string | null;
  hypotheses: Hypothesis[];
}

export interface Polls2027Dataset {
  meta: Polls2027Meta;
  candidates: Polls2027Candidate[];
  polls: Poll2027[];
}

export interface PollScores {
  poll: Poll2027;
  scores: Hypothesis;
}

export interface Scenario {
  key: string;
  ids: string[];
  pollCount: number;
}

export interface CandidateAverage {
  value: number;
  pollCount: number;
  margin: number | null;
}

export type TrendRow = { date: string; labelShort: string } & Record<string, number | string | undefined>;

export async function getPolls2027Round1(): Promise<Polls2027Dataset> {
  const res = await fetch("/data/presidential/polls-2027-round1.json");
  if (!res.ok) throw new Error("Impossible de charger les sondages.");
  return res.json() as Promise<Polls2027Dataset>;
}

export function addDaysIso(iso: string, delta: number): string {
  const base = new Date(`${iso}T12:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + delta);
  return base.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(`${to}T12:00:00.000Z`).getTime() - new Date(`${from}T12:00:00.000Z`).getTime()) / 86_400_000,
  );
}

export function hypothesisKey(h: Hypothesis): string {
  return Object.keys(h).sort().join("|");
}

export function listScenarios(dataset: Polls2027Dataset, minPolls = 3, max = 12): Scenario[] {
  const byKey = new Map<string, { ids: string[]; polls: Set<string> }>();
  for (const poll of dataset.polls) {
    for (const h of poll.hypotheses) {
      const key = hypothesisKey(h);
      const entry = byKey.get(key) ?? { ids: Object.keys(h).sort(), polls: new Set<string>() };
      entry.polls.add(poll.id);
      byKey.set(key, entry);
    }
  }
  return [...byKey.entries()]
    .map(([key, v]) => ({ key, ids: v.ids, pollCount: v.polls.size }))
    .filter((s) => s.pollCount >= minPolls)
    .sort((a, b) => b.pollCount - a.pollCount || a.key.localeCompare(b.key))
    .slice(0, max);
}

export function selectScores(dataset: Polls2027Dataset, scenarioKey: string | null): PollScores[] {
  const out: PollScores[] = [];
  for (const poll of dataset.polls) {
    const pool = scenarioKey ? poll.hypotheses.filter((h) => hypothesisKey(h) === scenarioKey) : poll.hypotheses;
    if (pool.length === 0) continue;
    const sums: Record<string, { total: number; n: number }> = {};
    for (const h of pool) {
      for (const [id, v] of Object.entries(h)) {
        const acc = sums[id] ?? { total: 0, n: 0 };
        acc.total += v;
        acc.n += 1;
        sums[id] = acc;
      }
    }
    const scores: Hypothesis = {};
    for (const [id, acc] of Object.entries(sums)) scores[id] = acc.total / acc.n;
    out.push({ poll, scores });
  }
  return out;
}

export function marginOfError(percent: number, sampleSize: number | null): number | null {
  if (!sampleSize || sampleSize <= 0) return null;
  const p = Math.min(Math.max(percent, 0), 100) / 100;
  return Math.round(1.96 * Math.sqrt((p * (1 - p)) / sampleSize) * 1000) / 10;
}

function weightOf(sampleSize: number | null): number {
  return sampleSize != null && sampleSize > 0 ? sampleSize : 1;
}

export function averageAt(
  entries: readonly PollScores[],
  candidateId: string,
  date: string,
  windowDays: number,
): CandidateAverage | null {
  const lo = addDaysIso(date, -(windowDays - 1));
  let num = 0;
  let den = 0;
  let count = 0;
  let sampleTotal = 0;
  for (const { poll, scores } of entries) {
    if (poll.fieldworkEnd < lo || poll.fieldworkEnd > date) continue;
    const v = scores[candidateId];
    if (v === undefined) continue;
    const w = weightOf(poll.sampleSize);
    num += v * w;
    den += w;
    count += 1;
    sampleTotal += poll.sampleSize ?? 0;
  }
  if (den === 0) return null;
  const value = Math.round((num / den) * 10) / 10;
  return { value, pollCount: count, margin: marginOfError(value, sampleTotal > 0 ? Math.round(sampleTotal / count) : null) };
}

export function averagesByCandidate(
  entries: readonly PollScores[],
  candidateIds: readonly string[],
  date: string,
  windowDays: number,
): Record<string, CandidateAverage> {
  const out: Record<string, CandidateAverage> = {};
  for (const id of candidateIds) {
    const avg = averageAt(entries, id, date, windowDays);
    if (avg) out[id] = avg;
  }
  return out;
}

export function buildTrend(
  entries: readonly PollScores[],
  candidateIds: readonly string[],
  windowDays: number,
  from: string,
  to: string,
  stepDays = 1,
): TrendRow[] {
  const rows: TrendRow[] = [];
  const longSpan = daysBetween(from, to) > 366;
  const pushRow = (d: string) => {
    const row: TrendRow = {
      date: d,
      labelShort: new Date(`${d}T12:00:00.000Z`).toLocaleDateString(
        "fr-FR",
        longSpan ? { month: "short", year: "2-digit" } : { day: "numeric", month: "short" },
      ),
    };
    for (const id of candidateIds) {
      const avg = averageAt(entries, id, d, windowDays);
      if (avg) row[id] = avg.value;
    }
    rows.push(row);
  };
  let last = from;
  for (let d = from; d <= to; d = addDaysIso(d, stepDays)) {
    pushRow(d);
    last = d;
  }
  if (last !== to) pushRow(to);
  return rows;
}
