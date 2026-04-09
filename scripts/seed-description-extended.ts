import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ColorRow {
  id: string;
  name: string;
  slug: string;
  color_family: string;
  undertone: string | null;
  lrv: number | null;
  brand_name: string;
  brand_slug: string;
}

// ---------------------------------------------------------------------------
// Room suggestions by color family
// ---------------------------------------------------------------------------

const ROOM_SUGGESTIONS: Record<string, string[]> = {
  beige: [
    'living rooms, bedrooms, and open-plan spaces where you want a warm, welcoming foundation',
    'entryways, dining rooms, and family rooms that benefit from a grounding neutral warmth',
  ],
  black: [
    'accent walls, powder rooms, and statement spaces where drama and sophistication are the goal',
    'home offices, media rooms, and formal dining rooms that call for bold, anchoring depth',
  ],
  blue: [
    'bedrooms, bathrooms, and home offices where calm focus and relaxation matter most',
    'living rooms, reading nooks, and coastal-inspired spaces that benefit from cool serenity',
  ],
  brown: [
    'studies, libraries, and living rooms where you want a cozy, grounded atmosphere',
    'dining rooms, dens, and bedrooms that benefit from rich, earthy warmth',
  ],
  gray: [
    'kitchens, bathrooms, and modern living spaces that need a clean, versatile backdrop',
    'home offices, hallways, and open-plan areas where understated elegance is key',
  ],
  green: [
    'kitchens, sunrooms, and bedrooms where a connection to nature feels refreshing',
    'bathrooms, home offices, and dining rooms that benefit from organic, restful energy',
  ],
  neutral: [
    'any room in the home — its versatility makes it an excellent whole-house color',
    'open-plan living areas, hallways, and transitional spaces that connect rooms',
  ],
  'off-white': [
    'kitchens, bathrooms, and bedrooms where you want brightness with a touch of warmth',
    'living rooms, nurseries, and spaces that need to feel open without the starkness of pure white',
  ],
  orange: [
    'kitchens, dining rooms, and social spaces where energy and warmth set the tone',
    'playrooms, creative studios, and accent walls that benefit from vibrant personality',
  ],
  pink: [
    'bedrooms, bathrooms, and dressing rooms where softness and warmth create intimacy',
    'nurseries, reading nooks, and powder rooms that benefit from gentle, approachable color',
  ],
  purple: [
    'bedrooms, meditation spaces, and formal living rooms where richness and depth feel intentional',
    'powder rooms, accent walls, and creative spaces that embrace bold personality',
  ],
  red: [
    'dining rooms, accent walls, and entryways where energy and warmth make a statement',
    'kitchens, libraries, and living room feature walls that benefit from confident color',
  ],
  white: [
    'any room — from kitchens and bathrooms to bedrooms and hallways — as a clean, timeless foundation',
    'galleries, minimalist spaces, and rooms where you want maximum light reflection and openness',
  ],
  yellow: [
    'kitchens, breakfast nooks, and sunrooms where cheerful energy lifts the mood',
    'hallways, laundry rooms, and children\'s rooms that benefit from sunny warmth',
  ],
};

// ---------------------------------------------------------------------------
// Design style suggestions by color family
// ---------------------------------------------------------------------------

const STYLE_SUGGESTIONS: Record<string, string[]> = {
  beige: ['transitional, farmhouse, traditional, and Mediterranean interiors', 'classic, coastal, rustic, and Japandi-inspired spaces'],
  black: ['modern, industrial, Art Deco, and contemporary interiors', 'minimalist, urban loft, and high-contrast dramatic spaces'],
  blue: ['coastal, Scandinavian, traditional, and Hampton-style interiors', 'nautical, modern farmhouse, and transitional spaces'],
  brown: ['rustic, craftsman, traditional, and mid-century modern interiors', 'lodge, colonial, and warm contemporary spaces'],
  gray: ['modern, minimalist, Scandinavian, and industrial interiors', 'contemporary, transitional, and urban-chic spaces'],
  green: ['organic modern, farmhouse, Arts & Crafts, and biophilic interiors', 'cottagecore, coastal, and Scandinavian-inspired spaces'],
  neutral: ['virtually any design style — from modern to traditional and everything in between', 'transitional, minimalist, farmhouse, and eclectic interiors that need a flexible foundation'],
  'off-white': ['farmhouse, coastal, Scandinavian, and French country interiors', 'transitional, bohemian, and classic traditional spaces'],
  orange: ['mid-century modern, Southwestern, bohemian, and eclectic interiors', 'Mediterranean, global-inspired, and warm contemporary spaces'],
  pink: ['romantic, bohemian, Art Deco, and contemporary interiors', 'Hollywood Regency, Scandi-soft, and modern feminine spaces'],
  purple: ['bohemian, maximalist, Art Deco, and romantic interiors', 'eclectic, jewel-toned, and modern glamour spaces'],
  red: ['traditional, colonial, Asian-inspired, and bold contemporary interiors', 'Mediterranean, eclectic, and classic formal spaces'],
  white: ['minimalist, modern, Scandinavian, and farmhouse interiors', 'coastal, contemporary, and gallery-inspired spaces'],
  yellow: ['farmhouse, cottage, mid-century modern, and coastal interiors', 'bohemian, traditional, and cheerful contemporary spaces'],
};

// ---------------------------------------------------------------------------
// Pairing suggestions by color family + undertone
// ---------------------------------------------------------------------------

const PAIRING_SUGGESTIONS: Record<string, Record<string, string>> = {
  beige: {
    warm: 'terracotta accents, warm wood tones like walnut or oak, and aged brass hardware',
    cool: 'soft gray textiles, cool-toned marble, and brushed nickel or chrome fixtures',
    neutral: 'natural linen, light wood tones, and mixed metals for a balanced, layered look',
  },
  black: {
    warm: 'rich cognac leather, warm brass accents, and deep wood tones like mahogany',
    cool: 'marble surfaces, chrome hardware, and crisp white for clean contrast',
    neutral: 'concrete, raw steel, matte black hardware, and natural stone',
  },
  blue: {
    warm: 'natural wood tones, woven rattan, and warm brass or gold hardware',
    cool: 'white marble, silver accents, and cool gray upholstery',
    neutral: 'sandy beige, driftwood tones, and matte black hardware for a grounded look',
  },
  brown: {
    warm: 'cream and ivory textiles, honey oak, and antique brass',
    cool: 'slate gray, brushed steel, and cool white trim for contrast',
    neutral: 'natural stone, raw linen, and matte bronze hardware',
  },
  gray: {
    warm: 'blush pink accents, warm wood tones, and aged brass hardware',
    cool: 'navy blue accents, white marble, and polished chrome fixtures',
    neutral: 'charcoal textiles, concrete, and matte black hardware for a tonal palette',
  },
  green: {
    warm: 'terracotta, warm wood tones, and aged copper or brass hardware',
    cool: 'crisp white trim, light gray, and brushed nickel accents',
    neutral: 'natural wood, stone, and mixed metals for an organic, grounded palette',
  },
  neutral: {
    warm: 'warm wood tones, camel leather, and gold or brass accents',
    cool: 'cool gray, white marble, and silver or chrome fixtures',
    neutral: 'natural textures — linen, jute, wool — and matte black hardware',
  },
  'off-white': {
    warm: 'natural wood, woven baskets, and warm brass accents for a layered, organic feel',
    cool: 'soft blue-gray accents, white marble, and polished chrome',
    neutral: 'greige textiles, light oak, and understated matte hardware',
  },
  orange: {
    warm: 'deep teal, warm wood tones, and antiqued brass for a rich, global feel',
    cool: 'navy blue, white trim, and matte black for grounding contrast',
    neutral: 'cream, natural jute, and mixed wood tones for an earthy palette',
  },
  pink: {
    warm: 'gold hardware, blush textiles, and warm wood tones like cherry or walnut',
    cool: 'silver accents, cool gray, and white marble for a refined palette',
    neutral: 'dusty rose, natural linen, and matte brass hardware',
  },
  purple: {
    warm: 'gold or brass accents, rich wood tones, and velvet in complementary warm shades',
    cool: 'silver, cool gray, and icy blue accents for a crisp, jeweled palette',
    neutral: 'charcoal, natural linen, and matte black hardware for grounding depth',
  },
  red: {
    warm: 'deep wood tones, gold hardware, and cream textiles for classic richness',
    cool: 'navy, cool gray, and brushed nickel for sophisticated contrast',
    neutral: 'natural stone, tan leather, and black iron hardware for an anchored look',
  },
  white: {
    warm: 'warm wood tones, natural fibers, and aged brass to prevent a clinical feel',
    cool: 'cool gray, marble, and polished chrome for a crisp, gallery-like finish',
    neutral: 'any material palette — white is the ultimate canvas for layering textures and tones',
  },
  yellow: {
    warm: 'natural wood, warm gray, and antique brass for a sunny, welcoming palette',
    cool: 'soft blue accents, white trim, and brushed nickel for a coastal feel',
    neutral: 'gray-green, natural linen, and matte black hardware for a grounded cheerfulness',
  },
};

// ---------------------------------------------------------------------------
// Undertone → lighting behavior
// ---------------------------------------------------------------------------

const LIGHTING_BEHAVIOR: Record<string, string[]> = {
  'Cool (Blue)': [
    'In north-facing rooms, the blue undertone will be amplified, creating a cooler, more serene atmosphere. South-facing light warms it slightly, bringing balance.',
    'Under artificial warm lighting, the blue cool undertone softens noticeably. In daylight, the blue character reads true and crisp.',
  ],
  'Cool (Green)': [
    'North-facing rooms bring out the green undertone beautifully, lending a fresh, natural cast. Warm south-facing light tempers the coolness without losing the green character.',
    'Under cool LED lighting, the green undertone reads clearly. Incandescent light pushes it slightly warmer, which can feel more inviting.',
  ],
  'Cool (Violet)': [
    'In north-facing rooms, the violet undertone emerges more prominently — this can read as sophisticated or moody depending on surrounding colors. South-facing light warms the violet into a softer, more approachable tone.',
    'Cool daylight emphasizes the violet character. Under warm artificial light, the violet softens and can shift toward a muted mauve.',
  ],
  'Neutral': [
    'This color reads consistently across different lighting conditions — a key advantage of a neutral undertone. It won\'t shift dramatically between north- and south-facing rooms.',
    'The neutral undertone means predictable performance under both natural and artificial light. What you see on the swatch is close to what you\'ll get on the wall.',
  ],
  'Warm (Golden)': [
    'South- and west-facing rooms amplify the golden warmth beautifully, especially during afternoon and evening light. In north-facing rooms, the warmth prevents the space from feeling cold.',
    'Under warm incandescent or candlelight, the golden undertone glows richly. Cool daylight keeps it balanced — you get warmth without the color appearing overly yellow.',
  ],
  'Warm (Pink)': [
    'The pink warmth emerges most in south- and west-facing rooms, creating a soft, flattering glow. North-facing rooms temper the pink into a subtler, more muted warmth.',
    'Under warm lighting, the pink undertone reads as a gentle blush warmth. In bright daylight, it stays controlled — warm but not overtly pink.',
  ],
};

// ---------------------------------------------------------------------------
// LRV tiers → practical advice
// ---------------------------------------------------------------------------

function getLrvAdvice(lrv: number | null, colorName: string): string {
  if (lrv === null) return '';
  if (lrv >= 80) {
    return `At LRV ${lrv.toFixed(0)}, ${colorName} is a very light color that reflects a high amount of natural light. It keeps rooms feeling bright and open, making it an excellent choice for small rooms, low-light spaces, hallways, and anywhere you want to maximize the sense of space.`;
  }
  if (lrv >= 60) {
    return `At LRV ${lrv.toFixed(0)}, ${colorName} is a light color that reflects a good amount of natural light. It works well in most rooms and keeps spaces feeling airy without the starkness of a near-white.`;
  }
  if (lrv >= 40) {
    return `At LRV ${lrv.toFixed(0)}, ${colorName} sits in the medium range — light enough to avoid making rooms feel heavy, but with enough depth to add real character. It works well in rooms with decent natural light.`;
  }
  if (lrv >= 20) {
    return `At LRV ${lrv.toFixed(0)}, ${colorName} is a deeper color that absorbs more light than it reflects. It creates cozy, intimate spaces and works best in well-lit rooms or spaces where a dramatic, cocooning effect is desired.`;
  }
  return `At LRV ${lrv.toFixed(0)}, ${colorName} is a very dark color that absorbs most light. Use it intentionally — in accent walls, powder rooms, or statement spaces where bold depth is the goal. Pair with ample lighting to prevent the space from feeling too enclosed.`;
}

// ---------------------------------------------------------------------------
// LRV → small room FAQ answer
// ---------------------------------------------------------------------------

function getSmallRoomAnswer(lrv: number | null, colorName: string): string {
  if (lrv === null) return `Test a large sample in your actual space to see how ${colorName} performs.`;
  if (lrv >= 70) {
    return `Yes — at LRV ${lrv.toFixed(0)}, ${colorName} reflects plenty of light, making it a great choice for small bedrooms, bathrooms, hallways, and other compact spaces where you want to maintain an open, airy feel.`;
  }
  if (lrv >= 40) {
    return `It depends on the room's natural light. At LRV ${lrv.toFixed(0)}, ${colorName} has moderate reflectance — it can work in a small room with good natural light or a large window, but may feel a bit heavy in a windowless space.`;
  }
  return `At LRV ${lrv.toFixed(0)}, ${colorName} is a bold choice for small spaces. It can create a stunning cocooning effect in a small powder room or study, but in a small bedroom with limited light, it may feel too dark. If you love the color, commit fully and pair with lighter trim and good lighting.`;
}

// ---------------------------------------------------------------------------
// Trim FAQ answer by undertone
// ---------------------------------------------------------------------------

function getTrimAnswer(undertone: string | null, colorName: string): string {
  const base = undertone ?? 'Neutral';
  if (base.startsWith('Warm')) {
    return `For ${colorName}, a warm white trim works beautifully — look for options like Benjamin Moore White Dove or Sherwin-Williams Alabaster. These prevent the jarring contrast that a stark cool white can create against warm wall colors. If you prefer more contrast, a clean bright white trim will also work, especially in rooms with plenty of natural light.`;
  }
  if (base.startsWith('Cool')) {
    return `A crisp, clean white trim complements ${colorName}'s cool undertone — options like Benjamin Moore Chantilly Lace or Sherwin-Williams Extra White pair naturally. Avoid warm/creamy whites, which can clash with the cool wall color and create a yellowish appearance on the trim.`;
  }
  return `${colorName}'s neutral undertone gives you flexibility with trim. Both warm whites (like White Dove) and clean whites (like Chantilly Lace) work well. Choose based on the mood you want — warm white for a softer transition, clean white for a crisper contrast.`;
}

// ---------------------------------------------------------------------------
// Style FAQ by color family
// ---------------------------------------------------------------------------

function getStyleFaqAnswer(colorFamily: string, colorName: string): string {
  const styles = STYLE_SUGGESTIONS[colorFamily] ?? STYLE_SUGGESTIONS['neutral'];
  return `${colorName} works particularly well in ${styles[0]}. Its character makes it a natural fit for spaces where you want the color to feel intentional and considered rather than arbitrary.`;
}

// ---------------------------------------------------------------------------
// Determine undertone category (warm/cool/neutral)
// ---------------------------------------------------------------------------

function undertoneCategory(undertone: string | null): 'warm' | 'cool' | 'neutral' {
  if (!undertone) return 'neutral';
  if (undertone.startsWith('Warm')) return 'warm';
  if (undertone.startsWith('Cool')) return 'cool';
  return 'neutral';
}

// ---------------------------------------------------------------------------
// Pick a deterministic variant using a simple hash
// ---------------------------------------------------------------------------

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pick<T>(arr: T[], seed: string): T {
  return arr[simpleHash(seed) % arr.length];
}

// ---------------------------------------------------------------------------
// Generate description_extended content for one color
// ---------------------------------------------------------------------------

function generateContent(color: ColorRow): string {
  const family = color.color_family ?? 'neutral';
  const undertone = color.undertone;
  const uCat = undertoneCategory(undertone);
  const lrv = color.lrv;
  const name = color.name;
  const displayName = `${color.brand_name} ${name}`;
  const seed = `${color.id}-${color.slug}`;

  // Room suggestion
  const rooms = ROOM_SUGGESTIONS[family] ?? ROOM_SUGGESTIONS['neutral'];
  const roomSuggestion = pick(rooms, seed);

  // Style suggestion
  const styles = STYLE_SUGGESTIONS[family] ?? STYLE_SUGGESTIONS['neutral'];
  const styleSuggestion = pick(styles, seed + '-style');

  // Pairing suggestion
  const pairingMap = PAIRING_SUGGESTIONS[family] ?? PAIRING_SUGGESTIONS['neutral'];
  const pairingSuggestion = pairingMap[uCat] ?? pairingMap['neutral'];

  // Lighting behavior
  const lightingOptions = LIGHTING_BEHAVIOR[undertone ?? 'Neutral'] ?? LIGHTING_BEHAVIOR['Neutral'];
  const lightingNote = pick(lightingOptions, seed + '-light');

  // LRV advice
  const lrvAdvice = getLrvAdvice(lrv, name);

  // Build main section
  const lines: string[] = [];
  lines.push(`**Using ${displayName} in Your Home**`);
  lines.push('');
  lines.push(`${displayName} is a strong choice for ${roomSuggestion}. It suits ${styleSuggestion}, and pairs naturally with ${pairingSuggestion}.`);
  lines.push('');
  if (lrvAdvice) {
    lines.push(lrvAdvice);
    lines.push('');
  }
  lines.push(lightingNote);
  lines.push('');

  // FAQ section
  lines.push('**FAQ**');
  lines.push(`- *What trim color works best with ${name}?* ${getTrimAnswer(undertone, name)}`);
  lines.push(`- *Is ${name} good for small or dark rooms?* ${getSmallRoomAnswer(lrv, name)}`);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main — batch update in pages of 1000
// ---------------------------------------------------------------------------

const BATCH_SIZE = 1000;
const UPDATE_CHUNK = 50;

async function main() {
  console.log('Starting description_extended seed script...');

  let totalUpdated = 0;
  let page = 0;

  while (true) {
    // Fetch colors missing description_extended, joined with brand name
    const { data: colors, error } = await supabase
      .from('colors')
      .select('id, name, slug, color_family, undertone, lrv, brand_id, brands!inner(name, slug)')
      .or('description_extended.is.null,description_extended.eq.')
      .range(page * BATCH_SIZE, (page + 1) * BATCH_SIZE - 1)
      .order('id');

    if (error) {
      console.error('Error fetching colors:', error.message);
      process.exit(1);
    }

    if (!colors || colors.length === 0) {
      break;
    }

    console.log(`Page ${page + 1}: processing ${colors.length} colors...`);

    // Map to our type
    const rows: ColorRow[] = colors.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      color_family: c.color_family,
      undertone: c.undertone,
      lrv: c.lrv ? parseFloat(c.lrv) : null,
      brand_name: c.brands.name,
      brand_slug: c.brands.slug,
    }));

    // Generate content and update in chunks
    for (let i = 0; i < rows.length; i += UPDATE_CHUNK) {
      const chunk = rows.slice(i, i + UPDATE_CHUNK);
      const promises = chunk.map(async (color) => {
        const content = generateContent(color);
        const { error: updateError } = await supabase
          .from('colors')
          .update({ description_extended: content })
          .eq('id', color.id);
        if (updateError) {
          console.error(`  Failed to update ${color.name} (${color.id}):`, updateError.message);
          return 0;
        }
        return 1;
      });
      const results = await Promise.all(promises);
      totalUpdated += results.reduce((a, b) => a + b, 0);
    }

    console.log(`  Updated so far: ${totalUpdated}`);

    if (colors.length < BATCH_SIZE) {
      break;
    }
    page++;
  }

  console.log(`\nDone. Total rows updated: ${totalUpdated}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
