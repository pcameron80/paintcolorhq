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
 * --email sends a styled HTML report through Resend IF RESEND_API_KEY is set in
 * .env.local (to REPORT_EMAIL_TO, default philip@theorphanshands.org). If the key
 * is absent it prints a notice and skips — the plain-text report still prints for
 * the launchd wrapper, which writes it to a file + macOS notification regardless.
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

/** Friendly labels for the pin types stored in the queue. */
const TYPE_LABEL: Record<string, string> = {
  swatch: "Swatch",
  guide: "Guide / blog",
  palette: "Room scene",
  comparison: "Comparison",
};

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

interface Agg { pins: number; IMPRESSION: number; PIN_CLICK: number; OUTBOUND_CLICK: number; SAVE: number }
interface Row extends Agg { type: string }

const num = (n: number) => n.toLocaleString("en-US");
const rate = (a: Agg) => (a.IMPRESSION ? ((a.OUTBOUND_CLICK / a.IMPRESSION) * 100).toFixed(2) : "0.00") + "%";

/** Plain-text table — for the terminal and the saved report file. */
function buildText(rows: Row[], tot: Agg, start: string, end: string, pinCount: number): string {
  const L: string[] = [];
  const pad = (v: string | number, n: number) => String(v).padStart(n);
  L.push(`Pinterest reach by pin type — ${start} → ${end} (${pinCount} drip pins)`);
  L.push("");
  L.push(`${"type".padEnd(13)}${pad("pins", 5)}${pad("impr", 8)}${pad("pinClk", 8)}${pad("outClk", 8)}${pad("saves", 7)}${pad("out%", 8)}`);
  L.push("-".repeat(57));
  for (const r of rows) {
    L.push(`${(TYPE_LABEL[r.type] ?? r.type).padEnd(13)}${pad(r.pins, 5)}${pad(r.IMPRESSION, 8)}${pad(r.PIN_CLICK, 8)}${pad(r.OUTBOUND_CLICK, 8)}${pad(r.SAVE, 7)}${pad(rate(r), 8)}`);
  }
  L.push("-".repeat(57));
  L.push(`${"TOTAL".padEnd(13)}${pad(tot.pins, 5)}${pad(tot.IMPRESSION, 8)}${pad(tot.PIN_CLICK, 8)}${pad(tot.OUTBOUND_CLICK, 8)}${pad(tot.SAVE, 7)}${pad(rate(tot), 8)}`);
  L.push("");
  L.push(`out% = outbound clicks ÷ impressions — the click-through-to-site rate (the lever to optimize).`);
  L.push(`Note: the drip's own pins only; account-wide reach also includes older/manual pins.`);
  return L.join("\n");
}

/** Styled HTML table — inline CSS only (email clients strip <style>). */
function buildHtml(rows: Row[], tot: Agg, start: string, end: string, pinCount: number): string {
  const wrap = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;";
  const th = "padding:8px 12px;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#ffffff;background:#2b2b2b;text-align:right;";
  const thL = th.replace("text-align:right;", "text-align:left;");
  const td = "padding:8px 12px;font-size:14px;text-align:right;border-bottom:1px solid #ececec;font-variant-numeric:tabular-nums;";
  const tdL = td.replace("text-align:right;", "text-align:left;font-weight:600;");
  const cell = (r: Row | Agg, key: Metric) => `<td style="${td}">${num(r[key])}</td>`;

  const bodyRows = rows
    .map((r, i) => {
      const bg = i % 2 ? "background:#fafafa;" : "";
      const label = TYPE_LABEL[r.type] ?? r.type;
      return `<tr style="${bg}">
        <td style="${tdL}${bg}">${label}</td>
        <td style="${td}${bg}">${num(r.pins)}</td>
        ${cell(r, "IMPRESSION")}${cell(r, "PIN_CLICK")}${cell(r, "OUTBOUND_CLICK")}${cell(r, "SAVE")}
        <td style="${td}${bg}font-weight:600;color:#0a66c2;">${rate(r)}</td>
      </tr>`;
    })
    .join("");

  const totRow = `<tr>
    <td style="${tdL}border-top:2px solid #2b2b2b;border-bottom:none;">Total</td>
    <td style="${td}border-top:2px solid #2b2b2b;border-bottom:none;font-weight:700;">${num(tot.pins)}</td>
    <td style="${td}border-top:2px solid #2b2b2b;border-bottom:none;font-weight:700;">${num(tot.IMPRESSION)}</td>
    <td style="${td}border-top:2px solid #2b2b2b;border-bottom:none;font-weight:700;">${num(tot.PIN_CLICK)}</td>
    <td style="${td}border-top:2px solid #2b2b2b;border-bottom:none;font-weight:700;">${num(tot.OUTBOUND_CLICK)}</td>
    <td style="${td}border-top:2px solid #2b2b2b;border-bottom:none;font-weight:700;">${num(tot.SAVE)}</td>
    <td style="${td}border-top:2px solid #2b2b2b;border-bottom:none;font-weight:700;color:#0a66c2;">${rate(tot)}</td>
  </tr>`;

  return `<div style="${wrap}max-width:640px;margin:0 auto;padding:8px 4px;">
    <h2 style="font-size:18px;margin:0 0 2px;">Pinterest reach by pin type</h2>
    <p style="margin:0 0 16px;color:#666;font-size:13px;">${start} → ${end} · ${pinCount} drip pins</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;border:1px solid #ececec;border-radius:8px;overflow:hidden;">
      <thead><tr>
        <th style="${thL}">Pin type</th>
        <th style="${th}">Pins</th>
        <th style="${th}">Impressions</th>
        <th style="${th}">Pin clicks</th>
        <th style="${th}">Outbound</th>
        <th style="${th}">Saves</th>
        <th style="${th}">Out&nbsp;rate</th>
      </tr></thead>
      <tbody>${bodyRows}${totRow}</tbody>
    </table>
    <p style="margin:16px 0 4px;color:#666;font-size:12px;line-height:1.5;">
      <strong>Out rate</strong> = outbound clicks ÷ impressions — the click-through-to-site rate, the lever to optimize.
    </p>
    <p style="margin:0;color:#999;font-size:12px;line-height:1.5;">
      The drip's own pins only; account-wide reach also includes older/manual pins. PaintColorHQ weekly.
    </p>
  </div>`;
}

async function emailReport(text: string, html: string, window: string): Promise<string> {
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
      html,
      text,
    }),
  });
  if (!res.ok) return `✉️  email failed (${res.status}): ${(await res.text()).slice(0, 160)}`;
  return `✉️  emailed to ${to}`;
}

async function main() {
  const start = arg("start") ?? daysAgo(arg("days") ? Number(arg("days")) : 30);
  const end = arg("end") ?? daysAgo(1); // yesterday — today isn't finalized

  const keyToType = new Map<string, string>(QUEUE.map((p) => [p.key, p.type] as [string, string]));
  const published: Record<string, { pinId?: string; publishedAt?: string }> = JSON.parse(
    fs.readFileSync(PUBLISHED_PATH, "utf8"),
  );
  const pins = Object.entries(published)
    .filter(([, v]) => v.pinId)
    .map(([key, v]) => ({ key, pinId: v.pinId!, type: keyToType.get(key) ?? key.split(/[-_]/)[0] }));

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

  const rows: Row[] = [...byType.entries()]
    .map(([type, a]) => ({ type, ...a }))
    .sort((x, y) => y.IMPRESSION - x.IMPRESSION);
  const tot: Agg = { pins: 0, IMPRESSION: 0, PIN_CLICK: 0, OUTBOUND_CLICK: 0, SAVE: 0 };
  for (const r of rows) { tot.pins += r.pins; for (const m of METRICS) tot[m] += r[m]; }

  const text = buildText(rows, tot, start, end, pins.length) + (failures ? `\n(${failures} pin(s) had no analytics yet.)` : "");
  console.log(text);

  if (EMAIL) {
    const html = buildHtml(rows, tot, start, end, pins.length);
    console.log("\n" + (await emailReport(text, html, `${start} → ${end}`)));
  }
}

main().catch((e) => {
  console.error("Error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
