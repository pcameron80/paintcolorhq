-- Heavy hitters: visitors with more than 100 pageviews in one UTC day.
--
--   scripts/analytics/run-clickhouse.sh scripts/analytics/heavy-hitters.sql 2026-10-20 2026-10-23
--
-- Run this before any traffic baseline goes into the Brain or the morning
-- brief. One automated Tokyo visitor (Edge, 1920x1080, paging through
-- /brands/behr) was about 25% of GA4's "real human" pageviews for
-- 2026-10-13..19; a single visitor like that moves pages per visit and
-- monthly pageviews more than any real change on the site.
--
-- user_id is Plausible's daily-rotating visitor hash, so the same scraper
-- shows up as one row per day. Read-only (run-clickhouse.sh passes
-- --readonly=1). Days are UTC, {start}..{end} inclusive.

-- (1) One row per visitor-day over the threshold ------------------------------
SELECT
  toDate(timestamp) AS day,
  user_id,
  count() AS pageviews,
  uniqExact(session_id) AS sessions,
  uniqExact(pathname) AS distinct_pages,
  any(country_code) AS country,
  any(city_geoname_id) AS city_geoname_id,
  any(operating_system) AS os,
  any(browser) AS browser,
  any(screen_size) AS screen,
  any(referrer_source) AS source,
  topK(1)(pathname)[1] AS top_page,
  min(timestamp) AS first_seen,
  max(timestamp) AS last_seen
FROM events_v2
WHERE site_id = 1
  AND name = 'pageview'
  AND toDate(timestamp) BETWEEN {start:Date} AND {end:Date}
GROUP BY day, user_id
HAVING pageviews > 100
ORDER BY day, pageviews DESC;

-- (2) Their share of each day's pageviews -------------------------------------
SELECT
  day,
  sum(pv) AS all_pageviews,
  sumIf(pv, pv > 100) AS heavy_hitter_pageviews,
  round(sumIf(pv, pv > 100) / sum(pv) * 100, 1) AS heavy_hitter_pct,
  countIf(pv > 100) AS heavy_hitters
FROM (
  SELECT toDate(timestamp) AS day, user_id, count() AS pv
  FROM events_v2
  WHERE site_id = 1
    AND name = 'pageview'
    AND toDate(timestamp) BETWEEN {start:Date} AND {end:Date}
  GROUP BY day, user_id
)
GROUP BY day
ORDER BY day;
