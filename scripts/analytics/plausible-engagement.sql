-- Plausible engagement by landing type, raw beside bot-filtered.
--
--   scripts/analytics/run-clickhouse.sh scripts/analytics/plausible-engagement.sql 2026-10-20 2026-10-23
--
-- Reads events_v2 (site_id 1) for UTC days {start}..{end}, both inclusive.
-- Read-only: run-clickhouse.sh passes --readonly=1.
--
-- FILTER DEFINITION (the "clean" variant). Use the same filter on the
-- baseline and the read window, or the comparison is meaningless:
--   operating_system != 'GNU/Linux'
--   AND country_code IN ('US','CA','GB','IE','AU','NZ')
-- Both conditions are taken from the session's first pageview. They are
-- outcome-independent on purpose: the filter never looks at pages per visit,
-- one-page exits, engagement or goals, because filtering on those would
-- remove the very outcome being measured. Real Linux desktop users and real
-- visitors from elsewhere are dropped too; that costs volume, not bias.
--
-- SENSITIVITY variant: raw sessions minus two bot-shaped pools that DO look
-- at engagement, so treat it as a bound, never the headline:
--   A. GNU/Linux + Chrome + Google referrer + no engagement event
--   B. direct (no referrer) + Mobile + Chrome + no engagement event
--
-- Goal events are Tool Use, Compare, Color Search and Retailer Click.
-- goals_per_visit counts every event. goals_per_visit_1s collapses each
-- session's events of the same goal into one per burst (a burst ends when
-- more than 1 s passes between events), because the room visualizer sent a
-- Tool Use per drag and Color Search fires per typed query.
--
-- Output: (1) pool sizes, (2) landing-type table for raw / clean /
-- sensitivity, (3) room visualizer Tool Use, raw against 1 s dedup,
-- (4) daily raw and clean visits and pageviews, plus visits by source
-- (the Mediavine baseline series).

-- (1) Pool sizes ------------------------------------------------------------
WITH s AS (
  SELECT
    session_id,
    argMinIf(referrer_source, timestamp, name = 'pageview')  AS src,
    argMinIf(operating_system, timestamp, name = 'pageview') AS os,
    argMinIf(country_code, timestamp, name = 'pageview')     AS cc,
    argMinIf(browser, timestamp, name = 'pageview')          AS br,
    argMinIf(screen_size, timestamp, name = 'pageview')      AS scr,
    countIf(name = 'pageview')   AS pv,
    countIf(name = 'engagement') AS eng
  FROM events_v2
  WHERE site_id = 1 AND toDate(timestamp) BETWEEN {start:Date} AND {end:Date}
  GROUP BY session_id
  HAVING pv > 0
),
f AS (
  SELECT *,
    os != 'GNU/Linux' AND cc IN ('US','CA','GB','IE','AU','NZ') AS clean,
    os = 'GNU/Linux' AND br = 'Chrome' AND src = 'Google' AND eng = 0 AS pool_a,
    src = '' AND scr = 'Mobile' AND br = 'Chrome' AND eng = 0 AS pool_b
  FROM s
)
SELECT
  pool,
  countIf(hit) AS visits,
  sumIf(pv, hit) AS pageviews,
  round(countIf(hit) / count() * 100, 1) AS pct_of_visits,
  round(sumIf(pv, hit) / sum(pv) * 100, 1) AS pct_of_pageviews
FROM (
  SELECT pv, p.1 AS pool, p.2 AS hit
  FROM f
  ARRAY JOIN [
    ('1 all sessions (raw)', true),
    ('2 excluded: GNU/Linux', os = 'GNU/Linux'),
    ('3 excluded: not Linux, outside US/CA/GB/IE/AU/NZ', os != 'GNU/Linux' AND NOT clean),
    ('4 kept: clean', clean),
    ('5 sensitivity pool A: Linux Chrome Google, no engagement', pool_a),
    ('6 sensitivity pool B: direct mobile Chrome, no engagement', pool_b),
    ('7 kept: sensitivity (raw minus A and B)', NOT (pool_a OR pool_b))
  ] AS p
)
GROUP BY pool
ORDER BY pool;

-- (2) Landing-type table ------------------------------------------------------
WITH ev AS (
  SELECT
    session_id, name, timestamp, pathname, referrer_source, operating_system,
    country_code, browser, screen_size,
    name IN ('Tool Use', 'Compare', 'Color Search', 'Retailer Click') AS is_goal,
    lagInFrame(timestamp, 1, toDateTime(0)) OVER (
      PARTITION BY session_id, name ORDER BY timestamp
      ROWS BETWEEN 1 PRECEDING AND CURRENT ROW
    ) AS prev_same
  FROM events_v2
  WHERE site_id = 1 AND toDate(timestamp) BETWEEN {start:Date} AND {end:Date}
),
s AS (
  SELECT
    session_id,
    argMinIf(pathname, timestamp, name = 'pageview')         AS landing,
    argMinIf(referrer_source, timestamp, name = 'pageview')  AS src,
    argMinIf(operating_system, timestamp, name = 'pageview') AS os,
    argMinIf(country_code, timestamp, name = 'pageview')     AS cc,
    argMinIf(browser, timestamp, name = 'pageview')          AS br,
    argMinIf(screen_size, timestamp, name = 'pageview')      AS scr,
    countIf(name = 'pageview')   AS pv,
    countIf(name = 'engagement') AS eng,
    countIf(is_goal) AS goals,
    countIf(is_goal AND dateDiff('second', prev_same, timestamp) > 1) AS goals_1s
  FROM ev
  GROUP BY session_id
  HAVING pv > 0
),
typed AS (
  SELECT *,
    multiIf(
      landing = '/',                                   'home',
      landing LIKE '/colors/family/%',                 'family',
      landing LIKE '/colors/hue/%',                    'hue',
      match(landing, '^/colors/[^/]+/[^/]+'),          'color',
      landing LIKE '/colors%',                         'colors index',
      landing LIKE '/brands/%',                        'brand',
      landing LIKE '/blog/%',                          'blog',
      match(landing, '^/tools/[^/]+'),                 concat('tool: ', splitByChar('/', landing)[3]),
      landing LIKE '/tools%',                          'tools index',
      landing LIKE '/compare%',                        'compare',
      match(landing, '^/match/[^/]+/to/'),             'brand-to-brand',
      landing LIKE '/match/%',                         'match pair',
      landing LIKE '/search%',                         'search',
      landing LIKE '/inspiration%',                    'inspiration',
      landing LIKE '/color-of-the-year%',              'color of the year',
      'other') AS landing_type,
    os != 'GNU/Linux' AND cc IN ('US','CA','GB','IE','AU','NZ') AS clean,
    (os = 'GNU/Linux' AND br = 'Chrome' AND src = 'Google' AND eng = 0)
      OR (src = '' AND scr = 'Mobile' AND br = 'Chrome' AND eng = 0) AS sens_excluded
  FROM s
),
v AS (
  SELECT *,
    arrayJoin(arrayConcat(
      ['1 raw'],
      if(clean, ['2 clean'], []),
      if(NOT sens_excluded, ['3 sensitivity'], [])
    )) AS variant
  FROM typed
)
SELECT
  variant,
  if(landing_type = '', 'ALL', landing_type) AS landing,
  count() AS visits,
  sum(pv) AS pageviews,
  round(sum(pv) / count(), 2) AS pages_per_visit,
  round(countIf(pv = 1) / count() * 100, 1) AS one_page_pct,
  round(sum(goals) / count(), 2) AS goals_per_visit,
  round(sum(goals_1s) / count(), 2) AS goals_per_visit_1s
FROM v
GROUP BY variant, landing_type WITH ROLLUP
HAVING variant != ''
ORDER BY variant, landing_type != '', visits DESC;

-- (3) Room visualizer Tool Use, raw vs 1 s burst dedup -----------------------
WITH s AS (
  SELECT
    session_id,
    argMinIf(operating_system, timestamp, name = 'pageview') AS os,
    argMinIf(country_code, timestamp, name = 'pageview')     AS cc
  FROM events_v2
  WHERE site_id = 1 AND toDate(timestamp) BETWEEN {start:Date} AND {end:Date}
  GROUP BY session_id
),
u AS (
  SELECT
    session_id, user_id, timestamp,
    lagInFrame(timestamp, 1, toDateTime(0)) OVER (
      PARTITION BY session_id ORDER BY timestamp
      ROWS BETWEEN 1 PRECEDING AND CURRENT ROW
    ) AS prev
  FROM events_v2
  WHERE site_id = 1 AND toDate(timestamp) BETWEEN {start:Date} AND {end:Date}
    AND name = 'Tool Use'
    AND meta.value[indexOf(meta.key, 'tool')] = 'room-visualizer'
),
per_user AS (
  SELECT
    user_id,
    any(s.os != 'GNU/Linux' AND s.cc IN ('US','CA','GB','IE','AU','NZ')) AS clean,
    count() AS raw_events,
    countIf(dateDiff('second', prev, timestamp) > 1) AS uses
  FROM u
  LEFT JOIN s USING (session_id)
  GROUP BY user_id
)
SELECT
  variant,
  count() AS users,
  sum(raw_events) AS raw_use_events,
  sum(uses) AS deduped_uses,
  round(avg(raw_events), 1) AS raw_events_per_user,
  round(avg(uses), 1) AS uses_per_user,
  median(uses) AS median_uses_per_user
FROM (
  SELECT *, arrayJoin(arrayConcat(['1 raw'], if(clean, ['2 clean'], []))) AS variant
  FROM per_user
)
GROUP BY variant
ORDER BY variant;

-- (4) Daily series and source split, raw beside clean -------------------------
WITH s AS (
  SELECT
    session_id,
    toDate(min(timestamp)) AS day,
    argMinIf(referrer_source, timestamp, name = 'pageview')  AS src,
    argMinIf(operating_system, timestamp, name = 'pageview') AS os,
    argMinIf(country_code, timestamp, name = 'pageview')     AS cc,
    countIf(name = 'pageview') AS pv
  FROM events_v2
  WHERE site_id = 1 AND toDate(timestamp) BETWEEN {start:Date} AND {end:Date}
  GROUP BY session_id
  HAVING pv > 0
)
SELECT
  if(d = '', 'ALL', d) AS day_utc,
  count() AS raw_visits,
  sum(pv) AS raw_pageviews,
  countIf(os != 'GNU/Linux' AND cc IN ('US','CA','GB','IE','AU','NZ')) AS clean_visits,
  sumIf(pv, os != 'GNU/Linux' AND cc IN ('US','CA','GB','IE','AU','NZ')) AS clean_pageviews
FROM (SELECT *, toString(day) AS d FROM s)
GROUP BY d WITH ROLLUP
ORDER BY d = '', d;

WITH s AS (
  SELECT
    session_id,
    argMinIf(referrer_source, timestamp, name = 'pageview')  AS src,
    argMinIf(operating_system, timestamp, name = 'pageview') AS os,
    argMinIf(country_code, timestamp, name = 'pageview')     AS cc,
    countIf(name = 'pageview') AS pv
  FROM events_v2
  WHERE site_id = 1 AND toDate(timestamp) BETWEEN {start:Date} AND {end:Date}
  GROUP BY session_id
  HAVING pv > 0
)
SELECT
  if(src = '', '(direct)', src) AS source,
  count() AS raw_visits,
  countIf(os != 'GNU/Linux' AND cc IN ('US','CA','GB','IE','AU','NZ')) AS clean_visits,
  round(sum(pv) / count(), 2) AS raw_pages_per_visit,
  round(sumIf(pv, os != 'GNU/Linux' AND cc IN ('US','CA','GB','IE','AU','NZ'))
    / greatest(countIf(os != 'GNU/Linux' AND cc IN ('US','CA','GB','IE','AU','NZ')), 1), 2) AS clean_pages_per_visit
FROM s
GROUP BY source
ORDER BY raw_visits DESC
LIMIT 15;
