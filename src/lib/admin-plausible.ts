import "server-only";
import { PLAUSIBLE_ORIGIN } from "@/lib/plausible";
import type { NameCount, TodayStats } from "@/lib/admin-analytics-types";

/*
 * Plausible Stats API v2 (self-hosted CE on the NAS). Plausible counts every
 * visitor without cookies and has no processing lag, so it supplies "right
 * now" and "today". GA4 keeps history, engagement and events.
 */

const SITE_ID = "paintcolorhq.com";
const TZ = "America/New_York";

type QueryResult = { results: { metrics: number[]; dimensions: string[] }[] };

export function plausibleConfigured(): boolean {
  return Boolean(process.env.PLAUSIBLE_API_KEY);
}

async function query(body: Record<string, unknown>): Promise<QueryResult> {
  const res = await fetch(`${PLAUSIBLE_ORIGIN}/api/v2/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PLAUSIBLE_API_KEY ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ site_id: SITE_ID, ...body }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Plausible query failed (${res.status})`);
  return (await res.json()) as QueryResult;
}

/** "GMT-04:00" style offset for TZ on the given date. */
function zoneOffset(at: Date): string {
  const part = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "longOffset" })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")?.value;
  const m = part?.match(/GMT([+-]\d{2}:\d{2})/);
  return m ? m[1] : "+00:00";
}

function ymd(at: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

/** Midnight Eastern at the start of the day containing `at`, as ISO 8601 with offset. */
function startOfDay(at: Date): string {
  return `${ymd(at)}T00:00:00${zoneOffset(at)}`;
}

const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

const STAT_METRICS = ["visitors", "visits", "pageviews", "views_per_visit", "bounce_rate"];

function toStats(r: QueryResult): TodayStats {
  const m = r.results[0]?.metrics ?? [];
  return {
    visitors: m[0] ?? 0,
    visits: m[1] ?? 0,
    pageViews: m[2] ?? 0,
    viewsPerVisit: m[3] ?? 0,
    bounceRate: (m[4] ?? 0) / 100,
  };
}

export async function plausibleToday() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [today, yesterday] = await Promise.all([
    query({ metrics: STAT_METRICS, date_range: [startOfDay(now), iso(now)] }),
    query({ metrics: STAT_METRICS, date_range: [startOfDay(dayAgo), iso(dayAgo)] }),
  ]);
  const y = toStats(yesterday);
  return {
    today: toStats(today),
    sameTimeYesterday: y.visits > 0 ? y : null,
    asOf: now.toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }),
    fetchedAt: Date.now(),
  };
}

export type PlausibleRealtime = {
  visitors: number;
  perMinute: number[];
  places: { city: string; country: string; visitors: number }[];
  pages: NameCount[];
  devices: NameCount[];
};

/** The last 30 minutes, matching GA4's realtime window. */
export async function plausibleRealtime(): Promise<PlausibleRealtime> {
  const now = new Date();
  const from = new Date(now.getTime() - 30 * 60 * 1000);
  const range = [iso(from), iso(now)];
  const [total, geo, pages, devices] = await Promise.all([
    query({ metrics: ["visitors"], date_range: range }),
    query({ metrics: ["visitors"], date_range: range, dimensions: ["visit:city_name", "visit:country_name"] }),
    query({ metrics: ["visitors"], date_range: range, dimensions: ["event:page"], order_by: [["visitors", "desc"]], pagination: { limit: 8 } }),
    query({ metrics: ["visitors"], date_range: range, dimensions: ["visit:device"] }),
  ]);

  // Per-minute bars are optional: older Plausible versions reject time:minute.
  const perMinute = Array<number>(30).fill(0);
  try {
    const minutes = await query({ metrics: ["visitors"], date_range: range, dimensions: ["time:minute"] });
    for (const r of minutes.results) {
      const t = Date.parse(r.dimensions[0].replace(" ", "T") + zoneOffset(now));
      const ago = Math.floor((now.getTime() - t) / 60_000);
      if (ago >= 0 && ago < 30) perMinute[29 - ago] += r.metrics[0];
    }
  } catch {
    // Leave the bars empty rather than fail the section.
  }

  const counts = (r: QueryResult): NameCount[] =>
    r.results.map((x) => ({ name: x.dimensions[0] || "(not set)", value: x.metrics[0] })).sort((a, b) => b.value - a.value);

  return {
    visitors: total.results[0]?.metrics[0] ?? 0,
    perMinute,
    places: geo.results.map((x) => ({ city: x.dimensions[0] ?? "", country: x.dimensions[1] ?? "", visitors: x.metrics[0] })),
    pages: counts(pages),
    devices: counts(devices).map((d) => ({ ...d, name: d.name.toLowerCase() })),
  };
}
