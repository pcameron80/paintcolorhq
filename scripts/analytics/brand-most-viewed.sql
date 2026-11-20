-- Most viewed color pages per brand, clean traffic only.
--
--   CH_FORMAT=TSVWithNames scripts/analytics/run-clickhouse.sh \
--     scripts/analytics/brand-most-viewed.sql 2026-08-18 2026-11-15
--
-- Fed to scripts/build-brand-most-viewed.ts, which writes
-- src/generated/brand-most-viewed.json. Never run at request time.
--
-- Clean = the session's first pageview is not GNU/Linux and is from US, CA,
-- GB, IE, AU or NZ (same definition as plausible-engagement.sql). On top of
-- that, any visitor-day with more than 100 pageviews is dropped (the
-- heavy-hitters rule), so one crawler paging through a brand cannot rank
-- colors. Color pages are /colors/<brand>/<color>; /colors/family/* has a
-- different shape and is excluded explicitly.
--
-- Columns: brand, color, views (pageviews), visits (sessions),
-- window_start (first UTC day with any event in the range; Plausible data
-- starts 2026-10-20, so a 90-day window is shorter until then).
WITH clean_sessions AS (
  SELECT session_id
  FROM events_v2
  WHERE site_id = 1 AND toDate(timestamp) BETWEEN {start:Date} AND {end:Date}
  GROUP BY session_id
  HAVING argMinIf(operating_system, timestamp, name = 'pageview') != 'GNU/Linux'
     AND argMinIf(country_code, timestamp, name = 'pageview') IN ('US','CA','GB','IE','AU','NZ')
),
heavy AS (
  SELECT toDate(timestamp) AS day, user_id
  FROM events_v2
  WHERE site_id = 1 AND name = 'pageview' AND toDate(timestamp) BETWEEN {start:Date} AND {end:Date}
  GROUP BY day, user_id
  HAVING count() > 100
)
SELECT
  brand, color, views, visits,
  (SELECT min(toDate(timestamp)) FROM events_v2 WHERE site_id = 1 AND toDate(timestamp) BETWEEN {start:Date} AND {end:Date}) AS window_start
FROM (
  SELECT
    splitByChar('/', pathname)[3] AS brand,
    splitByChar('/', pathname)[4] AS color,
    count() AS views,
    uniqExact(session_id) AS visits
  FROM events_v2
  WHERE site_id = 1
    AND name = 'pageview'
    AND toDate(timestamp) BETWEEN {start:Date} AND {end:Date}
    AND startsWith(pathname, '/colors/')
    AND length(splitByChar('/', pathname)) = 4
    AND splitByChar('/', pathname)[3] != 'family'
    AND session_id IN (SELECT session_id FROM clean_sessions)
    AND (toDate(timestamp), user_id) NOT IN (SELECT day, user_id FROM heavy)
  GROUP BY brand, color
)
ORDER BY brand, views DESC, visits DESC, color
LIMIT 40 BY brand
