/**
 * Pinterest drip PREVIEW — see exactly what the drip will post before it posts.
 *
 * Forward-simulates the real selectDailyMix() for the next N days (same quota
 * config + cooldown the live drip uses), then renders a visual contact sheet so
 * you can catch a wrong style / wrong mix / wrong type BEFORE it's live — instead
 * of discovering it on the Pinterest feed days later.
 *
 * Thumbnails are the REAL pin images: local room-scene/comparison PNGs from
 * IMAGE_DIR, and live /api/pin & /api/pin/palette & /api/pin/blog URLs.
 *
 *   npx tsx scripts/pinterest-preview.ts            # next 7 days
 *   npx tsx scripts/pinterest-preview.ts --days=14  # next 14 days
 *   # then: open scripts/pinterest/preview.html
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  QUEUE,
  IMAGE_DIR,
  selectDailyMix,
  quotasForWeekday,
  DRIP_CONFIG,
  type PinSpec,
  type PublishedLog,
} from "./pinterest/queue.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_PATH = path.resolve(__dirname, "pinterest/published.json");
const OUT_PATH = path.resolve(__dirname, "pinterest/preview.html");

const daysArg = process.argv.find((a) => a.startsWith("--days="));
const DAYS = daysArg ? Math.max(1, parseInt(daysArg.replace("--days=", ""), 10) || 7) : 7;

const WEEKDAY = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TYPE_COLOR: Record<string, string> = {
  swatch: "#0d9488",
  palette: "#7c3aed",
  guide: "#6b7280",
  comparison: "#ea580c",
};

function loadLog(): PublishedLog {
  try {
    return JSON.parse(fs.readFileSync(LOG_PATH, "utf8"));
  } catch {
    return {};
  }
}

/** Real pin image: live URL for programmatic pins, local file for curated. */
function imgSrc(p: PinSpec): { src: string; missing: boolean } {
  if (p.imageUrl) return { src: p.imageUrl, missing: false };
  const file = path.join(IMAGE_DIR, p.image);
  return { src: `file://${encodeURI(file)}`, missing: !fs.existsSync(file) };
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

interface DayPlan {
  date: string;
  weekday: number;
  quotas: Record<string, number>;
  pins: PinSpec[];
}

// ---- forward simulation ----
const sim: PublishedLog = { ...loadLog() }; // grows as the sim "posts" each day
const start = new Date();
start.setHours(10, 0, 0, 0); // drip fires ~10:00 local
const plan: DayPlan[] = [];
for (let i = 0; i < DAYS; i++) {
  const d = new Date(start.getTime() + i * 86400_000);
  const weekday = ((d.getDay() + 6) % 7) + 1; // 1=Mon … 7=Sun
  const quotas = quotasForWeekday(DRIP_CONFIG, weekday) as Record<string, number>;
  const pins = selectDailyMix(QUEUE, sim, quotas, d.getTime(), DRIP_CONFIG.cooldownDays);
  for (const p of pins) sim[p.key] = { pinId: "sim", publishedAt: d.toISOString() };
  plan.push({ date: d.toISOString().slice(0, 10), weekday, quotas, pins });
}

// ---- type tally across the window ----
const tally: Record<string, number> = {};
let total = 0;
for (const day of plan) for (const p of day.pins) { tally[p.type] = (tally[p.type] ?? 0) + 1; total++; }
const tallyStr = Object.entries(tally)
  .map(([t, n]) => `<b style="color:${TYPE_COLOR[t] ?? "#333"}">${n} ${t}</b>`)
  .join(" · ") || "<i>nothing scheduled</i>";

// ---- render ----
const cards = (pins: PinSpec[]) =>
  pins.length === 0
    ? `<div class="empty">— nothing to post —</div>`
    : pins
        .map((p) => {
          const { src, missing } = imgSrc(p);
          const badge = `<span class="badge" style="background:${TYPE_COLOR[p.type] ?? "#333"}">${p.type}</span>`;
          const thumb = missing
            ? `<div class="thumb miss">image not generated<br><code>${esc(p.image)}</code></div>`
            : `<img class="thumb" loading="lazy" src="${esc(src)}" alt="${esc(p.name)}">`;
          return `<div class="card">${thumb}<div class="meta">${badge}<div class="board">${esc(p.board)}</div><div class="title">${esc(p.title || p.name)}</div></div></div>`;
        })
        .join("");

const days = plan
  .map(
    (day) => `<section class="day">
    <h2>${day.date} <span class="wd">${WEEKDAY[day.weekday]}</span>
      <span class="quota">quota: ${esc(JSON.stringify(day.quotas))}</span></h2>
    <div class="grid">${cards(day.pins)}</div>
  </section>`,
  )
  .join("");

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Pinterest drip preview — next ${DAYS} days</title>
<style>
  body{font:14px/1.4 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;margin:0;background:#f6f6f7;color:#111}
  header{position:sticky;top:0;background:#fff;border-bottom:1px solid #e5e5e5;padding:16px 24px;z-index:1}
  header h1{margin:0 0 4px;font-size:18px}
  .summary{color:#444}
  section.day{padding:16px 24px;border-bottom:1px solid #ececec}
  section.day h2{font-size:15px;margin:0 0 12px;display:flex;gap:12px;align-items:baseline}
  .wd{color:#888;font-weight:600}
  .quota{color:#aaa;font-weight:400;font-size:12px;margin-left:auto}
  .grid{display:flex;flex-wrap:wrap;gap:14px}
  .card{width:150px}
  .thumb{width:150px;height:225px;object-fit:cover;border-radius:8px;background:#e9e9ea;display:block;box-shadow:0 1px 4px rgba(0,0,0,.12)}
  .thumb.miss{display:flex;align-items:center;justify-content:center;text-align:center;color:#b91c1c;font-size:11px;padding:8px;box-sizing:border-box}
  .meta{margin-top:6px}
  .badge{display:inline-block;color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding:2px 7px;border-radius:99px}
  .board{color:#888;font-size:11px;margin-top:3px}
  .title{font-size:12px;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .empty{color:#999;font-style:italic;padding:8px 0}
</style></head><body>
<header><h1>Pinterest drip preview — next ${DAYS} days (${total} pins)</h1>
<div class="summary">Mix: ${tallyStr}</div></header>
${days}
</body></html>`;

fs.writeFileSync(OUT_PATH, html);
console.log(`Previewed ${total} pins across ${DAYS} days. Mix:`, tally);
const missing = plan.flatMap((d) => d.pins).filter((p) => imgSrc(p).missing);
if (missing.length) console.warn(`⚠️  ${missing.length} curated image(s) not generated yet:`, missing.map((p) => p.key).join(", "));
console.log(`\nOpen the contact sheet:\n  open "${OUT_PATH}"`);
