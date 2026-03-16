import { type ReactNode } from "react";
import Link from "next/link";

export interface BrandContent {
  intro: ReactNode;
  details: ReactNode;
}

const content: Record<string, BrandContent> = {
  "sherwin-williams": {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Sherwin-Williams is America&apos;s largest paint company, with over 4,000 retail locations
          and a palette of 1,700+ colors. Founded in 1866 in Cleveland, Ohio, Sherwin-Williams has
          grown into a global coatings leader trusted by homeowners, contractors, and architects alike.
          Their most popular color —{" "}
          <Link href="/colors/sherwin-williams/agreeable-gray-sw-7029" className="text-brand-blue hover:underline">
            Agreeable Gray SW 7029
          </Link>{" "}
          — has been the best-selling paint color in the country for five consecutive years. The brand
          is known for excellent contractor-grade formulas and frequent 30–40% off sales.
        </p>
        <p>
          Other top Sherwin-Williams colors include{" "}
          <Link href="/colors/sherwin-williams/pure-white-sw-7005" className="text-brand-blue hover:underline">Pure White SW 7005</Link>,{" "}
          <Link href="/colors/sherwin-williams/alabaster-sw-7008" className="text-brand-blue hover:underline">Alabaster SW 7008</Link>,{" "}
          <Link href="/colors/sherwin-williams/repose-gray-sw-7015" className="text-brand-blue hover:underline">Repose Gray SW 7015</Link>, and{" "}
          <Link href="/colors/sherwin-williams/naval-sw-6244" className="text-brand-blue hover:underline">Naval SW 6244</Link>.
          These colors span warm whites, versatile grays, and bold accent shades that work in any home.
        </p>
        <p>
          Top product lines include <strong>Emerald</strong> (premium, self-leveling),{" "}
          <strong>Duration</strong> (extreme durability for exteriors and high-traffic interiors),{" "}
          <strong>SuperPaint</strong> (solid mid-range), and <strong>Cashmere</strong> (smooth,
          buttery application). Sherwin-Williams paint is sold through their own stores and Lowe&apos;s
          (HGTV Home line). Price range: $55–$80+ per gallon depending on the line. Pro tip: sign up
          for their PaintPerks program to get notified of sales events.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Popular Sherwin-Williams Colors</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Explore Sherwin-Williams&apos; best-selling{" "}
          <Link href="/colors/family/gray" className="text-brand-blue hover:underline">grays</Link>,{" "}
          <Link href="/colors/family/white" className="text-brand-blue hover:underline">whites</Link>, and{" "}
          <Link href="/colors/family/neutral" className="text-brand-blue hover:underline">neutrals</Link>.
          For kitchen-specific picks, see our{" "}
          <Link href="/blog/best-kitchen-paint-colors-2025" className="text-brand-blue hover:underline">
            kitchen colors guide
          </Link>. Looking for a specific Benjamin Moore shade in SW? Our cross-brand matching shows
          the closest{" "}
          <Link href="/blog/best-sherwin-williams-alternatives-to-benjamin-moore" className="text-brand-blue hover:underline">
            SW alternatives to BM&apos;s top sellers
          </Link>. Preview any color with our{" "}
          <Link href="/tools/room-visualizer" className="text-brand-blue hover:underline">room visualizer</Link>,
          or click any color below to see matches from all 14 brands.
        </p>
      </div>
    ),
  },

  "benjamin-moore": {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Benjamin Moore is the premium paint brand preferred by interior designers and professional
          painters. Founded in 1883 in Brooklyn, New York, Benjamin Moore has built a reputation for
          rich, true-to-swatch color over more than 140 years. Their proprietary Gennex color system
          produces exceptionally accurate, consistent color with every can, and their 3,500+ color
          palette is the largest among major paint brands. Benjamin Moore is sold exclusively through
          independent paint stores and hardware stores — you won&apos;t find it at Home Depot or
          Lowe&apos;s.
        </p>
        <p>
          The most popular Benjamin Moore colors consistently include{" "}
          <Link href="/colors/benjamin-moore/white-dove-oc-17" className="text-brand-blue hover:underline">White Dove OC-17</Link>,{" "}
          <Link href="/colors/benjamin-moore/edgecomb-gray-hc-173" className="text-brand-blue hover:underline">Edgecomb Gray HC-173</Link>,{" "}
          <Link href="/colors/benjamin-moore/revere-pewter-hc-172" className="text-brand-blue hover:underline">Revere Pewter HC-172</Link>,{" "}
          <Link href="/colors/benjamin-moore/chantilly-lace-oc-65" className="text-brand-blue hover:underline">Chantilly Lace OC-65</Link>,{" "}
          <Link href="/colors/benjamin-moore/hale-navy-hc-154" className="text-brand-blue hover:underline">Hale Navy HC-154</Link>, and{" "}
          <Link href="/colors/benjamin-moore/simply-white-oc-117" className="text-brand-blue hover:underline">Simply White OC-117</Link>.
          These colors have become staples in both residential and commercial design projects.
        </p>
        <p>
          Top product lines include <strong>Aura</strong> (the premium flagship — true one-coat
          coverage with Color Lock technology), <strong>Regal Select</strong> (excellent all-around
          performance for any room), <strong>Ben</strong> (budget-friendly entry point), and{" "}
          <strong>Natura</strong> (zero-VOC for nurseries and bedrooms). Price range: $60–$85+ per
          gallon. The higher price buys you richer color depth, superior coverage, and exceptional
          durability. To find a dealer, visit your local independent paint store or use Benjamin
          Moore&apos;s store locator on their website.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Popular Benjamin Moore Colors</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Benjamin Moore&apos;s most loved colors span every style. For warm neutrals, explore their{" "}
          <Link href="/colors/family/beige" className="text-brand-blue hover:underline">beige family</Link> and{" "}
          <Link href="/colors/family/gray" className="text-brand-blue hover:underline">gray family</Link>.
          See our{" "}
          <Link href="/blog/best-white-paint-colors-guide" className="text-brand-blue hover:underline">
            white paint guide
          </Link>{" "}
          for BM&apos;s best whites compared side by side. For a full brand showdown, read{" "}
          <Link href="/blog/behr-vs-sherwin-williams-vs-benjamin-moore" className="text-brand-blue hover:underline">
            Behr vs SW vs BM
          </Link>. Use our{" "}
          <Link href="/tools/room-visualizer" className="text-brand-blue hover:underline">room visualizer</Link>{" "}
          to preview any color in your space, or try the{" "}
          <Link href="/compare" className="text-brand-blue hover:underline">compare tool</Link> to see
          Delta E matches from all 14 brands.
        </p>
      </div>
    ),
  },

  behr: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Behr is the most accessible major paint brand in the United States, sold exclusively at
          Home Depot with a palette of 3,000+ colors. As the go-to paint for DIY homeowners, Behr
          has earned top marks from Consumer Reports, which has consistently ranked Behr Marquee at
          or near the top in blind coverage and durability tests. Behr&apos;s thick consistency and
          one-coat formulas are especially forgiving for first-time painters.
        </p>
        <p>
          The most popular Behr paint colors include{" "}
          <Link href="/colors/behr/silver-drop-790c-2" className="text-brand-blue hover:underline">Silver Drop 790C-2</Link>,{" "}
          <Link href="/colors/behr/ultra-pure-white-1850" className="text-brand-blue hover:underline">Ultra Pure White 1850</Link>,{" "}
          <Link href="/colors/behr/cameo-white-w-d-200" className="text-brand-blue hover:underline">Cameo White W-D-200</Link>,{" "}
          <Link href="/colors/behr/dolphin-fin-790c-3" className="text-brand-blue hover:underline">Dolphin Fin 790C-3</Link>, and{" "}
          <Link href="/colors/behr/whisper-white-w-d-300" className="text-brand-blue hover:underline">Whisper White W-D-300</Link>.
          These top sellers are overwhelmingly neutrals — reflecting the trend toward warm grays,
          soft whites, and greiges that dominate modern interior design.
        </p>
        <p>
          Top product lines include <strong>Dynasty</strong> (premium, one-coat, scuff-resistant — ideal
          for high-traffic areas), <strong>Marquee</strong> (excellent coverage with stain-blocking
          technology), <strong>Ultra</strong> (solid mid-range performer), and{" "}
          <strong>Premium Plus</strong> (the budget-friendly option that still delivers). Price range:
          $35–$55 per gallon — making Behr the most affordable of the big three brands. All Behr paints
          are available in-store at Home Depot or online at homedepot.com with free delivery on qualifying
          orders.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Popular Behr Colors</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Explore Behr&apos;s most loved color families:{" "}
          <Link href="/colors/family/gray" className="text-brand-blue hover:underline">grays</Link>,{" "}
          <Link href="/colors/family/white" className="text-brand-blue hover:underline">whites</Link>, and{" "}
          <Link href="/colors/family/beige" className="text-brand-blue hover:underline">beiges</Link> are
          the top sellers. For a full comparison of the big three brands, read our{" "}
          <Link href="/blog/behr-vs-sherwin-williams-vs-benjamin-moore" className="text-brand-blue hover:underline">
            Behr vs SW vs BM guide
          </Link>. Preview any Behr color in your room with our{" "}
          <Link href="/tools/room-visualizer" className="text-brand-blue hover:underline">room visualizer</Link>,
          or use the{" "}
          <Link href="/compare" className="text-brand-blue hover:underline">compare tool</Link> to find the
          closest match from Sherwin-Williams, Benjamin Moore, and 11 other brands.
        </p>
      </div>
    ),
  },

  ppg: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          PPG is one of the world&apos;s largest paint and coatings manufacturers, with roots going
          back to 1883 when Pittsburgh Plate Glass Company was founded in Pittsburgh, Pennsylvania.
          Today PPG operates in more than 70 countries and brings that global coatings expertise to its
          residential paint lines. PPG paints are available at Home Depot (under the PPG Timeless and
          PPG Diamond labels), PPG Paints stores, and independent dealers nationwide — giving homeowners
          and contractors multiple convenient purchasing options.
        </p>
        <p>
          Popular PPG colors include{" "}
          <Link href="/colors/ppg/delicate-white-1001-1" className="text-brand-blue hover:underline">Delicate White 1001-1</Link>,{" "}
          <Link href="/colors/ppg/gypsum-1006-1" className="text-brand-blue hover:underline">Gypsum 1006-1</Link>,{" "}
          <Link href="/colors/ppg/swirling-smoke-1007-2" className="text-brand-blue hover:underline">Swirling Smoke 1007-2</Link>,{" "}
          <Link href="/colors/ppg/stonehenge-greige-1024-5" className="text-brand-blue hover:underline">Stonehenge Greige 1024-5</Link>, and{" "}
          <Link href="/colors/ppg/olive-sprig-1125-4" className="text-brand-blue hover:underline">Olive Sprig 1125-4</Link>.
          These top sellers reflect the brand&apos;s strength in versatile neutrals, warm greiges, and
          nature-inspired accent colors.
        </p>
        <p>
          Top product lines include <strong>PPG Timeless</strong> (premium interior/exterior with a
          one-coat color guarantee and paint-and-primer-in-one formula), <strong>PPG Diamond</strong>{" "}
          (durable mid-range with excellent scuff and stain resistance), and the classic{" "}
          <strong>Pittsburgh Paints</strong> line sold through PPG Paints stores. PPG also owns the{" "}
          <strong>Glidden</strong> and <strong>Olympic</strong> brands for budget-friendly options.
          Price range: $35&ndash;$70 per gallon depending on the line. Preview any PPG color in your
          room with our{" "}
          <Link href="/tools/room-visualizer" className="text-brand-blue hover:underline">room visualizer</Link>,
          or use the{" "}
          <Link href="/compare" className="text-brand-blue hover:underline">compare tool</Link> to
          find the closest match from other brands.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Popular PPG Colors</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Explore PPG&apos;s best-selling{" "}
          <Link href="/colors/family/gray" className="text-brand-blue hover:underline">grays</Link>,{" "}
          <Link href="/colors/family/white" className="text-brand-blue hover:underline">whites</Link>, and{" "}
          <Link href="/colors/family/beige" className="text-brand-blue hover:underline">beiges</Link>.
          PPG&apos;s palette covers over 2,000 colors across every family, from soft neutrals to bold
          accents. Click any PPG color below to see the closest matches from Sherwin-Williams, Benjamin
          Moore, and all other brands in our database — ranked by{" "}
          <Link href="/blog/how-to-find-perfect-color-match-across-brands" className="text-brand-blue hover:underline">
            Delta E accuracy
          </Link>. Use our{" "}
          <Link href="/compare" className="text-brand-blue hover:underline">compare tool</Link> to
          check the exact difference between any two colors, or preview shades with the{" "}
          <Link href="/tools/room-visualizer" className="text-brand-blue hover:underline">room visualizer</Link>.
        </p>
      </div>
    ),
  },

  valspar: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Valspar is one of the most popular paint brands in America, available exclusively at
          Lowe&apos;s stores nationwide. Now owned by Sherwin-Williams (acquired in 2017), Valspar
          benefits from the parent company&apos;s color science while maintaining its own distinct
          palette of 2,000+ colors and competitive pricing. Valspar is a go-to choice for
          budget-conscious DIYers who want broad color selection without the premium price tag — and
          the convenience of picking up paint at any Lowe&apos;s location.
        </p>
        <p>
          Popular Valspar colors include{" "}
          <Link href="/colors/valspar/warm-eucalyptus-8004-28f" className="text-brand-blue hover:underline">Warm Eucalyptus 8004-28F</Link>{" "}
          (their 2026 Color of the Year),{" "}
          <Link href="/colors/valspar/safari-beige-6006-2b" className="text-brand-blue hover:underline">Safari Beige 6006-2B</Link>,{" "}
          <Link href="/colors/valspar/notre-dame-5006-1b" className="text-brand-blue hover:underline">Notre Dame 5006-1B</Link>,{" "}
          <Link href="/colors/valspar/gray-silt-6002-1c" className="text-brand-blue hover:underline">Gray Silt 6002-1C</Link>, and{" "}
          <Link href="/colors/valspar/gravity-4005-1b" className="text-brand-blue hover:underline">Gravity 4005-1B</Link>.
          These top sellers lean heavily toward warm neutrals, earthy tones, and calming greens —
          reflecting current design trends.
        </p>
        <p>
          Top product lines include <strong>Valspar Signature</strong> (premium one-coat coverage with
          ScuffShield technology for high-traffic areas), <strong>Valspar Reserve</strong> (the
          ultra-premium line with stain- and scuff-resistant finishes), and <strong>Valspar Ultra</strong>{" "}
          (a solid mid-range paint-and-primer-in-one). All Valspar paints are available in a full range
          of sheens from flat to high-gloss. Price range: $30&ndash;$55 per gallon — making Valspar one
          of the most affordable quality options on the market. Preview any Valspar color with our{" "}
          <Link href="/tools/room-visualizer" className="text-brand-blue hover:underline">room visualizer</Link>,
          or use the{" "}
          <Link href="/compare" className="text-brand-blue hover:underline">compare tool</Link> to
          find equivalent shades from other brands.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Popular Valspar Colors</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Explore Valspar&apos;s trending{" "}
          <Link href="/colors/family/green" className="text-brand-blue hover:underline">greens</Link>,{" "}
          <Link href="/colors/family/gray" className="text-brand-blue hover:underline">grays</Link>, and{" "}
          <Link href="/colors/family/beige" className="text-brand-blue hover:underline">beiges</Link> —
          their most popular color families. Found a color from another brand you love? Click any Valspar
          color below to see the closest equivalents from all 14 brands, ranked by{" "}
          <Link href="/blog/how-to-find-perfect-color-match-across-brands" className="text-brand-blue hover:underline">
            Delta E accuracy
          </Link>. You can also search by hex code in our{" "}
          <Link href="/search" className="text-brand-blue hover:underline">color search</Link>, or
          preview colors in your space with the{" "}
          <Link href="/tools/room-visualizer" className="text-brand-blue hover:underline">room visualizer</Link>.
        </p>
      </div>
    ),
  },

  "dunn-edwards": {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Dunn-Edwards is a premium West Coast paint brand founded in 1925 in Los Angeles, California.
          With over 150 company-owned stores across California, Arizona, Nevada, New Mexico, and Texas,
          Dunn-Edwards has built a loyal following among contractors, architects, and designers who
          demand exceptional quality. The brand is particularly known for its zero-VOC and low-VOC
          formulas — their <strong>SUPREMA</strong> line earned GreenWise certification — making them an
          excellent choice for environmentally conscious homeowners and projects where air quality matters.
        </p>
        <p>
          Popular Dunn-Edwards colors include{" "}
          <Link href="/colors/dunn-edwards/swiss-coffee-dew341" className="text-brand-blue hover:underline">Swiss Coffee DEW341</Link>,{" "}
          <Link href="/colors/dunn-edwards/bone-china-dew339" className="text-brand-blue hover:underline">Bone China DEW339</Link>,{" "}
          <Link href="/colors/dunn-edwards/cottage-white-dew318" className="text-brand-blue hover:underline">Cottage White DEW318</Link>,{" "}
          <Link href="/colors/dunn-edwards/foggy-day-de6226" className="text-brand-blue hover:underline">Foggy Day DE6226</Link>, and{" "}
          <Link href="/colors/dunn-edwards/cold-water-de6316" className="text-brand-blue hover:underline">Cold Water DE6316</Link>.
          Their best sellers lean toward warm whites and soft neutrals that complement the sun-drenched
          interiors of Western homes.
        </p>
        <p>
          Top product lines include <strong>SUPREMA</strong> (premium interior with exceptional hide and
          coverage), <strong>Evershield</strong> (exterior formulated to resist cracking, peeling, and
          UV fade in harsh Western climates), and <strong>Aristoshield</strong> (interior/exterior with
          advanced stain and scuff resistance). Dunn-Edwards paints are contractor-grade quality with
          excellent color accuracy batch to batch. Price range: $45&ndash;$65 per gallon. While
          availability is limited to the Western US, you can use our{" "}
          <Link href="/tools/room-visualizer" className="text-brand-blue hover:underline">room visualizer</Link>{" "}
          to preview any Dunn-Edwards color, or find a nationally available match using our{" "}
          <Link href="/compare" className="text-brand-blue hover:underline">compare tool</Link>.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Find Dunn-Edwards Matches Nationwide</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Love a Dunn-Edwards color but live outside the Western US? Click any color below to find
          the closest match from nationally available brands like{" "}
          <Link href="/brands/sherwin-williams" className="text-brand-blue hover:underline">Sherwin-Williams</Link>,{" "}
          <Link href="/brands/benjamin-moore" className="text-brand-blue hover:underline">Benjamin Moore</Link>, and{" "}
          <Link href="/brands/behr" className="text-brand-blue hover:underline">Behr</Link>. Explore
          Dunn-Edwards&apos;{" "}
          <Link href="/colors/family/white" className="text-brand-blue hover:underline">whites</Link>,{" "}
          <Link href="/colors/family/beige" className="text-brand-blue hover:underline">beiges</Link>, and{" "}
          <Link href="/colors/family/gray" className="text-brand-blue hover:underline">grays</Link> —
          their most popular families. Use our{" "}
          <Link href="/tools/room-visualizer" className="text-brand-blue hover:underline">room visualizer</Link>{" "}
          to preview any shade in your space.
        </p>
      </div>
    ),
  },

  "farrow-ball": {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Farrow &amp; Ball is a British luxury paint brand founded in 1946 in Dorset, England, renowned
          for its deeply pigmented, richly textured finishes. Each color is handcrafted using
          exceptionally high concentrations of pigment that create an extraordinary depth and complexity
          of color — especially visible as natural light changes throughout the day. The brand has a
          cult following among interior designers, architects, and homeowners who want paint that looks
          and feels fundamentally different from mass-market alternatives. Farrow &amp; Ball paints are
          available through their own showrooms, select design retailers, and online.
        </p>
        <p>
          The most iconic Farrow &amp; Ball colors include{" "}
          <Link href="/colors/farrow-ball/hague-blue-30" className="text-brand-blue hover:underline">Hague Blue No.30</Link>,{" "}
          <Link href="/colors/farrow-ball/elephants-breath-229" className="text-brand-blue hover:underline">Elephant&apos;s Breath No.229</Link>,{" "}
          <Link href="/colors/farrow-ball/cornforth-white-228" className="text-brand-blue hover:underline">Cornforth White No.228</Link>,{" "}
          <Link href="/colors/farrow-ball/ammonite-274" className="text-brand-blue hover:underline">Ammonite No.274</Link>, and{" "}
          <Link href="/colors/farrow-ball/stiffkey-blue-281" className="text-brand-blue hover:underline">Stiffkey Blue No.281</Link>.
          These colors have become design world staples — Elephant&apos;s Breath is one of the most
          searched paint colors in the world, and Hague Blue has defined the moody blue trend for a decade.
        </p>
        <p>
          Their palette is deliberately curated at approximately 150 colors rather than thousands — each
          one carefully developed and given an evocative name drawn from British history and landscape.
          Farrow &amp; Ball is known for unique finish names: <strong>Modern Emulsion</strong> (a durable,
          wipeable matte for most rooms), <strong>Estate Emulsion</strong> (a chalky, ultra-matte finish
          for ceilings and low-traffic rooms), <strong>Full Gloss</strong> (for woodwork and trim), and{" "}
          <strong>Modern Eggshell</strong> (a mid-sheen for kitchens and bathrooms). Price range:
          $100&ndash;$120 per gallon — the most expensive major brand, reflecting artisanal manufacturing,
          premium pigment concentration, and water-based formulas. Preview any Farrow &amp; Ball color with
          our{" "}
          <Link href="/tools/room-visualizer" className="text-brand-blue hover:underline">room visualizer</Link>,
          or use the{" "}
          <Link href="/compare" className="text-brand-blue hover:underline">compare tool</Link> to find a
          budget-friendly alternative from other brands.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Budget Alternatives to Farrow &amp; Ball</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Love a Farrow &amp; Ball color but not the $100+ price tag? Click any color below to see the
          closest matches from more affordable brands. Our Delta E matching finds near-identical shades
          from{" "}
          <Link href="/brands/benjamin-moore" className="text-brand-blue hover:underline">Benjamin Moore</Link>,{" "}
          <Link href="/brands/sherwin-williams" className="text-brand-blue hover:underline">Sherwin-Williams</Link>,
          and{" "}
          <Link href="/brands/behr" className="text-brand-blue hover:underline">Behr</Link> — often at
          a third of the price per gallon. Explore Farrow &amp; Ball&apos;s most loved{" "}
          <Link href="/colors/family/blue" className="text-brand-blue hover:underline">blues</Link>,{" "}
          <Link href="/colors/family/gray" className="text-brand-blue hover:underline">grays</Link>, and{" "}
          <Link href="/colors/family/white" className="text-brand-blue hover:underline">whites</Link>, or
          use our{" "}
          <Link href="/compare" className="text-brand-blue hover:underline">compare tool</Link> to check
          the exact Delta E difference between any two colors.
        </p>
      </div>
    ),
  },

  kilz: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Kilz is best known as America&apos;s #1 primer brand, but they also offer a full line of
          interior paints. Founded in 1954 and now a sister company to Behr under the Masco
          Corporation, Kilz brings decades of stain-blocking and adhesion expertise to their paint
          formulas. Kilz products are sold at Home Depot and Walmart.
        </p>
        <p>
          Their flagship paint line is <strong>Kilz Tribute</strong> — a premium interior paint +
          primer with excellent stain-blocking and coverage (up to 400 sq ft per gallon), available in
          Matte, Eggshell, Satin, and Semi-Gloss. They also make specialty paints including{" "}
          <strong>Porch & Patio</strong> floor paint and <strong>Cabinet & Trim</strong>. Price
          range: $30–$40 per gallon.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Kilz Cross-Brand Matching</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Click any Kilz color below to find the closest matches from{" "}
          <Link href="/brands/behr" className="text-brand-blue hover:underline">Behr</Link>,{" "}
          <Link href="/brands/sherwin-williams" className="text-brand-blue hover:underline">Sherwin-Williams</Link>,{" "}
          <Link href="/brands/benjamin-moore" className="text-brand-blue hover:underline">Benjamin Moore</Link>,
          and all other brands in our database — ranked by{" "}
          <Link href="/blog/how-to-find-perfect-color-match-across-brands" className="text-brand-blue hover:underline">
            Delta E accuracy
          </Link>.
        </p>
      </div>
    ),
  },

  "vista-paint": {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Vista Paint is a family-owned paint manufacturer founded in 1956 in Southern California.
          With over 65 years in business, Vista Paint operates 50+ company-owned retail stores across
          California and Southern Nevada. Their manufacturing facility runs on 100% solar energy,
          and the brand is known for quality contractor-grade paints at competitive prices.
        </p>
        <p>
          Top product lines include <strong>V-PRO 5000</strong> (premium professional-grade),{" "}
          <strong>Scuff-Tec</strong> (durable, scuff-resistant for high-traffic areas), and{" "}
          <strong>Carefree</strong> (mid-range interior/exterior). Price range: $25–$50 per gallon
          depending on the line.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Find Vista Paint Matches Nationwide</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Love a Vista Paint color but live outside California or Nevada? Click any color below to
          find the closest match from nationally available brands like{" "}
          <Link href="/brands/sherwin-williams" className="text-brand-blue hover:underline">Sherwin-Williams</Link>,{" "}
          <Link href="/brands/benjamin-moore" className="text-brand-blue hover:underline">Benjamin Moore</Link>, and{" "}
          <Link href="/brands/behr" className="text-brand-blue hover:underline">Behr</Link>.
        </p>
      </div>
    ),
  },

  hirshfields: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Hirshfield&apos;s is a fourth-generation, family-owned paint and decorating company based in
          Minneapolis, Minnesota, with over 130 years of history. They are the largest manufacturer of
          trade sales paint in Minnesota, producing over 5,000 gallons daily at their Minneapolis
          facility. Hirshfield&apos;s operates 30+ decorating centers across Minnesota, North Dakota,
          South Dakota, and Wisconsin.
        </p>
        <p>
          Top product lines include <strong>Platinum Ceramic</strong> (premium interior),{" "}
          <strong>Reserve</strong> (mid-premium interior), and <strong>Wash & Wear</strong> (solid
          everyday flat). They also make <strong>Housecoat</strong> and <strong>House & Trim</strong>{" "}
          for exteriors. Price range: $47–$69 per gallon.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Hirshfield&apos;s Cross-Brand Matching</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Live outside the Upper Midwest? Click any Hirshfield&apos;s color below to find the closest
          equivalent from nationally available brands like{" "}
          <Link href="/brands/sherwin-williams" className="text-brand-blue hover:underline">Sherwin-Williams</Link>,{" "}
          <Link href="/brands/benjamin-moore" className="text-brand-blue hover:underline">Benjamin Moore</Link>, and{" "}
          <Link href="/brands/behr" className="text-brand-blue hover:underline">Behr</Link>. Use our{" "}
          <Link href="/compare" className="text-brand-blue hover:underline">compare tool</Link> to check the
          exact Delta E difference between any two colors.
        </p>
      </div>
    ),
  },

  colorhouse: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Colorhouse is a woman-owned, eco-friendly paint company founded in 2005 in Portland, Oregon.
          Their paints are zero-VOC, low-odor, and free of reproductive toxins and chemical solvents —
          making them an excellent choice for nurseries, bedrooms, and homes with children or pets.
          Colorhouse paints are sold online and through select retailers.
        </p>
        <p>
          Their artist-crafted palette is organized into unique thematic families like Air, Stone,
          Clay, Leaf, Water, and Petal. Available in Flat, Eggshell, and Semi-Gloss sheens. Price
          range: $36–$50 per gallon.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Colorhouse Cross-Brand Matching</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Love a Colorhouse shade but want to compare options? Click any color below to see the
          closest matches from all 14 brands in our database. For nursery-safe color ideas, see our{" "}
          <Link href="/blog/best-nursery-paint-colors" className="text-brand-blue hover:underline">
            nursery paint colors guide
          </Link>.
        </p>
      </div>
    ),
  },

  "dutch-boy": {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Dutch Boy is a heritage paint brand founded in 1907, now a subsidiary of Sherwin-Williams.
          Known for its iconic Dutch boy mascot and innovations like the Twist & Pour paint can,
          Dutch Boy is primarily sold at Menards stores and is positioned as a value-to-mid-tier
          paint brand with solid performance.
        </p>
        <p>
          Top product lines include <strong>Platinum Plus</strong> (premium, with water-based alkyd
          technology for cabinets and trim), <strong>Dura Clean</strong> (dirt-resistant formula with
          Kitchen & Bath variants), and <strong>Forever</strong> (interior/exterior with Arm & Hammer
          odor-eliminating technology). Price range: $25–$45 per gallon at Menards.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Dutch Boy Cross-Brand Matching</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Don&apos;t have a Menards nearby? Click any Dutch Boy color below to find the closest match
          from nationally available brands like{" "}
          <Link href="/brands/sherwin-williams" className="text-brand-blue hover:underline">Sherwin-Williams</Link>,{" "}
          <Link href="/brands/behr" className="text-brand-blue hover:underline">Behr</Link>, and{" "}
          <Link href="/brands/benjamin-moore" className="text-brand-blue hover:underline">Benjamin Moore</Link> —
          ranked by{" "}
          <Link href="/blog/how-to-find-perfect-color-match-across-brands" className="text-brand-blue hover:underline">
            Delta E accuracy
          </Link>.
        </p>
      </div>
    ),
  },

  ral: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          RAL is the European standard color matching system, originating in Germany in 1927. Unlike
          paint brands, RAL defines standardized color codes used globally across industries —
          architecture, automotive, industrial coatings, powder coating, and manufacturing. When you
          specify a RAL color, any manufacturer can produce an exact match.
        </p>
        <p>
          The <strong>RAL Classic</strong> collection contains 216 colors, each identified by a 4-digit
          code. The system also includes <strong>RAL Design System Plus</strong> (1,825 colors) and{" "}
          <strong>RAL Effect</strong> (490 colors including metallics). RAL colors are the go-to
          standard for European architecture, windows, doors, facades, and industrial applications.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Match RAL Colors to Paint Brands</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Need to match a RAL specification to a retail paint brand? Click any RAL color below to find
          the closest available paint from{" "}
          <Link href="/brands/sherwin-williams" className="text-brand-blue hover:underline">Sherwin-Williams</Link>,{" "}
          <Link href="/brands/benjamin-moore" className="text-brand-blue hover:underline">Benjamin Moore</Link>,{" "}
          <Link href="/brands/behr" className="text-brand-blue hover:underline">Behr</Link>, and 11 other
          brands — ranked by Delta E accuracy.
        </p>
      </div>
    ),
  },

  mpc: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          MPC (Master Paint Colors) is a paint color system offering a wide selection of architectural
          colors. Their palette provides a comprehensive range of shades organized across every color
          family, from neutrals and whites to bold accent colors.
        </p>
        <p>
          MPC colors are commonly used as reference standards in the coatings industry, making them
          useful for color matching and specification. Their systematic naming convention makes it
          easy to identify colors by family and tone.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Match MPC Colors to Retail Brands</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Click any MPC color below to find the closest available paint from retail brands like{" "}
          <Link href="/brands/sherwin-williams" className="text-brand-blue hover:underline">Sherwin-Williams</Link>,{" "}
          <Link href="/brands/benjamin-moore" className="text-brand-blue hover:underline">Benjamin Moore</Link>, and{" "}
          <Link href="/brands/behr" className="text-brand-blue hover:underline">Behr</Link>. Use our{" "}
          <Link href="/compare" className="text-brand-blue hover:underline">compare tool</Link> to check the
          exact Delta E difference between any two colors.
        </p>
      </div>
    ),
  },

};

export function getBrandContent(slug: string): BrandContent | undefined {
  return content[slug];
}
