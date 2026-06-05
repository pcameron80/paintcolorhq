/**
 * Facebook Page publisher — cross-posts the same approved queue to the
 * Paint Color HQ Page. Sibling of instagram-publish.ts; shares all caption /
 * eligibility logic via social-content.ts.
 *
 * Unlike Instagram, Facebook posts CAN carry a clickable link, so the caption
 * includes the (FB-attributed) destination URL — this lane can actually drive
 * traffic, not just impressions.
 *
 * Publish: mint a Page access token from the Business system-user token, then
 *   POST /{PAGE_ID}/photos  (url = the 4:5 pin image, message = caption)
 * (A system-user token can't post to a Page directly — Graph returns #200 — but
 *  the Page token derived from it can.)
 *
 * Separate log (scripts/facebook/fb-published.json) so a pin can post to
 * Pinterest, Instagram, AND Facebook independently without double-posting.
 *
 * Env (.env.local, untracked):
 *   META_PAGE_ACCESS_TOKEN   system-user token with pages_manage_posts
 *   META_PAGE_ID             the Facebook Page id
 *   META_GRAPH_VERSION       optional, defaults to v23.0
 *
 * Usage:
 *   npx tsx scripts/facebook-publish.ts --dry-run --drip=1
 *   npx tsx scripts/facebook-publish.ts --drip=1
 *   npx tsx scripts/facebook-publish.ts --only=<queue-key>
 */
import * as path from "path";
import * as fs from "fs";
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import { QUEUE, selectForDrip, unpublished, type PinSpec, type PublishedLog } from "./pinterest/queue.ts";
import { eligible, imageUrl4x5, buildCaption } from "./social-content.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.resolve(__dirname, "../.env.local");
const LOG_PATH = path.resolve(__dirname, "facebook/fb-published.json");
dotenv.config({ path: ENV_PATH });

const TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.META_PAGE_ID;
const VERSION = process.env.META_GRAPH_VERSION || "v23.0";
const GRAPH = `https://graph.facebook.com/${VERSION}`;

/** macOS local notification — best-effort, never throws. */
function notify(message: string) {
  execFile(
    "osascript",
    ["-e", `display notification "${message.replace(/"/g, "'")}" with title "PaintColorHQ"`],
    () => {},
  );
}

// ---- CLI args ----
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const dripArg = args.find((a) => a.startsWith("--drip="));
const DRIP = dripArg ? Math.max(1, parseInt(dripArg.replace("--drip=", ""), 10) || 1) : null;
const onlyArg = args.find((a) => a.startsWith("--only="));
const onlyKeys = onlyArg ? new Set(onlyArg.replace("--only=", "").split(",")) : null;

// ---- log helpers ----
type FbPublishedLog = Record<string, { postId: string; publishedAt: string }>;
function loadLog(): FbPublishedLog {
  try {
    return JSON.parse(fs.readFileSync(LOG_PATH, "utf8"));
  } catch {
    return {};
  }
}
function saveLog(log: FbPublishedLog) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2) + "\n");
}

/** A system-user token can't post to a Page; derive the Page token once. */
let pageToken: string | null = null;
async function getPageToken(): Promise<string> {
  if (pageToken) return pageToken;
  const res = await fetch(`${GRAPH}/${PAGE_ID}?fields=access_token&access_token=${TOKEN}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`Could not get Page token: ${JSON.stringify(data?.error ?? data)}`);
  }
  pageToken = data.access_token as string;
  return pageToken;
}

async function publishOne(pin: PinSpec, log: FbPublishedLog) {
  const tag = `${pin.key} ${pin.name}`;
  if (log[pin.key]) {
    console.log(`⏭️  ${tag} — already posted (post ${log[pin.key].postId})`);
    return;
  }
  const imageUrl = imageUrl4x5(pin);
  const message = buildCaption(pin, "facebook");

  if (DRY_RUN) {
    console.log(`🧪 [${pin.type}] ${tag}  [${message.length} chars]`);
    console.log(`     image: ${imageUrl}`);
    console.log(message.split("\n").map((l) => `     | ${l}`).join("\n"));
    console.log("");
    return;
  }

  const token = await getPageToken();
  const body = new URLSearchParams({ url: imageUrl, message, access_token: token });
  const res = await fetch(`${GRAPH}/${PAGE_ID}/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(data?.error ?? data)}`);

  log[pin.key] = { postId: data.post_id ?? data.id, publishedAt: new Date().toISOString() };
  saveLog(log);
  console.log(`✅ ${tag} → post ${log[pin.key].postId}`);
}

async function main() {
  if (!TOKEN || !PAGE_ID) {
    throw new Error("Missing META_PAGE_ACCESS_TOKEN or META_PAGE_ID in .env.local");
  }
  const log = loadLog();
  const pool = QUEUE.filter(eligible);

  let targets: PinSpec[];
  if (DRIP) {
    targets = selectForDrip(pool, log as unknown as PublishedLog, DRIP);
    if (targets.length === 0) {
      console.log("Drip: no unpublished FB-eligible pins left.");
      if (!DRY_RUN) notify("Facebook queue empty — stock more pins with Claude.");
      return;
    }
  } else if (onlyKeys) {
    targets = pool.filter((p) => onlyKeys.has(p.key));
  } else {
    targets = unpublished(pool, log as unknown as PublishedLog);
  }

  console.log(
    `${DRY_RUN ? "DRY RUN — " : ""}Posting ${targets.length} to Facebook` +
      `${DRIP ? " (drip, variety rotation)" : onlyKeys ? ` (--only)` : " (all unpublished)"}\n`,
  );

  for (const pin of targets) {
    try {
      await publishOne(pin, log);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`❌ ${pin.key} ${pin.name}: ${msg}`);
      if (!DRY_RUN && /OAuth|token|\b190\b|\b200\b|permission/i.test(msg)) {
        notify("Facebook auth failed — check the Meta system-user token / pages_manage_posts.");
      }
    }
    if (!DRY_RUN) await new Promise((r) => setTimeout(r, 3000));
  }
  console.log("\nDone.");
}

main();
