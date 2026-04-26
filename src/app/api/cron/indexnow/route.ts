/**
 * Daily cron: re-submit the live sitemap to IndexNow (Bing + Yandex).
 *
 * Walks the sitemap index, collects URLs, batches into ≤10k chunks,
 * and POSTs to api.indexnow.org. Idempotent — re-submitting the same
 * URL daily signals "still live"; URLs with a bumped lastmod get
 * re-crawled.
 *
 * Google does not honor IndexNow directly, but follows Bing's index,
 * so this nudges discovery sideways for "Crawled — currently not
 * indexed" URLs that need a re-look.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const BASE_URL = "https://www.paintcolorhq.com";
const HOST = "www.paintcolorhq.com";
const KEY = "a28e7cd07d004d4b94cfcd6bc2129bda";
const KEY_LOCATION = `${BASE_URL}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH_SIZE = 10_000;

async function fetchSitemapXml(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Sitemap fetch ${url} → ${res.status}`);
  return res.text();
}

function extractLocs(xml: string): string[] {
  const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
  return Array.from(matches, (m) => m[1].trim()).filter(Boolean);
}

async function collectAllUrls(): Promise<string[]> {
  const indexXml = await fetchSitemapXml(`${BASE_URL}/sitemap.xml`);
  const subSitemaps = extractLocs(indexXml);
  const allUrls: string[] = [];

  for (const subUrl of subSitemaps) {
    try {
      const subXml = await fetchSitemapXml(subUrl);
      const locs = extractLocs(subXml);
      for (const u of locs) {
        if (u.startsWith(BASE_URL + "/") || u === BASE_URL) {
          allUrls.push(u);
        }
      }
    } catch (err) {
      console.error(`indexnow-cron: skipping ${subUrl}`, err);
    }
  }

  return Array.from(new Set(allUrls));
}

async function submitBatch(urls: string[]): Promise<{ status: number; ok: boolean }> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList: urls,
    }),
  });
  return { status: res.status, ok: res.ok };
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const urls = await collectAllUrls();

    if (urls.length === 0) {
      return NextResponse.json({
        ok: false,
        message: "No URLs collected from sitemap",
        durationMs: Date.now() - startedAt,
      });
    }

    const batches: string[][] = [];
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      batches.push(urls.slice(i, i + BATCH_SIZE));
    }

    const results = [];
    for (const batch of batches) {
      const r = await submitBatch(batch);
      results.push({ count: batch.length, status: r.status, ok: r.ok });
    }

    const allOk = results.every((r) => r.ok);

    return NextResponse.json({
      ok: allOk,
      totalUrls: urls.length,
      batches: results.length,
      results,
      durationMs: Date.now() - startedAt,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
        durationMs: Date.now() - startedAt,
      },
      { status: 500 },
    );
  }
}
