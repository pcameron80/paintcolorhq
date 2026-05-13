// Hand-written intro paragraphs for each /match/[a]/to/[b] directional
// brand pair page. With 7 brands in MAJOR_MATCH_BRANDS that's 42 directional
// pages (7 × 6 — same brand pair excluded). Each intro covers:
//   - Why someone typically makes this switch (price, availability, finish)
//   - Concrete undertone or color-matching specifics
//   - A practical sampling/usage caveat where relevant
//
// Keyed on `{sourceSlug}__{targetSlug}`. Missing keys fall back to the
// templated default ("Switching from X to Y? These are the closest matches.")
// on the match listing page.

export const BRAND_PAIR_INTROS: Record<string, string> = {
  // SW → others
  "sherwin-williams__benjamin-moore":
    "Sherwin-Williams to Benjamin Moore is the most cross-shopped pair in residential paint. Both are designer-tier brands with deep color libraries — SW skews toward cleaner mid-LRV grays while BM owns the warm whites category (White Dove, Chantilly Lace). For neutrals expect tight Delta E matches under 2.0; for saturated jewel tones BM's pigment density tends to win. Order both fan decks if you're picking trim and wall colors together.",
  "sherwin-williams__behr":
    "Switching from Sherwin-Williams to Behr usually comes down to availability and price — Behr Marquee at Home Depot runs about half the cost of SW's Emerald line for similar coverage. Color matching is reasonable in warm grays (Behr Silver Drop ↔ SW Repose Gray runs Delta E under 2). The biggest gaps show up in deep saturated colors where SW's tinting load tends to outperform. Wet-sample any color below LRV 30 before committing.",
  "sherwin-williams__ppg":
    "Sherwin-Williams to PPG cross-shopping is most common for exterior and commercial jobs where PPG Manor Hall is spec'd by builders. PPG is also available at Home Depot for consumer purchases. Warm white ranges overlap tightly (PPG Delicate White, Gypsum calibrate close to SW); cool grays diverge with PPG running about a half-step bluer. Test side by side before committing on north-facing walls.",
  "sherwin-williams__valspar":
    "Switching from Sherwin-Williams to Valspar usually means moving from a paint store to Lowe's. Valspar Signature competes with SW's value tier on price but the formulation hides brush marks less effectively at scale. Color matching is reasonable in neutrals — SW Repose Gray finds a near-identical Valspar match — but bold colors can read flatter. Sample on a vertical surface, not a flat chip, to see how the finish behaves.",
  "sherwin-williams__dunn-edwards":
    "Sherwin-Williams to Dunn-Edwards is largely a West Coast story — DE distribution is dense in California and the Southwest, plus its lower-VOC formulations align with state regulations. Their color spaces overlap heavily in neutrals (SW Agreeable Gray ↔ DE Bone China runs Delta E under 1.5). For trim, DE Whisper is the closest equivalent to SW Pure White. Both brands fan out cleanly under daylight.",
  "sherwin-williams__farrow-ball":
    "Sherwin-Williams to Farrow & Ball isn't a like-for-like switch — F&B's mineral pigments and finish depth create a different wall character entirely. Cross-shoppers usually want to recreate a specific F&B look (Hague Blue, Stiffkey Blue, Pelt) at SW pricing. Direct hex matches reach Delta E 2-3 for the closest equivalents but the finish character still reads differently on a real wall. Sample at minimum 4×4 inches under your room's actual lighting.",

  // BM → others
  "benjamin-moore__sherwin-williams":
    "Benjamin Moore to Sherwin-Williams reverses the most cross-shopped pair in residential paint. Both designer-tier brands; expect tight matches in mid-LRV grays and warm whites (BM White Dove ↔ SW Alabaster runs Delta E under 2). The differences show up in deep saturated colors where BM's pigment density tends to outperform. Order both fan decks for trim/wall coordination.",
  "benjamin-moore__behr":
    "Switching from Benjamin Moore to Behr typically saves 30-50% per gallon at Home Depot. Color matching is tight in warm whites (Behr Cameo White ↔ BM White Dove, Delta E under 2). Where Behr lags is the deeper jewel tones — BM's color depth in navies and forest greens doesn't always translate. Wet-sample any color under LRV 30 before committing on a full room.",
  "benjamin-moore__ppg":
    "Benjamin Moore to PPG cross-shopping is most common for commercial specs where PPG Manor Hall is the standard architectural choice. Warm white ranges overlap (BM Simply White ↔ PPG Delicate White at Delta E 1.5). PPG's cool grays calibrate a half-step bluer than BM's, which matters in north-facing rooms. Sample at multiple times of day to see lighting behavior.",
  "benjamin-moore__valspar":
    "Benjamin Moore to Valspar means moving from independent paint stores to Lowe's distribution. Valspar Reserve competes with BM at mid-price but the pigment density differs — BM produces a more uniform sheen at scale. For neutrals expect reasonable matches (BM Edgecomb Gray ↔ Valspar Notre Dame). Bold colors can read flatter in Valspar's value lines.",
  "benjamin-moore__dunn-edwards":
    "Benjamin Moore to Dunn-Edwards is most relevant on the West Coast where DE distribution is dense. DE's low-VOC formulations align with California regulations. Off-white ranges match BM tightly (BM Swiss Coffee ↔ DE Swiss Coffee runs at Delta E under 1). For deeper colors DE's palette is smaller but well-curated. Order DE samples directly if you're matching against existing BM walls.",
  "benjamin-moore__farrow-ball":
    "Benjamin Moore to Farrow & Ball isn't a price or convenience switch — it's a finish character change. F&B's mineral pigments and water-based formulations create a chalky depth BM's standard finishes don't replicate. Cross-shoppers usually want to recreate F&B's signature looks (Cornforth White, Ammonite, Pelt) with BM substitutes. Expect Delta E 2-4 for the closest hex matches; the wall still reads differently.",

  // Behr → others
  "behr__sherwin-williams":
    "Switching from Behr to Sherwin-Williams happens for two reasons: SW's stronger color depth in deep saturated colors (jewel tones, dark grays), and the paint-store color-matching experience that comes with the upgrade. Behr Marquee → SW Emerald is the closest line comparison; expect to spend roughly double per gallon. Most popular Behr-to-SW matches concentrate in the warm gray space (Behr Silver Drop ↔ SW Repose Gray).",
  "behr__benjamin-moore":
    "Behr to Benjamin Moore is often an upgrade-tier switch for whole-house projects where BM's pigment density and trim-line consistency matter. BM is sold through independent paint stores rather than Home Depot, so the buying experience changes too. Warm whites match tightly (Behr Cameo White ↔ BM White Dove). Deep colors are where the upgrade shows — BM produces richer reds and navies.",
  "behr__ppg":
    "Behr to PPG cross-shopping happens at the same Home Depot aisle — PPG is the other architectural brand on the shelf. PPG's color library skews slightly cooler in the gray range and warmer in the off-white range. For exterior work PPG Manor Hall is the more commonly spec'd choice. Expect tight Delta E matches in the mid-LRV neutral zone.",
  "behr__valspar":
    "Switching from Behr to Valspar typically happens for Lowe's vs Home Depot availability reasons — both brands sit at similar price points. Their undertone calibration differs especially in mid-LRV grays where Valspar leans cooler. Behr's color library is larger (4,500+ vs Valspar's 2,400) so Behr-to-Valspar matches are tighter than the reverse direction.",
  "behr__dunn-edwards":
    "Behr to Dunn-Edwards is a West Coast availability story — DE distribution is dense in California, less so elsewhere. DE's lower-VOC formulations are required for some California municipalities that Behr Marquee doesn't always meet. Color-wise DE's neutrals (Bone China, Whisper) calibrate close to Behr's whites and warm grays. Expect Delta E under 2 for the most common neutral targets.",
  "behr__farrow-ball":
    "Behr to Farrow & Ball is a major leap in both price (3-4x) and finish character. F&B's mineral pigments produce a depth Behr can't replicate. Cross-shoppers typically want F&B's signature deep colors (Hague Blue, Pelt, Studio Green) and need Behr substitutes for cost reasons. The closest Behr matches by hex will still read differently on the wall.",

  // PPG → others
  "ppg__sherwin-williams":
    "PPG to Sherwin-Williams is most commonly an upgrade switch for whole-house renovations where designer color matching support matters. SW's color library is similar in size (3,300 vs PPG's 2,100) but skews residential; PPG's tends toward commercial. Warm whites match tightly (PPG Delicate White ↔ SW Pure White). Cool grays diverge — PPG runs slightly bluer in mid-LRV ranges.",
  "ppg__benjamin-moore":
    "PPG to Benjamin Moore is an upgrade-tier switch — BM's pigment density and trim-line coordination outperform PPG's consumer lines at the cost of paint-store-only buying. For commercial-to-residential transitions PPG users find BM's library more designer-led. Off-whites match closely (PPG Gypsum ↔ BM Swiss Coffee, Delta E 1.5). Deep colors show BM's pigment advantage clearly.",
  "ppg__behr":
    "PPG and Behr share the Home Depot aisle — cross-shopping is usually about line availability (Behr Marquee vs PPG Manor Hall) rather than brand quality. Their color calibrations differ subtly: PPG runs cooler in grays, Behr runs warmer in whites. The most common cross-brand matches concentrate in the mid-LRV neutral range where both libraries are strong.",
  "ppg__valspar":
    "PPG to Valspar means moving from Home Depot to Lowe's. Price points are similar; the difference is which big-box is closer. Both have decent value tiers and reasonable color depth. Neutral matches are tight; bold colors show some divergence — Valspar's saturated reds tend to read warmer, PPG's read cooler.",
  "ppg__dunn-edwards":
    "PPG to Dunn-Edwards is most common on the West Coast where DE distribution is strongest. DE's lower-VOC formulations meet California regulations that PPG doesn't always cover. The brands overlap in commercial/architectural grays and off-whites. Expect Delta E under 2 for the closest neutral targets.",
  "ppg__farrow-ball":
    "PPG to Farrow & Ball is a specialty-brand switch — F&B's depth and chalky finish aren't a like-for-like replacement for PPG's commercial-leaning lines. Cross-shoppers typically want specific F&B colors (Pigeon, Pelt, Hague Blue) and need PPG's closest hex matches as a budget alternative. Delta E 2-4 is realistic; the finish character still differs.",

  // Valspar → others
  "valspar__sherwin-williams":
    "Valspar to Sherwin-Williams is an upgrade from Lowe's to designer-trusted paint stores. SW's pigment loading and color consistency outperform Valspar's value tier; price gap is roughly 2x. Their gray libraries overlap reasonably (Valspar Notre Dame ↔ SW Repose Gray runs Delta E 2). Bold and saturated colors show the upgrade most clearly.",
  "valspar__benjamin-moore":
    "Valspar to Benjamin Moore is an upgrade-tier switch from Lowe's to independent paint stores. BM's signature whites (White Dove, Simply White) don't have direct Valspar equivalents — Valspar's whites tend to run cooler. For warm grays expect Delta E 2 matches; for saturated colors expect BM's pigment depth to outperform clearly.",
  "valspar__behr":
    "Valspar to Behr typically means moving from Lowe's to Home Depot. Both brands sit at similar price points; differences come down to availability and finish character. Behr Marquee competes directly with Valspar Reserve. Behr's library is larger and trends warmer in grays; Valspar's leans cooler. Most popular cross-matches concentrate in the mid-LRV neutral range.",
  "valspar__ppg":
    "Valspar to PPG cross-shopping is most common for commercial work where PPG Manor Hall is the spec standard. From a consumer perspective both brands sit at similar price points on big-box shelves. Color libraries overlap in neutrals; PPG runs slightly cooler in grays. Expect tight matches in mid-LRV ranges.",
  "valspar__dunn-edwards":
    "Valspar to Dunn-Edwards is West Coast focused — DE distribution is dense in California, Valspar less so. DE's lower-VOC formulations meet California regulations. Their neutral palettes overlap reasonably; DE's off-whites tend to outperform Valspar's whites for trim use. Order both fan decks if you're matching trim and walls.",
  "valspar__farrow-ball":
    "Valspar to Farrow & Ball is a price and finish-character jump (3-4x cost difference). F&B's mineral pigments and chalky finish aren't directly replicable in Valspar's lines. Cross-shoppers want F&B's signature colors (Ammonite, Cornforth White, Hague Blue) at Valspar pricing. Delta E 2-3 matches are achievable on hex codes; the surface texture differs.",

  // DE → others
  "dunn-edwards__sherwin-williams":
    "Dunn-Edwards to Sherwin-Williams is most common when relocating from the West Coast (where DE dominates) to other regions where SW distribution is denser. DE's off-whites match SW tightly (DE Swiss Coffee ↔ SW Pure White, Delta E under 2). DE's color library is smaller but well-curated for California aesthetics — desert tones, sun-drenched neutrals.",
  "dunn-edwards__benjamin-moore":
    "Dunn-Edwards to Benjamin Moore is most common for relocations or commercial spec changes. Both are designer-trusted brands at similar price points; the switch is usually about distribution rather than tier. Off-whites match closely (DE Swiss Coffee ↔ BM Swiss Coffee, near-identical). For deeper colors BM's library is broader; DE's is more West-Coast-tuned.",
  "dunn-edwards__behr":
    "Dunn-Edwards to Behr typically means downgrading the paint quality tier for cost savings. DE's lower-VOC formulations align with California regulations that Behr doesn't always meet — verify local requirements first. Color matching is reasonable in the neutral range; expect Delta E 2 for warm grays.",
  "dunn-edwards__ppg":
    "Dunn-Edwards to PPG is most common for commercial-architectural specs where PPG is the standard. Their color spaces overlap in commercial neutrals (architectural grays, off-whites). DE's residential color library is more West-Coast-tuned; PPG's leans toward commercial specifications. Match quality is reasonable in the mid-LRV range.",
  "dunn-edwards__valspar":
    "Dunn-Edwards to Valspar is a price-tier change — Valspar's Lowe's distribution beats DE's specialty-store model on availability outside the West Coast. DE's neutrals are tighter and more designer-led; Valspar's lean toward consumer appeal. Expect Delta E 2 for matches in the mid-LRV neutral range.",
  "dunn-edwards__farrow-ball":
    "Dunn-Edwards to Farrow & Ball is a finish-character upgrade — F&B's mineral pigments produce a chalky depth DE's standard formulations don't replicate. Both brands are designer-trusted; F&B's heritage palette and unique pigment blends are the draw. Closest matches are imperfect; expect Delta E 2-4 with surface character differences.",

  // F&B → others
  "farrow-ball__sherwin-williams":
    "Farrow & Ball to Sherwin-Williams is most common when budget or availability rules out specialty-paint sourcing. SW's library is much larger (1,700+ vs F&B's 132) so most F&B colors have a tight hex match in SW. The finish character still differs — F&B's mineral pigments produce a chalky depth SW's standard finishes don't replicate. Expect Delta E 2-3 for hex matches.",
  "farrow-ball__benjamin-moore":
    "Farrow & Ball to Benjamin Moore is most common when budget or availability rules out F&B. BM's color library is the largest in the market (3,900+) so almost every F&B color has a tight hex equivalent. The wall character still differs — F&B's pigment density creates a finish depth standard BM lines don't replicate. Sample at minimum 4×4 inches under actual room lighting.",
  "farrow-ball__behr":
    "Farrow & Ball to Behr is a major price-tier drop (4x cost). Most F&B fans matching to Behr know the finish character won't replicate. Behr Marquee at Home Depot offers the closest hex matches; expect Delta E 2-3. The mineral-pigment depth that defines F&B isn't reproducible in Behr's standard formulations.",
  "farrow-ball__ppg":
    "Farrow & Ball to PPG is most common for commercial specs needing F&B's heritage look at architectural budgets. PPG's color library is broad but more commercial-leaning than F&B's designer palette. Hex matches are achievable in the off-white and gray ranges; finish character still differs noticeably. Sample at scale.",
  "farrow-ball__valspar":
    "Farrow & Ball to Valspar is a 4x price-tier drop. Valspar's library overlaps F&B's at the most common F&B targets (Cornforth White, Pigeon, Pelt). Hex matches are achievable; the mineral-pigment finish character that defines F&B isn't replicable in Valspar's standard formulations. Sample at minimum 4×4 inches.",
  "farrow-ball__dunn-edwards":
    "Farrow & Ball to Dunn-Edwards is most common on the West Coast where DE distribution is strong. Both brands are designer-trusted with curated palettes; F&B's library is smaller (132) and DE's broader (1,696). Hex matches are achievable in the off-white range. F&B's mineral pigment depth is hard to replicate in any standard latex paint, including DE.",
};

export function getBrandPairIntro(
  sourceSlug: string,
  targetSlug: string
): string | undefined {
  return BRAND_PAIR_INTROS[`${sourceSlug}__${targetSlug}`];
}
