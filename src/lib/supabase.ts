import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

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
      fetch: (url, init) =>
        fetch(url, { ...init, next: { revalidate: 86400 } }),
    },
  }
);

// Service role client for admin operations (scripts, seeding)
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey, {
    global: {
      fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }),
    },
  });
}
