const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function fmtCount(n: number | null | undefined): string {
  return n === null || n === undefined ? "–" : compact.format(n);
}

export function fmtRate(n: number | null | undefined): string {
  if (n === null || n === undefined) return "–";
  const s = n >= 100 ? compact.format(Math.round(n)) : n.toFixed(1);
  return `${s}/s`;
}

export function fmtUptime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "–";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${Math.floor(seconds % 60)}s`;
}

/** "0.56.0 (aarch64-apple-darwin ...)" -> "0.56.0" */
export function fmtVersion(v: string | null | undefined): string {
  return v ? v.split(" ")[0] : "–";
}
