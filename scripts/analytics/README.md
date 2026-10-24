# Analytics queries (Plausible ClickHouse)

Read-only SQL against the self-hosted Plausible events database on the NAS
(`events_v2`, site_id 1). Plausible data starts 2026-10-20 21:44 UTC.

```bash
scripts/analytics/run-clickhouse.sh scripts/analytics/heavy-hitters.sql       2026-10-20 2026-10-23
scripts/analytics/run-clickhouse.sh scripts/analytics/plausible-engagement.sql 2026-10-20 2026-10-23
```

## run-clickhouse.sh

`run-clickhouse.sh <file.sql> [start] [end]` pipes the file over ssh to
`clickhouse-client --readonly=1` inside `plausible-plausible_events_db-1`.
The server rejects any write, and nothing on the NAS is changed.

- Dates are `YYYY-MM-DD`, UTC calendar days, both inclusive. They default to
  the last 7 full days. They are validated, then passed as ClickHouse query
  parameters, so a query reads them as `{start:Date}` and `{end:Date}`.
- `NAS_HOST` overrides the ssh target (default `root@192.168.2.110`; off the
  LAN use `root@tower` over Tailscale). `CH_FORMAT` sets the output format
  (default `PrettyCompactMonoBlock`; `TSVWithNames` for pasting).
- Needs the NAS root ssh key on this machine. Nothing else.

## heavy-hitters.sql: run it first

Lists visitor-days with more than 100 pageviews, with country, city
geoname id, OS, browser, screen, source and top page, then each day's
heavy-hitter share. Run it before any traffic baseline goes into the Brain or
the morning brief. A flagged row is a candidate to check, not an automatic
exclusion; some are real people reading 50+ pages.

Plausible's `user_id` rotates daily, so one scraper is one row per day.

The 2026-10-13..19 Tokyo visitor predates Plausible, so this query cannot see
it. The GA4 equivalent: dimensions `city, browser, screenResolution`, metric
`screenPageViews`, sorted descending. On 2026-10-13..19 that put Nerima City
(Tokyo), Edge, 1920x1080 at 2,285 pageviews in 15 sessions, all Organic Search.

## plausible-engagement.sql

Four result sets for the window:

1. **Pool sizes**: visits and pageviews in every excluded and kept pool.
2. **By landing type** (color, brand, family, hue, blog, each tool, compare,
   match pair, brand-to-brand, home, search and the rest), for three
   variants: `raw`, `clean` and `sensitivity`. Columns: visits, pageviews,
   pages per visit, one-page %, goal events per visit, and goal events per
   visit with each goal collapsed to one per 1 s burst.
3. **Room visualizer Tool Use**: users, raw events and uses after the 1 s
   burst dedup (mean and median per user). The visualizer sent a Tool Use on
   every drag before the C-14 fix.
4. **Daily series and sources**: raw and clean visits and pageviews per UTC
   day (the Mediavine baseline series), then visits and pages per visit by
   referrer source, raw beside clean.

### Filter definition (`clean`)

```
operating_system != 'GNU/Linux'
AND country_code IN ('US','CA','GB','IE','AU','NZ')
```

Both are taken from the session's first pageview. The filter is
outcome-independent: it never looks at depth, exits, engagement or goals,
because filtering on those removes the outcome being measured. Apply the same
filter to the baseline and the read window.

`sensitivity` is raw minus two bot-shaped pools that do look at engagement,
so it is a bound beside the headline, never the headline:

- Linux + Chrome + Google referrer + no `engagement` event
- direct + Mobile + Chrome + no `engagement` event

### Reference run, 2026-10-20..23

| | visits | pages/visit | one-page % |
|---|---|---|---|
| raw | 1,340 | 2.59 | 70.8 |
| clean | 938 | 3.18 | 61.1 |
| sensitivity | 973 | 3.18 | 59.8 |

Excluded pools: GNU/Linux 179 visits (13.4%), not Linux but outside the six
countries 223 (16.6%). The clean filter keeps 70% of visits and 86% of
pageviews.
