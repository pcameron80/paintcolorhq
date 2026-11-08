-- 015_nearest_colors_by_lab_v2.sql
--
-- NOT APPLIED. Philip applies this to production (Supabase SQL editor, or
-- `supabase db push` / apply_migration). Verify afterwards with:
--   npx tsx scripts/check-nearest-v2.ts
--
-- Why: nearest_colors_by_lab (migration 010) returns no availability column, so
-- the REST API, the MCP tool and every on-site tool cannot label the 2,790
-- retired colors (migration 012). Roughly 6% of top-1 tool results are retired.
--
-- Why a new function instead of altering v1: adding a column to a RETURNS TABLE
-- function changes its return type, which CREATE OR REPLACE refuses; it would
-- need DROP FUNCTION + CREATE on the function paid RapidAPI traffic calls, with
-- a window where the RPC 404s. v2 is additive: v1 is untouched and keeps
-- serving until the callers move over in a separate code change.
--
-- What v2 changes relative to v1 (backup: supabase/backups/nearest_colors_by_lab_v1.sql):
--   1. Returns c.availability ('current' | 'retired' | 'discontinued') as the
--      last column. Every other column, its name, type and order is identical.
--   2. Optional in_current_only boolean (default false). When true, only
--      availability = 'current' rows are returned. Default false means the row
--      set matches v1 exactly (v1 applies no availability filter at all, so
--      discontinued colors are still returned, as they are today).
--   3. Ties on LAB distance break on c.id. v1 orders by distance only, so rows
--      at exactly the same distance (duplicate hexes across brands are common)
--      come back in planner order and can swap between calls. The tiebreak makes
--      v2 deterministic; it can only reorder rows inside an exact-distance tie,
--      never change which distances come back.
--   4. SET search_path = public. v1 has a mutable search_path (Supabase advisor
--      function_search_path_mutable); v2 must not add a second warning. The
--      body already names public tables only.
--
-- Same as v1: LANGUAGE sql, STABLE (PostgREST allows GET, so Next's Data Cache
-- keeps caching it), SECURITY INVOKER (RLS of the caller applies), limit clamp
-- 1..1000, owner postgres, EXECUTE for PUBLIC, anon, authenticated, service_role.
--
-- Revert: DROP FUNCTION public.nearest_colors_by_lab_v2(double precision, double precision, double precision, text, integer, boolean);
-- (Safe while no caller uses v2. v1 is unaffected either way.)

begin;

create function public.nearest_colors_by_lab_v2(
  in_l double precision,
  in_a double precision,
  in_b double precision,
  in_brand text default null,
  in_limit integer default 200,
  in_current_only boolean default false
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
  brand_slug text,
  availability text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.id, c.name, c.hex, c.slug, c.color_number,
    c.rgb_r, c.rgb_g, c.rgb_b,
    c.lab_l, c.lab_a, c.lab_b_val,
    c.undertone, c.lrv, c.color_family,
    b.name, b.slug,
    c.availability
  from public.colors c
  join public.brands b on b.id = c.brand_id
  where (in_brand is null or b.slug = in_brand)
    and (in_current_only is not true or c.availability = 'current')
  order by
    (c.lab_l::float8 - in_l) * (c.lab_l::float8 - in_l)
    + (c.lab_a::float8 - in_a) * (c.lab_a::float8 - in_a)
    + (c.lab_b_val::float8 - in_b) * (c.lab_b_val::float8 - in_b),
    c.id
  limit greatest(least(in_limit, 1000), 1);
$$;

comment on function public.nearest_colors_by_lab_v2(double precision, double precision, double precision, text, integer, boolean) is
  'v2 of nearest_colors_by_lab: same rows and columns, plus availability (current/retired/discontinued), an optional in_current_only filter, a c.id tiebreak for deterministic order, and a fixed search_path. Lets the API, MCP tool and site tools label retired colors. v1 is unchanged.';

-- Match v1's ACL exactly: PUBLIC keeps the default EXECUTE, plus the named roles.
grant execute on function public.nearest_colors_by_lab_v2(double precision, double precision, double precision, text, integer, boolean) to public;
grant execute on function public.nearest_colors_by_lab_v2(double precision, double precision, double precision, text, integer, boolean) to anon, authenticated, service_role;

commit;

-- PostgREST caches the schema; Supabase reloads it on DDL automatically. If the
-- RPC 404s right after applying, run: notify pgrst, 'reload schema';
