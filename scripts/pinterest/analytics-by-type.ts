/**
 * Pinterest analytics, broken down by PIN TYPE.
 *
 * Joins published.json (pinId + key) → the QUEUE's key→type map → per-pin
 * Pinterest analytics, and aggregates impressions / pin-clicks / outbound-clicks
 * / saves by type (swatch, guide, palette/room-scene, comparison). This is the
 * Pinterest-REACH view the cloud Monday digest can't produce (no API access in
 * the cloud agent) — the digest covers the GA4 site-traffic view via UTM campaign.
 *
 * The decision it informs: which pin TYPE converts reach into engagement +
 * outbound clicks, so the drip's daily mix can shift toward the winner.
 *
 * Usage:
 *   npx tsx scripts/pinterest/analytics-by-type.ts            # last 30 days → stdout
 *   npx tsx scripts/pinterest/analytics-by-type.ts --days=7
 *   npx tsx scripts/pinterest/analytics-by-type.ts --start=2026-05-27 --end=2026-06-02
 *   npx tsx scripts/pinterest/analytics-by-type.ts --days=7 --email   # also email via Resend
 *
 * --email sends the report through Resend IF RESEND_API_KEY is set in .env.local
 * (to REPORT_EMAIL_TO, default philip@theorphanshands.org). If the key is absent
 * it prints a notice and skips — the report still prints/returns for the caller
 * (the launchd wrapper writes it to a file + macOS notification regardless).
 */
import "../blog/load-env.ts"; // loads .env.local before anything reads process.env
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { QUEUE } from "./queue.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, "../../.env.local");
const PUBLISHED_PATH = path.resolve(__dirname, "published.json");
const API = "https://api.pinterest.com/v5";
const APP_ID = process.env.PINTEREST_APP_ID!;
const APP_SECRET = process.env.PINTEREST_APP_SECRET_KEY!;
let accessToken = process.env.PINTEREST_ACCESS_TOKEN!;

const METRICS = ["IMPRESSION", "PIN_CLICK", "OUTBOUND_CLICK", "SAVE"] as const;
type Metric = (typeof METRICS)[number];

const args = process.argv.slice(2);
const EMAIL = args.includes("--email");
function arg(name: string): string | undefined {
  return args.find((a) => a.startsWith(`--${name}=`))?.replace(`--${name}=`, "");
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function upsertEnv(updates: Record<string, string>) {
  const lines = fs.readFileSync(ENV_PATH, "utf8").split("\n");
  for (const [key, value] of Object.entries(updates)) {
    const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
    const line = `${key}=${value}`;
    if (idx >= 0) lines[idx] = line;
    else lines.push(line);
  }
  fs.writeFileSync(ENV_PATH, lines.join("\n"));
}

async function refreshAccessToken(): Promise<void> {
  const refresh = process.env.PINTEREST_REFRESH_TOKEN;
  if (!refresh) throw new Error("401 and no PINTEREST_REFRESH_TOKEN — re-run pinterest-auth.ts");
  const basic = Buffer.from(`${APP_ID}:${APP_SECRET}`).toString("base64");
  const res = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Token refresh failed (${res.status}): ${JSON.stringify(data)}`);
  accessToken = data.access_token;
  const updates: Record<string, string> = { PINTEREST_ACCESS_TOKEN: data.access_token };
  if (data.refresh_token) updates.PINTEREST_REFRESH_TOKEN = data.refresh_token;
  upsertEnv(updates);
}

async function pinterest(pathname: string, retry = true): Promise<any> {
  const res = await fetch(`${API}${pathname}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json().catch(() => ({}));
  const isScopeError = typeof data?.message === "string" && /scope|Missing:/i.test(data.message);
  if (res.status === 401 && retry && !isScopeError) {
    await refreshAccessToken();
    return pinterest(pathname, false);
  }
  if (!res.ok) throw new Error(`${res.status} ${pathname}: ${JSON.stringify(data).slice(0, 200)}`);
  return data;
}

async function pinSummary(pinId: string, start: string, end: string): Promise<Record<Metric, number>> {
  const q = `start_date=${start}&end_date=${end}&metric_types=${METRICS.join(",")}`;
  const data = await pinterest(`/pins/${pinId}/analytics?${q}`);
  const all = data.all ?? data;
  const summary = all.summary_metrics ?? {};
  const out = {} as Record<Metric, number>;
  for (const m of METRICS) out[m] = Number(summary[m] ?? 0);
  return out;
}

/** Email the report via Resend (same provider the site uses). No-op if no key. */
async function emailReport(body: string, window: string): Promise<string> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.REPORT_EMAIL_TO || "philip@theorphanshands.org";
  if (!key) return "✉️  skipped email — no RESEND_API_KEY in .env.local (report saved + notified instead).";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Paint Color HQ <delivered@resend.dev>",
      to,
      subject: `PaintColorHQ — Pinterest reach by pin type (${window})`,
      text: body,
    }),
  });
  if (!res.ok) return `✉️  email failed (${res.status}): ${(await res.text()).slice(0, 160)}`;
  return `✉️  emailed to ${to}`;
}

async function main() {
  const start = arg("start") ?? daysAgo(arg("days") ? Number(arg("days")) : 30);
  const end = arg("end") ?? daysAgo(1); // yesterday — today isn't finalized

  const keyToType = new Map<string, string>(QUEUE.map((p) => [p.key, p.type]));
  const published: Record<string, { pinId?: string; publishedAt?: string }> = JSON.parse(
    fs.readFileSync(PUBLISHED_PATH, "utf8"),
  );
  const pins = Object.entries(published)
    .filter(([, v]) => v.pinId)
    .map(([key, v]) => ({ key, pinId: v.pinId!, type: keyToType.get(key) ?? key.split(/[-_]/)[0] }));

  type Agg = { pins: number; IMPRESSION: number; PIN_CLICK: number; OUTBOUND_CLICK: number; SAVE: number };
  const byType = new Map<string, Agg>();
  let failures = 0;
  for (const pin of pins) {
    let s: Record<Metric, number>;
    try {
      s = await pinSummary(pin.pinId, start, end);
    } catch {
      failures++;
      continue;
    }
    const a = byType.get(pin.type) ?? { pins: 0, IMPRESSION: 0, PIN_CLICK: 0, OUTBOUND_CLICK: 0, SAVE: 0 };
    a.pins += 1;
    for (const m of METRICS) a[m] += s[m];
    byType.set(pin.type, a);
  }

  // Build the report (returned as text so the caller can email/file it).
  const L: string[] = [];
  const pad = (v: string | number, n: number) => String(v).padStart(n);
  L.push(`Pinterest analytics by pin type — ${start} → ${end} (${pins.length} drip pins)`);
  L.push("");
  L.push(`${"type".padEnd(12)}${pad("pins", 5)}${pad("impr", 8)}${pad("pinClk", 8)}${pad("outClk", 8)}${pad("saves", 7)}${pad("out%", 8)}`);
  L.push("-".repeat(56));
  const rows = [...byType.entries()].sort((x, y) => y[1].IMPRESSION - x[1].IMPRESSION);
  const tot: Agg = { pins: 0, IMPRESSION: 0, PIN_CLICK: 0, OUTBOUND_CLICK: 0, SAVE: 0 };
  for (const [type, a] of rows) {
    const outRate = a.IMPRESSION ? ((a.OUTBOUND_CLICK / a.IMPRESSION) * 100).toFixed(2) : "0.00";
    L.push(`${type.padEnd(12)}${pad(a.pins, 5)}${pad(a.IMPRESSION, 8)}${pad(a.PIN_CLICK, 8)}${pad(a.OUTBOUND_CLICK, 8)}${pad(a.SAVE, 7)}${pad(outRate + "%", 8)}`);
    tot.pins += a.pins;
    for (const m of METRICS) tot[m] += a[m];
  }
  L.push("-".repeat(56));
  const totRate = tot.IMPRESSION ? ((tot.OUTBOUND_CLICK / tot.IMPRESSION) * 100).toFixed(2) : "0.00";
  L.push(`${"TOTAL".padEnd(12)}${pad(tot.pins, 5)}${pad(tot.IMPRESSION, 8)}${pad(tot.PIN_CLICK, 8)}${pad(tot.OUTBOUND_CLICK, 8)}${pad(tot.SAVE, 7)}${pad(totRate + "%", 8)}`);
  if (failures) L.push(`\n${failures} pin(s) had no analytics yet (new pins).`);
  L.push("");
  L.push(`out% = outbound clicks ÷ impressions — the click-through-to-site rate (the lever to optimize).`);
  L.push(`Note: these are the drip's own pins only; account-wide reach includes older/manual pins.`);

  const report = L.join("\n");
  console.log(report);

  if (EMAIL) {
    const status = await emailReport(report, `${start} → ${end}`);
    console.log("\n" + status);
  }
}

main().catch((e) => {
  console.error("Error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
