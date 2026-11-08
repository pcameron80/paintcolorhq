-- Backup of public.nearest_colors_by_lab (v1) as it exists in production.
--
-- Captured 2026-10-24 from the paintcolorhq.com Supabase project with
-- read-only catalog queries:
--   select pg_get_functiondef(p.oid), p.proacl, p.prosecdef, p.provolatile,
--          p.proconfig, obj_description(p.oid, 'pg_proc'), pg_get_userbyid(p.proowner)
--   from pg_proc p where p.proname = 'nearest_colors_by_lab';
--
-- Catalog facts at capture time:
--   signature   nearest_colors_by_lab(double precision, double precision,
--               double precision, text, integer)
--   owner       postgres
--   volatility  STABLE ('s'), SECURITY INVOKER (prosecdef = false)
--   proconfig   null (no search_path set; already flagged by the Supabase
--               advisor as function_search_path_mutable)
--   proacl      {=X/postgres,postgres=X/postgres,anon=X/postgres,
--                authenticated=X/postgres,service_role=X/postgres}
--
-- Migration 015 does NOT modify this function. This file exists so v1 can be
-- recreated exactly if it is ever dropped or replaced by mistake. Running it is
-- idempotent (CREATE OR REPLACE plus GRANT).

CREATE OR REPLACE FUNCTION public.nearest_colors_by_lab(in_l double precision, in_a double precision, in_b double precision, in_brand text DEFAULT NULL::text, in_limit integer DEFAULT 200)
 RETURNS TABLE(id uuid, name text, hex text, slug text, color_number text, rgb_r integer, rgb_g integer, rgb_b integer, lab_l numeric, lab_a numeric, lab_b_val numeric, undertone text, lrv numeric, color_family text, brand_name text, brand_slug text)
 LANGUAGE sql
 STABLE
AS $function$
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
$function$;

COMMENT ON FUNCTION public.nearest_colors_by_lab(double precision, double precision, double precision, text, integer) IS
  'Returns the in_limit colors nearest to (in_l,in_a,in_b) in CIE LAB (deltaE76), optionally within one brand slug. Used by src/lib/color-match.ts as the candidate pre-filter before exact CIEDE2000 refinement. Replaces the old unordered RGB-box .limit(500), which dropped the true closest color in dense regions.';

-- The captured ACL grants EXECUTE to PUBLIC (the "=X" entry, Postgres's default
-- for new functions) and explicitly to anon, authenticated and service_role.
GRANT EXECUTE ON FUNCTION public.nearest_colors_by_lab(double precision, double precision, double precision, text, integer) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.nearest_colors_by_lab(double precision, double precision, double precision, text, integer) TO anon, authenticated, service_role;
