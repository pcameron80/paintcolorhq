/**
 * Shared caption + eligibility logic for the social cross-posters (Instagram,
 * Facebook). Both networks pull from the same Pinterest QUEUE; this module keeps
 * their copy identical and on-message: discover the color you love → see it in a
 * room → find where to buy it. Never "match across brands."
 */
import type { PinSpec } from "./pinterest/queue.ts";

export type Network = "instagram" | "facebook";

/** Only pins whose image is a public /api/pin* URL can be cross-posted. */
export function eligible(p: PinSpec): boolean {
  return Boolean(p.imageUrl && p.imageUrl.includes("/api/pin"));
}

/** Force the 4:5 render (1080×1350) — IG rejects 2:3, and 4:5 suits FB too. */
export function imageUrl4x5(p: PinSpec): string {
  return `${p.imageUrl}&ar=4:5`;
}

/** Re-tag a pin's destination link for Facebook click attribution. */
export function fbLink(p: PinSpec): string {
  return p.link.replace(/utm_source=[^&]+&utm_medium=[^&]+/, "utm_source=facebook&utm_medium=social");
}

/**
 * LRV → plain-language character, in the site's no-raw-numbers voice. High-LRV
 * warm families (yellow/orange/red/brown) are off-whites in practice — Alabaster
 * is family "yellow" but reads as a warm white; don't call those by their family.
 */
function characterNoun(lrv: number | null, family: string): string {
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

export function hashtagsFor(p: PinSpec): string {
  const generic = ["paintcolors", "paint", "interiordesign", "homedecor", "homeimprovement", "colorinspiration"];
  const themeTag = (p.theme || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  const skip = new Set(["", "color", "swatch", "guide", "paint"]);
  const tags = [...generic];
  if (!skip.has(themeTag)) tags.push(`${themeTag}paint`);
  return tags.map((t) => `#${t}`).join(" ");
}

/**
 * Build a caption for the given network. Instagram can't have clickable links,
 * so it points to the bio; Facebook gets the real (FB-attributed) destination.
 */
export function buildCaption(p: PinSpec, network: Network): string {
  const isGuide = p.type !== "swatch";
  const verb = isGuide
    ? "Discover the colors, picture them in your space, and find where to buy"
    : "See it in a real room and find the best place to buy it";
  const cta =
    network === "facebook"
      ? `✨ ${verb}:\n${fbLink(p)}`
      : `✨ ${verb} 👇\npaintcolorhq.com (link in bio)`;

  let lead: string;
  let body: string;
  if (!isGuide) {
    const params = new URL(p.imageUrl!).searchParams;
    const name = params.get("name") ?? p.name;
    const code = params.get("code") ?? "";
    const lrvRaw = params.get("lrv");
    const lrv = lrvRaw ? parseInt(lrvRaw, 10) : null;
    const family = params.get("family") ?? p.theme;
    lead = [params.get("brand") ?? "", name, code].filter(Boolean).join(" ");
    const character = colorCharacter(lrv, family);
    body = `${character.charAt(0).toUpperCase()}${character.slice(1)}${lrv != null ? ` (LRV ${lrv})` : ""}.`;
  } else {
    lead = p.name;
    body = p.description;
  }
  return [lead, "", body, "", cta, "", hashtagsFor(p)].join("\n");
}
