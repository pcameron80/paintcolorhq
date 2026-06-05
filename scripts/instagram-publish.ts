/**
 * Instagram publisher — cross-posts the same approved queue to @paintcolorhq.
 *
 * Reuses the Pinterest QUEUE and its variety-rotation selection, but only the
 * lanes whose image is a PUBLIC URL (swatch + guide, served by /api/pin*).
 * Instagram's Content Publishing API needs a public image_url — it can't take
 * a base64 upload — so the curated local-file pins (palette/comparison) are not
 * IG-eligible yet. Each eligible image is requested at ?ar=4:5 (1080×1350)
 * because IG rejects the 2:3 Pinterest ratio.
 *
 * Publish is a 2-step container flow against the Graph API:
 *   1. POST /{IG_ID}/media        (image_url + caption)  -> creation id
 *   2. poll  /{creation_id}?fields=status_code           until FINISHED
 *   3. POST /{IG_ID}/media_publish (creation_id)          -> media id
 *
 * Auth is a never-expiring Business system-user token (no refresh needed).
 * A separate log (scripts/instagram/ig-published.json) keyed by queue key means
 * a pin can post to both Pinterest and Instagram, and re-runs never double-post.
 *
 * Env (.env.local, untracked):
 *   META_PAGE_ACCESS_TOKEN   system-user token with instagram_content_publish
 *   IG_BUSINESS_ACCOUNT_ID   the IG Business account id (17841426339714639)
 *   META_GRAPH_VERSION       optional, defaults to v23.0
 *
 * Usage:
 *   npx tsx scripts/instagram-publish.ts --dry-run --drip=1   # show selection
 *   npx tsx scripts/instagram-publish.ts --drip=1             # post next (variety rotation)
 *   npx tsx scripts/instagram-publish.ts --only=swatch-sherwin-williams-agreeable-gray-7029
 */
import * as path from "path";
import * as fs from "fs";
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import { QUEUE, selectForDrip, unpublished, type PinSpec, type PublishedLog } from "./pinterest/queue.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.resolve(__dirname, "../.env.local");
const LOG_PATH = path.resolve(__dirname, "instagram/ig-published.json");
dotenv.config({ path: ENV_PATH });

const TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
const IG_ID = process.env.IG_BUSINESS_ACCOUNT_ID;
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

// ---- IG-eligible lanes ----
/** Only pins whose image is a public /api/pin* URL can be cross-posted to IG. */
function igEligible(p: PinSpec): boolean {
  return Boolean(p.imageUrl && p.imageUrl.includes("/api/pin"));
}

/** Force the Instagram 4:5 render of a /api/pin* image (it already has a query). */
function igImageUrl(p: PinSpec): string {
  return `${p.imageUrl}&ar=4:5`;
}

/**
 * LRV → plain-language character, in the site's no-raw-numbers voice. Gives each
 * swatch caption a warm, human line instead of a data dump.
 */
function characterNoun(lrv: number | null, family: string): string {
  // High-LRV warm families (yellow/orange/red/brown) are off-whites & creams in
  // practice — Alabaster is family "yellow" but reads as a warm white. Don't
  // call those by their underlying family; it undercuts the data we show.
  const warm = ["yellow", "orange", "red", "brown", "gold", "beige", "tan"];
  if (lrv != null && lrv >= 73 && warm.includes(family)) return "warm white";
  if (lrv != null && lrv >= 80 && ["gray", "neutral", "white", "", "color"].includes(family)) {
    return "soft white";
  }
  return family && !["color", "guide", "swatch"].includes(family) ? family : "shade";
}

function colorCharacter(lrv: number | null, family: string): string {
  const f = characterNoun(lrv, family);
  if (lrv == null) return `a beautiful ${f}`;
  if (lrv >= 70) return `a light, airy ${f}`;
  if (lrv >= 55) return `a soft, versatile ${f}`;
  if (lrv >= 40) return `a warm mid-tone ${f}`;
  if (lrv >= 25) return `a rich, grounded ${f}`;
  return `a deep, dramatic ${f}`;
}

function hashtagsFor(p: PinSpec): string {
  const generic = ["paintcolors", "paint", "interiordesign", "homedecor", "homeimprovement", "colorinspiration"];
  const themeTag = (p.theme || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  const skip = new Set(["", "color", "swatch", "guide", "paint"]);
  const tags = [...generic];
  if (!skip.has(themeTag)) tags.push(`${themeTag}paint`);
  return tags.map((t) => `#${t}`).join(" ");
}

/**
 * Build the IG caption around the site's real arc — discover the color you love,
 * see it in your room, find where to buy it. Never "match across brands."
 */
function buildCaption(p: PinSpec): string {
  let lead: string;
  let body: string;
  let cta: string;
  if (p.type === "swatch") {
    const params = new URL(p.imageUrl!).searchParams;
    const name = params.get("name") ?? p.name;
    const code = params.get("code") ?? "";
    const lrvRaw = params.get("lrv");
    const lrv = lrvRaw ? parseInt(lrvRaw, 10) : null;
    const family = params.get("family") ?? p.theme;
    lead = [params.get("brand") ?? "", name, code].filter(Boolean).join(" ");
    const character = colorCharacter(lrv, family);
    body = `${character.charAt(0).toUpperCase()}${character.slice(1)}${lrv != null ? ` (LRV ${lrv})` : ""}.`;
    cta = "✨ See it in a real room and find the best place to buy it 👇\npaintcolorhq.com (link in bio)";
  } else {
    // guide (or other): the post title + excerpt already read as prose.
    lead = p.name;
    body = p.description;
    cta = "✨ Discover the colors, picture them in your space, and find where to buy 👇\npaintcolorhq.com (link in bio)";
  }
  return [lead, "", body, "", cta, "", hashtagsFor(p)].join("\n");
}

// ---- log helpers ----
type IgPublishedLog = Record<string, { mediaId: string; publishedAt: string }>;
function loadLog(): IgPublishedLog {
  try {
    return JSON.parse(fs.readFileSync(LOG_PATH, "utf8"));
  } catch {
    return {};
  }
}
function saveLog(log: IgPublishedLog) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2) + "\n");
}

// ---- Graph API ----
async function graph(node: string, params: Record<string, string>, method: "GET" | "POST"): Promise<any> {
  const body = new URLSearchParams({ ...params, access_token: TOKEN! });
  const url = method === "GET" ? `${GRAPH}/${node}?${body.toString()}` : `${GRAPH}/${node}`;
  const res = await fetch(url, {
    method,
    ...(method === "POST"
      ? { headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }
      : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${node}: ${JSON.stringify(data?.error ?? data)}`);
  return data;
}

/** Wait for the media container to finish processing the fetched image. */
async function waitForContainer(creationId: string): Promise<void> {
  for (let i = 0; i < 12; i++) {
    const { status_code } = await graph(creationId, { fields: "status_code" }, "GET");
    if (status_code === "FINISHED") return;
    if (status_code === "ERROR" || status_code === "EXPIRED") {
      throw new Error(`container ${status_code}`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("container not FINISHED after ~36s");
}

async function publishOne(pin: PinSpec, log: IgPublishedLog) {
  const tag = `${pin.key} ${pin.name}`;
  if (log[pin.key]) {
    console.log(`⏭️  ${tag} — already posted (media ${log[pin.key].mediaId})`);
    return;
  }
  const imageUrl = igImageUrl(pin);
  const caption = buildCaption(pin);

  if (DRY_RUN) {
    console.log(`🧪 [${pin.type}] ${tag}  [${caption.length} chars]`);
    console.log(`     image: ${imageUrl}`);
    console.log(caption.split("\n").map((l) => `     | ${l}`).join("\n"));
    console.log("");
    return;
  }

  // 1. create container, 2. wait, 3. publish
  const { id: creationId } = await graph(`${IG_ID}/media`, { image_url: imageUrl, caption }, "POST");
  await waitForContainer(creationId);
  const { id: mediaId } = await graph(`${IG_ID}/media_publish`, { creation_id: creationId }, "POST");

  log[pin.key] = { mediaId, publishedAt: new Date().toISOString() };
  saveLog(log);
  console.log(`✅ ${tag} → media ${mediaId}`);
}

async function main() {
  if (!TOKEN || !IG_ID) {
    throw new Error("Missing META_PAGE_ACCESS_TOKEN or IG_BUSINESS_ACCOUNT_ID in .env.local");
  }
  const log = loadLog();
  const eligible = QUEUE.filter(igEligible);

  let targets: PinSpec[];
  if (DRIP) {
    targets = selectForDrip(eligible, log as unknown as PublishedLog, DRIP);
    if (targets.length === 0) {
      console.log("Drip: no unpublished IG-eligible pins left.");
      if (!DRY_RUN) notify("Instagram queue empty — stock more pins with Claude.");
      return;
    }
  } else if (onlyKeys) {
    targets = eligible.filter((p) => onlyKeys.has(p.key));
  } else {
    // No flag: post every unpublished eligible pin (manual backfill).
    targets = unpublished(eligible, log as unknown as PublishedLog);
  }

  console.log(
    `${DRY_RUN ? "DRY RUN — " : ""}Posting ${targets.length} to Instagram` +
      `${DRIP ? " (drip, variety rotation)" : onlyKeys ? ` (--only)` : " (all unpublished)"}\n`,
  );

  for (const pin of targets) {
    try {
      await publishOne(pin, log);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`❌ ${pin.key} ${pin.name}: ${msg}`);
      // The drip runs unattended — surface auth failures so they don't die silently.
      if (!DRY_RUN && /OAuth|token|\b190\b|permission/i.test(msg)) {
        notify("Instagram auth failed — regenerate the Meta system-user token.");
      }
    }
    if (!DRY_RUN) await new Promise((r) => setTimeout(r, 3000));
  }
  console.log("\nDone.");
}

main();
