-- 008_samplize_handle.sql
-- Source of truth for Samplize availability moved from a URL crawl (migration 007)
-- to the authoritative CJ product feed (advertiser 6366250 = "Samplize"), pulled by
-- scripts/sync-samplize-feed.ts.
--
-- Most stocked colors live at samplize.com/products/<our-slug>-12x12, so the CTA can
-- build the URL from the slug as before. But a handful of colors whose name has
-- accented/special characters have a Samplize handle that differs from our slug
-- (we built `verde-marr-n`, Samplize uses `verde-marron`). For those, store the
-- exact Samplize handle here; the CTA uses it verbatim. NULL = use the default
-- `<slug>-12x12` (the common case). Only set for available SW/BM/F&B colors.
alter table colors add column if not exists samplize_handle text;

comment on column colors.samplize_handle is
  'Exact samplize.com product handle when it differs from <slug>-12x12 (accent/special-char colors). NULL = use the default <slug>-12x12. Maintained by scripts/sync-samplize-feed.ts from the CJ product feed.';
