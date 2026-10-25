export const fmtInt = (n: number): string => Math.round(n).toLocaleString("fr-FR");
export const fmtPct = (n: number, d = 1): string => `${n.toFixed(d).replace(".", ",")} %`;
export const fmtSigned = (n: number, d = 1): string => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(d).replace(".", ",")}`;
