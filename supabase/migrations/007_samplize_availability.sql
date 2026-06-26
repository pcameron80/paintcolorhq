-- 007_samplize_availability.sql
-- Samplize is PaintColorHQ's first affiliate (CJ Affiliate, 12%). It stocks
-- peel-and-stick samples for ONLY Sherwin-Williams, Benjamin Moore, and
-- Farrow & Ball — and even within those, its catalog is not a superset of ours
-- (e.g. ~1/3 of our SW colors have no Samplize product). The color-page
-- "Order a peel-and-stick sample" CTA deep-links to samplize.com/products/<slug>-12x12;
-- without this flag, ~1 in 6 of those links (worse for SW) lands on a 404 — a
-- monetized dead end once the affiliate is live.
--
-- samplize_available gates that CTA: render it only when a live product page
-- exists. NULL = not yet checked (CTA hidden — fail safe, no 404). Populated by
-- scripts/check-samplize-availability.ts; re-run after color imports.
alter table colors add column if not exists samplize_available boolean;

comment on column colors.samplize_available is
  'True if a live samplize.com peel-and-stick product page exists for this color. NULL = unchecked. Gates the color-page affiliate sample CTA. Only SW/BM/F&B are stocked by Samplize. Maintained by scripts/check-samplize-availability.ts.';
