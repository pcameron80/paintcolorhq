// Palette lane — every curated inspiration palette as a programmatic
// multi-color Pinterest pin (board: Color Palettes). Image is the programmatic
// /api/pin/palette swatch stack; data comes from src/lib/palettes.ts. No image
// generation — these render server-side like the swatch lane.
import { inspirationPalettes, assignPaletteRoles } from "../../../src/lib/palettes.ts";
import type { PinSpec } from "../batch-may26.ts";

const SITE = "https://www.paintcolorhq.com";
const UTM = "?utm_source=Pinterest&utm_medium=organic&utm_campaign=palette-drip";

export function palettePins(): PinSpec[] {
  return inspirationPalettes.map((p) => {
    const roles = assignPaletteRoles(p.colors);
    const colors = p.colors.map((hex, i) => `${hex}:${roles[i] ?? ""}`).join(",");
    const params = new URLSearchParams({
      name: p.name,
      description: p.description,
      colors,
    });
    const title = `${p.name} — ${p.colors.length}-Color Paint Palette`;
    return {
      id: 0,
      key: `palette-${p.slug}`,
      type: "palette",
      board: "Color Palettes",
      theme: p.slug,
      format: "palette",
      name: p.name,
      image: "",
      imageUrl: `${SITE}/api/pin/palette?${params.toString()}`,
      prompt: "",
      title: title.length > 100 ? title.slice(0, 97) + "..." : title,
      description: `${p.description} A cross-brand matched ${p.colors.length}-color scheme — see every color and where to buy it at PaintColorHQ.`,
      link: `${SITE}/inspiration/${p.slug}${UTM}`,
    } as PinSpec;
  });
}
