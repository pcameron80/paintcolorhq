/** Shared (client-safe) shapes for the private /admin/live dashboard. */

/** A dashboard section that fails on its own without taking the page down. */
export type Section<T> = { ok: true; data: T } | { ok: false };

export type DailyRow = {
  /** YYYY-MM-DD in the property timezone (America/New_York). */
  date: string;
  sessions: number;
  engagedSessions: number;
  pageViews: number;
  users: number;
};

export type PeriodStats = {
  sessions: number;
  pageViews: number;
  pagesPerSession: number;
  engagedRate: number;
};

/**
 * Yesterday (last complete day) vs the average of the 7 complete days before it.
 * Today is shown without deltas because GA4 standard reports lag by many hours.
 */
export type Summary = {
  yesterday: PeriodStats;
  /** Average per day over the 7 complete days before yesterday. */
  avg7: PeriodStats;
  /** Null when GA4 has no rows for today yet. lastHour is the last processed hour (0-23, ET). */
  today: { sessions: number; pageViews: number; lastHour: number } | null;
};

export type DailyData = { rows: DailyRow[]; summary: Summary | null };

export type NameCount = { name: string; value: number };

/** Where a section's numbers came from. Every chart and table names it. */
export type DataSource = "plausible" | "ga4";

export type ChannelRow = { key: string; label: string; visits: number };

export type ChannelsData = { source: DataSource; rows: ChannelRow[] };

export type LandingRow = {
  path: string;
  visits: number;
  /** Plausible one-page share, 0-1. Null when the window only covers invalid bounce data. */
  bounceRate?: number | null;
  /** GA4 engaged-session share for the same landing path, 0-1, when GA4 answers. */
  engagementRate?: number;
};

export type LandingData = {
  source: DataSource;
  rows: LandingRow[];
  /**
   * "full": bounce covers the whole window. "trimmed": the window overlaps the
   * invalid bounce period, so bounce covers only bounceFrom onward. "excluded":
   * no valid bounce data in the window. "none": GA4, which has no bounce here.
   */
  bounce: "full" | "trimmed" | "excluded" | "none";
  bounceFrom: string | null;
};

export type EventRow = {
  name: string;
  label: string;
  current: number;
  /** Null when the previous window starts before the source has data. */
  previous: number | null;
  source: DataSource;
};

export type CountryRow = { country: string; visits: number };

export type CountriesData = { source: DataSource; rows: CountryRow[] };

export type TrendRow = { date: string; visitors: number; visits: number; pageViews: number };

/** Visitor-days with more than 100 page views: likely scrapers, not growth. */
export type HeavyDay = { date: string; visitorDays: number; visits: number; pageViews: number };

export type TrendData = {
  source: DataSource;
  rows: TrendRow[];
  /** Plausible only; GA4 already filters known bots. */
  heavy: HeavyDay[] | null;
  /** Heavy-hitter totals for the last 7 full days, with their share of all page views. */
  heavy7: { visitorDays: number; pageViews: number; share: number } | null;
};

/** One day's (or a per-day average's) Plausible numbers for the Yesterday card. */
export type DayStats = {
  visits: number;
  pageViews: number;
  viewsPerVisit: number;
  /** One-page share, 0-1. Null when no day in the span has valid bounce data. */
  bounceRate: number | null;
  /** Page views from heavy-hitter visitor-days (over 100 page views). */
  heavyPageViews: number;
  heavyVisitorDays: number;
  /** Page views and pages per visit with heavy-hitter groups removed. */
  exHeavyPageViews: number;
  exHeavyViewsPerVisit: number;
};

/** Yesterday from Plausible vs the per-day average of the 7 days before it. */
export type YesterdayData = {
  date: string;
  yesterday: DayStats;
  avg7: DayStats;
  avgFrom: string;
  avgTo: string;
  /** Days in the 7-day span the bounce average uses (invalid bounce days are left out). */
  bounceDays: string[];
  /** GA4 engaged-session share, a secondary line. Null when GA4 does not answer. */
  engaged: { yesterday: number; avg7: number } | null;
};

export type ReportsData = {
  /** GA4 daily rows and the Yesterday summary (engagement rate needs GA4). */
  daily: Section<DailyData>;
  trend: Section<TrendData>;
  /** Plausible Yesterday card. When not ok, the page falls back to daily.summary (GA4). */
  yesterday: Section<YesterdayData>;
  channels: Section<ChannelsData>;
  landing: Section<LandingData>;
  events: Section<EventRow[]>;
  countries: Section<CountriesData>;
  fetchedAt: number;
};

export type MapPoint = {
  city: string;
  country: string;
  users: number;
  /** Absent when the city is not in the lookup; the client falls back to the country centroid. */
  lat?: number;
  lng?: number;
};

export type RealtimeData = {
  activeUsers: number;
  /** 30 entries, oldest first (index 29 is the current minute). */
  perMinute: number[];
  points: MapPoint[];
  pages: NameCount[];
  devices: NameCount[];
  /** Plausible (cookieless, counts everyone) when it answers; GA4 realtime otherwise. */
  source: "plausible" | "ga4";
  fetchedAt: number;
};

export type TodayStats = {
  visitors: number;
  visits: number;
  pageViews: number;
  viewsPerVisit: number;
  /** Share of visits that viewed one page, 0-1. Lower is better. */
  bounceRate: number;
};

/** Today so far from Plausible, compared with yesterday up to the same time of day. */
export type TodayData = {
  today: TodayStats;
  /** Null until Plausible has data from yesterday. */
  sameTimeYesterday: TodayStats | null;
  /** Eastern time the numbers run to, e.g. "2:05 PM". */
  asOf: string;
  fetchedAt: number;
};

export type SearchDay = { date: string; clicks: number; impressions: number; ctr: number; position: number };

export type SearchQuery = { query: string; clicks: number; impressions: number; ctr: number; position: number };

export type SearchData = {
  days: SearchDay[];
  lastDate: string;
  queries: SearchQuery[];
  queriesFrom: string;
  fetchedAt: number;
};

export type LiveResponse = {
  realtime: Section<RealtimeData>;
  today: Section<TodayData>;
  reports: ReportsData;
  search: Section<SearchData>;
};
