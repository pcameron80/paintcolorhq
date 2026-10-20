"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { LiveResponse, PeriodStats, Section, Summary, TodayData, TodayStats } from "@/lib/admin-analytics-types";
import { BarList, LineChart, MinuteBars } from "./charts";
import { WorldMap } from "./world-map";
import { ago, fmtDecimal, fmtNum, fmtPct, pointDelta, relDelta, shortDate, type Delta } from "./format";

const REALTIME_MS = 60_000;
const FULL_MS = 10 * 60_000;
// GA4 turned on its bot-traffic data filter on this date. Days before it still
// include bots, so any comparison across it reads low. Update if the filter changes.
const BOT_FILTER_DATE = "Oct 20, 2026";

/*
 * Colors follow the dataviz palette (blue slot 1, orange slot 2), stepped for
 * light and dark. Dark mode follows the OS, or data-theme on <html> if set.
 */
const THEME_CSS = `
.admin-live{color-scheme:light;
  --v-page:#f4f3f0;--v-surface:#fcfcfb;--v-ink:#0b0b0b;--v-muted:#52514e;--v-grid:#e6e5e1;--v-axis:#a3a29c;--v-land:#dedcd6;
  --v-series-1:#2a78d6;--v-series-2:#eb6834;--v-tip-bg:#0b0b0b;--v-tip-fg:#ffffff;--v-border:#e3e2dd;}
@media (prefers-color-scheme:dark){:root:where(:not([data-theme="light"])) .admin-live{color-scheme:dark;
  --v-page:#121211;--v-surface:#1a1a19;--v-ink:#ffffff;--v-muted:#c3c2b7;--v-grid:#32322f;--v-axis:#6d6c66;--v-land:#3b3b37;
  --v-series-1:#3987e5;--v-series-2:#d95926;--v-tip-bg:#ffffff;--v-tip-fg:#0b0b0b;--v-border:#2c2c2a;}}
:root[data-theme="dark"] .admin-live{color-scheme:dark;
  --v-page:#121211;--v-surface:#1a1a19;--v-ink:#ffffff;--v-muted:#c3c2b7;--v-grid:#32322f;--v-axis:#6d6c66;--v-land:#3b3b37;
  --v-series-1:#3987e5;--v-series-2:#d95926;--v-tip-bg:#ffffff;--v-tip-fg:#0b0b0b;--v-border:#2c2c2a;}
.admin-live{background:var(--v-page);color:var(--v-ink);min-height:100vh}
.admin-card{min-width:0;background:var(--v-surface);border:1px solid var(--v-border);border-radius:14px;padding:16px}
@keyframes admin-pulse{0%{transform:scale(1);opacity:.9}100%{transform:scale(3);opacity:0}}
.admin-pulse{transform-box:fill-box;transform-origin:center;animation:admin-pulse 1.8s ease-out 2}
@media (prefers-reduced-motion:reduce){.admin-pulse{animation:none;opacity:0}}
`;

export function LiveDashboard({ initial }: { initial: LiveResponse }) {
  const startRt = initial.realtime.ok ? initial.realtime.data.fetchedAt : initial.reports.fetchedAt;
  const startFull = initial.reports.fetchedAt;
  const [data, setData] = useState<LiveResponse>(initial);
  const [rtAt, setRtAt] = useState(startRt);
  const [fullAt, setFullAt] = useState(startFull);
  const [now, setNow] = useState(startRt);
  const [error, setError] = useState<string | null>(null);
  const inflight = useRef({ rt: false, full: false });
  const last = useRef({ rt: startRt, full: startFull });

  const load = useCallback(async (kind: "rt" | "full") => {
    if (inflight.current[kind]) return;
    inflight.current[kind] = true;
    try {
      const res = await fetch(kind === "rt" ? "/api/admin/live?part=realtime" : "/api/admin/live", { cache: "no-store" });
      if (res.status === 404) {
        setError("Signed out. Reload to sign in again.");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as Partial<LiveResponse>;
      const t = Date.now();
      setError(null);
      setData((d) => ({
        realtime: json.realtime?.ok ? json.realtime : d.realtime,
        today: json.today?.ok || !d.today.ok ? (json.today ?? d.today) : d.today,
        reports: json.reports ?? d.reports,
        search: json.search?.ok || !d.search.ok ? (json.search ?? d.search) : d.search,
      }));
      last.current[kind] = t;
      if (kind === "rt") setRtAt(t);
      else {
        setFullAt(t);
        setRtAt(t);
        last.current.rt = t;
      }
    } catch {
      setError("Could not refresh. Showing the last data.");
    } finally {
      inflight.current[kind] = false;
    }
  }, []);

  // Poll only while the tab is visible. The timer is torn down when it is hidden.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const check = () => {
      const t = Date.now();
      setNow(t);
      if (t - last.current.full >= FULL_MS) void load("full");
      else if (t - last.current.rt >= REALTIME_MS) void load("rt");
    };
    const start = () => {
      if (timer) return;
      check();
      timer = setInterval(check, 1000);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVis = () => (document.visibilityState === "visible" ? start() : stop());
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  const rt = data.realtime;
  const reports = data.reports;

  return (
    <div className="admin-live">
      <style>{THEME_CSS}</style>
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">PaintColorHQ live</h1>
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--v-muted)" }}>
            <span aria-live="off">Updated {ago(now - rtAt)}</span>
            <button
              type="button"
              onClick={() => void load("full")}
              className="rounded-md border px-2 py-1"
              style={{ borderColor: "var(--v-border)", color: "var(--v-ink)" }}
            >
              Refresh
            </button>
          </div>
        </header>
        {error && (
          <p role="status" className="admin-card mb-4 text-sm">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Card
            className="lg:col-span-4"
            title="Visitors right now"
            note={rt.ok && rt.data.source === "ga4" ? "Last 30 minutes, from GA4 (Plausible unavailable)" : "Last 30 minutes, from Plausible (counts everyone)"}
          >
            {rt.ok ? (
              <>
                <div className="mb-3 flex items-end gap-3">
                  <span className="text-6xl font-semibold leading-none tabular-nums">{rt.data.activeUsers}</span>
                  <span className="pb-1 text-sm" style={{ color: "var(--v-muted)" }}>
                    {rt.data.devices.map((d) => `${d.value} ${d.name}`).join(" · ")}
                  </span>
                </div>
                <MinuteBars values={rt.data.perMinute} />
              </>
            ) : (
              <Unavailable what="Live visitor data" />
            )}
          </Card>

          <Card className="lg:col-span-8" title="Today so far" note="From Plausible, compared with yesterday up to the same time.">
            {data.today.ok ? <TodayTiles data={data.today.data} /> : <Unavailable what="Plausible data" />}
          </Card>

          <Card className="lg:col-span-12" title="Yesterday" note="The last complete day in GA4, compared with the average of the 7 days before it.">
            {reports.daily.ok && reports.daily.data.summary ? (
              <SummaryTiles summary={reports.daily.data.summary} />
            ) : (
              <Unavailable what="Analytics data" />
            )}
          </Card>

          <Card className="lg:col-span-8" title="Where visitors are">
            {rt.ok ? <WorldMap points={rt.data.points} /> : <Unavailable what="Live visitor data" />}
          </Card>

          <Card className="lg:col-span-4" title="Pages being viewed now">
            {rt.ok ? (
              <BarList rows={rt.data.pages.map((p) => ({ label: p.name, value: p.value }))} empty="No one is on the site." />
            ) : (
              <Unavailable what="Live visitor data" />
            )}
          </Card>

          <Card className="lg:col-span-12" title="Visits per day" note="The 28 complete days ending yesterday.">
            {reports.daily.ok ? (
              <LineChart
                ariaLabel="Daily sessions over the last 28 days"
                unit="visits"
                points={reports.daily.data.rows.map((r) => ({ label: shortDate(r.date), value: r.sessions }))}
              />
            ) : (
              <Unavailable what="Analytics data" />
            )}
            <p className="mt-3 text-xs" style={{ color: "var(--v-muted)" }}>
              Bot traffic is excluded from {BOT_FILTER_DATE}; earlier days include it, so comparisons across that date read low.
            </p>
          </Card>

          <SearchCards search={data.search} />

          <Card className="lg:col-span-6" title="Where visits come from" note="Last 7 full days">
            {reports.channels.ok ? (
              <BarList rows={reports.channels.data.map((c) => ({ label: c.label, value: c.sessions }))} />
            ) : (
              <Unavailable what="Analytics data" />
            )}
          </Card>

          <Card className="lg:col-span-6" title="Top landing pages" note="Last 7 full days">
            {reports.landing.ok ? (
              <BarList
                rows={reports.landing.data.map((l) => ({
                  label: l.path,
                  value: l.sessions,
                  sub: `${fmtPct(l.engagementRate)} engaged`,
                }))}
              />
            ) : (
              <Unavailable what="Analytics data" />
            )}
          </Card>

          <Card className="lg:col-span-4" title="What people do" note="Last 7 full days vs the 7 before">
            {reports.events.ok ? <EventList rows={reports.events.data} /> : <Unavailable what="Analytics data" />}
          </Card>

          <Card className="lg:col-span-4" title="Top countries" note="Last 7 full days">
            {reports.countries.ok ? (
              <BarList rows={reports.countries.data.map((c) => ({ label: c.country, value: c.sessions }))} />
            ) : (
              <Unavailable what="Analytics data" />
            )}
          </Card>

          <Card className="lg:col-span-4" title="Top Google searches" note={data.search.ok ? `7 days to ${shortDate(data.search.data.lastDate)}` : undefined}>
            {data.search.ok ? (
              <BarList
                rows={data.search.data.queries.map((q) => ({
                  label: q.query,
                  value: q.clicks,
                  sub: `${fmtNum(q.impressions)} views`,
                }))}
                format={(n) => `${fmtNum(n)} ${n === 1 ? "click" : "clicks"}`}
                empty="No clicks in this window."
              />
            ) : (
              <Unavailable what="Search Console data" />
            )}
          </Card>
        </div>

        <footer className="mt-6 text-center text-[11px]" style={{ color: "var(--v-muted)" }}>
          Full report refreshed {ago(now - fullAt)}. Realtime refreshes every minute while this tab is open. Private page.
        </footer>
      </div>
    </div>
  );
}

function Card({ title, note, className = "", children }: { title: string; note?: string; className?: string; children: ReactNode }) {
  return (
    <section className={`admin-card ${className}`}>
      <h2 className="text-sm font-semibold">{title}</h2>
      {note && (
        <p className="mb-3 text-xs" style={{ color: "var(--v-muted)" }}>
          {note}
        </p>
      )}
      {!note && <div className="mb-3" />}
      {children}
    </section>
  );
}

function Unavailable({ what }: { what: string }) {
  return (
    <p className="text-sm" style={{ color: "var(--v-muted)" }}>
      {what} unavailable.
    </p>
  );
}

function DeltaText({ delta, label }: { delta: Delta | null; label: string }) {
  if (!delta) return <li style={{ color: "var(--v-muted)" }}>{label}: not enough data</li>;
  const arrow = delta.dir === "up" ? "▲" : delta.dir === "down" ? "▼" : "■";
  const color = delta.dir === "up" ? "#0ca30c" : delta.dir === "down" ? "#d03b3b" : "var(--v-axis)";
  return (
    <li>
      <span aria-hidden style={{ color }}>
        {arrow}
      </span>{" "}
      {delta.text} <span style={{ color: "var(--v-muted)" }}>{label}</span>
    </li>
  );
}

function SummaryTiles({ summary }: { summary: Summary }) {
  const { yesterday, avg7 } = summary;
  const tiles = [
    tile("Visits", yesterday, avg7, (s) => s.sessions, fmtNum, false),
    tile("Page views", yesterday, avg7, (s) => s.pageViews, fmtNum, false),
    tile("Pages per visit", yesterday, avg7, (s) => s.pagesPerSession, fmtDecimal, false),
    tile("Engaged visits", yesterday, avg7, (s) => s.engagedRate, (n) => fmtPct(n), true),
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label}>
            <div className="text-xs" style={{ color: "var(--v-muted)" }}>
              {t.label}
            </div>
            <div className="text-3xl font-semibold tabular-nums">{t.value}</div>
            <ul className="mt-1 space-y-0.5 text-xs">
              <DeltaText delta={t.delta} label={`vs 7-day avg (${t.avg})`} />
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

function TodayTiles({ data }: { data: TodayData }) {
  const { today, sameTimeYesterday: y } = data;
  const row = (label: string, pick: (s: TodayStats) => number, fmt: (n: number) => string, isRate: boolean, lowerIsBetter = false) => {
    const d = y ? (isRate ? pointDelta : relDelta)(pick(today), pick(y)) : null;
    // For bounce rate a drop is good news, so flip the arrow color, not the wording.
    const delta = d && lowerIsBetter && d.dir !== "flat" ? { ...d, dir: (d.dir === "up" ? "down" : "up") as Delta["dir"] } : d;
    return { label, value: fmt(pick(today)), base: y ? fmt(pick(y)) : "", delta, raw: d };
  };
  const tiles = [
    row("Visitors", (s) => s.visitors, fmtNum, false),
    row("Page views", (s) => s.pageViews, fmtNum, false),
    row("Pages per visit", (s) => s.viewsPerVisit, fmtDecimal, false),
    row("One-page visits", (s) => s.bounceRate, (n) => fmtPct(n), true, true),
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label}>
            <div className="text-xs" style={{ color: "var(--v-muted)" }}>
              {t.label}
            </div>
            <div className="text-3xl font-semibold tabular-nums">{t.value}</div>
            <ul className="mt-1 space-y-0.5 text-xs">
              {y ? (
                <DeltaText delta={t.delta && t.raw ? { ...t.delta, text: t.raw.text } : null} label={`vs yesterday at this time (${t.base})`} />
              ) : (
                <li style={{ color: "var(--v-muted)" }}>No comparison until Plausible has a full day</li>
              )}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs" style={{ color: "var(--v-muted)" }}>
        Midnight to {data.asOf} Eastern. Plausible counts every visitor, including those who decline cookies, so it reads higher than GA4.
      </p>
    </>
  );
}

function tile(
  label: string,
  yest: PeriodStats,
  avg: PeriodStats,
  pick: (s: PeriodStats) => number,
  fmt: (n: number) => string,
  isRate: boolean,
) {
  const cmp = isRate ? pointDelta : relDelta;
  return { label, value: fmt(pick(yest)), avg: fmt(pick(avg)), delta: cmp(pick(yest), pick(avg)) };
}

function EventList({ rows }: { rows: { name: string; label: string; current: number; previous: number }[] }) {
  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const d = relDelta(r.current, r.previous);
        return (
          <li key={r.name} className="flex items-baseline justify-between gap-3 text-sm">
            <span>{r.label}</span>
            <span className="text-right tabular-nums">
              {fmtNum(r.current)}
              <span className="ml-2 text-xs" style={{ color: "var(--v-muted)" }}>
                {d ? `${d.dir === "up" ? "▲" : d.dir === "down" ? "▼" : "■"} ${d.text}` : r.previous === 0 && r.current > 0 ? "new" : ""}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function SearchCards({ search }: { search: Section<import("@/lib/admin-analytics-types").SearchData> }) {
  if (!search.ok) {
    return (
      <Card className="lg:col-span-12" title="Google Search">
        <Unavailable what="Search Console data" />
      </Card>
    );
  }
  const { days, lastDate } = search.data;
  const total = (k: "clicks" | "impressions") => days.reduce((a, d) => a + d[k], 0);
  const note = `Last 28 days, through ${shortDate(lastDate)} (Google reports 2 to 3 days late)`;
  return (
    <>
      <Card className="lg:col-span-6" title={`Clicks from Google: ${fmtNum(total("clicks"))}`} note={note}>
        <LineChart
          height={150}
          ariaLabel="Search Console clicks per day"
          unit="clicks"
          points={days.map((d) => ({ label: shortDate(d.date), value: d.clicks }))}
        />
      </Card>
      <Card className="lg:col-span-6" title={`Times shown in Google: ${fmtNum(total("impressions"))}`} note={note}>
        <LineChart
          height={150}
          color="var(--v-series-2)"
          ariaLabel="Search Console impressions per day"
          unit="views"
          points={days.map((d) => ({ label: shortDate(d.date), value: d.impressions }))}
        />
      </Card>
    </>
  );
}
