import "server-only";
import { PLAUSIBLE_ORIGIN } from "@/lib/plausible";
import type { ChannelRow, CountriesData, DayStats, HeavyDay, NameCount, TodayStats, TrendRow } from "@/lib/admin-analytics-types";

/*
 * Plausible Stats API v2 (self-hosted CE on the NAS). Plausible counts every
 * visitor without cookies and has no processing lag, so it supplies "right
 * now", "today" and, since it has a full week of data, the 7-day reports.
 * GA4 keeps the history before Plausible, engagement rate and the events that
 * are not Plausible goals. The site's Plausible timezone is America/New_York,
 * so plain YYYY-MM-DD date ranges match GA4's days.
 */

/** First full Eastern day of Plausible data. Collection began 2026-10-20 21:44 UTC. */
export const PLAUSIBLE_FIRST_DAY = "2026-10-21";

/**
 * Bounce rate and visit duration are invalid from 2026-10-24 until this
 * instant: every Web Vitals event cleared the bounce flag (#246, fixed in #296).
 */
const BOUNCE_BAD_FIRST_DAY = "2026-10-24";
const BOUNCE_VALID_FROM = "2026-10-27T12:10:00Z";
const BOUNCE_VALID_FIRST_DAY = "2026-10-27";

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

// ---------------------------------------------------------------- 7-day reports

type Range = { start: string; end: string };

/** End of an Eastern day as ISO 8601 with offset, for ranges that mix in a timestamp. */
function endOfDay(ymdStr: string): string {
  return `${ymdStr}T23:59:59${zoneOffset(new Date(`${ymdStr}T12:00:00Z`))}`;
}

const AI_SOURCE = /(chatgpt|openai|perplexity|claude|anthropic|gemini|copilot|microsoft\.ai|bard|you\.com|phind|poe\.com|deepseek|grok|meta\.ai|mistral)/i;
const EMAIL_SOURCE = /(mail|outlook)/i;
// Bing's index answers these, so they move with Bing rankings, not Google's.
const BING_FAMILY = new Set(["Bing", "DuckDuckGo", "Yahoo!", "Yahoo! Images", "Ecosia", "Qwant"]);
const OTHER_SEARCH = /^(brave|yandex|baidu|naver|startpage|seznam|sogou|so\.com|mojeek|kagi|you)$/i;
const SOCIAL_SOURCE = /^(reddit|facebook|instagram|pinterest|x|twitter|linkedin|youtube|tiktok|threads|nextdoor|bluesky|tumblr|quora|houzz)$/i;

const CHANNEL_LABELS: Record<string, string> = {
  google: "From Google",
  bing: "From Bing, DuckDuckGo, Yahoo, Ecosia",
  search: "From other search engines",
  ai: "From AI assistants",
  direct: "Typed or bookmarked",
  social: "From social media",
  email: "From email",
  referral: "From other websites",
};

function channelFor(source: string): string {
  if (!source || source === "Direct / None") return "direct";
  if (AI_SOURCE.test(source)) return "ai";
  if (EMAIL_SOURCE.test(source)) return "email";
  if (/^google( images)?$/i.test(source)) return "google";
  if (BING_FAMILY.has(source)) return "bing";
  if (OTHER_SEARCH.test(source)) return "search";
  if (SOCIAL_SOURCE.test(source)) return "social";
  return "referral";
}

export async function plausibleChannels(r: Range): Promise<ChannelRow[]> {
  const res = await query({
    metrics: ["visits"],
    date_range: [r.start, r.end],
    dimensions: ["visit:source"],
    pagination: { limit: 1000 },
  });
  const totals = new Map<string, number>();
  for (const x of res.results) {
    const key = channelFor(x.dimensions[0] ?? "");
    totals.set(key, (totals.get(key) ?? 0) + x.metrics[0]);
  }
  return [...totals.entries()]
    .map(([key, visits]) => ({ key, label: CHANNEL_LABELS[key], visits }))
    .sort((a, b) => b.visits - a.visits);
}

/**
 * Top entry pages with Plausible bounce rate. When the window overlaps the
 * invalid bounce period, bounce comes from the valid part only (or not at all).
 */
export async function plausibleLanding(r: Range) {
  const top = await query({
    metrics: ["visits", "bounce_rate"],
    date_range: [r.start, r.end],
    dimensions: ["visit:entry_page"],
    order_by: [["visits", "desc"]],
    pagination: { limit: 11 },
  });
  // An empty entry page is a session with no pageview (events only), not a landing.
  const rows = top.results
    .filter((x) => x.dimensions[0])
    .slice(0, 10)
    .map((x) => ({ path: x.dimensions[0], visits: x.metrics[0], bounceRate: (x.metrics[1] / 100) as number | null }));

  const overlaps = r.end >= BOUNCE_BAD_FIRST_DAY && r.start <= BOUNCE_VALID_FIRST_DAY;
  if (!overlaps) return { rows, bounce: "full" as const, bounceFrom: null };
  if (r.end < BOUNCE_VALID_FIRST_DAY || !rows.length) {
    return { rows: rows.map((x) => ({ ...x, bounceRate: null })), bounce: "excluded" as const, bounceFrom: null };
  }
  const valid = await query({
    metrics: ["bounce_rate"],
    date_range: [BOUNCE_VALID_FROM, endOfDay(r.end)],
    dimensions: ["visit:entry_page"],
    filters: [["is", "visit:entry_page", rows.map((x) => x.path)]],
  });
  const byPath = new Map(valid.results.map((x) => [x.dimensions[0], x.metrics[0] / 100]));
  return {
    rows: rows.map((x) => ({ ...x, bounceRate: byPath.get(x.path) ?? null })),
    bounce: "trimmed" as const,
    bounceFrom: BOUNCE_VALID_FIRST_DAY,
  };
}

export async function plausibleCountries(r: Range): Promise<CountriesData["rows"]> {
  const res = await query({
    metrics: ["visits"],
    date_range: [r.start, r.end],
    dimensions: ["visit:country_name"],
    order_by: [["visits", "desc"]],
    pagination: { limit: 6 },
  });
  return res.results.map((x) => ({ country: x.dimensions[0] || "(not set)", visits: x.metrics[0] }));
}

/** Goal completions per goal name. Names must match the goals table exactly. */
export async function plausibleGoals(r: Range, goals: string[]): Promise<Map<string, number>> {
  const res = await query({
    metrics: ["events"],
    date_range: [r.start, r.end],
    dimensions: ["event:goal"],
    filters: [["is", "event:goal", goals]],
  });
  return new Map(res.results.map((x) => [x.dimensions[0], x.metrics[0]]));
}

/** Visitors, visits and page views per Eastern day. Missing days come back as zero. */
export async function plausibleDaily(r: Range, dates: string[]): Promise<TrendRow[]> {
  const res = await query({
    metrics: ["visitors", "visits", "pageviews"],
    date_range: [r.start, r.end],
    dimensions: ["time:day"],
  });
  const byDate = new Map(res.results.map((x) => [x.dimensions[0].slice(0, 10), x.metrics]));
  return dates.map((date) => {
    const m = byDate.get(date) ?? [0, 0, 0];
    return { date, visitors: m[0], visits: m[1], pageViews: m[2] };
  });
}

/**
 * Visitor-days over 100 page views, the API version of
 * scripts/analytics/heavy-hitters.sql. The API cannot group by visitor, so
 * this groups by day and session fingerprint (city, browser, OS, device) and
 * flags groups averaging over 100 page views per visitor: such a group holds
 * at least one heavy hitter. Checked against the SQL on 2026-10-21..29 (ET):
 * the same 10 visitor-days, no false positives. Page views are the whole
 * group's, so they can include a few ordinary visitors who share the fingerprint.
 */
export async function plausibleHeavyHitters(r: Range): Promise<HeavyDay[]> {
  const res = await query({
    metrics: ["visitors", "pageviews", "visits"],
    date_range: [r.start, r.end],
    dimensions: ["time:day", "visit:city", "visit:browser", "visit:os", "visit:device"],
    order_by: [["pageviews", "desc"]],
    pagination: { limit: 1000 },
  });
  const byDate = new Map<string, HeavyDay>();
  for (const x of res.results) {
    const [visitors, pv, visits] = x.metrics;
    if (pv <= 100 * visitors) continue;
    const date = x.dimensions[0].slice(0, 10);
    const d = byDate.get(date) ?? { date, visitorDays: 0, visits: 0, pageViews: 0 };
    d.visitorDays += 1;
    d.visits += visits;
    d.pageViews += pv;
    byDate.set(date, d);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** True when an Eastern day falls in the invalid bounce period (any part of it). */
export function bounceInvalidOn(day: string): boolean {
  return day >= BOUNCE_BAD_FIRST_DAY && day <= BOUNCE_VALID_FIRST_DAY;
}

type DayRow = { date: string; visits: number; pageViews: number; bounceRate: number };

/** Visits, page views and bounce per Eastern day. Missing days come back as zero. */
export async function plausibleDayStats(r: Range): Promise<DayRow[]> {
  const res = await query({
    metrics: ["visits", "pageviews", "bounce_rate"],
    date_range: [r.start, r.end],
    dimensions: ["time:day"],
  });
  return res.results.map((x) => ({
    date: x.dimensions[0].slice(0, 10),
    visits: x.metrics[0],
    pageViews: x.metrics[1],
    bounceRate: x.metrics[2] / 100,
  }));
}

/**
 * Combine days into per-day averages. Pages per visit and bounce are ratios of
 * the totals, so a light day does not count as much as a heavy one. Bounce
 * skips days in the invalid bounce period.
 */
export function combineDays(days: DayRow[], heavy: HeavyDay[], n: number): DayStats {
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const visits = sum(days.map((d) => d.visits));
  const pv = sum(days.map((d) => d.pageViews));
  const dates = new Set(days.map((d) => d.date));
  const h = heavy.filter((x) => dates.has(x.date));
  const hPv = sum(h.map((x) => x.pageViews));
  const hVisits = sum(h.map((x) => x.visits));
  const valid = days.filter((d) => !bounceInvalidOn(d.date) && d.visits > 0);
  const validVisits = sum(valid.map((d) => d.visits));
  return {
    visits: visits / n,
    pageViews: pv / n,
    viewsPerVisit: visits ? pv / visits : 0,
    bounceRate: validVisits ? sum(valid.map((d) => d.bounceRate * d.visits)) / validVisits : null,
    heavyPageViews: hPv / n,
    heavyVisitorDays: sum(h.map((x) => x.visitorDays)) / n,
    exHeavyPageViews: (pv - hPv) / n,
    exHeavyViewsPerVisit: visits - hVisits > 0 ? (pv - hPv) / (visits - hVisits) : 0,
  };
}
