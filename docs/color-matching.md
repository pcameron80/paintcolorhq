# Color Matching Algorithm

## Overview

Paint Color HQ uses the **CIEDE2000 (Delta E 2000)** algorithm to find perceptually similar colors across paint brands. This is the industry-standard color difference formula used by paint manufacturers, textile companies, and printing.

## Why CIEDE2000?

Simple RGB/hex distance doesn't match how humans perceive color differences. Two colors can be far apart in RGB space but look identical to the human eye, and vice versa.

CIEDE2000 works in the CIELAB color space, which is designed to be perceptually uniform -- equal numerical distances correspond to roughly equal perceived differences.

**Delta E interpretation:**

| Delta E | Meaning |
|---------|---------|
| 0 - 1 | Imperceptible (identical to human eye) |
| 1 - 2 | Very close (perceptible only by trained observer) |
| 2 - 3.5 | Close (noticeable but acceptable match) |
| 3.5 - 5 | Noticeable difference |
| 5 - 10 | Obvious difference |
| > 10 | Different colors |

## Color Space Conversion Pipeline

```
Hex (#D1CBC1)
    |
    v
RGB (209, 203, 193)
    |
    v  [sRGB linearization]
Linear RGB
    |
    v  [sRGB to XYZ matrix, D65 illuminant]
XYZ (D65)
    |
    v  [CIE standard conversion]
CIELAB (L=82.3, a=1.2, b=5.8)
    |
    v  [CIEDE2000 formula]
Delta E score
```

## Implementation

All color math is in `scripts/lib/color-utils.ts`.

### Functions

**`hexToRgb(hex)`** - Parse hex string to RGB values.

**`rgbToLab(r, g, b)`** - Full sRGB to CIELAB conversion:
1. Linearize sRGB (inverse gamma)
2. Apply sRGB-to-XYZ matrix (D65 illuminant)
3. Convert XYZ to CIELAB using D65 reference white (Xn=0.95047, Yn=1.0, Zn=1.08883)

**`deltaE2000(lab1, lab2)`** - Full CIEDE2000 implementation with:
- Lightness, chroma, and hue difference components
- Weighting factors kL=kC=kH=1 (standard)
- Rotation term (RT) for blue region correction
- All edge cases handled (achromatic colors, hue angle wrapping)

**`calculateLrv(r, g, b)`** - Light Reflectance Value (0-100), used for lighting requirements.

### Validation

The Delta E implementation is validated against all **34 official Sharma et al. test pairs** from the CIEDE2000 reference paper. All pass with sub-0.001 accuracy.

Run the self-test:
```bash
npx tsx scripts/lib/color-utils.ts
# Output: 45 passed, 0 failed
```

## Cross-Brand Matching Process

**Script:** `scripts/compute-matches.ts`

For each of the 22,807 colors:
1. Pre-compute CIELAB values (stored as Float64Arrays for performance)
2. Compare against all colors from every *other* brand
3. Track the top 5 closest matches per target brand using sorted insertion
4. Store results as `{ source, match, delta_e_score, rank }`

**Output:** 1,482,455 match records across all brand pairs.

### Performance Optimizations

- **Float64Array storage**: Lab values stored in typed arrays for CPU cache efficiency
- **Sorted insertion with binary search**: Maintains top-5 per brand without sorting the full list
- **Brand-at-a-time processing**: Processes one source brand at a time to bound memory
- **Progress logging**: Reports rate and ETA every 1000 colors

## Display on Color Pages

On each color detail page (`/colors/[brand]/[color]`), matches are:
1. Fetched from `cross_brand_matches` table via Supabase join
2. Grouped by target brand
3. Sorted by Delta E score (ascending = most similar first)
4. Displayed with color swatches, hex codes, and human-readable Delta E labels

Labels shown to users:
- Delta E 0-2: "very close"
- Delta E 2-3.5: "close"
- Delta E 3.5-5: "close"
- Delta E 5-10: "noticeable difference"
- Delta E > 10: "significant difference"

## Caveats

The site displays this disclaimer on all match pages:

> "Closest digital match based on color values. Pigments and finishes differ between brands -- always verify with physical samples."

Digital hex values cannot capture:
- Paint finish (matte vs satin vs gloss)
- Pigment formulation differences
- Substrate and lighting effects
- Metamerism (colors matching under one light but not another)
