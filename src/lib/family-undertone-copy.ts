// Per-family undertone descriptions used in the FAQPage JSON-LD on family
// hub pages. Plain text (no JSX) so it can flow into structured-data
// answer fields. Each entry is ~70-100 words, tuned to be substantive
// enough for AI engine citation (Perplexity, AI Overviews) while
// remaining specific to the family rather than templated.
//
// Replaces the prior generic "warm undertones leaning yellower, cool
// undertones leaning bluer..." answer that read identically across all
// 15 families.

export const FAMILY_UNDERTONE_ANSWERS: Record<string, string> = {
  white:
    "White paint colors come in three undertone families. Warm whites lean cream, yellow, or peach (Benjamin Moore White Dove, Sherwin-Williams Pure White). Cool whites lean blue or gray (Benjamin Moore Chantilly Lace, Sherwin-Williams Snowbound). True neutral whites are rare. Match the white's undertone to your fixed elements — warm floors and brass hardware call for warm whites; cool tile and chrome call for cool whites. Always sample three options on the actual wall before committing.",
  "off-white":
    "Off-white paint colors are defined by their underlying warm cast. Cream, ivory, ecru, oat, and bone tones all sit here. Most lean toward yellow-warm undertones rather than cool gray, which makes them forgiving in north-facing rooms where pure whites can read sterile. Designer staples include Benjamin Moore Swiss Coffee and Sherwin-Williams Alabaster. Filter by undertone above to find off-whites that lean warmer or pull toward a cooler greige.",
  gray:
    "Grays come in three distinct undertone families. Blue-leaning grays read crisp and cool; green-leaning grays feel earthy and architectural; purple-leaning grays warm slightly under 2700K incandescent light. Warm grays like Sherwin-Williams Agreeable Gray and Benjamin Moore Revere Pewter lean tan. Cool grays like Benjamin Moore Pewter and Sherwin-Williams Repose Gray stay closer to neutral. Match your gray to your light source — north-facing rooms punish any blue undertone, while south-facing rooms can support cooler grays.",
  neutral:
    "Neutral paint colors sit on the border between gray and beige — greige is the technical name. They're temperature-flexible: warm neutrals lean tan or pink, cool neutrals lean gray-blue, and true neutrals show neither bias. Benjamin Moore Edgecomb Gray and Revere Pewter are the most-searched greiges. Because neutrals carry such subtle bias, sampling on the actual wall under both daylight and 2700K bulbs is essential — what looks beige on the chip can read pink at scale.",
  beige:
    "Beige paint colors carry warm undertones — yellow, gold, peach, or red. The cleanest beiges, like Sherwin-Williams Accessible Beige and Benjamin Moore Manchester Tan, avoid the pink or orange cast that dates older beiges. Modern beige favors a slight green or gray push for greige territory. Beiges pair beautifully with warm wood floors, brass, and natural fibers. Always check them under 4000K LED lighting — many beiges that look balanced under 2700K bulbs shift to a clinical gray under daylight.",
  tan:
    "Tan paint colors fall between beige and brown — warmer than beige, lighter than chocolate. Common undertones are yellow (sandy, oat) and red (rose-tan, ochre). Tans pair naturally with warm woods, leather, and brass; they feel less formal than gray and warmer than off-white, which makes them popular for hallways and family rooms. Pure neutral tans are rare — most lean either warmer toward camel or cooler toward greige. Sample under both daylight and lamp light to see the true bias.",
  brown:
    "Brown paint colors range from cool taupe and mushroom to warm chocolate, cocoa, and espresso. Undertones are usually red, yellow, or violet. Light browns like Benjamin Moore Camel Back read as warm neutrals; medium browns like Sherwin-Williams Java anchor furniture-grade spaces; deep browns like Benjamin Moore Iron Mountain work as accents and exteriors. Browns absorb a lot of light, so check LRV before committing — a 10-LRV chocolate reads dramatically different than a 25-LRV warm taupe.",
  black:
    "Black paint colors aren't monolithic. True blacks like Benjamin Moore Black Beauty sit near LRV 5. Softer blacks like Sherwin-Williams Tricorn Black and Benjamin Moore Wrought Iron hover around LRV 6-8 with subtle undertones — brown, blue, or green. The undertone matters most on walls where you'll see large fields of color; trim and accent uses are more forgiving. Pair true blacks with crisp whites; pair soft blacks with warm whites and natural wood.",
  red:
    "Red paint colors come in two main undertone families. Warm reds with yellow or orange bias produce terracotta, brick, and rust. Cool reds with blue or violet bias produce raspberry, wine, and oxblood. Sherwin-Williams Cherry Tomato is a saturated warm red; Benjamin Moore Caliente is the iconic Color of the Year red — balanced and true. Reds intensify under 2700K bulbs and can read pinker under 4000K daylight. Reserve true reds for accent walls; warmer earth-reds work for full rooms.",
  orange:
    "Orange paint colors range from soft peach and apricot through terracotta and burnt sienna to vibrant tangerine. Undertones are typically yellow (sandy, ochre) or red (rust, copper). Warm earth-oranges like Sherwin-Williams Cavern Clay and Benjamin Moore Spiced Pumpkin pair with warm wood floors, brass, and natural materials. Bright oranges work best as accent walls or in active rooms — kitchens, playrooms, home offices. Under 2700K bulbs they deepen into amber; under daylight they stay truer to the chip.",
  yellow:
    "Yellow paint colors come in three temperature zones. Warm yellows like butter, gold, and honey lean orange or red. Cool yellows like lemon and citrus lean green. Balanced yellows like creamy and custard sit in between. Benjamin Moore Hawthorne Yellow is a designer staple. Yellows read more golden under 2700K bulbs and stay truer under 4000K daylight — saturated yellows can edge toward green in mixed light. Pair with crisp whites for trim and navy or deep teal for accent contrast.",
  green:
    "Green paint colors carry more undertone variation than any other family. Blue-greens (teal, emerald, jade) read cool. Yellow-greens (olive, sage, moss) read warm. Pure greens (forest, kelly) sit in between. Sherwin-Williams Evergreen Fog and Benjamin Moore Saybrook Sage are popular sages; deeper choices like Hunter Green or Farrow & Ball Calke Green go architectural. Greens shift the most under different lighting — 2700K warms them toward olive, while 4000K daylight reveals their true tone.",
  blue:
    "Blue paint colors split into three undertone families. Green-blues (teal, peacock, aqua) lean warmer; pure blues (cornflower, sky, navy) sit in the middle; red-blues (periwinkle, indigo, deep navy) lean cooler. Benjamin Moore Hale Navy is the most-searched modern navy; lighter staples like Sherwin-Williams Sea Salt and Benjamin Moore Healing Aloe lean toward soft spa territory. Blues stay crisp under 4000K LEDs but can read grayer or shift slightly purple under 2700K warm bulbs.",
  purple:
    "Purple paint colors are the most lighting-sensitive family. Cool purples (lavender, lilac, violet) lean blue. Warm purples (plum, eggplant, mauve) lean red. Under 2700K warm bulbs all purples push toward mauve or pink; under 4000K daylight they keep their violet integrity. Light purples work as bedroom accent walls; deep eggplants like Farrow & Ball Pelt make dramatic dining rooms. Always sample at multiple times of day — what reads purple at noon often reads gray or pink at sunset.",
  pink:
    "Pink paint colors range from soft blush and powder pink through coral and salmon to vibrant magenta and fuchsia. Undertones are usually peach (warm, leaning orange) or true pink (cool, leaning blue-violet). Designer staples include Benjamin Moore Pink Bliss and Sherwin-Williams Faint Coral. Warm pinks glow under 2700K bulbs and lean coral; cool pinks stay more saturated and slightly cooler under daylight. Pinks pair surprisingly well with deep green accents and natural wood — keeps them from feeling too sweet.",
};
