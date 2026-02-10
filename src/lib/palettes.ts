export type PaletteRole = "Walls" | "Trim" | "Accent" | "Pop";

export interface InspirationPalette {
  name: string;
  slug: string;
  description: string;
  colors: string[];
}

export const inspirationPalettes: InspirationPalette[] = [
  {
    name: "Modern Farmhouse",
    slug: "modern-farmhouse",
    description: "Warm neutrals with organic green and soft taupe — relaxed and timeless.",
    colors: ["#d6d0c4", "#f0ece2", "#4a4a48", "#7a8c6e", "#b8a99a"],
  },
  {
    name: "Coastal Retreat",
    slug: "coastal-retreat",
    description: "Airy blues and sandy neutrals — breezy and light-filled.",
    colors: ["#d5e1df", "#f5f0e8", "#2b4c6f", "#c4a87c", "#87b5b0"],
  },
  {
    name: "Moody Library",
    slug: "moody-library",
    description: "Deep greens, burgundy, and aged gold — rich and contemplative.",
    colors: ["#2f4538", "#f2ead3", "#6b2737", "#b8963e", "#4a3728"],
  },
  {
    name: "Scandinavian Minimal",
    slug: "scandinavian-minimal",
    description: "Crisp whites and soft grays with warm wood tones — clean and airy.",
    colors: ["#f4f1ec", "#ffffff", "#b0b8b4", "#d4c1a8", "#e8e3db"],
  },
  {
    name: "Bold & Eclectic",
    slug: "bold-and-eclectic",
    description: "Vibrant yellow, deep blue, and purple accents — energetic and playful.",
    colors: ["#e8c547", "#f7f3ea", "#2d5a7b", "#c1533c", "#6b4e8a"],
  },
  {
    name: "Earthy Organic",
    slug: "earthy-organic",
    description: "Terracotta, sage, and warm beige — grounded and natural.",
    colors: ["#c4a882", "#efe8dd", "#6b4e37", "#8a9a5b", "#d4b896"],
  },
  {
    name: "Soft Romantic",
    slug: "soft-romantic",
    description: "Blush pinks, dusty mauves, and warm cream — gentle and inviting.",
    colors: ["#e8d5d0", "#faf6f3", "#9b7e8a", "#c4956a", "#d4a5b0"],
  },
  {
    name: "Urban Industrial",
    slug: "urban-industrial",
    description: "Cool grays with copper and charcoal — modern and edgy.",
    colors: ["#6d6e70", "#e8e4de", "#3c3c3c", "#b87333", "#a09e9a"],
  },
  {
    name: "Mediterranean Sun",
    slug: "mediterranean-sun",
    description: "Warm terracotta, ocean blue, and sun-bleached white — lively and warm.",
    colors: ["#f5e6d3", "#fefcf7", "#c75c2a", "#2e6b8a", "#e4b87c"],
  },
  {
    name: "Classic Traditional",
    slug: "classic-traditional",
    description: "Navy, burgundy, and antique gold — refined and timeless.",
    colors: ["#2b3a52", "#f2ece0", "#8b2232", "#c5a55a", "#5c6e82"],
  },
  {
    name: "Desert Sunset",
    slug: "desert-sunset",
    description: "Sandstone, burnt sienna, and warm clay — sun-baked and serene.",
    colors: ["#e0c4a8", "#f7ede0", "#c75b3f", "#8b6b4a", "#d4956e"],
  },
  {
    name: "Woodland Cabin",
    slug: "woodland-cabin",
    description: "Forest greens and warm browns — cozy and rustic.",
    colors: ["#5c6b4e", "#e8dfd0", "#8b6b4a", "#3c4a32", "#c4b090"],
  },
  {
    name: "Ocean Breeze",
    slug: "ocean-breeze",
    description: "Clear blues and driftwood neutrals — calm and refreshing.",
    colors: ["#6a9fb5", "#f0f4f3", "#2c5f7c", "#d4c5a9", "#8cbcc8"],
  },
  {
    name: "Midnight Luxe",
    slug: "midnight-luxe",
    description: "Deep navy, champagne, and burnished bronze — elegant and dramatic.",
    colors: ["#1e2a3a", "#e8e0d0", "#7a5c3e", "#c5a55a", "#3a4a5c"],
  },
  {
    name: "Spring Garden",
    slug: "spring-garden",
    description: "Fresh greens, soft peach, and warm cream — bright and uplifting.",
    colors: ["#a8c5a0", "#f5f2eb", "#e8a87c", "#5c8a5e", "#d4d0b8"],
  },
  {
    name: "French Country",
    slug: "french-country",
    description: "Linen, slate blue, and muted gold — understated and charming.",
    colors: ["#d5c8b8", "#f8f4ef", "#7a8c9a", "#b8a070", "#9c8070"],
  },
  {
    name: "Tropical Escape",
    slug: "tropical-escape",
    description: "Emerald, amber, and leafy greens — lush and vibrant.",
    colors: ["#2e8b6e", "#f5efe5", "#e8a030", "#1a6b5a", "#c4d4b8"],
  },
  {
    name: "Vintage Charm",
    slug: "vintage-charm",
    description: "Antique rose, warm taupe, and faded gold — nostalgic and soft.",
    colors: ["#c8b8a0", "#f2ece2", "#8b6b6b", "#a09060", "#d8c8b8"],
  },
];

export function getPaletteBySlug(slug: string): InspirationPalette | undefined {
  return inspirationPalettes.find((p) => p.slug === slug);
}

export function hexToHsl(hex: string): [number, number, number] {
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

export function determineRole(hex: string): PaletteRole {
  const [, s, l] = hexToHsl(hex);
  if (l > 92) return "Trim";
  if (l > 65) return "Walls";
  if (s > 50 && l >= 30 && l <= 70) return "Pop";
  return "Accent";
}

/**
 * Assign roles to a palette of 5 colors ensuring all 4 roles
 * (Trim, Pop, Walls, Accent) are represented. The 5th color
 * gets whichever role fits it best as a duplicate.
 */
export function assignPaletteRoles(hexes: string[]): PaletteRole[] {
  const hsls = hexes.map(hexToHsl);
  const roles: (PaletteRole | null)[] = new Array(hexes.length).fill(null);
  const used = new Set<number>();

  function pickBest(scorer: (i: number) => number): number {
    let bestIdx = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < hexes.length; i++) {
      if (used.has(i)) continue;
      const score = scorer(i);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  // Trim: lightest color
  const trimIdx = pickBest((i) => hsls[i][2]);
  roles[trimIdx] = "Trim";
  used.add(trimIdx);

  // Pop: most saturated of remaining
  const popIdx = pickBest((i) => hsls[i][1]);
  roles[popIdx] = "Pop";
  used.add(popIdx);

  // Walls: lightest of remaining
  const wallsIdx = pickBest((i) => hsls[i][2]);
  roles[wallsIdx] = "Walls";
  used.add(wallsIdx);

  // Accent: darkest of remaining
  const accentIdx = pickBest((i) => 100 - hsls[i][2]);
  roles[accentIdx] = "Accent";
  used.add(accentIdx);

  // 5th color: best individual fit
  for (let i = 0; i < hexes.length; i++) {
    if (!roles[i]) {
      roles[i] = determineRole(hexes[i]);
    }
  }

  return roles as PaletteRole[];
}
