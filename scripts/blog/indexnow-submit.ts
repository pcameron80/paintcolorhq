/**
 * Submit a handful of NEW or CHANGED URLs to IndexNow (Bing + Yandex). TARGETED, never bulk.
 *
 * The whole-sitemap daily submission (/api/cron/indexnow, about 27,000 URLs a
 * run) was deleted on 2026-10-24 for flooding the engines. Never rebuild it.
 * This tool hard-caps every run at 25 URLs so it can't become a flood either.
 *
 * DRY RUN BY DEFAULT: it prints the payload and sends nothing. Add --submit to
 * send. Every real submission is appended to the ledger described in
 * indexnow-client.ts (outside the repo).
 *
 * Modes:
 *   (default)  blog posts published in the last 2 days (--days=N to widen)
 *   --slug     named blog posts. A future-dated (scheduled) slug is refused,
 *              because the engines would crawl a 404; --force overrides. A slug
 *              that matches no post is always refused.
 *   --url      any page, repeatable (--url=A --url=B). Each must be https on
 *              www.paintcolorhq.com and either answer 200 or be listed in the
 *              sitemap. Use it for a non-blog page whose content changed.
 *
 * Usage:
 *   npx tsx scripts/blog/indexnow-submit.ts                         # preview last 2 days of posts
 *   npx tsx scripts/blog/indexnow-submit.ts --submit                # ...and send them
 *   npx tsx scripts/blog/indexnow-submit.ts --days=7 --submit
 *   npx tsx scripts/blog/indexnow-submit.ts --slug=best-valspar-paint-colors,best-ppg-paint-colors --submit
 *   npx tsx scripts/blog/indexnow-submit.ts --url=https://www.paintcolorhq.com/colors/behr/cracked-pepper-ppu18-1
 *   npx tsx scripts/blog/indexnow-submit.ts --slug=<scheduled> --force --submit
 */
import { getAllPosts, getPostBySlug } from "../../src/lib/blog-posts.tsx";
import { checkSlugs, checkUrls, MAX_URLS } from "./indexnow-lib.ts";
import { submitIndexNow, BASE, LEDGER_PATH } from "./indexnow-client.ts";

const args = process.argv.slice(2);
const SUBMIT = args.includes("--submit");
const FORCE = args.includes("--force");
function arg(name: string): string | undefined {
  return args.find((a) => a.startsWith(`--${name}=`))?.replace(`--${name}=`, "");
}
function allArgs(name: string): string[] {
  return args.filter((a) => a.startsWith(`--${name}=`)).map((a) => a.replace(`--${name}=`, ""));
}

function refuse(lines: string[]): never {
  lines.forEach((l) => console.error(l));
  process.exit(1);
}

/** Every <loc> in the sitemap index and its child sitemaps. Only fetched when
 *  some --url did not answer 200. */
async function sitemapUrls(): Promise<Set<string>> {
  const locs = (xml: string) => Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => m[1].trim());
  const get = async (url: string) => {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`sitemap ${url} returned ${res.status}`);
    return res.text();
  };
  const out = new Set<string>();
  for (const child of locs(await get(`${BASE}/sitemap.xml`))) {
    for (const loc of locs(await get(child))) out.add(loc);
  }
  return out;
}

/** --url mode: static checks, then each URL must answer 200 (no redirect) or be
 *  in the sitemap. */
async function urlsFromArgs(values: string[]): Promise<string[]> {
  const check = checkUrls(values);
  if (check.errors.length > 0) refuse(["Refusing:", ...check.errors.map((e) => `  ${e}`)]);

  const notLive: Array<{ url: string; status: number }> = [];
  for (const url of check.urls) {
    const res = await fetch(url, { redirect: "manual", cache: "no-store" });
    if (res.status !== 200) notLive.push({ url, status: res.status });
  }
  if (notLive.length > 0) {
    const listed = await sitemapUrls();
    const bad = notLive.filter((n) => !listed.has(n.url));
    if (bad.length > 0) {
      refuse([
        "Refusing: these URLs neither answer 200 nor appear in the sitemap:",
        ...bad.map((b) => `  ${b.url} (status ${b.status})`),
      ]);
    }
  }
  return check.urls;
}

function slugsFromArgs(slugArg: string): string[] {
  const requested = slugArg.split(",").map((s) => s.trim()).filter(Boolean);
  // getPostBySlug returns scheduled posts too when VERCEL_ENV isn't "production",
  // which is the case for this local script, so their dates can be checked here.
  const check = checkSlugs(requested, (s) => getPostBySlug(s)?.date, new Date());
  if (check.unknown.length > 0) {
    refuse([`Refusing: no blog post with slug ${check.unknown.map((s) => `"${s}"`).join(", ")}.`]);
  }
  if (check.scheduled.length > 0 && !FORCE) {
    refuse([
      "Refusing: these posts are scheduled and not live yet, so the engines would crawl a 404:",
      ...check.scheduled.map(({ slug, date }) => `  ${slug} (reveals ${date})`),
      "Run this again on or after the reveal date, or pass --force to submit anyway.",
    ]);
  }
  return requested;
}

async function main() {
  const urlArgs = allArgs("url");
  const slugArg = arg("slug");
  if (urlArgs.length > 0 && slugArg) refuse(["Use --url or --slug, not both."]);

  let urlList: string[];
  if (urlArgs.length > 0) {
    urlList = await urlsFromArgs(urlArgs);
  } else {
    let slugs: string[];
    if (slugArg) {
      slugs = slugsFromArgs(slugArg);
    } else {
      const days = arg("days") ? Number(arg("days")) : 2;
      const cutoff = Date.now() - days * 86_400_000;
      // getAllPosts() already excludes future-dated (not-yet-live) posts.
      slugs = getAllPosts()
        .filter((p) => new Date(p.date).getTime() >= cutoff)
        .map((p) => p.slug);
    }
    urlList = slugs.map((s) => `${BASE}/blog/${s}`);
  }

  if (urlList.length === 0) {
    console.log("No newly-published posts to submit (use --slug, --url or a larger --days).");
    return;
  }
  if (urlList.length > MAX_URLS) {
    refuse([
      `Refusing to submit ${urlList.length} URLs. This tool is for new or changed pages only, not bulk ` +
        `re-submission (that floods IndexNow). Narrow with --slug, --url or a smaller --days.`,
    ]);
  }

  console.log(`IndexNow payload, ${urlList.length} URL(s):`);
  console.log(JSON.stringify({ host: new URL(BASE).host, urlList }, null, 2));

  if (!SUBMIT) {
    console.log("\nDry run: nothing sent. Add --submit to send.");
    return;
  }

  try {
    const status = await submitIndexNow(urlList, urlArgs.length > 0 ? "indexnow-submit --url" : "indexnow-submit");
    console.log(`\nIndexNow accepted (${status}). Logged to ${LEDGER_PATH}.`);
  } catch (e) {
    console.error(`\nIndexNow failed: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
