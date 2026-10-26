export interface ScrutinMeta {
  id: string;
  type: "legislatives" | "europeennes" | "municipales";
  year: number;
  label: string;
  short: string;
  kind: "nuance" | "list" | "local";
  tours: number[];
}

export interface ScrutinLine {
  key: string;
  label: string;
  voix: number;
  pct: number;
  detail?: string;
  full?: string;
  nuance?: string;
  nuanceLabel?: string;
  sieges?: number;
}

export interface ScrutinResult {
  nomCommune: string | null;
  inscrits: number;
  abstentions: number;
  votants: number;
  blancs: number;
  nuls: number;
  exprimes: number;
  participation: number;
  lines: ScrutinLine[];
  communes?: number;
}

export interface ScrutinFile {
  v: 1;
  scrutin: string;
  tour: number;
  kind: "nuance" | "list" | "local";
  entries?: string[][];
  rows: Record<string, unknown[]>;
}

export type ScrutinResults = Record<string, Partial<Record<number, ScrutinResult | null>> | undefined>;

export const SCRUTINS: ScrutinMeta[];
export const SCRUTIN_FILE_VERSION: string;
export function scrutinById(id: string): ScrutinMeta | undefined;
export function tourLabel(scrutin: ScrutinMeta, tour: number): string;
export function scrutinTourTitle(scrutin: ScrutinMeta, tour: number): string;
export function coverageLabel(ids: string[]): string;
export function fmtInt(n: number): string;
export function fmtPct(n: number): string;
export function nuanceLabel(code: string): string;
export function formatHead(raw: string): string;
export function decodeScrutinRow(file: ScrutinFile | null | undefined, code: string): ScrutinResult | null;
export function aggregateScrutinFile(file: ScrutinFile): ScrutinResult;
export function leadSentence(scrutin: ScrutinMeta, tour: number, name: string, result: ScrutinResult, options?: { aggregate?: boolean }): string;
export function coveredIds(results: ScrutinResults | undefined): string[];
export function summaryRows(results: ScrutinResults | undefined): { scrutin: ScrutinMeta; tour: number; label: string; lead: string; pct: number; participation: number }[];
export function communeScrutinsFaq(name: string, results: ScrutinResults | undefined): { q: string; a: string }[];
export function communeTitle(name: string): string;
export function communeDescription(name: string, ids?: string[]): string;
