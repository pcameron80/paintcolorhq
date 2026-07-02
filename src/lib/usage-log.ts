import { createClient } from "@supabase/supabase-js";

// Best-effort adoption telemetry for the color-match API surfaces (free REST,
// the MCP agent tool, and the embeddable widget). Writes one row per request to
// `api_usage_events` (migration 009) so scripts/adoption-report.ts can measure
// the three value streams in docs/api-adoption-plan-2026-06-27.md §1.
//
// Design rules:
//  - NEVER throws into the caller. A telemetry failure must not affect an API
//    response. Always call this from inside `after()` so it runs after the
//    response flushes and adds zero latency to the matched result.
//  - Uses the anon key (writes are allowed by the RLS insert policy; reads need
//    the service role). A dedicated client keeps the ISR-revalidate fetch wrapper
//    in src/lib/supabase.ts — tuned for cached GET reads — away from these POSTs.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const logClient =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { fetch: (u, init) => fetch(u, { ...init, cache: "no-store" }) },
      })
    : null;

export type UsageSource = "color-match" | "mcp" | "embed";

export interface UsageEvent {
  source: UsageSource;
  tier?: "free" | "paid" | null;
  referer?: string | null;
  origin?: string | null;
  host?: string | null; // embedding parent origin, from the widget beacon
  userAgent?: string | null;
  country?: string | null;
  hex?: string | null;
}

function clip(value: string | null | undefined, max = 1024): string | null {
  if (!value) return null;
  return value.length > max ? value.slice(0, max) : value;
}

export async function logUsageEvent(event: UsageEvent): Promise<void> {
  if (!logClient) return;
  try {
    await logClient.from("api_usage_events").insert({
      source: event.source,
      tier: event.tier ?? null,
      referer: clip(event.referer),
      origin: clip(event.origin),
      host: clip(event.host),
      user_agent: clip(event.userAgent, 512),
      country: event.country ?? null,
      hex: clip(event.hex, 16),
    });
  } catch {
    // Telemetry is best-effort — swallow everything (including a missing table
    // before migration 009 is applied). Logging must never break a response.
  }
}

// True when the Referer is our own site. The on-site tools and the embedded widget
// call /api/color-match on every color-picker change; at drag rates that would
// swamp api_usage_events with same-origin noise. It's on-site engagement (already
// in GA4), not API *adoption*, so the color-match logger skips it and keeps the
// table focused on external consumers (Stream A). Embeds themselves are captured
// separately by the /api/embed-event beacon, not by these picker calls.
export function isOnSiteReferer(referer: string | null): boolean {
  if (!referer) return false;
  try {
    return /(^|\.)paintcolorhq\.com$/i.test(new URL(referer).hostname);
  } catch {
    return false;
  }
}

// Pull the request-level metadata we log on every API surface. `x-vercel-ip-country`
// is injected by Vercel's edge; it's absent in local dev (→ null).
export function usageMetaFromRequest(request: Request): {
  referer: string | null;
  origin: string | null;
  userAgent: string | null;
  country: string | null;
} {
  const h = request.headers;
  return {
    referer: h.get("referer"),
    origin: h.get("origin"),
    userAgent: h.get("user-agent"),
    country: h.get("x-vercel-ip-country"),
  };
}
