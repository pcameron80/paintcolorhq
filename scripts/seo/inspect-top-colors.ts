/**
 * Batch URL Inspection: Google's index verdict for a ranked list of pages.
 *
 * Reads one URL per line (a full https://www.paintcolorhq.com URL or a path such
 * as /colors/behr/cracked-pepper-ppu18-1), asks the Search Console URL
 * Inspection API about each, and appends url, verdict, coverage and last crawl
 * to a TSV. Re-running with the same output file skips URLs already in it, so an
 * interrupted run resumes where it stopped.
 *
 * Read-only: it never asks Google to index anything. 300 URLs take about two
 * minutes, well inside the API's 2,000 inspections per property per day.
 * Written for the 2026-10-23 top-color indexing check and kept for the
 * 2026-11-07 indexing recheck.
 *
 * Usage:
 *   npx tsx scripts/seo/inspect-top-colors.ts <urls.txt> <out.tsv>
 *   npx tsx scripts/seo/inspect-top-colors.ts <urls.txt> <out.tsv> --site=https://www.paintcolorhq.com/
 *
 * --site defaults to the domain property sc-domain:paintcolorhq.com.
 */
import * as fs from "fs";
import { inspectUrl } from "../blog/google-search-console.ts";

const BASE = "https://www.paintcolorhq.com";
const DELAY_MS = 250;

const args = process.argv.slice(2);
const [listFile, outFile] = args.filter((a) => !a.startsWith("--"));
const site = args.find((a) => a.startsWith("--site="))?.slice("--site=".length) ?? "sc-domain:paintcolorhq.com";

if (!listFile || !outFile) {
  console.error("Usage: npx tsx scripts/seo/inspect-top-colors.ts <urls.txt> <out.tsv> [--site=<property>]");
  process.exit(2);
}

const toUrl = (line: string) => (line.startsWith("http") ? line : BASE + (line.startsWith("/") ? line : `/${line}`));
const clean = (v: string) => v.replace(/[\t\n]/g, " ");

async function main() {
  const urls = fs
    .readFileSync(listFile, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map(toUrl);

  const done = new Set<string>();
  if (fs.existsSync(outFile)) {
    for (const line of fs.readFileSync(outFile, "utf8").split("\n").slice(1)) if (line) done.add(line.split("\t")[0]);
  } else {
    fs.writeFileSync(outFile, "url\tverdict\tcoverage\tlast_crawl\n");
  }

  let inspected = 0;
  let errors = 0;
  for (const url of urls) {
    if (done.has(url)) continue;
    try {
      const r = await inspectUrl(site, url);
      fs.appendFileSync(outFile, `${url}\t${r.verdict}\t${clean(r.coverageState)}\t${r.lastCrawlTime ?? ""}\n`);
    } catch (e) {
      errors++;
      const msg = e instanceof Error ? e.message : String(e);
      fs.appendFileSync(outFile, `${url}\tERROR\t${clean(msg).slice(0, 120)}\t\n`);
    }
    inspected++;
    await new Promise((res) => setTimeout(res, DELAY_MS));
  }
  console.log(`Inspected ${inspected} URL(s), ${errors} error(s), ${done.size} already in ${outFile}.`);
  if (inspected > 0 && errors === inspected) process.exitCode = 1;
}

main().catch((e) => {
  console.error("Error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
