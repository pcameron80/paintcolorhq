export type PaletteRole = "Walls" | "Trim" | "Accent" | "Pop";

export interface InspirationPalette {
  name: string;
  slug: string;
  description: string;
  colors: string[];
  editorial?: string;
}

export const inspirationPalettes: InspirationPalette[] = [
  {
    name: "Modern Farmhouse",
    slug: "modern-farmhouse",
    description: "Warm neutrals with organic green and soft taupe — relaxed and timeless.",
    colors: ["#d6d0c4", "#f0ece2", "#4a4a48", "#7a8c6e", "#b8a99a"],
    editorial: `The modern farmhouse palette works because it resolves a tension most decorating schemes can't: warmth without weight. The warm greige wall color (LRV around 55–65) reflects enough light to keep spaces open while the soft taupe and organic sage green ground the room visually. The near-black charcoal acts as punctuation — cabinet hardware, window frames, light fixtures — preventing the palette from reading as too soft or ambiguous.

This combination became popular in the late 2010s largely through open floor plan renovations where the challenge was making a large connected space feel cohesive but not monotonous. The greige anchors the walls, the crisp off-white goes on trim and ceilings, and the sage appears as a kitchen island color, a mudroom accent, or exterior shutters.

In practice, the best room candidates are kitchens, dining rooms, and main living areas. The palette is particularly forgiving in east- and west-facing rooms, where the warm undertones in the greige and taupe counteract both the cool morning light (east) and the golden afternoon light (west) without overcorrecting.

For bedrooms, this palette works well but benefits from leaning into the softer side: use the off-white as the primary wall color with the greige only as an accent. The charcoal as a headboard wall or alcove works well in larger bedrooms. Keep the sage green to soft furnishings — throw pillows, linen curtains — rather than a dedicated wall to avoid making the room feel too thematic.

Finish matters in farmhouse schemes. Flat or matte finishes on walls soften the look and reduce formality. Eggshell works on walls that get handled (kitchens, kids' rooms). Reserve satin for trim only — it adds the right subtle sheen to millwork without making it feel like a new construction builder grade.

Hardware and material pairings that work: unlacquered brass (ages to a warm patina), matte black (for contrast), natural oak (not red-toned cherry), linen upholstery, concrete countertops, shiplap, and board-and-batten.`,
  },
  {
    name: "Coastal Retreat",
    slug: "coastal-retreat",
    description: "Airy blues and sandy neutrals — breezy and light-filled.",
    colors: ["#d5e1df", "#f5f0e8", "#2b4c6f", "#c4a87c", "#87b5b0"],
    editorial: `Coastal palettes fail when they go too blue. The mistake most people make is painting walls a medium blue and adding navy accents, which results in a room that reads more "nautical theme" than relaxed beach house. This palette avoids that problem by using a pale seafoam as the primary wall color — it has just enough blue-green to feel coastal without committing to a hue that will overpower everything.

The sandy neutral (LRV around 70) functions as the natural transition color — it appears on trim, built-ins, and anywhere you want warmth without heat. The deep navy is kept to accent use only: a kitchen island, a single accent wall in a bedroom, fireplace millwork. At LRV around 8–10, the navy is too dark for large surfaces unless you're in a very light-filled room.

Coastal doesn't have to mean beach house. This palette reads equally well in lake cabins, suburban bathrooms and ensuites, and any room that gets strong natural light. The key is light — pale blue-greens work well in south-facing rooms where strong direct sun warms the cool undertones. In north-facing rooms, they can read cold; add the sandy neutral more aggressively to compensate.

Bedrooms and primary bathrooms are the strongest candidates. The pale seafoam on walls with warm sandy trim creates a retreat feeling without committing to the full coastal aesthetic in every room. Guest bathrooms are ideal for the deep navy as a full-room color — small spaces can handle dark colors more easily, and the contrast against white tile and fixtures is striking.

For outdoor spaces — porches, covered patios — this palette works especially well. The sandy neutral on ceiling and trim boards (painted horizontal tongue-and-groove ceiling is traditional) with seafoam on walls or shutters extends the interior palette outdoors naturally.

Material pairings: weathered teak, sea glass, rattan, white oak, shiplap painted the off-white, linen and cotton textiles in natural tones, and aged bronze or unlacquered brass hardware.`,
  },
  {
    name: "Moody Library",
    slug: "moody-library",
    description: "Deep greens, burgundy, and aged gold — rich and contemplative.",
    colors: ["#2f4538", "#f2ead3", "#6b2737", "#b8963e", "#4a3728"],
    editorial: `The moody library palette is built for rooms where you want drama over brightness. The deep forest green (LRV around 8–10) absorbs most of the light in a room — in a small study or home library, that's exactly what you want. It creates the visual cocoon that makes concentrated reading and thinking feel easier.

Color-drenching is the right application technique here: walls, ceiling, and trim all in the same deep green. This approach looks intentional rather than ominous, because the eye has nothing to compare against. When green walls meet white trim, the contrast emphasizes how dark the walls are. When everything matches, the room reads as a unified design decision.

The cream (LRV 80+) appears as the accent — book pages, upholstery, the inside of built-in bookshelves. The burgundy and aged gold are the third and fourth tones: leather chair in burgundy-adjacent tones, aged brass hardware on cabinet pulls and lighting, gilded picture frames, and warm amber glassware.

This palette performs best in rooms that can tolerate low ambient light or that have supplemental artificial lighting: home offices, studies, dining rooms, and living rooms with strong directional pendant or table lamp coverage. It fails in rooms that depend on natural light as the primary illumination — north-facing rooms with small windows will feel oppressive.

The dark warm brown in the palette reads as the wood tone anchor: dark walnut bookshelves and flooring, mahogany desk surfaces, dark espresso furniture legs. Lighter woods (ash, maple, white oak) create too much contrast and undermine the moody atmosphere.

Textiles matter more in this palette than in lighter schemes. Velvet in deep jewel tones (bottle green, burgundy, cognac), wool plaid throws, Turkish-style rugs in medallion patterns with rich coloration, and aged leather all reinforce the library atmosphere.`,
  },
  {
    name: "Scandinavian Minimal",
    slug: "scandinavian-minimal",
    description: "Crisp whites and soft grays with warm wood tones — clean and airy.",
    colors: ["#f4f1ec", "#ffffff", "#b0b8b4", "#d4c1a8", "#e8e3db"],
    editorial: `Scandinavian minimalism in interior design relies on a specific hierarchy: white (or near-white) as the primary surface color, one soft neutral as the secondary, and wood as the material that prevents it from feeling sterile. The palette here follows that logic precisely.

The off-white (LRV around 88) rather than pure white is the critical choice. True white at LRV 98–100 reads as clinical under most residential lighting. The slight warm undertone of an off-white reflects light without the stark, fluorescent quality. Ceilings can go pure white — the slight value contrast between ceiling and walls is barely perceptible but prevents the room from feeling flat.

The soft blue-gray (LRV around 50–55) functions as the secondary neutral for a specific purpose: creating low-contrast visual rest. It pairs with the off-white without creating tension. It works well on a single wall behind a bed, on built-in cabinet faces, or as a bathroom vanity color.

The warm wood tone in this palette is essential. Without it, the white-and-gray combination reads as cold rather than calm. The wood anchors the warmth: white oak flooring, a birch dining table, ash shelving. The wood color should be light — dark wood creates too much contrast and undermines the serene quality.

This palette is well-suited to: primary bedrooms, home offices, bathrooms, and kitchens where cabinet and countertop materials bring natural variation. It's a particularly good choice for north-facing rooms in northern latitudes where light is limited — the high LRV whites reflect whatever daylight is available.

Lighting is more important in Scandinavian schemes than in richer palettes. Multiple light sources at different levels (overhead, task, ambient) replace the color variety that other palettes use to create visual interest. Edison pendants, recessed lighting, and table lamps with warm 2700K bulbs are standard complements.`,
  },
  {
    name: "Bold & Eclectic",
    slug: "bold-and-eclectic",
    description: "Vibrant yellow, deep blue, and purple accents — energetic and playful.",
    colors: ["#e8c547", "#f7f3ea", "#2d5a7b", "#c1533c", "#6b4e8a"],
    editorial: `Bold and eclectic palettes succeed or fail based on one principle: high-saturation colors need proportional control. This palette has four strong hues — amber yellow, deep teal-blue, terracotta red, and muted purple — plus a near-neutral cream. The mistake is using all four in equal proportion. The right approach keeps one color dominant (50–60% of the room's color presence) and uses the others as accents at 10–20% each.

In practice, this means the cream off-white as walls throughout, the deep teal-blue as the dominant accent (kitchen cabinets, a major upholstered piece, or a feature wall in a high-use room), and the yellow, terracotta, and purple as rotating accents in art, textiles, ceramics, and small furnishings.

Dining rooms and living rooms handle this palette better than bedrooms. The energy of four saturated colors works in social spaces where activity and conversation are the point. In a bedroom, where the goal is rest, the same palette can feel exhausting if not carefully controlled toward the calmer end (more cream and teal, less yellow and terracotta).

Children's rooms and playrooms are natural fits — the playful quality of the palette aligns with the function of the space. Here you can lean into the proportions more aggressively, since stimulation is appropriate.

Eclectic decorating doesn't mean random. What holds this palette together is a shared temperature (all colors lean warm, even the blue has green-yellow warmth rather than cold navy quality) and similar saturation level (all are mid-saturation, none are neon or pastel). Staying within those shared parameters is what makes an eclectic palette feel curated rather than chaotic.

Art is the natural vehicle for this palette — a large abstract or vintage poster that incorporates multiple palette colors gives you permission to use them in smaller quantities throughout the room.`,
  },
  {
    name: "Earthy Organic",
    slug: "earthy-organic",
    description: "Terracotta, sage, and warm beige — grounded and natural.",
    colors: ["#c4a882", "#efe8dd", "#6b4e37", "#8a9a5b", "#d4b896"],
    editorial: `The earthy organic palette draws from a limited section of the color spectrum — all warm, all nature-derived, no cool tones — which makes it one of the most forgiving palettes to execute. Colors this close to each other on the color wheel naturally coexist without tension.

The warm beige (LRV around 55–60) works as the primary wall color in virtually any room orientation. Its warm yellow-red undertones counteract cool light in north-facing rooms and soften the intensity of warm direct sun in south-facing rooms. It's the rare wall color that behaves consistently across different lighting conditions.

Terracotta appears in this palette as an accent — not a wall color, except in small powder rooms or bathroom niches where a single dark warm accent wall makes sense. At LRV around 25–30, terracotta is too dark for full-room walls in most residential spaces. Its best applications are kitchen cabinet fronts (with terracotta-toned drawer pulls), a fireplace surround, ceramic tile accents, and upholstered accent chairs.

The sage-olive green bridges the warm and cool sides of the palette — it has enough yellow to read as warm but enough gray-green to provide visual relief from the pure earth tones. Use it on interior doors (painting interior doors is a high-impact low-cost change), kitchen island, or exterior shutters if the exterior palette permits.

Natural materials amplify this palette more than any other. Unglazed clay tile floors, raw linen upholstery, jute and sisal rugs, terracotta planters, unfinished wood (rough-sawn oak, reclaimed barnwood), rattan, and handmade ceramics with organic glaze variations all reinforce the palette without requiring additional color.

This palette pairs well with plants and greenery — the warm beige and terracotta read richer against live plant foliage than against most other color combinations.`,
  },
  {
    name: "Soft Romantic",
    slug: "soft-romantic",
    description: "Blush pinks, dusty mauves, and warm cream — gentle and inviting.",
    colors: ["#e8d5d0", "#faf6f3", "#9b7e8a", "#c4956a", "#d4a5b0"],
    editorial: `The soft romantic palette is built for intimacy. Every color in this palette has a warm pink or peach undertone — even the dusty mauve, which could read as cool purple in other palettes, has enough red to stay warm. That shared undertone is what creates harmony across the five shades.

Blush pink wall color (LRV around 65–70) reads very differently in person than it does on a sample card. On a small chip, it looks distinctly pink. On four walls, with daylight bouncing off the surfaces, it often reads as a warm off-white with just enough pink to feel different from cream. This makes it more versatile than people expect — it can work in guest bedrooms, primary bathrooms, and dining rooms without the room feeling themed.

The warm cream at LRV 90+ is the natural trim and ceiling color. Avoid true white here — the cool undertone in pure white will clash visibly with the warm pink walls. Stick to warm whites with yellow-pink undertones: Benjamin Moore White Dove, Sherwin-Williams Alabaster, or similar warm neutrals.

The dusty mauve is the depth color — it functions like the deep tone in any palette, adding dimension without drama. Good applications include an upholstered headboard in a bedroom, a velvet accent chair in a living room, bedside lamp shades, and decorative pillows. As a wall color, use it sparingly: one wall in a bedroom behind the bed, or the full walls of a small powder room.

The terracotta-leaning warm caramel is the unexpected but critical element. Without a warm brown-orange anchor, pink and mauve combinations can feel feminine in a way that limits the palette's appeal. The caramel tone in wood floors, wicker furniture, or leather accessories grounds the scheme and broadens its appeal.

Best rooms for this palette: primary bedrooms, nurseries (particularly for gender-neutral applications), dining rooms in traditional homes, and bathrooms.`,
  },
  {
    name: "Urban Industrial",
    slug: "urban-industrial",
    description: "Cool grays with copper and charcoal — modern and edgy.",
    colors: ["#6d6e70", "#e8e4de", "#3c3c3c", "#b87333", "#a09e9a"],
    editorial: `Industrial palettes work differently from most residential color schemes: the materials carry more of the visual load than the paint. Concrete, exposed brick, steel, worn leather, and reclaimed wood are the primary design elements — paint plays a supporting role, keeping surfaces from competing with the material texture.

The medium cool gray (LRV around 25–30) is the workhouse of this palette. At this LRV, it's dark enough to add atmosphere but light enough for living spaces with decent windows. It functions well on a feature wall, in a kitchen with industrial pendant lighting, or in a home office where a low-stimulation backdrop is useful.

The warm off-white (LRV around 80+) is the natural pairing for the gray — it prevents the palette from reading cold or oppressive. Kitchens and bathrooms with white subway tile or white marble particularly benefit from this off-white on adjacent surfaces, which bridges the warm and cool tones.

Near-black charcoal (LRV under 5) is a statement color that works best at controlled scale: an interior door, kitchen island, fireplace surround, or built-in shelving unit. Full rooms in near-black require strong artificial lighting to function, but single architectural elements in deep charcoal add significant visual impact.

Copper is the distinctive element that separates industrial from simply gray. Aged copper develops a patina that adds warmth and complexity: pendant light fixtures, plumbing hardware in bathrooms and kitchens, exposed copper pipe used as a design feature, and copper-finished cabinet hardware. The key word is aged — bright polished copper conflicts with the worn, functional quality of industrial design. Unlacquered copper allowed to patinate, or fixtures sold in an aged finish, are preferable.

Best rooms: home offices, kitchens, bathrooms, loft apartments, and open-plan spaces where the high ceiling height allows darker colors without creating claustrophobia.`,
  },
  {
    name: "Mediterranean Sun",
    slug: "mediterranean-sun",
    description: "Warm terracotta, ocean blue, and sun-bleached white — lively and warm.",
    colors: ["#f5e6d3", "#fefcf7", "#c75c2a", "#2e6b8a", "#e4b87c"],
    editorial: `Mediterranean color logic is the opposite of Scandinavian minimalism. Where Scandinavian design recedes toward near-neutral, Mediterranean interiors use saturated color at architectural scale — tiled stairways, colored rendered walls, painted shutters — because the strong sunlight of the Mediterranean climate can handle it without feeling overwhelming. In Northern climates with weaker light, the same principles apply but proportions shift.

The warm peach-sand (LRV around 80) as the primary wall color is the sun-bleached plaster effect: color that has been washed out by years of direct Mediterranean sun. It reads warm and inviting without the full commitment of terracotta walls. This color works beautifully in south-facing rooms and any space that gets strong afternoon light.

The terracotta-orange (LRV around 20–25) is the accent that defines the palette. Unlike the earthy organic terracotta, this is a more vivid, saturated tone — closer to burnt sienna than clay. Its best applications in residential interiors: a hand-painted tile backsplash, a painted arch or niche, exterior walls in warm climates, pottery and ceramic vessels, and upholstered accent chairs or settees.

The ocean blue is the counterweight — without it, the palette reads only warm and lacks the cool visual respite that makes a space comfortable in warm weather. Used on interior shutters, a kitchen island, or cabinet doors, the blue-green ocean tone prevents the palette from feeling overhot.

The amber-gold ties to the metal and stone materials associated with Mediterranean architecture: brass fixtures with warm patina, golden honey-colored limestone or travertine floors, and gilded frames on art or mirrors.

Outdoor spaces, sunrooms, and kitchens are the strongest candidates for this palette. It also works very well in powder rooms and small bathrooms where the bold color combinations can be experienced at intimate scale.`,
  },
  {
    name: "Classic Traditional",
    slug: "classic-traditional",
    description: "Navy, burgundy, and antique gold — refined and timeless.",
    colors: ["#2b3a52", "#f2ece0", "#8b2232", "#c5a55a", "#5c6e82"],
    editorial: `Traditional design palettes are built on contrast and formality: deep saturated colors against crisp light backgrounds, architectural millwork as the organizing structure, and rich material pairings that imply permanence. This palette executes that formula with navy, burgundy, and antique gold as the three working colors against a warm cream foundation.

The navy (LRV around 8–12) is the dominant deep tone. In traditional interiors, it functions best on built-in bookshelves (the back panel, painted while the shelves themselves stay cream or white), upholstered sofas and armchairs in solid navy velvet or wool, kitchen cabinets in classic shaker style, and wainscoting in formal rooms. Full navy walls work in rooms with 9-foot or higher ceilings and strong artificial lighting — dining rooms and libraries are the traditional applications.

The warm cream (LRV around 80–85) is the lightening agent throughout. All trim, ceilings, and architectural molding should be in this tone or a slightly lighter version. Traditional design uses layered molding profiles (crown molding, chair rail, picture rail, wainscoting) — and the cream unifies all of that millwork visually while maintaining the formality.

Burgundy functions as the accent with historical justification: it appears in Persian and Oriental rugs (which are the traditional floor covering for this style), in leather-bound books, in wine-colored upholstery on dining chairs, and in damask fabric patterns. It adds warmth and a sense of age to the palette.

The antique gold is the metal tone — gilt frames on oil paintings, brass candlesticks and lamp bases, gilded mirror frames, brass cabinet hardware. Avoid polished bright gold: antique, satin, or brushed finishes in warm gold read as traditional rather than decorative.

Strongest rooms for this palette: formal dining rooms, home offices and studies, living rooms in period homes with original millwork, and primary bedrooms in Tudor, Colonial, or Georgian revival architecture.`,
  },
  {
    name: "Desert Sunset",
    slug: "desert-sunset",
    description: "Sandstone, burnt sienna, and warm clay — sun-baked and serene.",
    colors: ["#e0c4a8", "#f7ede0", "#c75b3f", "#8b6b4a", "#d4956e"],
    editorial: `Desert palettes occupy a specific niche: all the warmth of Mediterranean and earthy organic palettes but compressed into a narrow band of reddish-orange and tan tones that reference arid landscape rather than verdant nature. The green component present in earthy palettes is absent here — the result is more monochromatic and more dramatic.

The sandstone warm neutral (LRV around 60–65) as the wall color is the foundation: warm enough to feel welcoming but light enough for the main walls of living spaces without LRV concerns. It reads as a pale tan-pink in rooms with warm incandescent or LED lighting, and as a more neutral sand color under cool daylight.

The burnt sienna (LRV around 20–25) is the defining accent. Saturated and red-orange, it's too intense for large wall surfaces in most rooms, but it works powerfully at a smaller scale: a painted plaster niche or arch, a kitchen range hood in a painted plaster or tiled finish, a single accent wall in a bedroom painted in an adobe-style flat or matte finish, or an exterior feature wall in warm climates.

The warm brown in this palette functions as the anchor and the material bridge: dark oak or walnut furniture, leather upholstery in cognac or saddle tan, unfinished wood beams (common in Southwestern and Spanish Colonial architecture), and door frames in warm espresso stain.

Adobe construction and Southwestern architecture are the most natural contexts for this palette, but it applies equally to any interior that draws on those references: a primary bedroom in a stucco home, a sunroom with terracotta tile floors, or a bathroom with handmade Talavera tile as the backsplash.

The natural material complement is extensive: terracotta tile, rough-hewn wood, hammered copper, river rock, handwoven wool rugs in geometric patterns (Navajo, Zapotec, and kilim styles), raw linen, and suede upholstery.`,
  },
  {
    name: "Woodland Cabin",
    slug: "woodland-cabin",
    description: "Forest greens and warm browns — cozy and rustic.",
    colors: ["#5c6b4e", "#e8dfd0", "#8b6b4a", "#3c4a32", "#c4b090"],
    editorial: `Woodland and cabin palettes lean on green more aggressively than most residential color schemes. The two greens in this palette — a medium forest green (LRV around 20–25) and a near-black deep forest (LRV under 10) — work together because they're closely related on the color spectrum, sharing the same green-brown family but at different depths.

The medium forest green is the primary working color. As a wall color, it creates the enclosed, sheltered quality of interior forest light — enough color to feel intentional, dark enough to read cozy rather than merely painted. It works best in rooms with adequate window coverage and warm artificial lighting; a forest green room with insufficient light becomes oppressive rather than cozy.

The deep forest near-black is the accent extreme. Used on exterior shutters, interior window frames, or as a color-drenched bathroom in a small space, it reads as a dark shadow against the medium green or the warm cream — it provides depth without introducing a new color.

The warm cream (LRV around 75–80) prevents the double-green scheme from feeling too monotonous. It appears on trim, built-in bookshelves (the shelves themselves, not the back panel), ceiling, and doors. In a classic cabin configuration, it's the color of knotty pine or white oak millwork.

The warm medium brown functions as the wood tone: dark oak flooring, pine log accents, leather upholstery in cognac or saddle brown, and wood beam ceiling details. The brown in this palette should be warmer than the green — pure mahogany or red-toned cherry would conflict; warm walnut or medium oak works.

Best spaces for this palette: vacation and mountain cabins, reading rooms, home offices that benefit from a focused atmosphere, basements and finished lower levels, and any room with exposed wood ceiling beams. It also translates well to bedrooms in primary residences when the goal is creating a sleep-conducive atmosphere.`,
  },
  {
    name: "Ocean Breeze",
    slug: "ocean-breeze",
    description: "Clear blues and driftwood neutrals — calm and refreshing.",
    colors: ["#6a9fb5", "#f0f4f3", "#2c5f7c", "#d4c5a9", "#8cbcc8"],
    editorial: `Ocean Breeze differs from the Coastal Retreat palette in a specific way: where coastal uses pale seafoam and sand, Ocean Breeze commits more fully to blue — the medium ocean blue (LRV around 35–40) is the primary tone rather than an accent. This means the palette asks for more of the room to be blue, which is a more demanding design choice but also a more distinctive one.

A medium-value blue at LRV 35–40 is versatile at room scale. It's dark enough to have visual presence on walls, but not so dark that it requires strong artificial lighting to avoid feeling oppressive. In south-facing rooms with good natural light, it reads as clear and refreshing. In north-facing rooms, the blue undertone is amplified by the cool indirect light — this is the one case where the coastal palette variant (with its warmer seafoam) would be a better choice than the full ocean blue.

The nearly-neutral aqua (slightly lighter, LRV around 45–50) functions as the secondary blue — it could be used in an adjacent bathroom, a connecting hallway, or as a ceiling color in a lighter variation on the main room color. Analogous schemes that step through two related colors on adjacent surfaces are a classic way to make an open floor plan feel intentional.

The deep steel blue (LRV around 12–15) is the dark accent — exterior shutters and doors, built-in bookshelves (back panel), kitchen island or cabinetry, and fireplace surrounds. At this depth it provides dramatic contrast against the light neutrals.

The driftwood beige-tan (LRV around 65–70) is the warm anchor that prevents the blue-dominant palette from feeling cold. It should appear in wood tones (weathered oak, driftwood-finished furniture), upholstery in warm linen or canvas, and natural fiber rugs. Without this warm element, the palette's cool quality tips into sterile.

Bathrooms respond particularly well to this palette — the combination of blue walls with white fixtures and warm wood accents is a modern classic.`,
  },
  {
    name: "Midnight Luxe",
    slug: "midnight-luxe",
    description: "Deep navy, champagne, and burnished bronze — elegant and dramatic.",
    colors: ["#1e2a3a", "#e8e0d0", "#7a5c3e", "#c5a55a", "#3a4a5c"],
    editorial: `Midnight Luxe is the palette that requires the most commitment: the near-black navy at LRV 5–8 is one of the darkest colors you can put on walls in a residential setting. At this depth, the room's light budget matters more than in any other palette. A room with three windows, white ceilings, and strong pendant or wall-mounted lighting can carry midnight navy on all four walls and feel dramatic. A room with one small north-facing window and a single overhead fixture will feel like a cave.

When the lighting conditions are right, deep navy delivers a quality no lighter color can: it makes a room feel both expansive and intimate at the same time. The deep color absorbs peripheral visual information and focuses attention inward — on the furniture, the art, the people in the room. This is why it's historically used in formal dining rooms, gentlemen's clubs, and high-end hotel bar areas.

The medium steel blue in this palette (LRV around 12–15) is the softer version of the same family. It works in bedrooms where the near-black would be too intense for sleep, or in home offices where a slightly lighter backdrop still reads as focused and sophisticated.

The champagne warm cream (LRV around 75–80) is the contrast element and the most important piece. Against near-black navy, champagne trim reads as warm gold rather than simple off-white — the contrast makes both colors appear more vivid. Painted millwork, ceiling, and trim in champagne against midnight navy walls is one of the most effective high-contrast color combinations in residential design.

The burnished bronze and warm brown tones are the material anchors: aged bronze light fixtures and hardware (not polished brass, not chrome), dark walnut furniture, cognac leather, and amber-tinted glass.

Best rooms: primary bedrooms, dining rooms, home bars, and home theaters where high-drama atmosphere serves the room's function.`,
  },
  {
    name: "Spring Garden",
    slug: "spring-garden",
    description: "Fresh greens, soft peach, and warm cream — bright and uplifting.",
    colors: ["#a8c5a0", "#f5f2eb", "#e8a87c", "#5c8a5e", "#d4d0b8"],
    editorial: `The Spring Garden palette introduces the most direct chromatic pairing in this collection: green and peach-orange on opposite sides of the warm spectrum. These colors don't appear across from each other on the traditional color wheel (that would be red and green), but they share a warmth that makes them companions rather than competitors.

The light sage (LRV around 52–58) is a particularly easy-to-use wall color. At this LRV, it's bright enough for most rooms without artificial light concerns, and the gray-green undertone keeps it from reading as overtly botanical. It functions like a warm neutral in many lighting conditions — in south-facing rooms with strong light, it reads as a fresh, gentle green; in cooler or more diffuse light, it reads as a sophisticated gray-green.

This makes it one of the most versatile colors in the green family for residential use. It works in kitchens, living rooms, bedrooms, and bathrooms — almost any room type — and it pairs well with both warm and cool-toned woods, making it flexible for existing furniture.

The medium forest green (LRV around 20–25) is the depth accent. Kitchen lower cabinets in this deeper green with upper cabinets in the lighter sage (or cream) is a two-tone kitchen approach that has grown significantly in popularity. The deeper green reads as the grounding element while the lighter sage provides visual relief.

The soft peach-orange (LRV around 60–65) is the warmth injection. As a wall color in a dining room or breakfast nook it creates the light, welcoming quality associated with morning light. As an accent it appears in ceramic dinnerware, woven throw blankets, upholstered accent chairs, and cut flowers.

The warm cream (LRV around 85+) on trim and ceilings keeps the palette from drifting into pastels — its slight warmth reinforces the connection between the green and peach tones.

Ideal rooms: kitchens and dining rooms, sunrooms, nurseries, and any space that benefits from an energetic but not aggressive color presence.`,
  },
  {
    name: "French Country",
    slug: "french-country",
    description: "Linen, slate blue, and muted gold — understated and charming.",
    colors: ["#d5c8b8", "#f8f4ef", "#7a8c9a", "#b8a070", "#9c8070"],
    editorial: `French Country interiors navigate a specific balance: they feel old, but not fussy; worn, but not neglected; colorful, but not saturated. This palette captures that quality through careful desaturation — every color here is muted. The slate blue is gray-blue, not bright blue. The gold is antique wheat, not vivid yellow. The warm linen and taupe keep the palette anchored in the neutral range even as it layers in warm and cool tones.

The warm linen (LRV around 60–65) is the defining wall color. It has warm pink-beige undertones that read as soft and lived-in rather than crisp and modern. This makes it different from the sharper greige neutrals in contemporary design — the French Country version is warmer, more organic, less architectural.

The slate blue-gray (LRV around 35–40) is the cool accent that provides the palette's range. In French Country interiors, this color appears on painted furniture — particularly kitchen cupboards, armoires, and buffets — rather than on walls. The tradition of painted furniture in worn or distressed finishes (the French word is patiné) means that furniture becomes the color vehicle rather than paint. This is important for interpreting the palette: if your furniture is painted slate blue, the walls should be the warm linen or soft cream, not also blue.

The muted antique gold (LRV around 40–45) ties to materials: gilded mirror frames, aged brass hardware, honey-toned limestone flooring, and straw-colored woven cane chair seats. The gold in French Country is never bright — it's always aged, tarnished, or muted through patina.

The dusty rose-brown bridges the warm and cool sides and often appears in textile form: toile de Jouy fabric (the traditional French Country print), linen upholstery with subtle stripe, and vintage Persian rug accents with faded warm tones.

Best rooms: kitchens, dining rooms, and primary bedrooms in traditional or French-influenced architecture. Particularly effective in rooms that already have aged wood elements — original pine floors, reclaimed ceiling beams.`,
  },
  {
    name: "Tropical Escape",
    slug: "tropical-escape",
    description: "Emerald, amber, and leafy greens — lush and vibrant.",
    colors: ["#2e8b6e", "#f5efe5", "#e8a030", "#1a6b5a", "#c4d4b8"],
    editorial: `Tropical palettes are the most difficult to execute at full residential scale because their defining colors — saturated emerald, amber, deep teal — are highly assertive. Used thoughtlessly, a tropical palette produces a room that feels like a hotel lobby in a resort. Used well, it creates genuine vitality.

The emerald green (LRV around 18–22) is the anchor color. At this saturation and depth, it absorbs light and creates a room that feels intimate despite its vivid character. The difference between a tropical palette that works and one that doesn't is this: the emerald needs to be the settled background, not a pop. If emerald appears as an accent against white walls, it reads as a statement piece. If it appears on the walls themselves, the furniture and textiles read against it, which is the more sophisticated arrangement.

The deep teal (LRV under 10) is the shadow version of the emerald — it can be used where you want the maximum depth: a color-drenched bathroom, an accent wall behind a bed, or built-in bookshelves. The slight blue shift in the teal compared to the emerald creates visual range within the green family without introducing a new color family.

The amber-gold (LRV around 45–50) is the complementary contrast that makes the green sing. Green and amber-orange sit across from each other on the warm color wheel, which means they intensify each other's apparent vividness. In practice this means: amber-toned pendant lights, warm honey-colored cane or rattan furniture, terracotta planters, brass hardware with a warm yellow-gold tone.

The soft pale green (LRV around 65–70) is the palette's relief valve — too much saturated deep green and the room will feel overwhelming. The pale sage-green appears in the lighter textile layer (curtains, bedding, soft furnishings) and connects back to the deeper greens without repeating them.

Live plants are the most natural accessory for this palette. The actual green of plant foliage deepens the connection to botanical reference. Best rooms: dining rooms, primary bedrooms with adequate light, sunrooms, and outdoor covered patios.`,
  },
  {
    name: "Vintage Charm",
    slug: "vintage-charm",
    description: "Antique rose, warm taupe, and faded gold — nostalgic and soft.",
    colors: ["#c8b8a0", "#f2ece2", "#8b6b6b", "#a09060", "#d8c8b8"],
    editorial: `Vintage palettes depend on desaturation more than any other style. The defining quality of vintage color isn't any particular hue — it's the washed-out, sun-faded quality that comes from reduced saturation. New paint in bright, vivid tones never reads as vintage, regardless of the color chosen. The palette here captures that quality: every tone has been grayed and softened.

The warm taupe (LRV around 55–60) is the primary wall color — it reads as a slightly more beige version of greige, with enough warmth to feel nostalgic but enough gray-brown neutrality to function as a versatile background. Unlike modern warm neutrals that tend toward sand or khaki, this taupe leans slightly toward pink-brown, which is the tell for vintage color sensibility.

The antique rose-brown (LRV around 25–30) is the defining accent. It's not pink enough to read as romantic, not brown enough to read as neutral — it occupies the in-between territory of faded rose, the kind of color you find on aged Victorian wallpaper or antique linen. As a wall color for a small room (powder room, bedroom niche, hallway) it creates instant period character. As an accent on painted furniture, upholstered headboard, or curtain fabric, it's the signature tone.

The muted gold-olive (LRV around 35–40) is the aged metal and antiqued yellow tone. In vintage interiors, this appears as the color of aged brass that hasn't been polished in years, of mustard-toned vintage textiles (think William Morris-era wallpaper colors), and of old gilded frames that have lost their shine.

The very light taupe (LRV around 70–75) is the secondary neutral — lighter than the wall color, it works on trim and as a secondary fabric tone in woven textiles.

Vintage Charm works in homes with period architectural features (original moldings, plaster medallions, transom windows, wainscoting) that already have historical character to build on. It also works in more modern spaces where the vintage quality is introduced entirely through furnishings and textiles rather than architecture.`,
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
