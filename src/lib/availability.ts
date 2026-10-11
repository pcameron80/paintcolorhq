import type { ColorAvailability } from "@/lib/types";

// Status copy for colors a brand has retired or discontinued. The sentences
// are verified against each brand's own site (2026-10-11); change them only
// with a new source. No em dashes: house rule for user-facing copy.

export function availabilityLabel(availability: ColorAvailability | undefined | null): string | null {
  if (availability === "retired") return "Retired";
  if (availability === "discontinued") return "Discontinued";
  return null;
}

export function availabilityStatus(
  brandSlug: string,
  brandName: string,
  colorNumber: string | null | undefined,
  availability: ColorAvailability | undefined | null,
): string | null {
  if (availability === "discontinued") {
    return `${brandName} has discontinued this color. The closest current colors from other brands are listed below.`;
  }
  if (availability !== "retired") return null;

  // Fall back to a generic phrase if a row has no color number.
  const code = colorNumber ? `code ${colorNumber}` : "its color code";
  switch (brandSlug) {
    case "behr":
      return `Behr has archived this color. You can still buy it online or in store at The Home Depot using ${code}.`;
    case "sherwin-williams":
      return "Sherwin-Williams has archived this color. It is still sold as paint and Color to Go samples, but not as color chips or peel-and-stick samples.";
    case "farrow-ball":
      return "Farrow & Ball has moved this color to its Archive. Archive colors are made to order and cannot be returned.";
    default:
      return `${brandName} has retired this color from its current palette. It can still be mixed from ${code}.`;
  }
}

export const RETIRED_MATCH_TOOLTIP = "Retired by the brand. Still available by its code.";
