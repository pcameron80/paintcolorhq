-- Migration 014: colors.content_updated_at
--
-- The sitemap's <lastmod> for a color page should change when that page's
-- content changes, so Google has a reason to recrawl it. colors had no
-- updated-at column, so every color page claimed the same template date and
-- the 2026-10-11 LRV, name and availability corrections (~4,300+ rows) sent
-- no recrawl signal.
--
-- content_updated_at is bumped only when a field the color page shows
-- changes. Writes that touch nothing visible (e.g. last_seen_live_on from the
-- palette scan) leave it alone.
--
-- Backfill: 2026-10-11 for every row. That day every color page changed
-- (closeness labels #186, availability labels, swatch/LRV/name corrections),
-- so it is the accurate last-content date for the whole catalog. Rows created
-- later keep their creation time.
--
-- Not covered: a color whose match list changes because a *different* color
-- moved. compute-matches rewrites cross_brand_matches in bulk; bump the
-- template date in src/app/api/sitemap/[id]/route.ts when a recompute changes
-- match lists site-wide.

BEGIN;

ALTER TABLE colors ADD COLUMN content_updated_at timestamptz;

UPDATE colors
SET content_updated_at = GREATEST(created_at, TIMESTAMPTZ '2026-10-11 00:00:00+00');

ALTER TABLE colors
  ALTER COLUMN content_updated_at SET NOT NULL,
  ALTER COLUMN content_updated_at SET DEFAULT now();

CREATE OR REPLACE FUNCTION colors_touch_content_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (NEW.name, NEW.slug, NEW.hex, NEW.color_number, NEW.lrv, NEW.undertone,
      NEW.color_family, NEW.availability)
     IS DISTINCT FROM
     (OLD.name, OLD.slug, OLD.hex, OLD.color_number, OLD.lrv, OLD.undertone,
      OLD.color_family, OLD.availability)
  THEN
    NEW.content_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER colors_content_updated_at
  BEFORE UPDATE ON colors
  FOR EACH ROW EXECUTE FUNCTION colors_touch_content_updated_at();

COMMIT;
