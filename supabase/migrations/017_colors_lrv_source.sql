-- Migration 017: colors.lrv_source and colors.lrv_checked_on
--
-- Every color page labels its LRV "estimated", but about 10,170 rows already
-- hold the manufacturer's published value (3,847 Benjamin Moore and 5,281
-- Behr among them, per the 2026-10-24 dry run of backfill-lrv-source.ts), and
-- the MP-50 corrections add about 6,000 more (Dunn-Edwards, Hirshfield's,
-- Vista, PPG, Sherwin-Williams, Dutch Boy). Nothing recorded which values are
-- published, so the page could not say so.
--
--   lrv_source      'manufacturer' = equals the brand's published LRV
--                   'computed'     = computed from hex (migration 004 formula)
--                   NULL           = no LRV
--   lrv_checked_on  date the stored value was last confirmed against the
--                   manufacturer's feed; NULL for computed values
--
-- Writers: apply-published-lrv.ts sets 'manufacturer' + the scan date;
-- apply-hex-corrections.ts and import-brand-scan.ts set 'manufacturer' when
-- the feed carries a usable LRV, otherwise 'computed'; any other insert gets
-- the 'computed' default. backfill-lrv-source.ts labels existing rows from the
-- scans and is safe to re-run.
--
-- Trigger: colors_touch_content_updated_at (migration 014) compares name,
-- slug, hex, color_number, lrv, undertone, color_family and availability. It
-- does not watch lrv_source or lrv_checked_on, so this migration and the
-- backfill leave content_updated_at (sitemap lastmod) alone. An LRV value
-- change still bumps it, as it should. When MP-80 starts printing the label,
-- the sitemap template date covers the site-wide page change.
--
-- ADD COLUMN with a constant default is metadata-only on Postgres 11+, so the
-- ~26,700-row table is not rewritten. The one UPDATE touches only rows with
-- no LRV (none on 2026-10-24) and changes no watched column.
--
-- Rollback:
--   ALTER TABLE colors DROP COLUMN lrv_checked_on, DROP COLUMN lrv_source;

BEGIN;

ALTER TABLE colors
  ADD COLUMN lrv_source text DEFAULT 'computed'
    CONSTRAINT colors_lrv_source_check CHECK (lrv_source IN ('manufacturer', 'computed')),
  ADD COLUMN lrv_checked_on date;

UPDATE colors SET lrv_source = NULL WHERE lrv IS NULL;

COMMENT ON COLUMN colors.lrv_source IS
  'manufacturer = stored lrv equals the brand''s published LRV; computed = derived from hex; NULL = no LRV. Set by scripts/apply-published-lrv.ts and scripts/backfill-lrv-source.ts.';
COMMENT ON COLUMN colors.lrv_checked_on IS
  'Date the stored lrv was last confirmed against the manufacturer feed (palette scan date). NULL for computed values.';

-- Verification: expect every row 'computed' (or NULL with no LRV) until the backfill runs.
SELECT lrv_source, count(*) FROM colors GROUP BY lrv_source ORDER BY lrv_source;

COMMIT;
