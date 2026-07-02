-- 010_nearest_colors_rpc.sql
-- Deterministic nearest-neighbour candidate selection for the cross-brand matcher
-- (src/lib/color-match.ts).
--
-- The old path fetched colors inside an RGB bounding box with a plain .limit(500)
-- and NO ordering. Paint colors cluster hard in neutral regions — a ±40 RGB box
-- around a common greige holds 6,000+ of our 26,597 colors — so Postgres returned
-- an arbitrary 500 and the *actual* closest color was often dropped. The "closest
-- match" could then change run to run (visible whenever the edge cache was busted).
--
-- This function orders ALL colors (optionally one brand) by squared Euclidean
-- distance in CIE LAB (ΔE76) and returns the k nearest. LAB is fully populated
-- (0 nulls), so ordering is exact and deterministic. The caller refines these k
-- with the exact CIEDE2000 (ΔE2000) formula in JS and takes the final top-N — the
-- ΔE2000 winners are always within the ΔE76 top-k for a generous k.
--
-- STABLE so PostgREST allows it over GET (supabase-js `.rpc(..., { get: true })`),
-- which keeps the call cacheable by Next's Data Cache like the previous query.
-- SECURITY INVOKER (default): runs as the caller, same RLS as the old direct read.
-- 26,597 rows → seq scan + top-k heap sort is a few ms; no special index needed.

create or replace function nearest_colors_by_lab(
  in_l double precision,
  in_a double precision,
  in_b double precision,
  in_brand text default null,
  in_limit integer default 200
)
returns table (
  id uuid,
  name text,
  hex text,
  slug text,
  color_number text,
  rgb_r integer,
  rgb_g integer,
  rgb_b integer,
  lab_l numeric,
  lab_a numeric,
  lab_b_val numeric,
  undertone text,
  lrv numeric,
  color_family text,
  brand_name text,
  brand_slug text
)
language sql
stable
as $$
  select
    c.id, c.name, c.hex, c.slug, c.color_number,
    c.rgb_r, c.rgb_g, c.rgb_b,
    c.lab_l, c.lab_a, c.lab_b_val,
    c.undertone, c.lrv, c.color_family,
    b.name, b.slug
  from colors c
  join brands b on b.id = c.brand_id
  where in_brand is null or b.slug = in_brand
  order by
    (c.lab_l::float8 - in_l) * (c.lab_l::float8 - in_l)
    + (c.lab_a::float8 - in_a) * (c.lab_a::float8 - in_a)
    + (c.lab_b_val::float8 - in_b) * (c.lab_b_val::float8 - in_b)
  limit greatest(least(in_limit, 1000), 1);
$$;

comment on function nearest_colors_by_lab is
  'Returns the in_limit colors nearest to (in_l,in_a,in_b) in CIE LAB (ΔE76), optionally within one brand slug. Used by src/lib/color-match.ts as the candidate pre-filter before exact CIEDE2000 refinement. Replaces the old unordered RGB-box .limit(500), which dropped the true closest color in dense regions.';

grant execute on function nearest_colors_by_lab(double precision, double precision, double precision, text, integer) to anon, authenticated;
