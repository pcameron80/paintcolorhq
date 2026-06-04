/**
 * Submit NEW blog-post URLs to IndexNow (Bing + Yandex) — TARGETED, never bulk.
 *
 * This is deliberately NOT the whole-sitemap submission: that daily approach was
 * killed for flooding the engines. This tool only ever submits a handful of
 * recently-published blog URLs (IndexNow's actual best practice: notify about
 * NEW/changed URLs), and hard-caps the count so it can't be turned into a flood.
 *
 * Run it after a post goes live (manually, or as the last step of the blog
 * pipeline). Scheduled posts: run it on the day they reveal, or with --days.
 *
 * Usage:
 *   npx tsx scripts/blog/indexnow-submit.ts                       # posts published in the last 2 days
 *   npx tsx scripts/blog/indexnow-submit.ts --days=7
 *   npx tsx scripts/blog/indexnow-submit.ts --slug=best-valspar-paint-colors,best-ppg-paint-colors
 *   npx tsx scripts/blog/indexnow-submit.ts --dry                 # print URLs, don't submit
 */
import { getAllPosts } from "../../src/lib/blog-posts.tsx";

const BASE = "https://www.paintcolorhq.com";
const HOST = "www.paintcolorhq.com";
// Public IndexNow key (also hosted at /{KEY}.txt) — same one /api/cron/indexnow uses.
const KEY = "a28e7cd07d004d4b94cfcd6bc2129bda";
const KEY_LOCATION = `${BASE}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS = 25; // flood guard — this tool is for new posts, not bulk re-submission

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
function arg(name: string): string | undefined {
  return args.find((a) => a.startsWith(`--${name}=`))?.replace(`--${name}=`, "");
}

async function main() {
  const slugArg = arg("slug");
  let slugs: string[];

  if (slugArg) {
    slugs = slugArg.split(",").map((s) => s.trim()).filter(Boolean);
  } else {
    const days = arg("days") ? Number(arg("days")) : 2;
    const cutoff = Date.now() - days * 86_400_000;
    // getAllPosts() already excludes future-dated (not-yet-live) posts.
    slugs = getAllPosts()
      .filter((p) => new Date(p.date).getTime() >= cutoff)
      .map((p) => p.slug);
  }

  if (slugs.length === 0) {
    console.log("No newly-published posts to submit (use --slug or a larger --days).");
    return;
  }
  if (slugs.length > MAX_URLS) {
    console.error(
      `Refusing to submit ${slugs.length} URLs — this tool is for NEW posts only, not bulk ` +
        `re-submission (that floods IndexNow). Narrow with --slug or a smaller --days.`,
    );
    process.exit(1);
  }

  const urlList = slugs.map((s) => `${BASE}/blog/${s}`);
  console.log(`IndexNow — ${urlList.length} blog URL(s):`);
  urlList.forEach((u) => console.log("  " + u));

  if (DRY) {
    console.log("\n(--dry: not submitted)");
    return;
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
  });
  if (res.ok) {
    console.log(`\n✅ IndexNow accepted (${res.status}) — Bing/Yandex will recrawl these.`);
  } else {
    console.error(`\n❌ IndexNow ${res.status}: ${(await res.text()).slice(0, 200)}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
