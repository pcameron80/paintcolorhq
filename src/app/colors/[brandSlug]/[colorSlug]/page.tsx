import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorCard } from "@/components/color-card";
import { ColorSwatch } from "@/components/color-swatch";
import { ComplementaryColors } from "@/components/complementary-colors";
import { CuratedPalettes } from "@/components/curated-palettes";
import { SaveToProject } from "@/components/save-to-project";
import { ShareButton } from "@/components/share-button";
import { PinterestSaveButton } from "@/components/pinterest-save-button";
import { redirect } from "next/navigation";
import { getColorBySlug, getColorSlugByNumber, getCrossBrandMatches, findClosestColor, getSimilarColorsFromSameBrand, getMoreFromFamily } from "@/lib/queries";
import { generateColorLede, nearestMatchesPerBrand, generateMetaDescription } from "@/lib/color-description";
import { getColorEditorial } from "@/lib/color-editorial";
import { getUndertoneDotClass } from "@/lib/undertone-utils";
import { getRetailerLinks, isAffiliateRetailer } from "@/lib/retailer-links";
import { getSampleLinks, affiliatizeRetailer, AFFILIATE_ENABLED } from "@/lib/affiliate";
import { TrackPage } from "@/components/track-page";
import { TrackedLink } from "@/components/tracked-link";
import { PairingSelector } from "@/components/pairing-selector";
import { POPULAR_COLOR_SLUGS } from "@/lib/popular-colors";

export const revalidate = 2592000; // 30d — static color/match/brand data; redeploys pick up data changes

// Pre-render popular colors at build time; all others are generated on
// demand and cached via ISR (revalidate=3600) on first visit. Without
// generateStaticParams Next.js 16 falls back to fully dynamic SSR for
// dynamic route segments — `revalidate` alone does not opt in.
// https://nextjs.org/docs/app/api-reference/functions/generate-static-params#dynamic-segments-without-generatestaticparams
//
// POPULAR_COLOR_SLUGS lives in src/lib/popular-colors.ts so it can be
// shared with the sitemap match-individual shard.

export async function generateStaticParams() {
  // Verify each slug exists in the database before claiming it as a static
  // param — protects the build from stale entries when a slug gets renamed.
  const verified = await Promise.all(
    POPULAR_COLOR_SLUGS.map(async (params) => {
      const color = await getColorBySlug(params.brandSlug, params.colorSlug);
      return color ? params : null;
    }),
  );
  return verified.filter((p): p is { brandSlug: string; colorSlug: string } => p !== null);
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = s / 100;
  l = l / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function isLightColor(hex: string): boolean {
  const [, , l] = hexToHsl(hex);
  return l > 55;
}

async function resolveHarmonies(hex: string) {
  const [h, s, l] = hexToHsl(hex);
  const rawHarmonies = [
    { name: "Complementary", description: "Opposite on the color wheel \u2014 creates vibrant contrast", colors: [{ hex, label: "Base" }, { hex: hslToHex(h + 180, s, l), label: "Complement" }] },
    { name: "Analogous", description: "Adjacent colors \u2014 creates a harmonious, cohesive feel", colors: [{ hex: hslToHex(h - 30, s, l), label: "Adjacent" }, { hex, label: "Base" }, { hex: hslToHex(h + 30, s, l), label: "Adjacent" }] },
    { name: "Triadic", description: "Evenly spaced \u2014 balanced and colorful", colors: [{ hex, label: "Base" }, { hex: hslToHex(h + 120, s, l), label: "Triad" }, { hex: hslToHex(h + 240, s, l), label: "Triad" }] },
    { name: "Split Complementary", description: "Softer alternative to complementary \u2014 less tension, still dynamic", colors: [{ hex, label: "Base" }, { hex: hslToHex(h + 150, s, l), label: "Split" }, { hex: hslToHex(h + 210, s, l), label: "Split" }] },
  ];
  const allHexes = new Set<string>();
  for (const harmony of rawHarmonies) for (const c of harmony.colors) allHexes.add(c.hex);
  const resolved = new Map<string, Awaited<ReturnType<typeof findClosestColor>>>();
  await Promise.all([...allHexes].map(async (h) => { resolved.set(h, await findClosestColor(h)); }));
  return rawHarmonies.map((harmony) => ({
    name: harmony.name, description: harmony.description,
    colors: harmony.colors.map((c) => {
      const match = resolved.get(c.hex);
      return { label: c.label, paletteHex: c.hex, matchHex: match?.hex ?? c.hex, matchName: match?.name ?? null, matchBrandSlug: match?.brand.slug ?? null, matchColorSlug: match?.slug ?? null };
    }),
  }));
}

interface PageProps { params: Promise<{ brandSlug: string; colorSlug: string }>; }

function extractVariantSuffix(slug: string, colorNumber: string | null | undefined): string {
  const m = slug.match(/-([2-9])$/);
  if (!m) return "";
  const digit = m[1];
  if (colorNumber && colorNumber.toLowerCase().endsWith(digit)) return "";
  return ` (variant ${digit})`;
}

// A slug like `agreeable-gray-7029-2` is a variant of `agreeable-gray-7029`.
// 49 such pages exist across Behr, Kilz, and Benjamin Moore — many cannibalize
// the primary slug because their generated copy differs only by "(variant 2)"
// in the title. Treat them as noindex so the primary keeps the ranking.
export function isVariantSlug(slug: string, colorNumber: string | null | undefined): boolean {
  return extractVariantSuffix(slug, colorNumber) !== "";
}

// Thin-content gate. Two paths to noindex:
//   1. Code-only name: when the color name has no alphabetic run of 3+
//      letters (e.g. Behr "YL-W15", "PPU5-16"). These can't rank for
//      natural-language queries — no one searches "YL-W15 paint." Colors
//      with real-word names like "Red", "Tan", or "Imagine .04" still
//      pass even when name overlaps with color_number.
//   2. Data quality score < 2: missing two or more of {LRV, undertone,
//      family, has-name}. Today every color has score >= 3 so this is
//      future-proofing for sparse imports.
function isCodeOnlyName(name: string): boolean {
  if (!name.trim()) return true;
  // Unicode-aware so "Crème" reads as a 5-letter word, not "Cr" + "me".
  const runs = name.match(/\p{L}+/gu);
  if (!runs) return true;
  return runs.every((r) => r.length < 3);
}

function dataQualityScore(color: { lrv: number | string | null; undertone: string | null; color_family: string | null; name: string }): number {
  let score = 0;
  if (color.lrv !== null && color.lrv !== undefined) score++;
  if (color.undertone) score++;
  if (color.color_family) score++;
  if (!isCodeOnlyName(color.name)) score++;
  return score;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { brandSlug, colorSlug } = await params;
  const color = await getColorBySlug(brandSlug, colorSlug);
  if (!color) {
    // Slug-renamed redirect: Google still has old slugs like /benjamin-moore/blue-736
    // indexed at decent positions. Resolve via color_number → canonical slug. Doing
    // this in generateMetadata (not just the page body) ensures Next.js short-circuits
    // with a proper HTTP 307 instead of streaming the not-found UI alongside a meta
    // refresh, which Googlebot indexes as a soft-404.
    const colorNumber = extractColorNumber(colorSlug);
    if (colorNumber) {
      const correctSlug = await getColorSlugByNumber(brandSlug, colorNumber);
      if (correctSlug && correctSlug !== colorSlug) redirect(`/colors/${brandSlug}/${correctSlug}`);
    }
    return { title: "Color Not Found" };
  }
  const url = `https://www.paintcolorhq.com/colors/${brandSlug}/${colorSlug}`;
  const colorNum = color.color_number ? ` ${color.color_number}` : "";
  const variant = extractVariantSuffix(colorSlug, color.color_number);
  // Title pivot: replace the hex code (low CTR signal) with LRV + family. LRV
  // is searched ("LRV 70 paint", "high LRV white"), and the family word
  // captures family-level intent ("yellow paint color").
  const lrvForTitle = color.lrv != null ? Math.round(Number(color.lrv)) : null;
  const familyForTitle = color.color_family
    ? color.color_family.charAt(0).toUpperCase() + color.color_family.slice(1)
    : null;
  const titleSuffix = familyForTitle
    ? ` | ${lrvForTitle != null ? `LRV ${lrvForTitle} ` : ""}${familyForTitle} Paint Color`
    : ` | ${color.hex.toUpperCase()}`; // fall back to hex if family unavailable
  const shouldIndex = !isCodeOnlyName(color.name) && dataQualityScore(color) >= 2 && !isVariantSlug(colorSlug, color.color_number);
  return {
    title: `${color.name}${colorNum} by ${color.brand.name}${variant}${titleSuffix}`,
    description: generateMetaDescription(color) + variant,
    alternates: { canonical: url },
    robots: shouldIndex ? undefined : { index: false, follow: true },
    openGraph: {
      title: `${color.name}${colorNum} by ${color.brand.name}${variant}`,
      description: `${color.name} (${color.hex.toUpperCase()}) by ${color.brand.name}${variant}. Find closest matches from other brands.`,
      url,
      images: [{ url: `/api/og?hex=${encodeURIComponent(color.hex)}&name=${encodeURIComponent(color.name)}&brand=${encodeURIComponent(color.brand.name)}`, width: 1200, height: 630, alt: `${color.name} paint color swatch` }],
    },
  };
}

function extractColorNumber(slug: string): string | null {
  const patterns = [/-([a-z]{1,4}\d+-\d+[a-z]*)$/i, /-([a-z]{1,4}-\d+[a-z]*)$/i, /-(\d+-\d+)$/i, /-(\d+)$/i];
  for (const p of patterns) { const m = slug.match(p); if (m) return m[1].toUpperCase(); }
  return null;
}

// JSON-LD helper — content is server-generated from trusted database values only
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function ColorPage({ params }: PageProps) {
  const { brandSlug, colorSlug } = await params;
  const color = await getColorBySlug(brandSlug, colorSlug);

  if (!color) {
    const colorNumber = extractColorNumber(colorSlug);
    if (colorNumber) {
      const correctSlug = await getColorSlugByNumber(brandSlug, colorNumber);
      if (correctSlug && correctSlug !== colorSlug) redirect(`/colors/${brandSlug}/${correctSlug}`);
    }
    notFound();
  }

  const [matches, similarColors, moreFromFamily] = await Promise.all([
    getCrossBrandMatches(color.id),
    getSimilarColorsFromSameBrand(color),
    getMoreFromFamily({ id: color.id, color_family: color.color_family, brand_id: color.brand_id }),
  ]);
  const colorLede = generateColorLede(color, matches);
  const brandMatrix = nearestMatchesPerBrand(matches);
  const topMatch = brandMatrix[0]; // nearest equivalent overall, for the side-by-side hero
  // Curated, hand-written review for high-demand colors (null for the long tail).
  const curatedEditorial = getColorEditorial(brandSlug, colorSlug);
  const retailerLinks = getRetailerLinks(color.brand.slug, color.brand.name, color.name, color.color_number ?? undefined, color.color_family ?? undefined);
  const sampleLinks = getSampleLinks({ brandSlug: color.brand.slug, colorSlug: color.slug, brandName: color.brand.name, colorName: color.name, colorNumber: color.color_number, samplizeAvailable: color.samplize_available, samplizeHandle: color.samplize_handle });
  // For brands stocked at an affiliate big-box (Behr/PPG/Valspar/Kilz/Glidden),
  // the big-box is the SINGLE buy CTA and the brand's own $0 .com is demoted to a
  // small "View official color" reference link below the buttons — not a competing
  // buy button (it leaks the click to a dead end). Brands with no marketplace
  // (SW/BM/Dunn-Edwards/Dutch Boy/specialty) keep every link as a buy button —
  // their own .com IS the buy CTA; Amazon is the monetizable fallback.
  const hasAffiliateRetailer = retailerLinks.some((l) => isAffiliateRetailer(l.retailerName));
  const buyRetailerLinks = hasAffiliateRetailer ? retailerLinks.filter((l) => isAffiliateRetailer(l.retailerName)) : retailerLinks;
  const officialColorLinks = hasAffiliateRetailer ? retailerLinks.filter((l) => !isAffiliateRetailer(l.retailerName)) : [];
  // Shopping CTAs in monetization-priority order: Samplize hero → buy retailer
  // (Home Depot/Lowe's, affiliate once live) → Amazon last. The first one is the
  // filled darker-teal "buy" hero (so every page has a focal point); the rest
  // are teal-outlined.
  const shoppingCtas = [
    ...sampleLinks.filter((l) => l.primary).map((l) => ({ key: l.label, href: l.url, label: `${l.label} of ${color.name}`, sponsored: true })),
    ...buyRetailerLinks.map((l) => {
      const a = affiliatizeRetailer(l.url);
      return { key: l.retailerName, href: a.url, label: `Buy at ${l.retailerName}`, sponsored: a.affiliate };
    }),
    ...sampleLinks.filter((l) => !l.primary).map((l) => ({ key: l.label, href: l.url, label: l.label, sponsored: true })),
  ];
  const harmonies = await resolveHarmonies(color.hex);
  const light = isLightColor(color.hex);
  const textClass = light ? "text-on-surface" : "text-on-primary";
  const textMutedClass = light ? "text-on-surface-variant" : "text-on-primary/80";

  // Build FAQ items
  const faqItems: Array<{ question: string; answer: string }> = [];
  const lrv = color.lrv != null ? Number(color.lrv) : null;
  const undertone = color.undertone ?? "";
  const undertoneLower = undertone.toLowerCase();

  // FAQ answers lead with per-color DATA (undertone / match list / LRV value) so
  // each is a citeable standalone passage for AI Overviews / Perplexity / Copilot.
  // The generic explainer sentences ("Undertone is the subtle cast…", the CIEDE2000
  // explainer, "LRV is the most reliable guide…") were trimmed — identical across
  // 26K pages, they added duplication, not citability. Delta E stays plain language.
  const closenessPhrase = (de: number) => (de < 2 ? "a near-identical match" : de < 5 ? "a very close match" : "a close match");
  if (color.undertone) {
    faqItems.push({
      question: `What undertone does ${color.name} have?`,
      answer: `${color.name} by ${color.brand.name} has a ${undertoneLower} undertone${color.color_family ? ` and sits in the ${color.color_family} color family` : ""}. The undertone shifts with light — warmer under 2700K bulbs, cleaner and cooler under 4000K daylight — so sample ${color.name} in your own space before committing.`,
    });
  }
  if (matches.length > 0) {
    const top3 = matches.slice(0, 3);
    const topList = top3.map((m) => `${m.match_color.name} by ${m.match_color.brand.name} (${closenessPhrase(Number(m.delta_e_score))})`).join(", ");
    faqItems.push({
      question: `What colors match ${color.name} from other brands?`,
      answer: `The closest cross-brand equivalents to ${color.name} are ${topList} — the best options for getting ${color.name}'s look from a brand your local store carries. Confirm with a physical sample, since sheen and lighting shift the final result.`,
    });
  }
  if (lrv != null) {
    const lrvBand =
      lrv >= 70 ? "a light, reflective color that bounces plenty of light back into a room — well-suited to north-facing spaces, hallways, and smaller rooms that need to feel brighter"
      : lrv >= 50 ? "a mid-light color — bright enough for living areas yet soft enough for bedrooms, and adaptable across most lighting conditions"
      : lrv >= 25 ? "a mid-depth color with real presence — strong on accent walls, libraries, and rooms with good natural light"
      : "a deep, dramatic color best saved for accent walls, dining rooms, and cozy spaces where atmosphere matters more than reflected light";
    faqItems.push({
      question: `What is the LRV of ${color.name}?`,
      answer: `${color.name} has a Light Reflectance Value (LRV) of ${lrv.toFixed(1)}, on a scale where 0 is pure black and 100 is pure white — that makes it ${lrvBand}.`,
    });
  }

  // Pinterest pin metadata — the browser extension and Save button look for
  // data-pin-media + data-pin-description on a hidden element to find a
  // higher-quality vertical (2:3) image for the saved pin.
  const pinParams = new URLSearchParams({
    hex: color.hex,
    name: color.name,
    brand: color.brand.name,
  });
  if (color.color_number) pinParams.set("code", color.color_number);
  if (color.lrv != null) pinParams.set("lrv", String(Math.round(Number(color.lrv))));
  if (color.color_family) pinParams.set("family", color.color_family);
  const pinImageUrl = `https://www.paintcolorhq.com/api/pin?${pinParams.toString()}`;
  const pinFamily = color.color_family ? ` ${color.color_family}` : "";
  const pinLrv = color.lrv != null ? `, LRV ${Math.round(Number(color.lrv))}` : "";
  const pinUndertone = color.undertone ? `, ${color.undertone.toLowerCase()} undertone` : "";
  const brandHashtag = `#${color.brand.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const familyHashtag = color.color_family
    ? ` #${color.color_family.toLowerCase().replace(/[^a-z0-9]/g, "")}paint`
    : "";
  const pinDescription = `${color.brand.name} ${color.name}${color.color_number ? ` (${color.color_number})` : ""} —${pinFamily} paint color${pinLrv}${pinUndertone}. Cross-brand matches at PaintColorHQ.com #paintcolor ${brandHashtag}${familyHashtag}`;

  return (
    <div className="min-h-screen bg-surface">
      <TrackPage eventName="page_view_enriched" params={{ page_type: "color", color_brand: color.brand.slug, color_family: color.color_family ?? undefined }} />
      {/* Pinterest pin trigger — hidden from users, picked up by the Save extension */}
      <img
        src={pinImageUrl}
        data-pin-media={pinImageUrl}
        data-pin-description={pinDescription}
        alt={`${color.name} by ${color.brand.name} paint color`}
        width={1000}
        height={1500}
        loading="lazy"
        style={{ position: "absolute", left: "-99999px", width: 1, height: 1, opacity: 0 }}
      />
      <Header />

      {/* Immersive Color Hero */}
      <section className="relative w-full min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden pt-20" style={{ backgroundColor: color.hex }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent pointer-events-none" />
        <div className="relative z-10 text-center px-6 py-16">
          <p className={`font-headline uppercase tracking-[0.4em] text-xs mb-4 opacity-80 ${textMutedClass}`}>
            Ref. {color.hex.toUpperCase()}{color.color_number ? ` \u00B7 ${color.color_number}` : ""}
          </p>
          <h1 className={`font-headline text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter mb-8 drop-shadow-2xl ${textClass}`}>
            {color.name}
          </h1>
          <div className="flex justify-center items-center gap-8 md:gap-12">
            {lrv != null && (
              <>
                <div className={textClass}>
                  <span className="block font-headline text-2xl md:text-3xl font-bold">{lrv.toFixed(0)}%</span>
                  <span className={`text-[10px] uppercase tracking-widest opacity-60 ${textMutedClass}`}>LRV Value</span>
                </div>
                <div className={`w-px h-12 ${light ? "bg-on-surface/20" : "bg-on-primary/20"}`} />
              </>
            )}
            {color.undertone && (
              <div className={textClass}>
                <span className="block font-headline text-2xl md:text-3xl font-bold uppercase">{color.undertone}</span>
                <span className={`text-[10px] uppercase tracking-widest opacity-60 ${textMutedClass}`}>Undertone</span>
              </div>
            )}
          </div>
        </div>
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 ${light ? "bg-on-surface/10" : "bg-white/10"} backdrop-blur-xl px-6 py-3 rounded-full border ${light ? "border-on-surface/10" : "border-white/10"}`}>
          <SaveToProject colorId={color.id} currentPath={`/colors/${brandSlug}/${colorSlug}`} />
          <ShareButton title={`${color.name} by ${color.brand.name}`} url={`/colors/${brandSlug}/${colorSlug}`} />
          <PinterestSaveButton
            pageUrl={`/colors/${brandSlug}/${colorSlug}`}
            mediaUrl={pinImageUrl}
            description={pinDescription}
          />
        </div>
      </section>

      {/* Data-derived lede — rendered immediately after the hero. Composed from
          the color's own values (hex/LRV/undertone/family) plus its single
          nearest cross-brand match, so it's genuinely unique per color instead
          of the templated family-verdict prose it replaced (two same-family
          colors used to share ~70% of that). The structured sections below
          carry the substance; this just leads. */}
      <section className="bg-surface-container-low border-b border-outline-variant/10">
        <article className="max-w-4xl mx-auto px-6 md:px-12 py-10">
          <p className="text-lg text-on-surface leading-relaxed">{colorLede}</p>
        </article>
      </section>

      {/* Curated review — only on high-demand colors (null for the long tail). */}
      {curatedEditorial && (
        <section className="bg-surface border-b border-outline-variant/10">
          <article className="max-w-4xl mx-auto px-6 md:px-12 py-12 space-y-4 text-on-surface-variant leading-relaxed">
            <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight">More about {color.name}</h2>
            {curatedEditorial}
          </article>
        </section>
      )}

      {/* Technical Profile + Matches */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">
          <div className="lg:col-span-5 space-y-12">
            <div>
              <nav className="mb-8 text-sm text-on-surface-variant">
                <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                <span className="mx-2 text-outline">/</span>
                <Link href={`/brands/${color.brand.slug}`} className="hover:text-primary transition-colors">{color.brand.name}</Link>
                <span className="mx-2 text-outline">/</span>
                <span className="text-on-surface">{color.name}</span>
              </nav>
              <div className="bg-surface-container-high h-1 w-12 mb-6" />
              <article>
                <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">{color.name} Technical Profile</h2>
              </article>
            </div>
            <div className="space-y-0">
              {[
                { label: "HEX Code", value: color.hex.toUpperCase() },
                { label: "RGB", value: `${color.rgb_r}, ${color.rgb_g}, ${color.rgb_b}` },
                ...(lrv != null ? [{ label: "LRV", value: lrv.toFixed(1) }] : []),
                ...(color.undertone ? [{ label: "Undertone", value: color.undertone, dot: getUndertoneDotClass(color.undertone) }] : []),
              ].map((spec) => (
                <div key={spec.label} className="flex justify-between items-center py-4 border-b border-outline-variant/15">
                  <span className="text-xs uppercase tracking-widest font-semibold text-outline">{spec.label}</span>
                  <span className="font-headline font-bold text-on-surface flex items-center gap-2">
                    {"dot" in spec && spec.dot && <span className={`inline-block h-3 w-3 rounded-full ${spec.dot}`} />}
                    {spec.value}
                  </span>
                </div>
              ))}
              {color.color_family && (
                <div className="flex justify-between items-center py-4 border-b border-outline-variant/15">
                  <span className="text-xs uppercase tracking-widest font-semibold text-outline">Color Family</span>
                  <Link href={`/colors/family/${color.color_family}`} className="font-headline font-bold text-primary capitalize hover:underline">{color.color_family}</Link>
                </div>
              )}
              <div className="flex justify-between items-center py-4 border-b border-outline-variant/15">
                <span className="text-xs uppercase tracking-widest font-semibold text-outline">Brand</span>
                <Link href={`/brands/${color.brand.slug}`} className="font-headline font-bold text-primary hover:underline">{color.brand.name}</Link>
              </div>
            </div>
            {/* Two labeled groups so the color language reads cleanly:
                blue = explore (site tools), teal = the primary buy action,
                outlined-neutral = secondary buy options. One filled hero per
                group. */}
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3">Use this color</p>
                <div className="flex flex-wrap gap-3">
                  <TrackedLink href={`/tools/palette-generator?hex=${encodeURIComponent(color.hex)}`} className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-3 rounded-xl font-headline font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl transition-all" eventName="cta_click" eventParams={{ cta_label: "generate_palette", color_name: color.name, color_brand: color.brand.slug }}>
                    Generate Palette
                  </TrackedLink>
                  <TrackedLink href={`/compare?color1=${color.id}`} className="bg-surface-container-highest text-primary px-6 py-3 rounded-xl font-headline font-bold text-sm border border-primary/20 hover:shadow-md transition-all" eventName="cta_click" eventParams={{ cta_label: "compare", color_name: color.name, color_brand: color.brand.slug }}>
                    Compare
                  </TrackedLink>
                </div>
              </div>

              {(sampleLinks.length > 0 || retailerLinks.length > 0) && (
                <div className="pt-5 border-t border-outline-variant/15">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3">Get this color</p>
                  <div className="flex flex-wrap gap-3">
                    {/* First CTA = filled darker-teal "buy" hero; rest teal-outlined.
                        rel="sponsored nofollow" per FTC/SEO. */}
                    {shoppingCtas.map((cta, i) => (
                      <a
                        key={cta.key}
                        href={cta.href}
                        target="_blank"
                        rel={`${cta.sponsored ? "sponsored " : ""}nofollow noopener noreferrer`}
                        className={
                          i === 0
                            ? "bg-secondary text-on-secondary px-6 py-3 rounded-xl font-headline font-bold text-sm shadow-lg shadow-secondary/20 hover:shadow-xl transition-all"
                            : "bg-surface-container-highest text-secondary px-6 py-3 rounded-xl font-headline font-bold text-sm border border-secondary/25 hover:shadow-md transition-all"
                        }
                      >
                        {cta.label}
                      </a>
                    ))}
                  </div>
                  {/* Brand's own color page — demoted to a plain reference link (not a
                      buy button) so the affiliate retailer stays the single buy CTA.
                      Plain <a> keeps GA4 linkDomain outbound tracking; not sponsored. */}
                  {officialColorLinks.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                      {officialColorLinks.map((l) => (
                        <a
                          key={l.retailerName}
                          href={l.url}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="text-sm text-on-surface-variant underline underline-offset-2 hover:text-on-surface transition-colors"
                        >
                          View official color on {l.retailerName} →
                        </a>
                      ))}
                    </div>
                  )}
                  {AFFILIATE_ENABLED && (
                    <p className="mt-4 text-xs text-on-surface-variant">
                      Some sample and supply links are affiliate links — if you buy through them, Paint Color HQ may earn a small commission at no extra cost to you. It helps keep the site free.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            {brandMatrix.length > 0 && (
              <div className="bg-surface-container-low rounded-xl p-8 md:p-10">
                <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface mb-2">{color.name} in Every Brand</h2>
                <p className="text-sm text-on-surface-variant mb-8">The closest equivalent to {color.name} in each major paint brand, ranked by how close the match reads. Always verify with a physical sample. <Link href="/methodology" className="text-primary underline-offset-4 hover:underline whitespace-nowrap">How we calculate match accuracy →</Link></p>
                {/* Side-by-side hero — the single nearest equivalent shown large,
                    so "does this actually match?" is answered visually before
                    the full per-brand matrix below. Whole block links to it. */}
                {topMatch && (
                  <Link
                    href={`/colors/${topMatch.match_color.brand.slug}/${topMatch.match_color.slug}`}
                    className="mb-8 grid grid-cols-[1fr_auto_1fr] items-stretch gap-px rounded-xl overflow-hidden bg-outline-variant/20 hover:shadow-md transition-all"
                  >
                    <div className="p-6 min-h-32 flex flex-col justify-end" style={{ backgroundColor: color.hex }}>
                      <span className={`text-[10px] uppercase tracking-wider ${isLightColor(color.hex) ? "text-black/55" : "text-white/70"}`}>{color.brand.name}</span>
                      <span className={`font-headline font-bold leading-tight ${isLightColor(color.hex) ? "text-black/90" : "text-white"}`}>{color.name}</span>
                    </div>
                    <div className="bg-surface-container-lowest flex flex-col items-center justify-center px-4 py-2 text-center">
                      <span className="text-[10px] uppercase tracking-widest text-outline">{Number(topMatch.delta_e_score) < 2 ? "Nearly identical" : Number(topMatch.delta_e_score) < 5 ? "Very similar" : "Visible difference"}</span>
                    </div>
                    <div className="p-6 min-h-32 flex flex-col justify-end" style={{ backgroundColor: topMatch.match_color.hex }}>
                      <span className={`text-[10px] uppercase tracking-wider ${isLightColor(topMatch.match_color.hex) ? "text-black/55" : "text-white/70"}`}>{topMatch.match_color.brand.name}</span>
                      <span className={`font-headline font-bold leading-tight ${isLightColor(topMatch.match_color.hex) ? "text-black/90" : "text-white"}`}>{topMatch.match_color.name}</span>
                    </div>
                  </Link>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {brandMatrix.map((match) => (
                    <Link key={match.id} href={`/colors/${match.match_color.brand.slug}/${match.match_color.slug}`} className="bg-surface-container-lowest p-6 rounded-lg group cursor-pointer hover:shadow-md transition-all">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-lg shrink-0" style={{ backgroundColor: match.match_color.hex }} />
                        <div className="min-w-0">
                          <h3 className="font-headline font-bold text-on-surface truncate">{match.match_color.name}</h3>
                          <p className="text-[10px] uppercase text-outline tracking-wider">{match.match_color.brand.name}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-on-surface-variant">{Number(match.delta_e_score) < 2 ? "Nearly identical" : Number(match.delta_e_score) < 5 ? "Very similar" : "Visible difference"}</span>
                        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Recommended Pairings — Room Preview */}
      <PairingSelector colorHex={color.hex} colorName={color.name} />

      {/* Complementary Colors */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <ComplementaryColors hex={color.hex} harmonies={harmonies} colorName={color.name} />
      </section>

      {/* Curated Palettes */}
      <section className="bg-tertiary-fixed py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <CuratedPalettes hex={color.hex} brandId={color.brand_id} currentPath={`/colors/${brandSlug}/${colorSlug}`} colorName={color.name} />
        </div>
      </section>

      {/* Similar Colors */}
      {similarColors.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 md:px-12 py-16">
          <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight">Similar {color.brand.name} Colors</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Other {color.brand.name} colors close to {color.name}.</p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {similarColors.map((s) => <ColorCard key={s.id} name={s.name} hex={s.hex} brandName={color.brand.name} brandSlug={brandSlug} colorSlug={s.slug} colorNumber={s.color_number} />)}
          </div>
        </section>
      )}

      {/* More from family — cross-brand colors in the same family. Spreads
          internal link equity into the long tail (H2 from the SEO audit). */}
      {moreFromFamily.length > 0 && color.color_family && (
        <section className="max-w-7xl mx-auto px-6 md:px-12 py-16">
          <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight">More {color.color_family} colors from other brands</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Cross-brand colors in the {color.color_family} family — useful when you want a similar look from a different brand.</p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {moreFromFamily.map((c) => <ColorCard key={c.id} name={c.name} hex={c.hex} brandName={c.brand.name} brandSlug={c.brand.slug} colorSlug={c.slug} colorNumber={c.color_number} />)}
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqItems.length > 0 && (
        <section className="bg-surface-container-low py-16 px-6 md:px-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-8">{color.name} — Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqItems.map((item, i) => (
                <details key={i} className="group bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                  <summary className="flex cursor-pointer items-center justify-between px-6 py-5 font-headline font-bold text-on-surface hover:text-primary transition-colors">
                    {item.question}
                    <svg className="h-5 w-5 shrink-0 text-outline transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                  </summary>
                  <div className="px-6 pb-5 text-sm leading-relaxed text-on-surface-variant">{item.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Keep Exploring */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-8">Explore More with {color.name}</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <TrackedLink href={`/tools/room-visualizer?hex=${encodeURIComponent(color.hex)}`} className="group bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 text-center hover:shadow-lg transition-all duration-500" eventName="cta_click" eventParams={{ cta_label: "room_visualizer", color_name: color.name }}>
            <p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">See It on a Wall</p>
            <p className="mt-2 text-sm text-on-surface-variant">Preview this color in a real room</p>
          </TrackedLink>
          <Link href="/tools/paint-calculator" className="group bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 text-center hover:shadow-lg transition-all duration-500">
            <p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">How Much Paint?</p>
            <p className="mt-2 text-sm text-on-surface-variant">Calculate gallons for your project</p>
          </Link>
          {color.color_family && (
            <Link href={`/colors/family/${color.color_family}`} className="group bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 text-center hover:shadow-lg transition-all duration-500">
              <p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">Browse {color.color_family} Colors</p>
              <p className="mt-2 text-sm text-on-surface-variant">Explore more shades in this family</p>
            </Link>
          )}
        </div>
      </section>

      {/* Related Reading — closes the color -> blog cluster gap the audit
          flagged. Universal links to high-relevance editorial guides. */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-16">
        <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-8">Related Reading</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Link href="/blog/how-to-find-perfect-color-match-across-brands" className="group bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all duration-500">
            <p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">How to Match Paint Colors Across Brands</p>
            <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">The science behind Delta E and CIEDE2000 — find a Behr equivalent of any Sherwin-Williams shade, or a Benjamin Moore alternative when your store is out of stock.</p>
          </Link>
          {color.undertone ? (
            <Link href="/blog/understanding-paint-color-undertones" className="group bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all duration-500">
              <p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">Understanding Paint Color Undertones</p>
              <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">Why {color.name}&apos;s {color.undertone.toLowerCase()} undertone matters more than its surface color — and how to read undertones in any paint chip.</p>
            </Link>
          ) : (
            <Link href="/blog/paint-sheen-guide" className="group bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all duration-500">
              <p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">Paint Sheen Guide</p>
              <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">Flat, eggshell, satin, or semi-gloss — the right finish for {color.name} depends on the room. Here&apos;s how to choose.</p>
            </Link>
          )}
        </div>
      </section>

      {/* JSON-LD — WebPage + DefinedTerm (NOT Product). A paint color is a
          reference/glossary entity, not a product for sale: PaintColorHQ doesn't
          sell paint. The old Product type mis-signaled commerce and pulled pages
          toward Google's Merchant surfaces (#129 stripped the priceless `offers`;
          this drops the Product type itself). WebPage/DefinedTerm is the type-fit
          entity and aids AI/Bing entity comprehension — hygiene, not a rich-results
          play (structured data doesn't lift rankings). Per-color facts stay
          machine-readable via additionalProperty; cross-brand matches stay as
          related DefinedTerms. BreadcrumbList + FAQPage are unchanged below. */}
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `${color.name}${color.color_number ? ` ${color.color_number}` : ""} Paint Color by ${color.brand.name}`,
        url: `https://www.paintcolorhq.com/colors/${brandSlug}/${colorSlug}`,
        description: colorLede,
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: `https://www.paintcolorhq.com/api/og?hex=${encodeURIComponent(color.hex)}&name=${encodeURIComponent(color.name)}&brand=${encodeURIComponent(color.brand.name)}`,
          caption: `Color swatch of ${color.brand.name} ${color.name}`,
          representativeOfPage: true,
        },
        mainEntity: {
          "@type": "DefinedTerm",
          name: `${color.name}${color.color_number ? ` ${color.color_number}` : ""}`,
          ...(color.color_number ? { termCode: color.color_number } : {}),
          description: colorLede,
          url: `https://www.paintcolorhq.com/colors/${brandSlug}/${colorSlug}`,
          image: `https://www.paintcolorhq.com/api/og?hex=${encodeURIComponent(color.hex)}&name=${encodeURIComponent(color.name)}&brand=${encodeURIComponent(color.brand.name)}`,
          inDefinedTermSet: {
            "@type": "DefinedTermSet",
            name: `${color.brand.name} Paint Colors`,
            url: `https://www.paintcolorhq.com/brands/${brandSlug}`,
          },
          // Per-color facts — kept machine-readable for AI/entity comprehension.
          additionalProperty: [
            { "@type": "PropertyValue", name: "Hex", value: color.hex.toUpperCase() },
            { "@type": "PropertyValue", name: "RGB", value: `${color.rgb_r}, ${color.rgb_g}, ${color.rgb_b}` },
            ...(lrv != null ? [{ "@type": "PropertyValue", name: "LRV", value: lrv.toFixed(1) }] : []),
            ...(color.undertone ? [{ "@type": "PropertyValue", name: "Undertone", value: color.undertone }] : []),
            ...(color.color_family ? [{ "@type": "PropertyValue", name: "Color Family", value: color.color_family }] : []),
          ],
        },
        // Near-identical cross-brand equivalents (ΔE < 2) — the moat data, kept as
        // related DefinedTerms so the cross-brand graph stays machine-readable.
        ...(matches.length > 0 && {
          mentions: matches
            .filter((m) => Number(m.delta_e_score) < 2)
            .slice(0, 5)
            .map((m) => ({
              "@type": "DefinedTerm",
              name: `${m.match_color.name}${m.match_color.color_number ? ` ${m.match_color.color_number}` : ""}`,
              ...(m.match_color.color_number ? { termCode: m.match_color.color_number } : {}),
              url: `https://www.paintcolorhq.com/colors/${m.match_color.brand.slug}/${m.match_color.slug}`,
              inDefinedTermSet: {
                "@type": "DefinedTermSet",
                name: `${m.match_color.brand.name} Paint Colors`,
                url: `https://www.paintcolorhq.com/brands/${m.match_color.brand.slug}`,
              },
            })),
        }),
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: color.brand.name, item: `https://www.paintcolorhq.com/brands/${brandSlug}` },
          { "@type": "ListItem", position: 3, name: color.name, item: `https://www.paintcolorhq.com/colors/${brandSlug}/${colorSlug}` },
        ],
      }} />
      {faqItems.length > 0 && <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
      }} />}

      <Footer />
    </div>
  );
}
