/**
 * Pinterest reach by PIN TYPE — across ALL owned pins on the account.
 *
 * Enumerates every owned pin (GET /v5/pins, paginated — old + manual + drip),
 * buckets each by its BOARD (boards map 1:1 to our types: swatch / palette /
 * guide / comparison; anything else → "other"), pulls per-pin analytics, and
 * aggregates impressions / pin-clicks / outbound-clicks / saves by type. Also
 * flags how many pins in each type came from the automated drip (published.json)
 * and the drip's share of impressions — so you see total account reach AND the
 * drip-tuning signal in one table.
 *
 * (Third-party REPINS can't be included — Pinterest only exposes analytics for
 * pins the account owns.)
 *
 * This is the Pinterest-reach view the cloud Monday GA4 digest can't produce.
 *
 * Usage:
 *   npx tsx scripts/pinterest/analytics-by-type.ts            # last 30 days → stdout
 *   npx tsx scripts/pinterest/analytics-by-type.ts --days=7
 *   npx tsx scripts/pinterest/analytics-by-type.ts --start=2026-05-27 --end=2026-06-02
 *   npx tsx scripts/pinterest/analytics-by-type.ts --days=7 --email   # styled HTML via Resend
 *
 * --email sends through Resend IF RESEND_API_KEY is set in .env.local (to
 * REPORT_EMAIL_TO, default philip@theorphanshands.org); otherwise it's a no-op
 * and the launchd wrapper still writes the report file + a macOS notification.
 */
import "../blog/load-env.ts"; // loads .env.local before anything reads process.env
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { BOARD_IDS, TYPE_FOR_BOARD } from "./queue.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, "../../.env.local");
const PUBLISHED_PATH = path.resolve(__dirname, "published.json");
const API = "https://api.pinterest.com/v5";
const APP_ID = process.env.PINTEREST_APP_ID!;
const APP_SECRET = process.env.PINTEREST_APP_SECRET_KEY!;
let accessToken = process.env.PINTEREST_ACCESS_TOKEN!;

const METRICS = ["IMPRESSION", "PIN_CLICK", "OUTBOUND_CLICK", "SAVE"] as const;
type Metric = (typeof METRICS)[number];

const TYPE_LABEL: Record<string, string> = {
  swatch: "Swatch",
  guide: "Guide / blog",
  palette: "Room scene",
  comparison: "Comparison",
  other: "Other / older",
};

// boardId → our pin type (invert BOARD_IDS, then TYPE_FOR_BOARD by board name).
const BOARD_ID_TO_TYPE: Record<string, string> = Object.fromEntries(
  Object.entries(BOARD_IDS).map(([name, id]) => [id, TYPE_FOR_BOARD[name as keyof typeof TYPE_FOR_BOARD]]),
);

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Pinterest JSON shapes vary by endpoint
async function pinterest(pathname: string, retry = true): Promise<any> {
  const res = await fetch(`${API}${pathname}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  // Rate limited — wait (honor Retry-After) and retry a few times.
  if (res.status === 429 && retry) {
    const wait = Number(res.headers.get("retry-after")) * 1000 || 3000;
    await sleep(wait);
    return pinterest(pathname, true);
  }
  const data = await res.json().catch(() => ({}));
  const isScopeError = typeof data?.message === "string" && /scope|Missing:/i.test(data.message);
  if (res.status === 401 && retry && !isScopeError) {
    await refreshAccessToken();
    return pinterest(pathname, false);
  }
  if (!res.ok) throw new Error(`${res.status} ${pathname}: ${JSON.stringify(data).slice(0, 200)}`);
  return data;
}

/** Every owned pin: id + board_id, following pagination bookmarks. */
async function fetchOwnedPins(): Promise<{ id: string; boardId: string }[]> {
  const out: { id: string; boardId: string }[] = [];
  let bookmark = "";
  do {
    const qs = `page_size=100&pin_fields=id,board_id${bookmark ? `&bookmark=${encodeURIComponent(bookmark)}` : ""}`;
    const data = await pinterest(`/pins?${qs}`);
    for (const it of data.items ?? []) out.push({ id: it.id, boardId: it.board_id ?? "" });
    bookmark = data.bookmark ?? "";
  } while (bookmark);
  return out;
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

interface Agg { pins: number; dripPins: number; IMPRESSION: number; PIN_CLICK: number; OUTBOUND_CLICK: number; SAVE: number; dripImpr: number }
interface Row extends Agg { type: string }

const num = (n: number) => n.toLocaleString("en-US");
const rate = (a: Agg) => (a.IMPRESSION ? ((a.OUTBOUND_CLICK / a.IMPRESSION) * 100).toFixed(2) : "0.00") + "%";

/** Plain-text table — terminal + saved report file. */
function buildText(rows: Row[], tot: Agg, start: string, end: string): string {
  const L: string[] = [];
  const pad = (v: string | number, n: number) => String(v).padStart(n);
  L.push(`Pinterest reach by pin type — ${start} → ${end}`);
  L.push(`${tot.pins} owned pins (${tot.dripPins} from the drip)`);
  L.push("");
  L.push(`${"type".padEnd(15)}${pad("pins", 5)}${pad("drip", 5)}${pad("impr", 8)}${pad("pinClk", 7)}${pad("outClk", 7)}${pad("saves", 6)}${pad("out%", 7)}`);
  L.push("-".repeat(60));
  for (const r of rows) {
    L.push(`${(TYPE_LABEL[r.type] ?? r.type).padEnd(15)}${pad(r.pins, 5)}${pad(r.dripPins, 5)}${pad(num(r.IMPRESSION), 8)}${pad(num(r.PIN_CLICK), 7)}${pad(num(r.OUTBOUND_CLICK), 7)}${pad(num(r.SAVE), 6)}${pad(rate(r), 7)}`);
  }
  L.push("-".repeat(60));
  L.push(`${"TOTAL".padEnd(15)}${pad(tot.pins, 5)}${pad(tot.dripPins, 5)}${pad(num(tot.IMPRESSION), 8)}${pad(num(tot.PIN_CLICK), 7)}${pad(num(tot.OUTBOUND_CLICK), 7)}${pad(num(tot.SAVE), 6)}${pad(rate(tot), 7)}`);
  const share = tot.IMPRESSION ? ((tot.dripImpr / tot.IMPRESSION) * 100).toFixed(1) : "0.0";
  L.push("");
  L.push(`Drip pins account for ${share}% of impressions (${num(tot.dripImpr)} of ${num(tot.IMPRESSION)}); the rest is older/manual pins.`);
  L.push(`out% = outbound clicks ÷ impressions — the click-through-to-site rate (the lever to optimize).`);
  L.push(`Excludes third-party repins (analytics only available for owned pins).`);
  return L.join("\n");
}

/** Styled HTML table — inline CSS only (email clients strip <style>). */
function buildHtml(rows: Row[], tot: Agg, start: string, end: string): string {
  const wrap = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;";
  const th = "padding:8px 10px;font-size:11px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:#ffffff;background:#2b2b2b;text-align:right;";
  const thL = th.replace("text-align:right;", "text-align:left;");
  const td = "padding:8px 10px;font-size:14px;text-align:right;border-bottom:1px solid #ececec;font-variant-numeric:tabular-nums;";
  const tdL = "padding:8px 10px;font-size:14px;text-align:left;font-weight:600;border-bottom:1px solid #ececec;";
  const tot_ = "border-top:2px solid #2b2b2b;border-bottom:none;font-weight:700;";

  const row = (r: Row, i: number) => {
    const bg = i % 2 ? "background:#fafafa;" : "";
    const pinsCell = r.dripPins
      ? `${num(r.pins)} <span style="color:#999;font-size:12px;">(${r.dripPins} drip)</span>`
      : num(r.pins);
    return `<tr>
      <td style="${tdL}${bg}">${TYPE_LABEL[r.type] ?? r.type}</td>
      <td style="${td}${bg}">${pinsCell}</td>
      <td style="${td}${bg}">${num(r.IMPRESSION)}</td>
      <td style="${td}${bg}">${num(r.PIN_CLICK)}</td>
      <td style="${td}${bg}">${num(r.OUTBOUND_CLICK)}</td>
      <td style="${td}${bg}">${num(r.SAVE)}</td>
      <td style="${td}${bg}font-weight:600;color:#0a66c2;">${rate(r)}</td>
    </tr>`;
  };

  const totRow = `<tr>
    <td style="${tdL}${tot_}">Total</td>
    <td style="${td}${tot_}">${num(tot.pins)}${tot.dripPins ? ` <span style="color:#bbb;font-size:12px;">(${tot.dripPins} drip)</span>` : ""}</td>
    <td style="${td}${tot_}">${num(tot.IMPRESSION)}</td>
    <td style="${td}${tot_}">${num(tot.PIN_CLICK)}</td>
    <td style="${td}${tot_}">${num(tot.OUTBOUND_CLICK)}</td>
    <td style="${td}${tot_}">${num(tot.SAVE)}</td>
    <td style="${td}${tot_}color:#0a66c2;">${rate(tot)}</td>
  </tr>`;

  const share = tot.IMPRESSION ? ((tot.dripImpr / tot.IMPRESSION) * 100).toFixed(1) : "0.0";

  return `<div style="${wrap}max-width:680px;margin:0 auto;padding:8px 4px;">
    <h2 style="font-size:18px;margin:0 0 2px;">Pinterest reach by pin type</h2>
    <p style="margin:0 0 16px;color:#666;font-size:13px;">${start} → ${end} · ${num(tot.pins)} owned pins (${tot.dripPins} from the drip)</p>
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
      <tbody>${rows.map(row).join("")}${totRow}</tbody>
    </table>
    <p style="margin:16px 0 4px;color:#444;font-size:12px;line-height:1.5;">
      Drip pins account for <strong>${share}%</strong> of impressions; the rest is older / manual pins.
    </p>
    <p style="margin:0;color:#999;font-size:12px;line-height:1.5;">
      <strong>Out rate</strong> = outbound clicks ÷ impressions (click-through-to-site, the lever to optimize).
      Excludes third-party repins — analytics are only available for owned pins. PaintColorHQ weekly.
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

  const dripIds = new Set<string>(
    Object.values(JSON.parse(fs.readFileSync(PUBLISHED_PATH, "utf8")) as Record<string, { pinId?: string }>)
      .map((v) => v.pinId)
      .filter(Boolean) as string[],
  );

  const owned = await fetchOwnedPins();
  console.error(`Fetching analytics for ${owned.length} owned pins…`);

  const byType = new Map<string, Agg>();
  let failures = 0;
  let firstError = "";
  for (const pin of owned) {
    let s: Record<Metric, number>;
    try {
      s = await pinSummary(pin.id, start, end);
      await sleep(120); // gentle throttle — stay under Pinterest's per-pin rate limit
    } catch (e) {
      failures++;
      if (!firstError) firstError = e instanceof Error ? e.message : String(e);
      continue;
    }
    const type = BOARD_ID_TO_TYPE[pin.boardId] ?? "other";
    const a = byType.get(type) ?? { pins: 0, dripPins: 0, IMPRESSION: 0, PIN_CLICK: 0, OUTBOUND_CLICK: 0, SAVE: 0, dripImpr: 0 };
    a.pins += 1;
    for (const m of METRICS) a[m] += s[m];
    if (dripIds.has(pin.id)) {
      a.dripPins += 1;
      a.dripImpr += s.IMPRESSION;
    }
    byType.set(type, a);
  }

  const rows: Row[] = [...byType.entries()]
    .map(([type, a]) => ({ type, ...a }))
    .sort((x, y) => y.IMPRESSION - x.IMPRESSION);
  const tot: Agg = { pins: 0, dripPins: 0, IMPRESSION: 0, PIN_CLICK: 0, OUTBOUND_CLICK: 0, SAVE: 0, dripImpr: 0 };
  for (const r of rows) {
    tot.pins += r.pins; tot.dripPins += r.dripPins; tot.dripImpr += r.dripImpr;
    for (const m of METRICS) tot[m] += r[m];
  }

  if (failures) console.error(`${failures} pin(s) failed${firstError ? ` — first: ${firstError}` : ""}`);
  const text = buildText(rows, tot, start, end) + (failures ? `\n(${failures} pin(s) had no analytics for this window.)` : "");
  console.log(text);

  if (EMAIL) {
    const html = buildHtml(rows, tot, start, end);
    console.log("\n" + (await emailReport(text, html, `${start} → ${end}`)));
  }
}

main().catch((e) => {
  console.error("Error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
