/**
 * adoption-report.ts
 *
 * The weekly KPI read for the color-match API adoption push
 * (docs/api-adoption-plan-2026-06-27.md §1). Aggregates the append-only
 * `api_usage_events` log (migration 009) into the three value streams and emits
 * a structured KPI_JSON block for the local Console dashboard (localhost:8765),
 * mirroring the *-brief skills' convention.
 *
 *   A (distribution): free /api/color-match calls + DISTINCT external referrers
 *                     + DISTINCT external sites embedding the /embed widget.
 *   B (agents):       /api/mcp tool calls (+ distinct agent clients by UA).
 *   C (subscriptions): paid calls proxied through RapidAPI (tier = 'paid').
 *
 * The one number to watch: unique external consumers this week (external
 * referrers ∪ embed hosts ∪ distinct MCP clients).
 *
 * Usage:
 *   npm run adoption-report           # 7d + 30d windows, human + KPI_JSON
 *   tsx scripts/adoption-report.ts --json   # KPI_JSON only (for the Console)
 *
 * Read-only. Uses the service role (RLS-exempt) — the table is write-only to anon.
 */
import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey, {
  global: { fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }) },
});

const JSON_ONLY = process.argv.includes("--json");

interface UsageRow {
  created_at: string;
  source: "color-match" | "mcp" | "embed";
  tier: string | null;
  referer: string | null;
  origin: string | null;
  host: string | null;
  user_agent: string | null;
  country: string | null;
  hex: string | null;
}

// Extract a bare hostname from a Referer/Origin/host string; null if unusable.
function hostOf(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isExternal(host: string | null): host is string {
  return Boolean(host) && !host!.endsWith("paintcolorhq.com");
}

function summarize(rows: UsageRow[]) {
  const colorMatchFree = rows.filter((r) => r.source === "color-match" && r.tier !== "paid").length;
  const colorMatchPaid = rows.filter((r) => r.source === "color-match" && r.tier === "paid").length;
  const mcpCalls = rows.filter((r) => r.source === "mcp").length;
  const embedBeacons = rows.filter((r) => r.source === "embed").length;

  // Stream A — distinct external sites calling the REST API directly.
  const externalReferrers = new Set<string>();
  for (const r of rows) {
    if (r.source === "embed") continue;
    const h = hostOf(r.referer) ?? hostOf(r.origin);
    if (isExternal(h)) externalReferrers.add(h);
  }

  // Stream A — distinct external sites embedding the widget (from the beacon).
  const embedHosts = new Set<string>();
  for (const r of rows) {
    if (r.source !== "embed") continue;
    const h = hostOf(r.host);
    if (isExternal(h)) embedHosts.add(h);
  }

  // Stream B — distinct agent clients (best-effort, by user-agent).
  const mcpClients = new Set<string>();
  for (const r of rows) {
    if (r.source === "mcp" && r.user_agent) mcpClients.add(r.user_agent);
  }

  // The one number: unique external consumers across all surfaces.
  const uniqueExternalConsumers = new Set<string>([
    ...[...externalReferrers].map((h) => `ref:${h}`),
    ...[...embedHosts].map((h) => `embed:${h}`),
    ...[...mcpClients].map((c) => `mcp:${c}`),
  ]).size;

  return {
    streamA: {
      colorMatchFreeCalls: colorMatchFree,
      externalReferrers: externalReferrers.size,
      externalReferrerHosts: [...externalReferrers].sort(),
      widgetEmbedBeacons: embedBeacons,
      embedHosts: embedHosts.size,
      embedHostList: [...embedHosts].sort(),
    },
    streamB: { mcpCalls, distinctMcpClients: mcpClients.size },
    streamC: { paidCalls: colorMatchPaid },
    uniqueExternalConsumers,
  };
}

function windowRows(rows: UsageRow[], days: number): UsageRow[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return rows.filter((r) => new Date(r.created_at).getTime() >= cutoff);
}

async function main() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("api_usage_events")
    .select("created_at, source, tier, referer, origin, host, user_agent, country, hex")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100_000);

  if (error) {
    if (!JSON_ONLY) {
      console.error("Could not read api_usage_events:", error.message);
      console.error("If this is the first run, apply migration 009_api_usage_events.sql.");
    } else {
      console.log(JSON.stringify({ error: error.message }));
    }
    process.exit(1);
  }

  const rows = (data ?? []) as UsageRow[];
  const last7 = summarize(windowRows(rows, 7));
  const last30 = summarize(rows);

  const kpi = {
    metric: "pchq_api_adoption",
    generatedAt: new Date().toISOString(),
    window7d: last7,
    window30d: last30,
    headline: { uniqueExternalConsumers7d: last7.uniqueExternalConsumers },
  };

  if (!JSON_ONLY) {
    const w = last7;
    console.log("PaintColorHQ — API adoption (last 7 days)\n");
    console.log("Stream A — distribution (the flywheel):");
    console.log(`  Free color-match calls (cache misses): ${w.streamA.colorMatchFreeCalls}`);
    console.log(`  Distinct external referrers:           ${w.streamA.externalReferrers}`);
    if (w.streamA.externalReferrerHosts.length) console.log(`    ${w.streamA.externalReferrerHosts.join(", ")}`);
    console.log(`  Widget embed beacons:                  ${w.streamA.widgetEmbedBeacons}`);
    console.log(`  Distinct embedding sites:              ${w.streamA.embedHosts}`);
    if (w.streamA.embedHostList.length) console.log(`    ${w.streamA.embedHostList.join(", ")}`);
    console.log("\nStream B — agents (the asymmetric bet):");
    console.log(`  MCP tool calls:                        ${w.streamB.mcpCalls}`);
    console.log(`  Distinct MCP clients:                  ${w.streamB.distinctMcpClients}`);
    console.log("\nStream C — subscriptions (bonus, not the goal):");
    console.log(`  Paid (RapidAPI) calls:                 ${w.streamC.paidCalls}`);
    console.log(`\n>> One number — unique external consumers (7d): ${w.uniqueExternalConsumers}`);
    console.log(`   (30d: ${last30.uniqueExternalConsumers})\n`);
  }

  console.log("KPI_JSON " + JSON.stringify(kpi));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
