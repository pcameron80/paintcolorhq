import type { ColorWithBrand, CrossBrandMatchWithColor } from "./types";
import { hexToHsl } from "./palettes";

// ---------- Derived color properties ----------

type Temperature = "warm" | "cool" | "neutral";
type LightnessCategory = "very light" | "light" | "medium" | "deep" | "dark";

interface DerivedProps {
  temperature: Temperature;
  lightness: LightnessCategory;
  isAchromatic: boolean;
  hue: number;
}

function deriveProps(color: ColorWithBrand): DerivedProps {
  const [h, s, l] = hexToHsl(color.hex);
  const lrv = color.lrv != null ? Number(color.lrv) : null;
  const labA = color.lab_a != null ? Number(color.lab_a) : null;
  const labB = color.lab_b_val != null ? Number(color.lab_b_val) : null;

  const isAchromatic = s < 8;

  // Temperature: use LAB a* if available, else hue
  let temperature: Temperature;
  if (isAchromatic) {
    if (labA != null && labB != null) {
      temperature = labA > 1 || labB > 2 ? "warm" : labA < -1 || labB < -2 ? "cool" : "neutral";
    } else {
      temperature = "neutral";
    }
  } else if (labA != null) {
    if (labA > 3) temperature = "warm";
    else if (labA < -3) temperature = "cool";
    else if (h >= 15 && h < 75) temperature = "warm";
    else if (h >= 75 && h < 165) temperature = "cool";
    else if (h >= 165 && h < 260) temperature = "cool";
    else temperature = "warm";
  } else {
    if (h >= 15 && h < 75) temperature = "warm";
    else if (h >= 260 || h < 15) temperature = "warm";
    else temperature = "cool";
  }

  // Lightness from LRV (preferred) or HSL
  let lightness: LightnessCategory;
  const lightnessVal = lrv ?? l;
  if (lightnessVal >= 82) lightness = "very light";
  else if (lightnessVal >= 55) lightness = "light";
  else if (lightnessVal >= 30) lightness = "medium";
  else if (lightnessVal >= 12) lightness = "deep";
  else lightness = "dark";

  return { temperature, lightness, isAchromatic, hue: h };
}

// ---------- Hue name helper ----------

function getHueName(hue: number): string {
  if (hue < 15) return "red";
  if (hue < 40) return "orange";
  if (hue < 70) return "yellow";
  if (hue < 150) return "green";
  if (hue < 200) return "teal";
  if (hue < 260) return "blue";
  if (hue < 290) return "purple";
  if (hue < 330) return "magenta";
  return "red";
}

// ---------- SEO query-targeting sentences ----------

function getQueryTargetingSentences(
  color: ColorWithBrand,
  matches: CrossBrandMatchWithColor[],
  props: DerivedProps
): string {
  const family = color.color_family || getHueName(props.hue);
  const hex = color.hex.toUpperCase();
  const tempWord = props.temperature === "neutral" ? "neutral" : props.temperature;

  // "What color is X" — directly answers the most common query pattern
  const whatColorIs = `What color is ${color.name}? It's a ${props.lightness} ${tempWord} ${family} with the hex code ${hex}.`;

  // "Colors similar to X" — answers "colors similar to" / "colors close to" queries
  const closeMatches = matches.filter((m) => Number(m.delta_e_score) < 3).slice(0, 3);
  let similarColors = "";
  if (closeMatches.length >= 2) {
    const names = closeMatches.map(
      (m) => `${m.match_color.brand.name} ${m.match_color.name}`
    );
    similarColors = `Colors similar to ${color.name} include ${names.join(", ")}.`;
  }

  // Undertone callout for "{color} undertones" queries
  const undertoneCallout = color.undertone
    ? `${color.name} has a ${color.undertone.toLowerCase()} undertone, which affects how it pairs with trim, flooring, and adjacent wall colors.`
    : "";

  return [whatColorIs, similarColors, undertoneCallout].filter(Boolean).join(" ");
}

// ---------- Public API ----------

export function generateColorDescription(
  color: ColorWithBrand,
  matches: CrossBrandMatchWithColor[]
): string {
  const props = deriveProps(color);
  return getQueryTargetingSentences(color, matches, props);
}

export function generateMetaDescription(color: ColorWithBrand): string {
  const props = deriveProps(color);
  const family = color.color_family || getHueName(props.hue);
  const lrv = color.lrv != null ? Math.round(Number(color.lrv)) : null;
  const colorNum = color.color_number ? ` (${color.color_number})` : "";
  const lrvPart = lrv != null ? `, LRV ${lrv}` : "";
  const undertonePart = color.undertone ? `, ${color.undertone.toLowerCase()} undertone` : "";

  const result = `${color.name}${colorNum} by ${color.brand.name} — ${color.hex.toUpperCase()}${lrvPart}${undertonePart}. ${family} with cross-brand matches from 14 paint brands.`;

  if (result.length <= 160) return result;
  const trimmed = result.slice(0, 157);
  const lastSpace = trimmed.lastIndexOf(" ");
  return trimmed.slice(0, lastSpace > 120 ? lastSpace : 157) + "...";
}
