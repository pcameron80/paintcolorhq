# Pinterest Drip v2 (Multi-Board, Multi-Type) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish to all four Pinterest boards from one local drip, posting a per-type daily quota mix (swatch/palette/guide/comparison) drawn from both curated local images and programmatic `/api/pin*` URLs, with a re-pin cooldown so finite pools cycle slowly.

**Architecture:** Each pin gains a `type` (→ board). Curated pins keep local images; swatch + guide pins are generated programmatically with `imageUrl` (`/api/pin`, `/api/pin/blog`). `selectDailyMix` fills per-type quotas (fresh first, then cooldown-eligible re-pins). A single daily `launchd` run computes quotas by weekday.

**Tech Stack:** TypeScript via `tsx`, Node `node:test`, Pinterest API v5, macOS `launchd`. Spec: `docs/superpowers/specs/2026-05-30-pinterest-drip-v2-multiboard-design.md`.

**Working dir:** worktree `/Users/philipcameron/Documents/GitHub/paintcolorhq-drip-v2` (branch `pinterest-drip-v2`). Run all commands there.

---

## File Structure

- `scripts/pinterest/batch-may26.ts` (MODIFY) — `PinSpec` gains `type`/`imageUrl?`; add `PinType` + `BOARD_FOR_TYPE`; tag its 10 pins.
- `scripts/pinterest/batch-jun-restock.ts` / `batch-jun-restock-2.ts` (MODIFY) — tag pins with `type`; comparison pins → `Color Comparisons` board.
- `scripts/pinterest/sources/guides.ts` (CREATE) — `guidePins()` from `getAllPosts()`.
- `scripts/pinterest/sources/swatches.ts` (CREATE) — `swatchPins()` from `swatch-colors.json`.
- `scripts/pinterest/build-swatch-colors.ts` (CREATE) — one-time generator → `swatch-colors.json`.
- `scripts/pinterest/swatch-colors.json` (GENERATED, committed) — priority colors + DB data.
- `scripts/pinterest/queue.ts` (MODIFY) — aggregate curated + sources; add `selectDailyMix`, quotas, cooldown.
- `scripts/pinterest/queue.test.ts` (MODIFY) — tests for `selectDailyMix`/quotas.
- `scripts/pinterest-publish.ts` (MODIFY) — `image_url` media + `--daily` mode.
- `scripts/pinterest/drip.sh`, `com.paintcolorhq.pinterest-drip.plist.template` (MODIFY) — `--daily`, single daily run.

---

## Task 1: PinSpec gains `type`/`imageUrl`; tag all existing pins

**Files:** Modify `scripts/pinterest/batch-may26.ts`, `batch-jun-restock.ts`, `batch-jun-restock-2.ts`

- [ ] **Step 1: Add types + board map to `batch-may26.ts`**

After the `BoardName` type, add:
```ts
export type PinType = "swatch" | "palette" | "guide" | "comparison";

export const BOARD_FOR_TYPE: Record<PinType, BoardName> = {
  swatch: "Paint Colors",
  palette: "Color Palettes",
  guide: "Paint Color Guides",
  comparison: "Color Comparisons",
};
```
In `interface PinSpec`, after `format`, add:
```ts
  /** Pin category → board (see BOARD_FOR_TYPE). */
  type: PinType;
  /** When set, publish via Pinterest image_url instead of a local image file. */
  imageUrl?: string;
```

- [ ] **Step 2: Tag the batch pins (type + correct board)**

In all three batch files, add `type: "palette"` to every pin **except** the side-by-side comparison pins, which get `type: "comparison"`. Set each pin's `board` to `BOARD_FOR_TYPE[type]`. Concretely:

Comparison pins (set `type: "comparison"`, `board: "Color Comparisons"`):
- `may26-04` (Best Whites Side-by-Side)
- `restock-14` (Best Warm Whites Compared)
- `restock-15` (Best Greiges Compared)
- `restock-29` (Best Navy Paint Colors Compared)
- `restock-30` (Best Green Paint Colors Compared)

Every other pin: `type: "palette"`, `board: "Color Palettes"`. (This also moves `may26-03` Iron Ore Front Door from `Paint Color Guides` to `Color Palettes`.)

- [ ] **Step 3: Verify every pin's board matches its type**

Run:
```bash
npx tsx -e 'import { QUEUE } from "./scripts/pinterest/queue.ts"; import { BOARD_FOR_TYPE } from "./scripts/pinterest/batch-may26.ts"; const bad = QUEUE.filter(p => p.board !== BOARD_FOR_TYPE[p.type]); console.log("mismatches:", bad.map(p=>p.key)); console.log("types:", QUEUE.reduce((a,p)=>{a[p.type]=(a[p.type]||0)+1;return a;},{} as any));'
```
Expected: `mismatches: []` and `{ palette: 35, comparison: 5 }`.

- [ ] **Step 4: Commit**
```bash
git add scripts/pinterest/batch-may26.ts scripts/pinterest/batch-jun-restock.ts scripts/pinterest/batch-jun-restock-2.ts
git commit -m "feat(pinterest): add pin type + board map; tag curated pins, remap comparisons"
```

---

## Task 2: Guide source (blog pins)

**Files:** Create `scripts/pinterest/sources/guides.ts`; Test `scripts/pinterest/queue.test.ts`

- [ ] **Step 1: Write `guides.ts`**
```ts
import { getAllPosts } from "../../../src/lib/blog-posts.tsx";
import type { PinSpec } from "../batch-may26.ts";

const SITE = "https://www.paintcolorhq.com";
const UTM = "?utm_source=Pinterest&utm_medium=organic&utm_campaign=guide-drip";

/** Pin specs for every indexable blog post (the "guide" lane). */
export function guidePins(): PinSpec[] {
  return getAllPosts()
    .filter((p) => !p.noindex)
    .map((p) => {
      const imageUrl = p.pinImage
        ? `${SITE}${p.pinImage}`
        : `${SITE}/api/pin/blog?title=${encodeURIComponent(p.title)}&cover=${encodeURIComponent(p.coverImage ? SITE + p.coverImage : "")}&color=${encodeURIComponent(p.coverColor)}`;
      const title = p.title.length > 100 ? p.title.slice(0, 97) + "..." : p.title;
      return {
        id: 0,
        key: `guide-${p.slug}`,
        type: "guide",
        board: "Paint Color Guides",
        theme: p.tags?.[0] ?? "guide",
        format: "guide",
        name: p.title,
        image: "",
        imageUrl,
        prompt: "",
        title,
        description: p.excerpt,
        link: `${SITE}/blog/${p.slug}${UTM}`,
      } as PinSpec;
    });
}
```

- [ ] **Step 2: Add a guide-source test to `queue.test.ts`** (append)
```ts
import { guidePins } from "./sources/guides.ts";

test("guidePins: all guide-type, on Guides board, with imageUrl + unique keys", () => {
  const g = guidePins();
  assert.ok(g.length >= 20, `expected >=20 guide pins, got ${g.length}`);
  assert.ok(g.every((p) => p.type === "guide" && p.board === "Paint Color Guides"));
  assert.ok(g.every((p) => typeof p.imageUrl === "string" && p.imageUrl.startsWith("https://")));
  assert.ok(g.every((p) => p.link.includes("/blog/")));
  assert.equal(new Set(g.map((p) => p.key)).size, g.length);
});
```

- [ ] **Step 3: Run the test**
Run: `npm run test:pinterest`
Expected: PASS (the new test + existing 5).

- [ ] **Step 4: Commit**
```bash
git add scripts/pinterest/sources/guides.ts scripts/pinterest/queue.test.ts
git commit -m "feat(pinterest): guide source — blog posts as programmatic pins"
```

---

## Task 3: Swatch source (catalog pins)

**Files:** Create `scripts/pinterest/build-swatch-colors.ts`, `scripts/pinterest/swatch-colors.json` (generated), `scripts/pinterest/sources/swatches.ts`

- [ ] **Step 1: Write the generator `build-swatch-colors.ts`**

The `PRIORITY` list seeds from `TIER1_COLORS` in `src/lib/pinterest-queue.ts` (GSC-impressed colors) plus the high-search colors already used in batches. Copy the `{ brandSlug, slug }` pairs from `TIER1_COLORS` into the `PRIORITY` array below, then append the extras shown.
```ts
import * as path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import * as dotenv from "dotenv";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

// Seed from pinterest-queue.ts TIER1_COLORS (GSC-impressed) + popular colors.
const PRIORITY: Array<{ brandSlug: string; slug: string }> = [
  // --- paste TIER1_COLORS pairs from src/lib/pinterest-queue.ts here ---
  // then popular extras already verified in batches:
  { brandSlug: "sherwin-williams", slug: "agreeable-gray-7029" },
  { brandSlug: "sherwin-williams", slug: "repose-gray-7015" },
  { brandSlug: "sherwin-williams", slug: "tricorn-black-6258" },
  { brandSlug: "sherwin-williams", slug: "sea-salt-6204" },
  { brandSlug: "benjamin-moore", slug: "hale-navy-hc-154" },
  { brandSlug: "benjamin-moore", slug: "revere-pewter-hc-172" },
  { brandSlug: "sherwin-williams", slug: "alabaster-7008" },
];

(async () => {
  const { getColorBySlug } = await import("../../src/lib/queries.ts");
  const out: any[] = [];
  const seen = new Set<string>();
  for (const { brandSlug, slug } of PRIORITY) {
    const dedup = `${brandSlug}/${slug}`;
    if (seen.has(dedup)) continue;
    seen.add(dedup);
    const c = await getColorBySlug(brandSlug, slug);
    if (!c) { console.warn("MISS", dedup); continue; }
    out.push({
      brandSlug, slug, brandName: c.brand?.name ?? "",
      name: c.name, hex: c.hex, code: c.color_number ?? null,
      lrv: c.lrv ?? null, family: c.color_family ?? null,
    });
  }
  fs.writeFileSync(path.resolve(__dirname, "swatch-colors.json"), JSON.stringify(out, null, 2) + "\n");
  console.log("wrote", out.length, "swatch colors");
})();
```

- [ ] **Step 2: Generate the data file**
Run: `npx tsx scripts/pinterest/build-swatch-colors.ts`
Expected: `wrote N swatch colors` (N ≈ 35+); `swatch-colors.json` created with real hex/lrv/family.

- [ ] **Step 3: Write `sources/swatches.ts`**
```ts
import * as path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import type { PinSpec } from "../batch-may26.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = "https://www.paintcolorhq.com";
const UTM = "?utm_source=Pinterest&utm_medium=organic&utm_campaign=swatch-drip";

interface SwatchColor {
  brandSlug: string; slug: string; brandName: string; name: string;
  hex: string; code: string | null; lrv: number | null; family: string | null;
}

const DATA: SwatchColor[] = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../swatch-colors.json"), "utf8"),
);

/** Pin specs for the priority color catalog (the "swatch" lane). */
export function swatchPins(): PinSpec[] {
  return DATA.map((c) => {
    const params = new URLSearchParams({ hex: c.hex, name: c.name, brand: c.brandName });
    if (c.code) params.set("code", c.code);
    if (c.lrv != null) params.set("lrv", String(Math.round(c.lrv)));
    if (c.family) params.set("family", c.family);
    return {
      id: 0,
      key: `swatch-${c.brandSlug}-${c.slug}`,
      type: "swatch",
      board: "Paint Colors",
      theme: c.family ?? "color",
      format: "swatch",
      name: `${c.brandName} ${c.name}`,
      image: "",
      imageUrl: `${SITE}/api/pin?${params.toString()}`,
      prompt: "",
      title: `${c.name}${c.code ? ` ${c.code}` : ""} — ${c.brandName} Paint Color`,
      description: `${c.brandName} ${c.name}${c.code ? ` (${c.code})` : ""} — ${c.family ?? "paint"} paint color${c.lrv != null ? `, LRV ${Math.round(c.lrv)}` : ""}. See cross-brand matches across 14 brands at PaintColorHQ.`,
      link: `${SITE}/colors/${c.brandSlug}/${c.slug}${UTM}`,
    } as PinSpec;
  });
}
```

- [ ] **Step 4: Add a swatch-source test to `queue.test.ts`** (append)
```ts
import { swatchPins } from "./sources/swatches.ts";

test("swatchPins: all swatch-type, on Colors board, /api/pin imageUrl, unique keys", () => {
  const s = swatchPins();
  assert.ok(s.length > 0);
  assert.ok(s.every((p) => p.type === "swatch" && p.board === "Paint Colors"));
  assert.ok(s.every((p) => p.imageUrl?.includes("/api/pin?")));
  assert.ok(s.every((p) => p.link.includes("/colors/")));
  assert.equal(new Set(s.map((p) => p.key)).size, s.length);
});
```

- [ ] **Step 5: Run tests**
Run: `npm run test:pinterest`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add scripts/pinterest/build-swatch-colors.ts scripts/pinterest/swatch-colors.json scripts/pinterest/sources/swatches.ts scripts/pinterest/queue.test.ts
git commit -m "feat(pinterest): swatch source — GSC-priority catalog pins via /api/pin"
```

---

## Task 4: Aggregate queue + `selectDailyMix` (TDD)

**Files:** Modify `scripts/pinterest/queue.ts`, `scripts/pinterest/queue.test.ts`

- [ ] **Step 1: Write failing tests for quotas + selection** (append to `queue.test.ts`)
```ts
import { quotasForWeekday, selectDailyMix, DRIP_CONFIG } from "./queue.ts";

function mkT(key: string, type: PinSpec["type"]): PinSpec {
  return { key, type, board: "x", theme: type, format: type } as unknown as PinSpec;
}

test("quotasForWeekday merges daily + weekday extras", () => {
  // Monday (1) adds a guide; daily is swatch 3 + palette 1
  assert.deepEqual(quotasForWeekday(DRIP_CONFIG, 1), { swatch: 3, palette: 1, guide: 1 });
  // Tuesday (2) = daily only
  assert.deepEqual(quotasForWeekday(DRIP_CONFIG, 2), { swatch: 3, palette: 1 });
});

test("selectDailyMix fills each type's quota from fresh", () => {
  const q = [mkT("s1","swatch"),mkT("s2","swatch"),mkT("s3","swatch"),mkT("s4","swatch"),mkT("p1","palette"),mkT("p2","palette")];
  const picks = selectDailyMix(q, {}, { swatch: 3, palette: 1 }, 0, 35);
  assert.equal(picks.filter(p=>p.type==="swatch").length, 3);
  assert.equal(picks.filter(p=>p.type==="palette").length, 1);
});

test("selectDailyMix re-pins only after cooldown, oldest first", () => {
  const DAY = 86400_000;
  const now = 100 * DAY;
  const q = [mkT("p1","palette"), mkT("p2","palette")];
  // both published; p1 long ago (eligible), p2 recently (not)
  const log = {
    p1: { pinId: "1", publishedAt: new Date(now - 40*DAY).toISOString() },
    p2: { pinId: "2", publishedAt: new Date(now - 5*DAY).toISOString() },
  };
  const picks = selectDailyMix(q, log, { palette: 1 }, now, 35);
  assert.equal(picks.length, 1);
  assert.equal(picks[0].key, "p1"); // p2 still in cooldown
});

test("selectDailyMix prefers fresh over re-pin", () => {
  const DAY = 86400_000; const now = 100 * DAY;
  const q = [mkT("p1","palette"), mkT("p2","palette")];
  const log = { p1: { pinId: "1", publishedAt: new Date(now - 40*DAY).toISOString() } }; // p1 old/published, p2 fresh
  const picks = selectDailyMix(q, log, { palette: 1 }, now, 35);
  assert.equal(picks[0].key, "p2"); // fresh wins
});
```

- [ ] **Step 2: Run to verify failure**
Run: `npm run test:pinterest`
Expected: FAIL (`quotasForWeekday`/`selectDailyMix`/`DRIP_CONFIG` not exported).

- [ ] **Step 3: Implement in `queue.ts`**

Add the imports + aggregation (replace the existing `QUEUE` export):
```ts
import { guidePins } from "./sources/guides.ts";
import { swatchPins } from "./sources/swatches.ts";
import type { PinType } from "./batch-may26.ts";

/** Curated (local image) + programmatic (swatch/guide) pins. */
export const QUEUE: PinSpec[] = [
  ...MAY26, ...JUN_RESTOCK, ...JUN_RESTOCK_2,
  ...swatchPins(), ...guidePins(),
];
```
Append the quota + selection logic:
```ts
export type Quotas = Partial<Record<PinType, number>>;

export interface DripConfig {
  cooldownDays: number;
  daily: Quotas;
  /** extra quota by ISO weekday (1=Mon … 7=Sun), merged onto `daily`. */
  byWeekday: Record<number, Quotas>;
}

export const DRIP_CONFIG: DripConfig = {
  cooldownDays: 35,
  daily: { swatch: 3, palette: 1 },
  byWeekday: {
    1: { guide: 1 },      // Mon
    3: { comparison: 1 }, // Wed
    4: { guide: 1 },      // Thu
    6: { comparison: 1 }, // Sat
  },
};

export function quotasForWeekday(cfg: DripConfig, isoWeekday: number): Quotas {
  const merged: Quotas = { ...cfg.daily };
  for (const [t, n] of Object.entries(cfg.byWeekday[isoWeekday] ?? {})) {
    merged[t as PinType] = (merged[t as PinType] ?? 0) + (n as number);
  }
  return merged;
}

/** Pick the day's mix: per type, fresh first (variety rotation), then cooldown-eligible re-pins (oldest first). */
export function selectDailyMix(
  queue: PinSpec[],
  published: PublishedLog,
  quotas: Quotas,
  nowMs: number,
  cooldownDays: number,
): PinSpec[] {
  const chosen: PinSpec[] = [];
  for (const [type, nRaw] of Object.entries(quotas)) {
    const n = nRaw as number;
    const ofType = queue.filter((p) => p.type === (type as PinType));
    const picks: PinSpec[] = [];

    const freshPool = ofType.filter((p) => !(p.key in published));
    while (picks.length < n && freshPool.length > 0) {
      const next = pickNext(freshPool, [...picks].reverse().slice(0, LOOKBACK))!;
      picks.push(next);
      freshPool.splice(freshPool.indexOf(next), 1);
    }

    if (picks.length < n) {
      const cutoff = nowMs - cooldownDays * 86400_000;
      const repinnable = ofType
        .filter((p) => published[p.key] && Date.parse(published[p.key].publishedAt) < cutoff)
        .sort((a, b) => Date.parse(published[a.key].publishedAt) - Date.parse(published[b.key].publishedAt));
      for (const p of repinnable) {
        if (picks.length >= n) break;
        picks.push(p);
      }
    }
    chosen.push(...picks);
  }
  return chosen;
}
```

- [ ] **Step 4: Run tests to verify pass**
Run: `npm run test:pinterest`
Expected: PASS (all tests, including the original 5).

- [ ] **Step 5: Commit**
```bash
git add scripts/pinterest/queue.ts scripts/pinterest/queue.test.ts
git commit -m "feat(pinterest): aggregate all sources + selectDailyMix quota/cooldown engine"
```

---

## Task 5: Publisher — `image_url` media + `--daily`

**Files:** Modify `scripts/pinterest-publish.ts`

- [ ] **Step 1: Support URL-based media in `imagePayload`**

Replace the body of `imagePayload(pin)` so a pin with `imageUrl` publishes by URL:
```ts
function mediaSource(pin: PinSpec) {
  if (pin.imageUrl) {
    return { source_type: "image_url" as const, url: pin.imageUrl };
  }
  const file = path.join(IMAGE_DIR, pin.image);
  if (!fs.existsSync(file)) throw new Error(`Image not found: ${file}`);
  const buf = fs.readFileSync(file);
  let contentType = "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) contentType = "image/jpeg";
  else if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) contentType = "image/png";
  return { source_type: "image_base64" as const, content_type: contentType, data: buf.toString("base64") };
}
```
Update `publishPin` to call `mediaSource(pin)` instead of `imagePayload(pin)`, and update the dry-run line to print `pin.imageUrl ?? pin.image`.

- [ ] **Step 2: Add `--daily` mode**

Add to the imports: `selectDailyMix, quotasForWeekday, DRIP_CONFIG`. Add arg parsing:
```ts
const DAILY = args.includes("--daily");
```
In `main()`, before the existing `DRIP` branch, add:
```ts
  if (DAILY) {
    const isoWeekday = ((new Date().getDay() + 6) % 7) + 1; // 1=Mon..7=Sun
    const quotas = quotasForWeekday(DRIP_CONFIG, isoWeekday);
    targets = selectDailyMix(QUEUE, log, quotas, Date.now(), DRIP_CONFIG.cooldownDays);
    console.log(`Daily mix (weekday ${isoWeekday}):`, JSON.stringify(quotas));
    if (targets.length === 0) {
      console.log("Nothing to post today.");
      if (!DRY_RUN) notify("Pinterest drip: nothing to post — stock more with Claude.");
      return;
    }
  } else if (DRIP) {
    // ...existing drip branch unchanged...
```
(Declare `let targets: PinSpec[];` once at the top of `main` as it already is.)

- [ ] **Step 3: Dry-run verify the daily mix**
Run: `npx tsx scripts/pinterest-publish.ts --dry-run --daily`
Expected: prints today's quota object + a list of selected pins spanning multiple boards (swatches via `/api/pin`, a palette, and guide/comparison if today's weekday includes them). No errors.

- [ ] **Step 4: Commit**
```bash
git add scripts/pinterest-publish.ts
git commit -m "feat(pinterest): publish image_url media + --daily quota mode"
```

---

## Task 6: launchd — daily cadence

**Files:** Modify `scripts/pinterest/drip.sh`, `scripts/pinterest/com.paintcolorhq.pinterest-drip.plist.template`

- [ ] **Step 1: Point `drip.sh` at `--daily`**
Replace the publish line in `scripts/pinterest/drip.sh`:
```bash
npx tsx scripts/pinterest-publish.ts --daily >> "$REPO/scripts/pinterest/drip.log" 2>&1
```
(Drop the `--drip="$COUNT"` arg; `--daily` computes the mix itself.)

- [ ] **Step 2: Single daily run in the plist template**
In `com.paintcolorhq.pinterest-drip.plist.template`, replace the two `StartCalendarInterval` dicts with one daily fire at 14:00 UTC (10am EDT):
```xml
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>14</integer><key>Minute</key><integer>0</integer></dict>
```
Also remove the trailing `<string>1</string>` arg from `ProgramArguments` (drip.sh no longer takes a count).

- [ ] **Step 3: Dry-confirm the wrapper resolves**
Run: `bash scripts/pinterest/drip.sh && tail -5 scripts/pinterest/drip.log`
Expected: the daily-mix log lines (it will attempt real posts only if a token is present; if `PINTEREST_ACCESS_TOKEN` is unset in this env it logs an auth error — acceptable here, the selection ran). For a no-post check, temporarily run `npx tsx scripts/pinterest-publish.ts --dry-run --daily` instead.

- [ ] **Step 4: Commit**
```bash
git add scripts/pinterest/drip.sh scripts/pinterest/com.paintcolorhq.pinterest-drip.plist.template
git commit -m "feat(pinterest): launchd daily multi-type cadence (replaces 2x/day drip)"
```

---

## Task 7: End-to-end verification (live, gated)

**Files:** none (verification)

- [ ] **Step 1: One live swatch + one live guide pin**
Run (requires a valid `PINTEREST_ACCESS_TOKEN` with `pins:write`):
```bash
npx tsx scripts/pinterest-publish.ts --only=$(npx tsx -e 'import {swatchPins} from "./scripts/pinterest/sources/swatches.ts"; console.log(swatchPins()[0].key)')
npx tsx scripts/pinterest-publish.ts --only=$(npx tsx -e 'import {guidePins} from "./scripts/pinterest/sources/guides.ts"; console.log(guidePins()[0].key)')
```
Expected: each prints `✅ … → pin <id> on <board>`. Verify in Pinterest that the swatch landed on **Paint Colors** and the guide on **Paint Color Guides**, both rendering via the `/api/pin*` image. Confirm `published.json` recorded both keys.

- [ ] **Step 2: Full daily dry-run sanity**
Run: `npx tsx scripts/pinterest-publish.ts --dry-run --daily`
Expected: today's mix, no pin already in `published.json` from Step 1 re-selected.

- [ ] **Step 3: PR + (after merge) install**
Open a PR for `pinterest-drip-v2`. After merge to `main`, from the **main checkout on `main`**, run `./scripts/pinterest/install-drip-schedule.sh` to (re)load the agent with the new daily cadence. `launchctl list | grep pinterest-drip` confirms it.

---

## Notes / caveats
- **Token at publish time:** the launchd job reads `PINTEREST_ACCESS_TOKEN`/`REFRESH_TOKEN` from the main checkout's `.env.local`; auto-refresh + auth-failure notification already handled (v1).
- **Cooldown** uses the run's `Date.now()` (a tsx script, so `new Date()`/`Date.now()` are allowed — unlike Workflow scripts).
- **Swatch list growth:** expand `PRIORITY` in `build-swatch-colors.ts` and re-run it to widen the swatch pool; commit the regenerated `swatch-colors.json`.
- **Deferred:** programmatic match-page comparison pins; blog-creation pipeline.
