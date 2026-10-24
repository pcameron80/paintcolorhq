import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const REQUEST_TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 300;

// One retry on a thrown fetch (network error, timeout) or a 5xx, 300 ms
// apart. 4xx responses are returned as-is: PGRST116 (no row) and bad input
// are answers, not outages. Each attempt gets its own 8 s timeout, combined
// with any signal the caller passed.
//
// `next: { revalidate: 86400 }` stays on every attempt, so Next's fetch cache
// still keys and stores these requests exactly as before. A failed attempt is
// never cached as data: 5xx bodies are thrown away by the retry, and a second
// failure surfaces to the caller, which throws (see getColorBySlug) so ISR
// keeps the last good page.
async function fetchWithRetry(url: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const attempt = () => {
    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    return fetch(url, { ...init, signal, next: { revalidate: 86400 } });
  };
  try {
    const res = await attempt();
    if (res.status < 500) return res;
    await res.body?.cancel().catch(() => {});
  } catch (err) {
    // A caller-initiated abort is final.
    if (init?.signal?.aborted) throw err;
  }
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  return attempt();
}

// Server-side client — uses Next.js ISR revalidation instead of no-store
// so pages with `revalidate` can be statically generated.
//
// Bumped to 24h (was 1h) as part of the egress reduction work — color
// data is extremely stable (only changes when scripts/compute-matches.ts
// or scripts/import-*.ts re-run, both rare). 24h was the recommended
// follow-up from the egress investigation handoff. If a manual edit
// needs to propagate faster, redeploy to bust the ISR cache.
export const supabase: SupabaseClient = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder",
  {
    global: {
      fetch: fetchWithRetry,
    },
  }
);
