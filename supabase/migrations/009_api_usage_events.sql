-- 009_api_usage_events.sql
-- Adoption instrumentation for the cross-brand color-match API (see
-- docs/api-adoption-plan-2026-06-27.md §1). The product is shipped; the unknown
-- is *demand* — who is actually calling the free API, embedding the widget, or
-- reaching it through the MCP/agent surface. This append-only event log is the
-- leading indicator for the three value streams:
--   A (distribution): free /api/color-match calls + the external sites embedding
--      the /embed widget (host captured by the widget beacon → /api/embed-event).
--   B (agents):       /api/mcp tool calls (source = 'mcp').
--   C (subscriptions): paid calls proxied through RapidAPI (tier = 'paid').
--
-- Written best-effort from server routes via src/lib/usage-log.ts (anon key +
-- the insert policy below). Read only by the operator: scripts/adoption-report.ts
-- using the service role, which bypasses RLS. There is deliberately NO select
-- policy, so the table is write-only to the public anon role.
--
-- Volume note: the free endpoint is edge-cached (24h s-maxage), so a row is
-- written only on a cache MISS — repeat lookups of the same hex/referer within a
-- day are not re-logged. That undercounts raw call volume but still captures the
-- *diversity of referrers/embeds*, which is the signal that matters here.

create table if not exists api_usage_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  source      text not null,   -- 'color-match' | 'mcp' | 'embed'
  tier        text,            -- 'free' | 'paid' (color-match / mcp); null for embed
  referer     text,            -- request Referer (direct API callers / embedding page)
  origin      text,            -- request Origin header
  host        text,            -- embedding parent origin, from the widget beacon (embed)
  user_agent  text,
  country     text,            -- Vercel geo header (x-vercel-ip-country)
  hex         text,            -- looked-up hex value (color-match / mcp)
  constraint api_usage_events_source_chk check (source in ('color-match', 'mcp', 'embed'))
);

comment on table api_usage_events is
  'Append-only adoption log for the color-match API (free REST, MCP agent tool, embeddable widget). Write-only for anon (RLS insert policy); read via service role only (scripts/adoption-report.ts). See docs/api-adoption-plan-2026-06-27.md §1.';

-- Time-window aggregation (last 7 / 30 days) is the only read pattern.
create index if not exists api_usage_events_created_at_idx on api_usage_events (created_at desc);
create index if not exists api_usage_events_source_idx on api_usage_events (source);

alter table api_usage_events enable row level security;

-- Public (anon) may APPEND events only — server routes log with the anon key.
-- No select/update/delete policy ⇒ the table is write-only to the public role;
-- the operator reads it with the service role (RLS-exempt). The CHECK keeps junk
-- out by constraining the source to the known set.
create policy "api_usage_events insert" on api_usage_events
  for insert to anon, authenticated
  with check (source in ('color-match', 'mcp', 'embed'));
