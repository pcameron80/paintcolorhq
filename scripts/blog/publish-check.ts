/**
 * Publish-day job for scheduled blog posts. Run by launchd twice a day
 * (scripts/blog/install-publish-check.sh); safe to run by hand any time.
 *
 * For each post that revealed in the last 3 days and hasn't been handled:
 *   1. confirm it is live (200, its own canonical, listed in sitemap/blog.xml)
 *   2. ping IndexNow (Bing, Yandex)
 *   3. resubmit the sitemap to Google Search Console
 * Then, for up to 14 days, inspect each submitted post once a day and report
 * when Google has indexed it. Results go to a macOS notification and to the log;
 * progress is kept in one state file shared by scheduled and manual runs:
 * ~/Library/Application Support/PaintColorHQ/publish-check/ (publish-check.log,
 * publish-check-state.json). Override the folder with $PUBLISH_CHECK_DIR.
 *
 * Google has no API to request indexing of a blog URL; resubmitting the sitemap
 * and inspecting the URL is the most the API allows (see google-search-console.ts).
 *
 * Usage:
 *   npx tsx scripts/blog/publish-check.ts            # normal run
 *   npx tsx scripts/blog/publish-check.ts --dry      # report only: no submissions, no state change
 *   npx tsx scripts/blog/publish-check.ts --no-notify
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execFileSync } from "child_process";
import { getAllPosts } from "../../src/lib/blog-posts.tsx";
import { submitIndexNow, BASE } from "./indexnow-client.ts";
import { submitSitemap, inspectUrl } from "./google-search-console.ts";
import {
  postsToSubmit,
  postsToInspect,
  postsNeverIndexed,
  isIndexed,
  liveProblem,
  type PublishState,
} from "./publish-check-lib.ts";

const GSC_SITE = "sc-domain:paintcolorhq.com"; // sitemap is registered here
// Inspect against the URL-prefix property: on 2026-10-11 the domain property
// answered "URL is unknown to Google" for /blog/paint-sheen-guide while this one
// gave the fuller "Discovered - currently not indexed" with a referring URL.
const GSC_INSPECT_SITE = "https://www.paintcolorhq.com/";
const SITEMAP_INDEX = `${BASE}/sitemap.xml`; // the sitemap registered in GSC
const BLOG_SITEMAP = `${BASE}/sitemap/blog.xml`;

const DIR =
  process.env.PUBLISH_CHECK_DIR ??
  path.join(os.homedir(), "Library/Application Support/PaintColorHQ/publish-check");
const STATE_PATH = path.join(DIR, "publish-check-state.json");
const DRY = process.argv.includes("--dry");
const NOTIFY = !process.argv.includes("--no-notify") && !DRY;

const urlOf = (slug: string) => `${BASE}/blog/${slug}`;

function loadState(): PublishState {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8")) as PublishState;
  } catch {
    return {};
  }
}

function notify(title: string, message: string) {
  console.log(`[notify] ${title}: ${message}`);
  if (!NOTIFY) return;
  const q = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  try {
    execFileSync("osascript", ["-e", `display notification "${q(message)}" with title "${q(title)}"`]);
  } catch (e) {
    console.error("notification failed:", e instanceof Error ? e.message : e);
  }
}

async function main() {
  const now = new Date();
  console.log(`=== publish-check ${now.toISOString()}${DRY ? " (dry)" : ""} ===`);
  const posts = getAllPosts().map((p) => ({ slug: p.slug, date: p.date }));
  const state = loadState();
  const done: string[] = [];
  const problems: string[] = [];

  // 1-3: newly revealed posts.
  const due = postsToSubmit(posts, state, now);
  const ready: string[] = [];
  if (due.length > 0) {
    const sitemapXml = await (await fetch(BLOG_SITEMAP, { cache: "no-store" })).text();
    for (const p of due) {
      const res = await fetch(urlOf(p.slug), { cache: "no-store" });
      const problem = liveProblem(urlOf(p.slug), res.status, await res.text(), sitemapXml);
      if (problem) {
        console.log(`  ${p.slug}: NOT READY (${problem})`);
        problems.push(`${p.slug}: ${problem}`);
        if (!DRY) state[p.slug] = { ...state[p.slug], lastProblem: problem };
      } else {
        console.log(`  ${p.slug}: live`);
        ready.push(p.slug);
      }
    }
  }

  if (ready.length > 0 && !DRY) {
    try {
      const status = await submitIndexNow(ready.map(urlOf));
      console.log(`  IndexNow accepted (${status})`);
      await submitSitemap(GSC_SITE, SITEMAP_INDEX);
      console.log(`  GSC sitemap resubmitted (${SITEMAP_INDEX})`);
      const at = new Date().toISOString();
      for (const slug of ready) {
        state[slug] = { ...state[slug], submittedAt: at, lastProblem: undefined };
        done.push(`${slug} is live, sent to IndexNow and Google`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`  submit failed: ${msg}`);
      problems.push(`submit failed: ${msg}`);
    }
  } else if (ready.length > 0) {
    console.log(`  (dry) would submit: ${ready.join(", ")}`);
  }

  // Daily index-status check for submitted posts.
  for (const p of postsToInspect(posts, state, now)) {
    try {
      const r = await inspectUrl(GSC_INSPECT_SITE, urlOf(p.slug));
      console.log(`  ${p.slug}: Google says "${r.coverageState}" (${r.verdict})`);
      if (DRY) continue;
      const s = (state[p.slug] = { ...state[p.slug] });
      s.inspections = [...(s.inspections ?? []), { at: new Date().toISOString(), ...r }];
      if (isIndexed(r.verdict)) {
        s.indexedAt = new Date().toISOString();
        done.push(`${p.slug} is indexed on Google`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`  ${p.slug}: inspection failed: ${msg}`);
      problems.push(`${p.slug}: inspection failed`);
    }
  }

  for (const p of postsNeverIndexed(posts, state, now)) {
    problems.push(`${p.slug}: not indexed by Google after 14 days`);
    if (!DRY) state[p.slug] = { ...state[p.slug], lastProblem: "not indexed after 14 days" };
  }

  if (!DRY) {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
  }
  if (problems.length > 0) notify("PaintColorHQ blog: check needed", problems.join("; "));
  if (done.length > 0) notify("PaintColorHQ blog", done.join("; "));
  if (problems.length === 0 && done.length === 0 && ready.length === 0) console.log("  nothing to do");
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error("Error:", msg);
  notify("PaintColorHQ blog: publish-check failed", msg);
  process.exit(1);
});
