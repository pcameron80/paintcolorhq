import "server-only";
import { GoogleAuth } from "google-auth-library";
import cityCoords from "@/generated/city-coords.json";
import { normalizePlace } from "@/lib/place-key";
import {
  PLAUSIBLE_FIRST_DAY,
  bounceInvalidOn,
  combineDays,
  plausibleChannels,
  plausibleConfigured,
  plausibleCountries,
  plausibleDaily,
  plausibleDayStats,
  plausibleGoals,
  plausibleHeavyHitters,
  plausibleLanding,
  plausibleRealtime,
  plausibleToday,
} from "@/lib/admin-plausible";
import type {
  ChannelsData,
  CountriesData,
  DailyData,
  DailyRow,
  EventRow,
  LandingData,
  LiveResponse,
  MapPoint,
  NameCount,
  PeriodStats,
  RealtimeData,
  ReportsData,
  SearchData,
  Section,
  Summary,
  TodayData,
  TrendData,
  YesterdayData,
} from "@/lib/admin-analytics-types";

/*
 * Server-only data layer for /admin/live. Talks to the GA4 Data API and the
 * Search Console API over REST with a service account. City coordinates come
 * from GeoNames (CC BY 4.0), see scripts/build-city-coords.ts.
 */

const SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
];
const TZ = "America/New_York";
const GSC_SITE = "sc-domain%3Apaintcolorhq.com";
const REQUEST_TIMEOUT_MS = 15_000;

const CITY_COORDS = cityCoords as unknown as Record<string, [number, number]>;

// ---------------------------------------------------------------- auth

type ServiceAccount = { client_email: string; private_key: string; [k: string]: unknown };

/**
 * GA4_SERVICE_ACCOUNT_JSON may be pasted into Vercel as multi-line pretty
 * printed JSON, or with literal "\n" sequences in private_key. Handle both.
 */
export function parseServiceAccount(raw: string): ServiceAccount {
  const parsed = JSON.parse(raw.trim()) as ServiceAccount;
  if (typeof parsed.private_key === "string" && parsed.private_key.includes("\\n")) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }
  return parsed;
}

let authClient: GoogleAuth | null = null;

function getAuth(): GoogleAuth {
  if (authClient) return authClient;
  const json = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (json && json.trim()) {
    authClient = new GoogleAuth({ credentials: parseServiceAccount(json), scopes: SCOPES });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    authClient = new GoogleAuth({ keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS, scopes: SCOPES });
  } else {
    throw new Error("No Google credentials configured");
  }
  return authClient;
}

async function googlePost<T>(url: string, data: unknown): Promise<T> {
  const res = await getAuth().request<T>({
    url,
    method: "POST",
    data,
    timeout: REQUEST_TIMEOUT_MS,
  });
  return res.data;
}

/** Log a short, secret-free line. Never log the raw error object (it can carry request config). */
function logFailure(section: string, err: unknown) {
  const status = (err as { response?: { status?: number } })?.response?.status;
  const msg = err instanceof Error ? err.message.split("\n")[0].slice(0, 160) : "unknown error";
  console.error(`[admin-analytics] ${section} failed${status ? ` (${status})` : ""}: ${msg}`);
}

async function safe<T>(section: string, fn: () => Promise<T>): Promise<Section<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    logFailure(section, err);
    return { ok: false };
  }
}

// ---------------------------------------------------------------- cache

type CacheEntry<T> = { at: number; value?: T; inflight?: Promise<T> };

function cached<T>(entry: CacheEntry<T>, ttlMs: number, load: () => Promise<T>, accept: (v: T) => boolean): Promise<T> {
  if (entry.value !== undefined && Date.now() - entry.at < ttlMs) return Promise.resolve(entry.value);
  if (entry.inflight) return entry.inflight;
  entry.inflight = load()
    .then((v) => {
      // Failed sections are not cached, so the next poll retries them.
      if (accept(v)) {
        entry.value = v;
        entry.at = Date.now();
      }
      return v;
    })
    .finally(() => {
      entry.inflight = undefined;
    });
  return entry.inflight;
}

const realtimeCache: CacheEntry<Section<RealtimeData>> = { at: 0 };
const reportsCache: CacheEntry<ReportsData> = { at: 0 };
const searchCache: CacheEntry<Section<SearchData>> = { at: 0 };

// ---------------------------------------------------------------- dates

function ymdInZone(d: Date): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function todayStr(): string {
  return ymdInZone(new Date());
}

function shiftDate(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function gaDate(raw: string): string {
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

// ---------------------------------------------------------------- GA4

type GaRow = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] };
type GaReport = { rows?: GaRow[] };

function propertyId(): string {
  return process.env.GA4_PROPERTY_ID || "524049284";
}

function runReport(body: unknown): Promise<GaReport> {
  return googlePost<GaReport>(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId()}:runReport`, body);
}

function runRealtime(body: unknown): Promise<GaReport> {
  return googlePost<GaReport>(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId()}:runRealtimeReport`, body);
}

const dim = (r: GaRow, i: number) => r.dimensionValues?.[i]?.value ?? "";
const met = (r: GaRow, i: number) => Number(r.metricValues?.[i]?.value ?? 0) || 0;

// ---- realtime

function resolvePoint(city: string, country: string, users: number): MapPoint | null {
  const noCountry = !country || country === "(not set)";
  if (noCountry) return null;
  const noCity = !city || city === "(not set)";
  if (!noCity) {
    const hit = CITY_COORDS[`${normalizePlace(city)}|${normalizePlace(country)}`];
    if (hit) return { city, country, users, lat: hit[0], lng: hit[1] };
  }
  // Country centroid is resolved on the client from the world topology.
  return { city: noCity ? "" : city, country, users };
}

async function loadRealtime(): Promise<Section<RealtimeData>> {
  // Plausible first: it counts visitors who decline cookies. GA4 realtime is
  // the fallback when Plausible is not configured or the NAS is unreachable.
  if (plausibleConfigured()) {
    const p = await safe("plausible realtime", plausibleRealtime);
    if (p.ok) {
      const points: MapPoint[] = [];
      for (const pl of p.data.places) {
        const pt = resolvePoint(pl.city, pl.country, pl.visitors);
        if (pt) points.push(pt);
      }
      return {
        ok: true,
        data: {
          activeUsers: p.data.visitors,
          perMinute: p.data.perMinute,
          points,
          pages: p.data.pages,
          devices: p.data.devices,
          source: "plausible",
          fetchedAt: Date.now(),
        },
      };
    }
  }
  return loadGaRealtime();
}

async function loadGaRealtime(): Promise<Section<RealtimeData>> {
  return safe("realtime", async () => {
    const metrics = [{ name: "activeUsers" }];
    const [total, geo, minutes, pages, devices] = await Promise.all([
      runRealtime({ metrics }),
      runRealtime({ dimensions: [{ name: "city" }, { name: "country" }], metrics, limit: 250 }),
      runRealtime({ dimensions: [{ name: "minutesAgo" }], metrics, limit: 30 }),
      runRealtime({
        dimensions: [{ name: "unifiedScreenName" }],
        metrics,
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 8,
      }),
      runRealtime({ dimensions: [{ name: "deviceCategory" }], metrics }),
    ]);

    const perMinute = Array<number>(30).fill(0);
    for (const r of minutes.rows ?? []) {
      const ago = Number(dim(r, 0));
      if (Number.isInteger(ago) && ago >= 0 && ago < 30) perMinute[29 - ago] = met(r, 0);
    }

    const points: MapPoint[] = [];
    for (const r of geo.rows ?? []) {
      const p = resolvePoint(dim(r, 0), dim(r, 1), met(r, 0));
      if (p) points.push(p);
    }

    const toCounts = (rep: GaReport): NameCount[] =>
      (rep.rows ?? []).map((r) => ({ name: dim(r, 0) || "(not set)", value: met(r, 0) })).sort((a, b) => b.value - a.value);

    return {
      activeUsers: met(total.rows?.[0] ?? {}, 0),
      perMinute,
      points,
      pages: toCounts(pages),
      devices: toCounts(devices),
      source: "ga4" as const,
      fetchedAt: Date.now(),
    };
  });
}

export function getRealtime(): Promise<Section<RealtimeData>> {
  return cached(realtimeCache, 30_000, loadRealtime, (v) => v.ok);
}

const todayCache: CacheEntry<Section<TodayData>> = { at: 0 };

/** Today so far, from Plausible only; GA4 lags too far behind to be useful here. */
export function getToday(): Promise<Section<TodayData>> {
  if (!plausibleConfigured()) return Promise.resolve({ ok: false });
  return cached(todayCache, 60_000, () => safe("plausible today", plausibleToday), (v) => v.ok);
}

// ---- reports

function periodStats(rows: DailyRow[]): PeriodStats {
  const sessions = rows.reduce((a, r) => a + r.sessions, 0);
  const engaged = rows.reduce((a, r) => a + r.engagedSessions, 0);
  const pv = rows.reduce((a, r) => a + r.pageViews, 0);
  return {
    sessions,
    pageViews: pv,
    pagesPerSession: sessions ? pv / sessions : 0,
    engagedRate: sessions ? engaged / sessions : 0,
  };
}

/**
 * Yesterday (the last complete day) vs the average of the 7 complete days
 * before it. GA4 standard reports for today lag by many hours, so today is
 * reported separately, without deltas, with the last hour GA4 has processed.
 */
async function loadSummary(): Promise<Summary> {
  const today = todayStr();
  const report = await runReport({
    dateRanges: [{ startDate: "8daysAgo", endDate: "today" }],
    dimensions: [{ name: "date" }, { name: "hour" }],
    metrics: [{ name: "sessions" }, { name: "engagedSessions" }, { name: "screenPageViews" }],
    limit: 250,
  });
  const byDate = new Map<string, DailyRow>();
  let lastHour = -1;
  for (const r of report.rows ?? []) {
    const date = gaDate(dim(r, 0));
    if (date === today) lastHour = Math.max(lastHour, Number(dim(r, 1)));
    const row = byDate.get(date) ?? { date, sessions: 0, engagedSessions: 0, pageViews: 0, users: 0 };
    row.sessions += met(r, 0);
    row.engagedSessions += met(r, 1);
    row.pageViews += met(r, 2);
    byDate.set(date, row);
  }
  const empty = (date: string): DailyRow => ({ date, sessions: 0, engagedSessions: 0, pageViews: 0, users: 0 });
  const day = (offset: number): DailyRow => byDate.get(shiftDate(today, -offset)) ?? empty(shiftDate(today, -offset));
  const weekTotal = periodStats([2, 3, 4, 5, 6, 7, 8].map(day));
  const t = byDate.get(today);
  return {
    yesterday: periodStats([day(1)]),
    avg7: { ...weekTotal, sessions: weekTotal.sessions / 7, pageViews: weekTotal.pageViews / 7 },
    today: t && lastHour >= 0 ? { sessions: t.sessions, pageViews: t.pageViews, lastHour } : null,
  };
}

async function loadDaily(): Promise<DailyData> {
  const report = await runReport({
    dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "sessions" }, { name: "engagedSessions" }, { name: "screenPageViews" }, { name: "totalUsers" }],
    orderBys: [{ dimension: { dimensionName: "date" } }],
    limit: 40,
  });
  const byDate = new Map<string, DailyRow>();
  for (const r of report.rows ?? []) {
    const date = gaDate(dim(r, 0));
    byDate.set(date, { date, sessions: met(r, 0), engagedSessions: met(r, 1), pageViews: met(r, 2), users: met(r, 3) });
  }
  // Fill zero days so the trend line has no gaps. Stops at yesterday: GA4's
  // standard reports lag many hours on today, so a today point always dips.
  const today = todayStr();
  const rows: DailyRow[] = [];
  for (let i = 28; i >= 1; i--) {
    const date = shiftDate(today, -i);
    rows.push(byDate.get(date) ?? { date, sessions: 0, engagedSessions: 0, pageViews: 0, users: 0 });
  }
  const summary = await safe("summary", loadSummary);
  return { rows, summary: summary.ok ? summary.data : null };
}

// ---- 7-day sections: Plausible first, GA4 when Plausible is unavailable

/** The 7 full days ending yesterday, and the 7 before them (ET). */
function weekRanges() {
  const today = todayStr();
  return {
    current: { start: shiftDate(today, -7), end: shiftDate(today, -1) },
    previous: { start: shiftDate(today, -14), end: shiftDate(today, -8) },
  };
}

/** Plausible when configured and answering; otherwise the GA4 loader. */
async function preferPlausible<T>(section: string, plausible: () => Promise<T>, ga4: () => Promise<T>): Promise<Section<T>> {
  if (plausibleConfigured()) {
    const p = await safe(`plausible ${section}`, plausible);
    if (p.ok) return p;
  }
  return safe(section, ga4);
}

/**
 * Daily trend from Plausible, starting at its first full day and growing to
 * 28 days by 2026-11-18. It is not spliced onto GA4's earlier days: Plausible
 * counts visitors who decline cookies (and bots GA4 filters), so a spliced
 * line would jump on the switch day and read as growth.
 */
async function plausibleTrend(): Promise<TrendData> {
  const today = todayStr();
  const first = [shiftDate(today, -28), PLAUSIBLE_FIRST_DAY].sort()[1];
  const end = shiftDate(today, -1);
  if (first > end) throw new Error("No full Plausible days yet");
  const dates: string[] = [];
  for (let d = first; d <= end; d = shiftDate(d, 1)) dates.push(d);
  const range = { start: first, end };
  const [rows, heavy] = await Promise.all([plausibleDaily(range, dates), plausibleHeavyHitters(range)]);
  const week = weekRanges().current;
  const inWeek = (d: string) => d >= week.start && d <= week.end;
  const weekPv = rows.filter((r) => inWeek(r.date)).reduce((a, r) => a + r.pageViews, 0);
  const weekHeavy = heavy.filter((h) => inWeek(h.date));
  const heavyPv = weekHeavy.reduce((a, h) => a + h.pageViews, 0);
  return {
    source: "plausible",
    rows,
    heavy,
    heavy7: {
      visitorDays: weekHeavy.reduce((a, h) => a + h.visitorDays, 0),
      pageViews: heavyPv,
      share: weekPv ? heavyPv / weekPv : 0,
    },
  };
}

/**
 * Yesterday vs the per-day average of the 7 days before it, from Plausible,
 * with the same Eastern day boundaries as GA4's summary. GA4's engaged rate
 * for the same days rides along as a secondary line.
 */
async function plausibleYesterday(daily: Promise<Section<DailyData>>): Promise<YesterdayData> {
  const today = todayStr();
  const date = shiftDate(today, -1);
  const avgFrom = shiftDate(today, -8);
  const avgTo = shiftDate(today, -2);
  if (avgFrom < PLAUSIBLE_FIRST_DAY) throw new Error("Fewer than 8 full Plausible days");
  const range = { start: avgFrom, end: date };
  const [days, heavy] = await Promise.all([plausibleDayStats(range), plausibleHeavyHitters(range)]);
  const prior = days.filter((d) => d.date >= avgFrom && d.date <= avgTo);
  const bounceDays: string[] = [];
  for (let d = avgFrom; d <= avgTo; d = shiftDate(d, 1)) {
    if (!bounceInvalidOn(d) && prior.some((p) => p.date === d && p.visits > 0)) bounceDays.push(d);
  }
  const summary = await daily;
  const s = summary.ok ? summary.data.summary : null;
  return {
    date,
    yesterday: combineDays(
      days.filter((d) => d.date === date),
      heavy,
      1,
    ),
    avg7: combineDays(prior, heavy, 7),
    avgFrom,
    avgTo,
    bounceDays,
    engaged: s ? { yesterday: s.yesterday.engagedRate, avg7: s.avg7.engagedRate } : null,
  };
}

function gaTrend(daily: DailyData): TrendData {
  return {
    source: "ga4",
    rows: daily.rows.map((r) => ({ date: r.date, visitors: r.users, visits: r.sessions, pageViews: r.pageViews })),
    heavy: null,
    heavy7: null,
  };
}

const AI_SOURCE = /(chatgpt|openai|perplexity|claude\.ai|anthropic|gemini\.google|copilot|bard|you\.com|phind|poe\.com|deepseek|grok|meta\.ai|mistral)/i;

const CHANNEL_LABELS: Record<string, string> = {
  "Organic Search": "From Google and Bing",
  "AI Assistants": "From AI assistants",
  Direct: "Typed or bookmarked",
  Referral: "From other websites",
  "Organic Social": "From social media",
  "Paid Search": "From paid search",
  Email: "From email",
  "Organic Shopping": "From shopping results",
  "Organic Video": "From video sites",
  Unassigned: "Unknown",
};

async function loadGaChannels(): Promise<ChannelsData> {
  const report = await runReport({
    dateRanges: [{ startDate: "7daysAgo", endDate: "yesterday" }],
    dimensions: [{ name: "sessionDefaultChannelGroup" }, { name: "sessionSource" }],
    metrics: [{ name: "sessions" }],
    limit: 250,
  });
  const totals = new Map<string, number>();
  for (const r of report.rows ?? []) {
    let key = dim(r, 0) || "Unassigned";
    if (AI_SOURCE.test(dim(r, 1))) key = "AI Assistants";
    totals.set(key, (totals.get(key) ?? 0) + met(r, 0));
  }
  const rows = [...totals.entries()]
    .map(([key, visits]) => ({ key, label: CHANNEL_LABELS[key] ?? key, visits }))
    .sort((a, b) => b.visits - a.visits);
  return { source: "ga4", rows };
}

/** GA4 engagement rate per landing path, joined onto Plausible's entry pages. */
async function gaEngagementByLanding(paths: string[]): Promise<Map<string, number>> {
  if (!paths.length) return new Map();
  const report = await runReport({
    dateRanges: [{ startDate: "7daysAgo", endDate: "yesterday" }],
    dimensions: [{ name: "landingPage" }],
    metrics: [{ name: "engagementRate" }],
    dimensionFilter: { filter: { fieldName: "landingPage", inListFilter: { values: paths } } },
    limit: 50,
  });
  return new Map((report.rows ?? []).map((r) => [dim(r, 0), met(r, 0)]));
}

async function loadPlausibleLanding(): Promise<LandingData> {
  const p = await plausibleLanding(weekRanges().current);
  // Engagement rate is GA4 only. Leave it off if GA4 does not answer.
  const engaged = await safe("landing engagement", () => gaEngagementByLanding(p.rows.map((r) => r.path)));
  const rows = p.rows.map((r) => ({ ...r, engagementRate: engaged.ok ? engaged.data.get(r.path) : undefined }));
  return { source: "plausible", rows, bounce: p.bounce, bounceFrom: p.bounceFrom };
}

async function loadGaLanding(): Promise<LandingData> {
  const report = await runReport({
    dateRanges: [{ startDate: "7daysAgo", endDate: "yesterday" }],
    dimensions: [{ name: "landingPagePlusQueryString" }],
    metrics: [{ name: "sessions" }, { name: "engagementRate" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 10,
  });
  const rows = (report.rows ?? []).map((r) => ({ path: dim(r, 0), visits: met(r, 0), engagementRate: met(r, 1) }));
  return { source: "ga4", rows, bounce: "none", bounceFrom: null };
}

const EVENT_LABELS: Record<string, string> = {
  tool_use: "Tool used",
  retailer_click: "Retailer link clicked",
  color_search: "Color searched",
  color_compare: "Colors compared",
  cta_click: "Button clicked",
  color_swatch_click: "Color swatch clicked",
};

/**
 * GA4 event name to Plausible goal, as mirrored by trackEvent in
 * src/lib/analytics.ts and confirmed against the goals table on the NAS.
 * Plausible's Tool Use counts actual uses only; GA4's tool_use also counts
 * every tool page open. Events without a goal stay on GA4.
 */
const PLAUSIBLE_GOALS: Record<string, string> = {
  retailer_click: "Retailer Click",
  color_search: "Color Search",
  color_compare: "Compare",
  tool_use: "Tool Use",
};

async function gaEventCounts(names: string[]): Promise<EventRow[]> {
  const report = await runReport({
    dateRanges: [
      { startDate: "7daysAgo", endDate: "yesterday", name: "current" },
      { startDate: "14daysAgo", endDate: "8daysAgo", name: "previous" },
    ],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: names } } },
    limit: 20,
  });
  const out = new Map<string, EventRow>(
    names.map((n) => [n, { name: n, label: EVENT_LABELS[n], current: 0, previous: 0, source: "ga4" as const }]),
  );
  for (const r of report.rows ?? []) {
    const row = out.get(dim(r, 0));
    if (!row) continue;
    // With several date ranges GA4 appends a "dateRange" dimension after the requested ones.
    if (dim(r, 1) === "previous") row.previous = met(r, 0);
    else row.current = met(r, 0);
  }
  return [...out.values()];
}

const byCurrent = (rows: EventRow[]) => rows.sort((a, b) => b.current - a.current);

async function loadPlausibleEvents(): Promise<EventRow[]> {
  const { current, previous } = weekRanges();
  const goals = Object.values(PLAUSIBLE_GOALS);
  // No comparison while the previous week starts before Plausible has data.
  const hasPrevious = previous.start >= PLAUSIBLE_FIRST_DAY;
  const [cur, prev] = await Promise.all([
    plausibleGoals(current, goals),
    hasPrevious ? plausibleGoals(previous, goals) : Promise.resolve(null),
  ]);
  const rows: EventRow[] = Object.entries(PLAUSIBLE_GOALS).map(([name, goal]) => ({
    name,
    label: EVENT_LABELS[name],
    current: cur.get(goal) ?? 0,
    previous: prev ? (prev.get(goal) ?? 0) : null,
    source: "plausible",
  }));
  const gaNames = Object.keys(EVENT_LABELS).filter((n) => !PLAUSIBLE_GOALS[n]);
  const ga = await safe("events (GA4 only)", () => gaEventCounts(gaNames));
  return byCurrent(ga.ok ? [...rows, ...ga.data] : rows);
}

async function loadGaEvents(): Promise<EventRow[]> {
  return byCurrent(await gaEventCounts(Object.keys(EVENT_LABELS)));
}

async function loadGaCountries(): Promise<CountriesData> {
  const report = await runReport({
    dateRanges: [{ startDate: "7daysAgo", endDate: "yesterday" }],
    dimensions: [{ name: "country" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 6,
  });
  return { source: "ga4", rows: (report.rows ?? []).map((r) => ({ country: dim(r, 0), visits: met(r, 0) })) };
}

async function loadReports(): Promise<ReportsData> {
  const week = weekRanges().current;
  const dailyP = safe("daily", loadDaily);
  const [daily, trend, yesterday, channels, landing, events, countries] = await Promise.all([
    dailyP,
    preferPlausible("trend", plausibleTrend, async () => {
      const d = await dailyP;
      if (!d.ok) throw new Error("GA4 daily unavailable");
      return gaTrend(d.data);
    }),
    // No GA4 loader here: the page falls back to the GA4 summary in `daily`.
    plausibleConfigured() ? safe("plausible yesterday", () => plausibleYesterday(dailyP)) : Promise.resolve({ ok: false as const }),
    preferPlausible("channels", async () => ({ source: "plausible" as const, rows: await plausibleChannels(week) }), loadGaChannels),
    preferPlausible("landing", loadPlausibleLanding, loadGaLanding),
    preferPlausible("events", loadPlausibleEvents, loadGaEvents),
    preferPlausible("countries", async () => ({ source: "plausible" as const, rows: await plausibleCountries(week) }), loadGaCountries),
  ]);
  return { daily, trend, yesterday, channels, landing, events, countries, fetchedAt: Date.now() };
}

export function getReports(): Promise<ReportsData> {
  const allOk = (r: ReportsData) =>
    r.daily.ok && r.trend.ok && (r.yesterday.ok || !plausibleConfigured()) && r.channels.ok && r.landing.ok && r.events.ok && r.countries.ok;
  return cached(reportsCache, 10 * 60_000, loadReports, allOk);
}

// ---------------------------------------------------------------- Search Console

type GscRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

function gscQuery(body: unknown): Promise<{ rows?: GscRow[] }> {
  return googlePost(`https://www.googleapis.com/webmasters/v3/sites/${GSC_SITE}/searchAnalytics/query`, body);
}

async function loadSearch(): Promise<Section<SearchData>> {
  return safe("search", async () => {
    const today = todayStr();
    const daily = await gscQuery({
      startDate: shiftDate(today, -35),
      endDate: today,
      dimensions: ["date"],
      rowLimit: 60,
    });
    const days = (daily.rows ?? [])
      .map((r) => ({ date: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-28);
    if (!days.length) throw new Error("No Search Console rows");
    const lastDate = days[days.length - 1].date;
    const queriesFrom = shiftDate(lastDate, -6);
    const q = await gscQuery({
      startDate: queriesFrom,
      endDate: lastDate,
      dimensions: ["query"],
      rowLimit: 10,
    });
    const queries = (q.rows ?? [])
      .map((r) => ({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }))
      .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
    return { days, lastDate, queries, queriesFrom, fetchedAt: Date.now() };
  });
}

export function getSearch(): Promise<Section<SearchData>> {
  return cached(searchCache, 60 * 60_000, loadSearch, (v) => v.ok);
}

// ---------------------------------------------------------------- public API

export async function getLiveData(part: "realtime" | "reports" | "search" | "all" = "all"): Promise<Partial<LiveResponse>> {
  if (part === "realtime") {
    const [realtime, today] = await Promise.all([getRealtime(), getToday()]);
    return { realtime, today };
  }
  if (part === "reports") return { reports: await getReports() };
  if (part === "search") return { search: await getSearch() };
  const [realtime, today, reports, search] = await Promise.all([getRealtime(), getToday(), getReports(), getSearch()]);
  return { realtime, today, reports, search };
}
