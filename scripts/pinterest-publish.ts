/**
 * Pinterest publisher — creates pins from the batch definition + local images.
 *
 * Reads scripts/pinterest/batch-may26.ts, matches each pin to its PNG in
 * IMAGE_DIR, base64-encodes it, and POSTs to /v5/pins on the correct board
 * with title / description / UTM link.
 *
 * Requires an OAuth access token with pins:write (run pinterest-auth.ts first).
 * Auto-refreshes the access token on 401 using PINTEREST_REFRESH_TOKEN.
 *
 * A publish log (scripts/pinterest/published-may26.json) records pin id ->
 * Pinterest pin id so re-runs never double-post.
 *
 * Usage:
 *   npx tsx scripts/pinterest-publish.ts --dry-run     # validate, no POST
 *   npx tsx scripts/pinterest-publish.ts --only=1,3    # publish pins 1 and 3
 *   npx tsx scripts/pinterest-publish.ts               # publish all unpublished
 */
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import { BATCH, BOARD_IDS, IMAGE_DIR, type PinSpec } from "./pinterest/batch-may26.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.resolve(__dirname, "../.env.local");
const LOG_PATH = path.resolve(__dirname, "pinterest/published-may26.json");
dotenv.config({ path: ENV_PATH });

const APP_ID = process.env.PINTEREST_APP_ID!;
const APP_SECRET = process.env.PINTEREST_APP_SECRET_KEY!;
const API = "https://api.pinterest.com/v5";

// ---- CLI args ----
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const onlyArg = args.find((a) => a.startsWith("--only="));
const onlyIds = onlyArg
  ? new Set(onlyArg.replace("--only=", "").split(",").map((n) => parseInt(n, 10)))
  : null;

// ---- env + log helpers ----
function upsertEnv(updates: Record<string, string>) {
  let lines = fs.readFileSync(ENV_PATH, "utf8").split("\n");
  for (const [key, value] of Object.entries(updates)) {
    const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
    const line = `${key}=${value}`;
    if (idx >= 0) lines[idx] = line;
    else lines.push(line);
  }
  fs.writeFileSync(ENV_PATH, lines.join("\n"));
}

type PublishLog = Record<string, { pinId: string; publishedAt: string }>;
function loadLog(): PublishLog {
  try {
    return JSON.parse(fs.readFileSync(LOG_PATH, "utf8"));
  } catch {
    return {};
  }
}
function saveLog(log: PublishLog) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2) + "\n");
}

let accessToken = process.env.PINTEREST_ACCESS_TOKEN!;

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
  console.log("   ↻ refreshed access token");
}

async function pinterest(pathname: string, init: RequestInit, retry = true): Promise<any> {
  const res = await fetch(`${API}${pathname}`, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  // Only refresh on an expired/invalid token — NOT on a scope error (also 401).
  const isScopeError = typeof data?.message === "string" && /scope|Missing:/i.test(data.message);
  if (res.status === 401 && retry && !isScopeError) {
    await refreshAccessToken();
    return pinterest(pathname, init, false);
  }
  if (!res.ok) throw new Error(`${res.status} ${pathname}: ${JSON.stringify(data)}`);
  return data;
}

function imagePayload(pin: PinSpec) {
  const file = path.join(IMAGE_DIR, pin.image);
  if (!fs.existsSync(file)) throw new Error(`Image not found: ${file}`);
  const buf = fs.readFileSync(file);
  // Sniff content type from magic bytes — the file extension can lie
  // (gemini-3-pro-image returns JPEG even when we save as .png).
  let contentType = "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) contentType = "image/jpeg";
  else if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) contentType = "image/png";
  return { source_type: "image_base64" as const, content_type: contentType, data: buf.toString("base64") };
}

async function publishPin(pin: PinSpec, log: PublishLog) {
  const tag = `#${pin.id} ${pin.name}`;
  if (log[pin.id]) {
    console.log(`⏭️  ${tag} — already published (pin ${log[pin.id].pinId})`);
    return;
  }
  const boardId = BOARD_IDS[pin.board];
  const media = imagePayload(pin); // validates file exists + reads bytes

  if (DRY_RUN) {
    console.log(`🧪 ${tag}`);
    console.log(`     board:  ${pin.board} (${boardId})`);
    console.log(`     title:  ${pin.title}  [${pin.title.length} chars]`);
    console.log(`     link:   ${pin.link}`);
    console.log(`     image:  ${pin.image} (${media.content_type}, ${(media.data.length / 1.37 / 1024 / 1024).toFixed(1)}MB)`);
    return;
  }

  const result = await pinterest("/pins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      board_id: boardId,
      title: pin.title,
      description: pin.description,
      link: pin.link,
      media_source: media,
    }),
  });
  log[pin.id] = { pinId: result.id, publishedAt: new Date().toISOString() };
  saveLog(log);
  console.log(`✅ ${tag} → pin ${result.id} on ${pin.board}`);
}

async function main() {
  const log = loadLog();
  const targets = BATCH.filter((p) => (onlyIds ? onlyIds.has(p.id) : true));
  console.log(
    `${DRY_RUN ? "DRY RUN — " : ""}Publishing ${targets.length} pin(s)${onlyIds ? ` (--only=${[...onlyIds].join(",")})` : ""}\n`
  );
  for (const pin of targets) {
    try {
      await publishPin(pin, log);
    } catch (e) {
      console.error(`❌ #${pin.id} ${pin.name}: ${e instanceof Error ? e.message : e}`);
    }
    // gentle spacing to stay clear of rate limits
    if (!DRY_RUN) await new Promise((r) => setTimeout(r, 2500));
  }
  console.log("\nDone.");
}

main();
