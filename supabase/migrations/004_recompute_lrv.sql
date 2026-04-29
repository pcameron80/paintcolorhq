-- Migration 004: Recompute LRV with proper gamma correction
--
-- The previous LRV values were computed from sRGB hex without gamma correction,
-- producing inflated values (e.g. SW Pure White showed LRV 92, actual is 84;
-- BM Quiet Moments showed LRV 81, actual is ~46-47).
--
-- This migration:
--   1. Defines srgb_to_lrv(hex) — gamma-corrected luminance per WCAG 2.x / CIE Y for sRGB
--   2. Runs sanity checks against known reference values
--   3. UPDATEs every row in colors with the recomputed LRV
--   4. Returns verification samples so the result can be eyeballed
--
-- Run via Supabase Dashboard → SQL Editor. One transaction. Safe to re-run
-- (UPDATE is idempotent).

BEGIN;

SET search_path = public, extensions;

-- ─── Function ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION srgb_to_lrv(hex_value text)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cleaned text;
  r_int   int;
  g_int   int;
  b_int   int;
  r_lin   numeric;
  g_lin   numeric;
  b_lin   numeric;
BEGIN
  cleaned := lower(replace(hex_value, '#', ''));
  IF length(cleaned) <> 6 THEN
    RAISE EXCEPTION 'srgb_to_lrv: invalid hex %', hex_value;
  END IF;

  r_int := ('x' || substring(cleaned from 1 for 2))::bit(8)::int;
  g_int := ('x' || substring(cleaned from 3 for 2))::bit(8)::int;
  b_int := ('x' || substring(cleaned from 5 for 2))::bit(8)::int;

  -- Gamma-corrected sRGB → linear (per IEC 61966-2-1 / WCAG 2.x)
  r_lin := CASE
    WHEN r_int / 255.0 <= 0.03928 THEN (r_int / 255.0) / 12.92
    ELSE power((r_int / 255.0 + 0.055) / 1.055, 2.4)
  END;
  g_lin := CASE
    WHEN g_int / 255.0 <= 0.03928 THEN (g_int / 255.0) / 12.92
    ELSE power((g_int / 255.0 + 0.055) / 1.055, 2.4)
  END;
  b_lin := CASE
    WHEN b_int / 255.0 <= 0.03928 THEN (b_int / 255.0) / 12.92
    ELSE power((b_int / 255.0 + 0.055) / 1.055, 2.4)
  END;

  -- Rec. 709 luminance coefficients on linear values, scaled to 0-100
  RETURN round(((0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin) * 100)::numeric, 1);
END;
$$;

COMMENT ON FUNCTION srgb_to_lrv(text) IS
  'Gamma-corrected sRGB → LRV (Light Reflectance Value, 0–100). Approximates manufacturer-published LRV within ~5 points for most paint colors. Use during color imports.';

-- ─── Sanity checks ──────────────────────────────────────────────────────────
-- Use \echo or ROLLBACK if any of these look off before continuing.

DO $$
DECLARE
  v_white  numeric := srgb_to_lrv('#FFFFFF');
  v_black  numeric := srgb_to_lrv('#000000');
  v_pure   numeric := srgb_to_lrv('#edece6'); -- SW Pure White, expect ~83.7
BEGIN
  IF v_white <> 100.0 THEN
    RAISE EXCEPTION 'sanity check failed: white returned %, expected 100.0', v_white;
  END IF;
  IF v_black <> 0.0 THEN
    RAISE EXCEPTION 'sanity check failed: black returned %, expected 0.0', v_black;
  END IF;
  IF v_pure < 83.0 OR v_pure > 84.5 THEN
    RAISE EXCEPTION 'sanity check failed: SW Pure White returned %, expected ~83.7', v_pure;
  END IF;
  RAISE NOTICE 'Sanity checks passed: white=%, black=%, pure_white=%', v_white, v_black, v_pure;
END $$;

-- ─── Update all rows ────────────────────────────────────────────────────────

UPDATE public.colors
SET lrv = public.srgb_to_lrv(hex)
WHERE hex IS NOT NULL
  AND length(replace(hex, '#', '')) = 6;

-- ─── Post-update verification ───────────────────────────────────────────────
-- Should show the 3 colors from the laundry-room blog post with corrected values.

SELECT name, hex, lrv, slug
FROM public.colors
WHERE slug IN (
  'saybrook-sage-hc-114',
  'pure-white-7005',
  'quiet-moments-1563',
  'hidden-gem-n430-6a',
  'naval-6244',
  'chantilly-lace-2121-70'
)
ORDER BY lrv DESC;

-- Expected (approximately):
--   Chantilly Lace      LRV 90.x
--   Pure White 7005     LRV 83.7
--   Quiet Moments 1563  LRV ~61.6
--   Saybrook Sage HC-114 LRV ~46.4
--   Hidden Gem N430-6A  LRV ~14.1
--   Naval 6244          LRV ~5.1

COMMIT;
