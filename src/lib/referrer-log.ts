import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { referrerFromHeaders, type NormalizedReferrer, type ReferrerKind } from "./attribution";

// Records which external sites use the free API, the MCP tool and the embed
// widget, one row per (kind, page URL) in api_referrers (migration 013), via
// the log_api_referrer RPC. scripts/check-attribution.ts reads the table and
// checks each page for a credit link.
//
// Design rules (same as usage-log.ts):
//  - NEVER throws into the caller. Call it inside `after()` so it runs once the
//    response has flushed and adds no latency.
//  - Service role only. The table has RLS on with no anon policies and the RPC
//    is granted to service_role alone. If SUPABASE_SERVICE_ROLE_KEY is unset,
//    or the migration has not been applied, every call is a silent no-op.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

let client: SupabaseClient | null | undefined;

function getClient(): SupabaseClient | null {
  if (client === undefined) {
    client =
      url && serviceKey
        ? createClient(url, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { fetch: (u, init) => fetch(u, { ...init, cache: "no-store" }) },
          })
        : null;
  }
  return client;
}

export async function logReferrer(kind: ReferrerKind, ref: NormalizedReferrer | null): Promise<void> {
  if (!ref) return;
  const db = getClient();
  if (!db) return;
  try {
    // supabase-js reports RPC failures in the returned `error` rather than
    // throwing; it is ignored on purpose. The catch covers network errors.
    await db.rpc("log_api_referrer", { p_kind: kind, p_url: ref.url, p_host: ref.host });
  } catch {
    // Best-effort. Logging must never affect a response.
  }
}

// Convenience for routes: pick Referer (Origin fallback) off the request.
export function logRequestReferrer(kind: ReferrerKind, request: Request): Promise<void> {
  const ref = referrerFromHeaders(request.headers.get("referer"), request.headers.get("origin"));
  return logReferrer(kind, ref);
}
