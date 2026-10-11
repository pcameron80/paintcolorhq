-- 011_drop_description_extended.sql
-- Drop colors.description_extended.
--
-- The column held templated boilerplate with wrong LRV values on ~21.9k rows.
-- Nothing in src/, scripts/ or the API reads it (the live site renders
-- descriptions from src/lib/color-description.ts). Verified on 2026-10-11 that no
-- index, policy, view, function, trigger or constraint references it.
--
-- Backup (21,858 rows: id, slug, brand_id, description_extended), written by
-- scripts/backup-description-extended.ts:
--   /Users/philipcameron/Documents/GitHub/projects/paintcolorhq/scripts/backups/description-extended-2026-10-11.json
-- Do not run this migration until that file exists.

ALTER TABLE colors DROP COLUMN IF EXISTS description_extended;
