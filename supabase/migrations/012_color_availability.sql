-- Migration 012: color availability states
--
-- Spec: docs/superpowers/specs/2026-10-11-color-availability-states-design.md
--
-- is_archived meant two things at once: "listed on /discontinued" and "never
-- a match target". The 2026-10 palette scan showed those must split: Behr's
-- feed flags 2,549 colors archived that Home Depot can still tint (Behr
-- Harbour QE-55). This adds three states:
--
--   current       in the brand's current palette
--   retired       the brand retired it, but it can still be mixed or ordered
--                 by code; stays a match target, labeled
--   discontinued  positive evidence it cannot be bought; excluded as a target
--
-- A state changes only with a recorded source (availability_source,
-- availability_checked_on). last_seen_live_on is written by the palette scan
-- apply step, never shown to users.
--
-- is_archived becomes a generated column (availability = 'discontinued'), so
-- every existing reader (compute-matches, /discontinued, hue bands, one-off
-- scripts) behaves exactly as before. Writers must set availability instead.
--
-- Behavior change: none. The 244 archived rows carry over as discontinued.

BEGIN;

ALTER TABLE colors
  ADD COLUMN availability text NOT NULL DEFAULT 'current'
    CHECK (availability IN ('current', 'retired', 'discontinued')),
  ADD COLUMN availability_source text,
  ADD COLUMN availability_checked_on date,
  ADD COLUMN last_seen_live_on date;

UPDATE colors
SET availability = 'discontinued',
    availability_source = 'carried over from is_archived (migration 006: Sherwin-Williams historic, Farrow & Ball Archive, Behr Harbour QE-55); pending retailer spot check',
    availability_checked_on = DATE '2026-10-11'
WHERE is_archived;

ALTER TABLE colors DROP COLUMN is_archived;
ALTER TABLE colors
  ADD COLUMN is_archived boolean GENERATED ALWAYS AS (availability = 'discontinued') STORED;

CREATE INDEX idx_colors_availability ON colors (availability) WHERE availability <> 'current';

COMMIT;
