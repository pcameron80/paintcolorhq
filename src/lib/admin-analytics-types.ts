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

export type ChannelRow = { key: string; label: string; sessions: number };

export type LandingRow = { path: string; sessions: number; engagementRate: number };

export type EventRow = { name: string; label: string; current: number; previous: number };

export type CountryRow = { country: string; sessions: number };

export type ReportsData = {
  daily: Section<DailyData>;
  channels: Section<ChannelRow[]>;
  landing: Section<LandingRow[]>;
  events: Section<EventRow[]>;
  countries: Section<CountryRow[]>;
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
  reports: ReportsData;
  search: Section<SearchData>;
};
