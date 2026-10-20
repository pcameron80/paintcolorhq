/** Readable number: 842, 1.2k, 18k, 1.4M. */
export function fmtNum(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${trim(n / 1_000_000)}M`;
  if (abs >= 10_000) return `${Math.round(n / 1000)}k`;
  if (abs >= 1000) return `${trim(n / 1000)}k`;
  if (abs >= 100 || Number.isInteger(n)) return String(Math.round(n));
  return trim(n);
}

function trim(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}

export function fmtPct(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function fmtDecimal(n: number): string {
  return n.toFixed(2);
}

export type Delta = { dir: "up" | "down" | "flat"; text: string };

/** Relative change as plain text plus a direction (never color alone). */
export function relDelta(current: number, base: number): Delta | null {
  if (!isFinite(base) || base === 0) return null;
  const change = (current - base) / base;
  if (Math.abs(change) < 0.005) return { dir: "flat", text: "no change" };
  const pct = Math.abs(change) * 100;
  const text = `${pct >= 10 ? Math.round(pct) : pct.toFixed(1)}%`;
  return { dir: change > 0 ? "up" : "down", text: `${change > 0 ? "up" : "down"} ${text}` };
}

/** Percentage-point change, for rates. */
export function pointDelta(current: number, base: number): Delta | null {
  if (!isFinite(base) || base === 0) return null;
  const pts = (current - base) * 100;
  if (Math.abs(pts) < 0.05) return { dir: "flat", text: "no change" };
  return { dir: pts > 0 ? "up" : "down", text: `${pts > 0 ? "up" : "down"} ${Math.abs(pts).toFixed(1)} pts` };
}

export function shortDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function ago(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return `${m}m ago`;
}
