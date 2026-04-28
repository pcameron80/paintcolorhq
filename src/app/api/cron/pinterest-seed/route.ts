/**
 * Pinterest auto-pinner — daily cron route.
 *
 * Picks N items from the priority queue, builds pin specs (using our existing
 * /api/pin and /api/pin/palette image endpoints + blog cover images), creates
 * pins via Pinterest's API.
 *
 * Auth: Bearer CRON_SECRET (matches Vercel cron runtime header). Manual
 * triggering for testing also works with the same header.
 *
 * Query params:
 *   count — how many pins to create this run (default 1, max 10)
 *   offset — date offset override (testing/demo only)
 *
 * Returns JSON summary of attempts: each item's seed, success/failure,
 * pin id (on success), or error detail (on failure).
 */

import { NextResponse } from "next/server";
import {
  refreshAccessToken,
  createPin,
  PINTEREST_BOARDS,
  type PinterestPinSpec,
} from "@/lib/pinterest";
import { getQueue, selectForRun, type Seed } from "@/lib/pinterest-queue";
import { getColorBySlug } from "@/lib/queries";
import { getPaletteBySlug, assignPaletteRoles } from "@/lib/palettes";
import { getPostBySlug } from "@/lib/blog-posts";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const SITE = "https://www.paintcolorhq.com";
const MAX_COUNT_PER_RUN = 10;

interface RunResult {
  ok: boolean;
  seed: Seed;
  pinId?: string;
  link?: string;
  error?: string;
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const requestedCount = parseInt(url.searchParams.get("count") ?? "1", 10);
  const count = Math.min(MAX_COUNT_PER_RUN, Math.max(1, Number.isFinite(requestedCount) ? requestedCount : 1));
  const offsetParam = url.searchParams.get("offset");
  const dayOffset = offsetParam != null
    ? parseInt(offsetParam, 10)
    : Math.floor(Date.now() / (1000 * 60 * 60 * 24));

  const queue = getQueue();
  const selected = selectForRun(queue, count, dayOffset);

  let accessToken: string;
  try {
    accessToken = await refreshAccessToken();
  } catch (err) {
    return NextResponse.json(
      { ok: false, stage: "refresh", error: String(err) },
      { status: 500 },
    );
  }

  const results: RunResult[] = [];
  for (const seed of selected) {
    try {
      const spec = await buildPinSpec(seed);
      if (!spec) {
        results.push({ ok: false, seed, error: "spec-build-failed (resource not found)" });
        continue;
      }
      const pin = await createPin(spec, accessToken);
      results.push({ ok: true, seed, pinId: pin.id, link: pin.link });
    } catch (err) {
      results.push({ ok: false, seed, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({
    ok: results.every((r) => r.ok),
    count: selected.length,
    succeeded: results.filter((r) => r.ok).length,
    dayOffset,
    queueSize: queue.length,
    results,
  });
}

async function buildPinSpec(seed: Seed): Promise<PinterestPinSpec | null> {
  if (seed.type === "color") return buildColorSpec(seed.brandSlug, seed.slug);
  if (seed.type === "palette") return buildPaletteSpec(seed.slug);
  if (seed.type === "blog") return buildBlogSpec(seed.slug);
  return null;
}

async function buildColorSpec(brandSlug: string, colorSlug: string): Promise<PinterestPinSpec | null> {
  const color = await getColorBySlug(brandSlug, colorSlug);
  if (!color) return null;

  const params = new URLSearchParams({
    hex: color.hex,
    name: color.name,
    brand: color.brand.name,
  });
  if (color.color_number) params.set("code", color.color_number);
  if (color.lrv != null) params.set("lrv", String(Math.round(Number(color.lrv))));
  if (color.color_family) params.set("family", color.color_family);

  const codeBit = color.color_number ? ` (${color.color_number})` : "";
  const familyBit = color.color_family ? ` ${color.color_family}` : "";
  const lrvBit = color.lrv != null ? `, LRV ${Math.round(Number(color.lrv))}` : "";
  const undertoneBit = color.undertone ? `, ${color.undertone.toLowerCase()} undertone` : "";
  const brandHashtag = `#${color.brand.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const familyHashtag = color.color_family
    ? ` #${color.color_family.toLowerCase().replace(/[^a-z0-9]/g, "")}paint`
    : "";

  return {
    board_id: PINTEREST_BOARDS.paintColors,
    title: `${color.brand.name} ${color.name}${codeBit}`.slice(0, 100),
    description: `${color.brand.name} ${color.name}${codeBit} —${familyBit} paint color${lrvBit}${undertoneBit}. Cross-brand matches at PaintColorHQ.com #paintcolor ${brandHashtag}${familyHashtag}`.slice(0, 500),
    alt_text: `${color.name} by ${color.brand.name} paint color swatch`.slice(0, 500),
    media_source: { source_type: "image_url", url: `${SITE}/api/pin?${params.toString()}` },
    link: `${SITE}/colors/${brandSlug}/${colorSlug}`,
  };
}

function buildPaletteSpec(slug: string): PinterestPinSpec | null {
  const palette = getPaletteBySlug(slug);
  if (!palette) return null;

  const roles = assignPaletteRoles(palette.colors);
  const colorPairs = palette.colors
    .map((hex, i) => `${hex.toLowerCase()}:${roles[i]}`)
    .join(",");
  const params = new URLSearchParams({
    name: palette.name,
    description: palette.description,
    colors: colorPairs,
  });

  return {
    board_id: PINTEREST_BOARDS.colorPalettes,
    title: `${palette.name} — 5-Color Paint Palette`.slice(0, 100),
    description: `${palette.name} — ${palette.description} 5-color paint palette with cross-brand matches at PaintColorHQ.com #paintpalette #colorpalette #${palette.slug.replace(/-/g, "")}`.slice(0, 500),
    alt_text: `${palette.name} 5-color paint palette`.slice(0, 500),
    media_source: { source_type: "image_url", url: `${SITE}/api/pin/palette?${params.toString()}` },
    link: `${SITE}/inspiration/${slug}`,
  };
}

function buildBlogSpec(slug: string): PinterestPinSpec | null {
  const post = getPostBySlug(slug);
  if (!post || !post.coverImage) return null;

  const tagHashtags = post.tags
    .slice(0, 4)
    .map((t) => `#${t.toLowerCase().replace(/[^a-z0-9]/g, "")}`)
    .filter(Boolean)
    .join(" ");

  return {
    board_id: PINTEREST_BOARDS.paintColorGuides,
    title: post.title.slice(0, 100),
    description: `${post.excerpt} Read at PaintColorHQ.com ${tagHashtags}`.slice(0, 500),
    alt_text: post.title.slice(0, 500),
    media_source: { source_type: "image_url", url: `${SITE}${post.coverImage}` },
    link: `${SITE}/blog/${slug}`,
  };
}
