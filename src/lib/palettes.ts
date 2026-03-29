export type PaletteRole = "Walls" | "Trim" | "Accent" | "Pop";

export interface InspirationPalette {
  name: string;
  slug: string;
  description: string;
  body?: string;
  colors: string[];
}

export const inspirationPalettes: InspirationPalette[] = [
  {
    name: "Modern Farmhouse",
    slug: "modern-farmhouse",
    description: "Warm neutrals with organic green and soft taupe — relaxed and timeless.",
    body: "The Modern Farmhouse palette draws its warmth from the same sources that define the style itself: weathered wood, aged linen, and the muted greens of kitchen herb gardens. It is a palette built for comfort rather than drama, anchored by soft taupes and warm whites that recede quietly into the background while organic green and charcoal accents do the detail work.\n\nThis palette works best in open-plan spaces where walls, trim, and cabinetry are all visible at once. Use the warm taupe on main walls, the creamy white for trim and ceiling, and the muted charcoal on a kitchen island, fireplace surround, or exterior door. The sage green functions beautifully as an accent in a mudroom, laundry room, or powder bath where you can commit to a single feature color without overwhelming the space.\n\nFor living rooms, pair the warm white walls with natural linen upholstery, shiplap paneling in the same white family, and brass or matte black hardware. The palette handles natural light well — south-facing rooms bring out the golden warmth, while north-facing spaces benefit from the slightly warmer taupe tones that prevent the palette from reading as gray. Layer in textured textiles in jute, cotton, and wool to anchor the organic, handcrafted feeling that defines modern farmhouse at its best.",
    colors: ["#d6d0c4", "#f0ece2", "#4a4a48", "#7a8c6e", "#b8a99a"],
  },
  {
    name: "Coastal Retreat",
    slug: "coastal-retreat",
    description: "Airy blues and sandy neutrals — breezy and light-filled.",
    body: "The Coastal Retreat palette is built around the sensory experience of being near the water: the pale aqua of shallow tidal flats, the deep navy of open ocean, the warm sand of a late-afternoon beach. It is a palette that performs exceptionally well in spaces with natural light and a connection to the outdoors — sunrooms, screened porches, master bedrooms, and open-plan kitchens where windows bring the outside in.\n\nThe light aqua-gray is the workhorse of this palette — it reads as nearly white in bright light and shifts to a soft blue-green in shadow, giving walls a living quality that changes through the day. Use the warm sandy neutral for trim and cabinetry to prevent the palette from reading as cold. Deep navy works best as a grounding accent: a fireplace wall, built-in bookshelves, or the cabinetry in a primary bathroom.\n\nFor rooms facing north or east, be cautious with the deep navy as a primary wall color — without warm light, it can feel heavy. Instead, use navy for a single feature element and keep walls in the aqua-gray or sandy neutral. Pair with natural materials — whitewashed oak floors, linen drapery, rattan furniture, and woven cotton throws — to complete the effortless coastal aesthetic without tipping into nautical kitsch.",
    colors: ["#d5e1df", "#f5f0e8", "#2b4c6f", "#c4a87c", "#87b5b0"],
  },
  {
    name: "Moody Library",
    slug: "moody-library",
    description: "Deep greens, burgundy, and aged gold — rich and contemplative.",
    body: "The Moody Library palette is for rooms that take themselves seriously. Deep forest green, aged burgundy, and warm antique gold evoke the atmosphere of a Victorian reading room — walls lined with books, the glow of a brass desk lamp, the smell of old paper and leather. This palette requires commitment: it is not subtle, and it transforms a room completely.\n\nThe deep forest green is the defining color of the palette. On four walls of a home office, study, or dining room, it creates a sense of enclosed richness that feels both intimate and sophisticated. The aged parchment tone works as the critical relief — use it generously on trim, ceiling, built-in shelving, and any architectural detail you want to highlight against the dark walls. The burgundy functions best as a single accent: an upholstered reading chair, a vintage rug, or a painted door.\n\nThe aged gold is the secret element — it appears in brass hardware, picture frames, lamp bases, and candlesticks, tying the palette together without requiring a painted surface. This palette is most successful in rooms with warm incandescent or candlelight-style lighting; LED cool-white bulbs will kill the richness. It works especially well in dining rooms, home libraries, and primary bedrooms where a sense of drama and seclusion is the goal rather than the problem to solve.",
    colors: ["#2f4538", "#f2ead3", "#6b2737", "#b8963e", "#4a3728"],
  },
  {
    name: "Scandinavian Minimal",
    slug: "scandinavian-minimal",
    description: "Crisp whites and soft grays with warm wood tones — clean and airy.",
    body: "Scandinavian design philosophy is fundamentally about light — maximizing it, celebrating it, and letting it do most of the visual work in a space. This palette reflects that priority: bright white, warm cream, and soft gray form a tonal background that bounces light around the room, while warm wood tones provide the organic grounding that prevents the palette from feeling clinical.\n\nThe off-white warm cream is the ideal Scandinavian wall color — it reads as white in bright light but prevents the cold, institutional feeling that true bright white can create in northern-facing rooms or on cloudy days. The soft gray works beautifully on a single feature wall or as a cabinet color in a kitchen or bathroom. Keep the palette tight: resist the urge to introduce additional colors and let the variation in textures — natural oak, linen, concrete, leather — provide visual interest instead.\n\nThis palette is remarkably forgiving across room sizes and orientations. In small spaces, the light palette expands the perceived volume. In large, open spaces, it creates visual coherence without monotony. The key material pairings are natural oak (light, not orange-toned), brushed steel or matte black hardware, white-painted plaster walls with visible texture, and simple linen or cotton textiles in white and oatmeal. Avoid glossy finishes — matte and eggshell sheens maintain the soft, diffused light quality that defines the style.",
    colors: ["#f4f1ec", "#ffffff", "#b0b8b4", "#d4c1a8", "#e8e3db"],
  },
  {
    name: "Bold & Eclectic",
    slug: "bold-and-eclectic",
    description: "Vibrant yellow, deep blue, and purple accents — energetic and playful.",
    body: "The Bold & Eclectic palette is for people who use color with full confidence. Vibrant golden yellow, rich navy, deep terracotta, and moody purple — this is not a palette that hedges. It is inspired by the maximalist interiors of artists, collectors, and travelers who understand that a space without color risk is a space without personality.\n\nThe warm ivory background is non-negotiable — it provides the breathing room the bolder colors need to coexist without chaos. Think of it as the museum wall against which the art hangs. From there, each bold color should be used with intention: the golden yellow on a single statement wall or in upholstery, the deep teal-blue on built-in shelving or kitchen cabinetry, the terracotta in accessories and artwork, the deep purple reserved for a single dramatic element like a reading chair or velvet sofa.\n\nThis palette thrives in eclectic, collected spaces where no single decorating style dominates. A living room with vintage pieces alongside modern art, a kitchen that mixes open shelving with patterned tile, a home office that refuses to be boring — these are the right rooms for this palette. The key is variety in scale: large areas of the ivory background, medium areas of the blue or yellow, and small punctuations of terracotta and purple. Natural light amplifies the vibrancy; in low-light rooms, the colors intensify into something even more dramatic.",
    colors: ["#e8c547", "#f7f3ea", "#2d5a7b", "#c1533c", "#6b4e8a"],
  },
  {
    name: "Earthy Organic",
    slug: "earthy-organic",
    description: "Terracotta, sage, and warm beige — grounded and natural.",
    body: "The Earthy Organic palette connects interior spaces to the natural world through color drawn directly from it: the warm beige of dry clay, the muted yellow-green of Mediterranean sage, the rich brown of aged wood and fertile soil. This is the palette of biophilic design — interiors intentionally designed to evoke nature, reduce stress, and create a sense of rootedness.\n\nWarm beige is the dominant tone and should cover the most surface area: main walls, ceilings in lower-contrast rooms, and large upholstered pieces. Sage green is the palette's most versatile accent — it works on feature walls, in kitchens as cabinet paint, and in bathrooms as tile grout or paint. The rich chocolate brown appears in wood furniture, exposed beams, leather upholstery, and objects rather than on painted surfaces. The lighter sandy tan bridges the beige and terracotta tones, excellent for trim or as a secondary wall color in adjacent spaces.\n\nThis palette harmonizes beautifully with natural materials: raw linen, unbleached cotton, terracotta tile, woven jute, rattan, and live-edge wood. It is the right choice for living rooms, dining rooms, and bedrooms where a warm, grounded atmosphere is the goal. North-facing rooms benefit from the warmer beige and brown tones; south-facing rooms can handle more of the sage green. Introduce plants generously — the living green of actual foliage amplifies the earthy palette more than any paint color can.",
    colors: ["#c4a882", "#efe8dd", "#6b4e37", "#8a9a5b", "#d4b896"],
  },
  {
    name: "Soft Romantic",
    slug: "soft-romantic",
    description: "Blush pinks, dusty mauves, and warm cream — gentle and inviting.",
    body: "The Soft Romantic palette is the antidote to cold, minimal interiors. Blush pink, dusty mauve, warm cream, and soft caramel come together in a palette that is undeniably feminine without being precious — the difference between a room that feels like a luxury hotel suite and one that feels like an Easter basket. The key is in the desaturation: these are not bright, candy pinks but muted, complex tones with gray and warm undertones that give them sophistication.\n\nThe warm cream is the palette's anchor — use it on walls, ceilings, and trim throughout the space to create a continuous warm envelope. Blush pink works beautifully on a single bedroom wall, as upholstery on a statement chair or headboard, or in a bathroom as the primary wall color where the smaller space allows a more confident use of the tone. Dusty mauve — the most complex color in the palette — is ideal for curtains, a velvet sofa, or a secondary accent wall.\n\nThis palette is most at home in bedrooms and primary bathrooms, where the intimacy of the space suits the gentle warmth of the colors. It also works unexpectedly well in dining rooms, where warm pink tones are flattering in candlelight and create an atmosphere of conviviality. Pair with unlacquered brass hardware, soft wool textiles in cream and blush, and wood tones that lean toward warm honey rather than cool gray. Keep patterns subtle — tone-on-tone textures and quiet floral prints rather than bold graphic repeats.",
    colors: ["#e8d5d0", "#faf6f3", "#9b7e8a", "#c4956a", "#d4a5b0"],
  },
  {
    name: "Urban Industrial",
    slug: "urban-industrial",
    description: "Cool grays with copper and charcoal — modern and edgy.",
    body: "The Urban Industrial palette translates the raw aesthetic of converted warehouses and loft apartments into a livable, considered color scheme. Cool medium gray, warm off-white, deep charcoal, aged copper, and warm greige work together to capture the tension between industrial honesty and comfortable habitation — spaces that feel real and undecorated even when they are anything but.\n\nThe cool medium gray is the palette's dominant tone, best applied to main walls in living areas and bedrooms. It is a gray with subtle blue undertones — it reads as serious rather than warm, and it provides the right backdrop for both raw materials and polished furniture. Deep charcoal is the shadow color of the palette: ideal for a feature wall, kitchen island cabinetry, or exposed steel elements that need to feel intentional rather than accidental. The aged copper is the palette's warmth — it appears in pendant light fixtures, cabinet pulls, exposed pipe details, and accessory objects rather than on painted walls.\n\nThe materials that define this palette are as important as the colors: exposed concrete (or concrete-look tile), raw or blackened steel, reclaimed wood with visible grain and wear, Edison bulb lighting, and leather with an aged patina. Open shelving in black steel with reclaimed wood shelves, subway tile in the gray-to-white range, and pendant lights with copper or brass accents complete the vocabulary. This palette works in kitchens, living rooms, home offices, and any space where visible structure — beams, pipes, ductwork — is a feature rather than something to hide.",
    colors: ["#6d6e70", "#e8e4de", "#3c3c3c", "#b87333", "#a09e9a"],
  },
  {
    name: "Mediterranean Sun",
    slug: "mediterranean-sun",
    description: "Warm terracotta, ocean blue, and sun-bleached white — lively and warm.",
    body: "The Mediterranean Sun palette captures the visual language of Southern European coastal architecture — whitewashed walls against a deep blue sky, terracotta roof tiles warming in the afternoon heat, the golden light that seems to bleach everything slightly and deepen shadows simultaneously. It is a palette of strong contrasts and vivid warmth, built for spaces that are meant to feel alive.\n\nThe sun-bleached warm white anchors the palette and should dominate wall surfaces. In a kitchen or bathroom, it works as the primary tile color. The terracotta is the palette's heart — use it on a single dining room wall, as kitchen or bathroom tile on the floor, or as the exterior color of a home in a warm climate. The deep Mediterranean blue provides the essential contrast: a front door, a tiled niche, garden pots, or a painted island in a white kitchen. The golden amber appears in warm wood tones, woven baskets, and ceramic objects.\n\nThis palette needs warmth to perform at its best — south-facing rooms in sunny climates are ideal, where the natural light amplifies the terracotta and golden tones. In northern climates or north-facing rooms, use the palette at reduced saturation: lighter terracotta, more of the warm white, and the blue as a smaller accent. Pair with Moroccan-style encaustic tile, hand-thrown ceramic tableware, natural fiber rugs with geometric patterns, and iron or wrought-steel fixtures. Lush potted plants — olive trees, fig, rosemary — complete the atmosphere.",
    colors: ["#f5e6d3", "#fefcf7", "#c75c2a", "#2e6b8a", "#e4b87c"],
  },
  {
    name: "Classic Traditional",
    slug: "classic-traditional",
    description: "Navy, burgundy, and antique gold — refined and timeless.",
    body: "The Classic Traditional palette is rooted in the design vocabulary of American and British traditional interiors that have endured for decades: the navy study walls of an English country house, the burgundy dining room of a Federal-style townhouse, the antique gold hardware and framing details that tie everything together with warmth and substance. This is the palette of rooms that are meant to age gracefully.\n\nDeep navy is the signature color — use it in the study, library, or dining room where its depth creates a sense of focus and occasion. The warm antique parchment is the essential foil: as wall color in adjacent rooms, as ceiling color in the navy room, and as upholstery fabric in cream or ivory linen. Burgundy is most effective as a single accent: a pair of upholstered chairs, a velvet settee, or a patterned area rug where it appears as one of several colors.\n\nAntique gold is the tonal thread that connects the palette — it appears in brass picture frames, mirror frames, lamp bases, cabinet hardware, and decorative objects. Use it liberally in accessories but avoid painting any surface gold. The steel blue variant of the navy provides a lighter alternative for bedrooms and sitting rooms where the deepest navy might feel heavy. This palette is most successful in formal rooms with high ceilings, crown molding, and architectural detail that gives the traditional furnishings proper context. Pair with Persian or Oriental rugs, mahogany or walnut furniture, leather-bound books, and heavy linen or velvet drapery in ivory or burgundy.",
    colors: ["#2b3a52", "#f2ece0", "#8b2232", "#c5a55a", "#5c6e82"],
  },
  {
    name: "Desert Sunset",
    slug: "desert-sunset",
    description: "Sandstone, burnt sienna, and warm clay — sun-baked and serene.",
    body: "The Desert Sunset palette is drawn from the specific quality of light that occurs in the American Southwest in the hour before dark: sandstone walls turning amber, the sky deepening from gold to burnt orange to violet, the earth itself seeming to radiate warmth absorbed over a long day. It is a palette of sustained heat and unhurried beauty.\n\nWarm sandstone dominates this palette and should form the primary wall color throughout. It reads as a complex warm beige in most lighting — picking up gold in direct sun, shifting toward amber in warm artificial light, cooling slightly toward stone in shade. Burnt sienna is the palette's most characteristic color: use it boldly on a fireplace surround, a built-in bookcase, or the exterior stucco of a Southwestern-style home. The lighter peach-clay tone bridges the sandstone and burnt sienna, working well as a secondary wall color in bedrooms or as the upholstered fabric on a sofa or chair.\n\nThis palette is custom-made for Southwestern, Adobe, and Spanish Colonial architecture, but it adapts beautifully to contemporary homes in any warm climate. Pair with Saltillo tile or terracotta in earthy orange-brown tones, natural wood with visible grain in warm honey or walnut, handwoven textiles with Navajo or geometric patterns, and hand-thrown pottery in earth tones. Wrought iron fixtures, exposed vigas (round log beams), and rough-plastered walls complete the material vocabulary. In cooler climates, use this palette in rooms that receive maximum afternoon sun — west-facing rooms that can borrow warmth from the low angle of late-day light.",
    colors: ["#e0c4a8", "#f7ede0", "#c75b3f", "#8b6b4a", "#d4956e"],
  },
  {
    name: "Woodland Cabin",
    slug: "woodland-cabin",
    description: "Forest greens and warm browns — cozy and rustic.",
    body: "The Woodland Cabin palette is built around the visual experience of a well-made mountain retreat: the deep forest green of conifers seen through a window, the warm brown of hewn log walls and wooden furniture, the warm cream of natural plaster or aged timber — all of it enclosed by a sense of comfortable shelter against the outdoors.\n\nDeep forest green is the character color of this palette and deserves prominent placement. In a cabin or mountain home, it can cover all four walls of a living room — the darker a space goes, the more intimate and cocooning it becomes. In a suburban context, use it on a single statement wall, as exterior trim, or for kitchen cabinetry. The warm cream provides essential relief and should be used generously on ceilings, trim, and adjacent rooms that need to feel less enclosed. The warm brown appears almost exclusively through materials — wood floors, timber beams, leather furniture, and wood furniture — rather than on painted walls.\n\nThis palette requires natural wood to come fully alive. Without the warmth of wood grain, the forest green and cream palette reads as simply traditional rather than woodsy. Prioritize real wood over painted MDF: exposed ceiling beams, a plank floor, a live-edge dining table, or log-style furniture all deepen the connection to the forest. Stone fireplace surrounds in gray or warm buff complement the palette without competing with it. Pair with wool plaids in forest green and warm tan, flannel upholstery, and antler or iron fixtures for the full lodge aesthetic.",
    colors: ["#5c6b4e", "#e8dfd0", "#8b6b4a", "#3c4a32", "#c4b090"],
  },
  {
    name: "Ocean Breeze",
    slug: "ocean-breeze",
    description: "Clear blues and driftwood neutrals — calm and refreshing.",
    body: "Where the Coastal Retreat palette evokes the color of water, Ocean Breeze captures its feeling — the specific clarity and freshness of moving air off the open water. The blues here are cleaner and more saturated than a coastal palette, the neutrals cooler and more driftwood-gray. It is a palette optimized for calm: research consistently shows that clear blues reduce perceived temperature and promote psychological relaxation.\n\nThe medium clear blue is the soul of this palette — it should cover the primary walls of the main living space. It is a color that performs best in rooms with significant natural light, especially east and north-facing rooms where it picks up the cool clarity of indirect light rather than warming under direct sun. The near-white blue-gray trim color maintains the cool temperature throughout the space while providing contrast. Deep navy grounds the palette and works as a single grounding element: painted trim in a bathroom, a kitchen island, or a sofa upholstered in deep navy linen.\n\nDriftwood gray is the palette's essential warmth — use it on wood floors in a gray-washed or natural finish, in woven fiber furniture, and in linen or cotton textiles in warm gray and taupe. Without this warmth, the palette can feel too cool and clinical in rooms without strong natural light. Pair with whitewashed or cerused oak furniture, sea glass and driftwood accessories, sheer white linen curtains that allow maximum light, and materials that reference the ocean without literally depicting it — wave-texture ceramics, organic cotton in ocean colors, hand-blown glass in clear blues and greens.",
    colors: ["#6a9fb5", "#f0f4f3", "#2c5f7c", "#d4c5a9", "#8cbcc8"],
  },
  {
    name: "Midnight Luxe",
    slug: "midnight-luxe",
    description: "Deep navy, champagne, and burnished bronze — elegant and dramatic.",
    body: "The Midnight Luxe palette is unabashedly glamorous. Deep midnight navy, warm champagne, burnished bronze, and antique gold create the atmosphere of a high-end cocktail bar, a luxury hotel lobby, or the private study of someone who understands that darkness is not oppressive — it is enveloping. This palette requires confidence to execute, but the result is rooms that feel genuinely special rather than aspirationally neutral.\n\nThe deep midnight navy-blue is the palette's defining color and must be used generously to work. A single feature wall is not enough — this palette requires at least three walls, ideally all four, in the deep navy to create the enveloping quality that makes it dramatic rather than merely dark. The champagne warm off-white provides the critical light source: on the ceiling, on architectural trim, and in light-colored upholstery, it keeps the space from feeling cave-like while maintaining the sophisticated depth of the navy walls.\n\nBurnished bronze is the metallic thread that gives the palette its luxe quality — it appears in light fixtures (especially pendant lights and wall sconces), cabinet hardware, mirror frames, and decorative objects. Champagne gold in a warm, slightly pink-toned version complements the bronze without matching it exactly. Pair with velvet upholstery in deep navy, champagne, or forest green; marble surfaces in warm white with gold veining; lacquered furniture with brass details; and heavy silk or velvet drapery in deep blue or champagne. This palette transforms most completely under warm incandescent or candlelight — avoid LED cool-white bulbs, which will flatten the depth of the navy and diminish the warmth of the metallic accents.",
    colors: ["#1e2a3a", "#e8e0d0", "#7a5c3e", "#c5a55a", "#3a4a5c"],
  },
  {
    name: "Spring Garden",
    slug: "spring-garden",
    description: "Fresh greens, soft peach, and warm cream — bright and uplifting.",
    body: "The Spring Garden palette captures the specific optimism of early spring — the moment when the first green appears after winter, the light changes quality, and the world brightens almost overnight. Soft sage green, fresh mid-tone green, warm cream, peach-apricot, and soft taupe create a palette that feels genuinely uplifting without being relentlessly cheerful.\n\nSoft sage green is the palette's primary color and works beautifully on walls in kitchens, dining rooms, bedrooms, and any room that benefits from the psychological associations of nature and growth. It is a color that reads as simultaneously neutral and colorful — clearly green, but muted enough to function as a background rather than a statement. The warm cream provides the essential warmth that prevents the palette from feeling cold or minty; use it on trim, ceilings, and as the primary color in any room adjacent to the green spaces.\n\nThe peach-apricot tone is the palette's surprise element — it adds a warmth and femininity that prevents the green palette from feeling corporate or clinical. Use it as a single accent wall in a bedroom or bathroom, as upholstery fabric on a single armchair, or in floral-patterned textiles. The deeper, richer green can appear in potted plants (especially in large quantities), as an exterior door or shutter color, or in garden-themed artwork. Pair with natural materials that reference the garden: rattan, wicker, terracotta pots, botanical prints, white-painted wood furniture, and fresh flowers and greenery treated as essential decor rather than optional accessories.",
    colors: ["#a8c5a0", "#f5f2eb", "#e8a87c", "#5c8a5e", "#d4d0b8"],
  },
  {
    name: "French Country",
    slug: "french-country",
    description: "Linen, slate blue, and muted gold — understated and charming.",
    body: "The French Country palette is the visual language of Provence — the soft, faded quality of colors that have been bleached by summer sun and refined by centuries of use. Warm linen, slate blue-gray, muted gold, and dusty mauve-taupe come together in a palette that is inherently weathered, never harsh, always inviting. It is the aesthetic of a well-used farmhouse kitchen, a covered terrace with lavender in the garden, a dining table set for a long lunch.\n\nWarm linen dominates this palette and should appear on walls, upholstered furniture, and soft furnishings throughout the space. It is a color that never reads as plain — it has enough warmth and complexity to work as the primary palette with only metallic accents. Slate blue-gray is the palette's characteristic color accent: use it for kitchen cabinetry in a French-style kitchen, as exterior shutters on a stucco home, or on a single bedroom wall where its softness reads as sophisticated rather than cold.\n\nMuted gold is the palette's warmth — it appears in aged brass fixtures, antique mirror frames, woven gold-tone textiles, and terracotta or yellow-toned ceramics. Avoid bright or polished gold, which reads as too new and sharp for this palette's deliberately aged sensibility. Pair with stone tile floors in warm gray or cream, natural linen drapery, painted wood furniture with a slightly distressed finish, and lavender or blue-gray floral patterns in textiles. The material vocabulary includes: toile de Jouy in blue and cream, woven rush chair seats, cast iron cookware, and hand-thrown earthenware in warm earth tones. This palette is equally successful in traditional French Country rooms and in more contemporary spaces where the palette is used more sparingly.",
    colors: ["#d5c8b8", "#f8f4ef", "#7a8c9a", "#b8a070", "#9c8070"],
  },
  {
    name: "Tropical Escape",
    slug: "tropical-escape",
    description: "Emerald, amber, and leafy greens — lush and vibrant.",
    body: "The Tropical Escape palette takes its cues from the most visually generous environments on earth: the deep emerald of tropical canopy, the warm amber of afternoon light filtered through dense foliage, the bright warm cream of a plaster wall at the edge of a garden. This palette is about lushness — the sense that color and life are abundant, generous, and uncontrolled.\n\nDeep emerald green is the palette's heart and demands a confident application. Use it on a single dramatic wall in a living room or bedroom, as kitchen cabinetry against warm cream walls, or as the color of a bathroom from floor to ceiling where the enclosure amplifies the depth. The warm cream backdrop is essential — it prevents the emerald from reading as dark and moody, keeping the whole palette in the register of tropical brightness rather than tropical darkness. Warm amber-gold appears in natural materials: rattan furniture, bamboo light fixtures, amber glass, warm oak wood — it is a material accent rather than a paint color.\n\nThe palette is sustained and enriched by actual plant life more than any other palette. Large-leafed tropical plants — Monstera, Bird of Paradise, Fiddle-Leaf Fig, potted palms — are not optional accessories in this scheme; they are structural elements that complete the palette in ways paint alone cannot. Layer multiple plants at different heights and sizes to create the canopy effect that makes the palette feel genuinely tropical rather than merely green. Pair with natural wicker and rattan furniture, geometric patterns in black and white or gold and cream, woven grass floor coverings, and brass fixtures with a warm polish.",
    colors: ["#2e8b6e", "#f5efe5", "#e8a030", "#1a6b5a", "#c4d4b8"],
  },
  {
    name: "Vintage Charm",
    slug: "vintage-charm",
    description: "Antique rose, warm taupe, and faded gold — nostalgic and soft.",
    body: "The Vintage Charm palette is built around the specific quality of colors that have aged well — the antique rose of faded silk, the warm taupe of old wool, the muted gold of tarnished brass and yellowed lace. It is a palette that evokes nostalgia without kitsch, sentimentality without sentimentalism. The colors feel like they belong to something that has been in the family for generations.\n\nWarm taupe is the palette's dominant tone — it is neither too pink nor too gray, reading as a complex warm neutral with just enough personality to feel considered. Use it as the primary wall color throughout, establishing a continuous warm envelope that makes every room feel inhabited and comfortable. Antique rose is the palette's character color — muted and complex, it avoids the sweetness of fresh pink by leaning toward dusty mauve. Use it on a bedroom wall, as upholstery on an armchair or settee, or in floral-patterned wallpaper in a powder room.\n\nMuted faded gold is the palette's metallic warmth — it appears in aged gilded frames, antique brass fixtures, and decorative objects with a patina rather than a polish. The deep dusty rose-mauve bridges the taupe and antique rose, working well as a secondary accent in textiles, artwork, and ceramics. Pair with heirloom-quality textiles: floral chintz, aged velvet, embroidered linen, and faded Persian rugs. Furniture should have some history — painted wood with visible wear, upholstered pieces in faded floral or solid aged velvet, and display objects that tell a story. This palette rewards a collected, personal approach to decorating rather than a matched-set retail aesthetic.",
    colors: ["#c8b8a0", "#f2ece2", "#8b6b6b", "#a09060", "#d8c8b8"],
  },
];

export function getPaletteBySlug(slug: string): InspirationPalette | undefined {
  return inspirationPalettes.find((p) => p.slug === slug);
}

export function getAllPaletteSlugs(): string[] {
  return inspirationPalettes.map((p) => p.slug);
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
