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
          and a palette of 1,700+ colors. Their most popular color — Agreeable Gray (SW 7029) — has
          been the best-selling paint color in the country for five consecutive years. The brand is
          known for excellent contractor-grade formulas and frequent 30–40% off sales.
        </p>
        <p>
          Top product lines include <strong>Emerald</strong> (premium, self-leveling),{" "}
          <strong>Duration</strong> (extreme durability), and <strong>SuperPaint</strong> (solid
          mid-range). Sherwin-Williams paint is sold through their own stores and Lowe&apos;s (HGTV
          Home line). Price range: $55–$80+ per gallon depending on the line.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Popular Sherwin-Williams Colors</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Best sellers include Agreeable Gray, Pure White, Alabaster, Repose Gray, and Naval. For
          kitchen-specific picks, see our{" "}
          <Link href="/blog/best-kitchen-paint-colors-2025" className="text-brand-blue hover:underline">
            kitchen colors guide
          </Link>. Looking for a specific Benjamin Moore shade in SW? Our cross-brand matching shows
          the closest{" "}
          <Link href="/blog/best-sherwin-williams-alternatives-to-benjamin-moore" className="text-brand-blue hover:underline">
            SW alternatives to BM&apos;s top sellers
          </Link>. Click any color below to see matches from all 14 brands.
        </p>
      </div>
    ),
  },

  "benjamin-moore": {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Benjamin Moore is the premium paint brand preferred by interior designers and professional
          painters. Their Gennex color system produces exceptionally accurate, consistent color, and
          their 3,500+ color palette is the largest among major brands. Benjamin Moore is sold
          exclusively through independent paint stores and hardware stores — not big-box retailers.
        </p>
        <p>
          Top product lines include <strong>Aura</strong> (the premium flagship — true one-coat
          coverage), <strong>Regal Select</strong> (excellent all-around performance), and{" "}
          <strong>Natura</strong> (zero-VOC for nurseries and bedrooms). Price range: $60–$85+ per
          gallon. The higher price buys you richer color depth and superior coverage.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Popular Benjamin Moore Colors</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Designer favorites include White Dove, Edgecomb Gray, Revere Pewter, Chantilly Lace, Hale
          Navy, and Simply White. See our{" "}
          <Link href="/blog/best-white-paint-colors-guide" className="text-brand-blue hover:underline">
            white paint guide
          </Link>{" "}
          for BM&apos;s best whites compared side by side. For a full brand showdown, read{" "}
          <Link href="/blog/behr-vs-sherwin-williams-vs-benjamin-moore" className="text-brand-blue hover:underline">
            Behr vs SW vs BM
          </Link>. Click any color below to see Delta E matches from all 14 brands.
        </p>
      </div>
    ),
  },

  behr: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Behr is the most accessible major paint brand, sold exclusively at Home Depot with a palette
          of 3,000+ colors. Consumer Reports has consistently ranked Behr Marquee at or near the top
          in blind coverage and durability tests. For DIY painters, Behr&apos;s thick consistency and
          one-coat formulas are especially forgiving.
        </p>
        <p>
          Top product lines include <strong>Dynasty</strong> (premium, one-coat, scuff-resistant),{" "}
          <strong>Marquee</strong> (excellent coverage, stain-blocking), and{" "}
          <strong>Premium Plus</strong> (solid budget option). Price range: $35–$55 per gallon — the
          most affordable of the big three brands.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Popular Behr Colors</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Best sellers include Silver Drop, Ultra Pure White, Cameo White, Dolphin Fin, and Whisper
          White. Behr&apos;s 2025 Color of the Year — Rumors — is a warm mushroom brown. For a full
          comparison of the big three brands, read our{" "}
          <Link href="/blog/behr-vs-sherwin-williams-vs-benjamin-moore" className="text-brand-blue hover:underline">
            Behr vs SW vs BM guide
          </Link>. Click any color below to find the closest match from Sherwin-Williams, Benjamin
          Moore, and 11 other brands.
        </p>
      </div>
    ),
  },

  ppg: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          PPG (Pittsburgh Paints & Stains) is one of the world&apos;s largest coatings companies,
          offering a diverse palette through multiple retail channels. PPG paints are available at PPG
          Paints stores, independent dealers, and Home Depot (under the PPG Diamond and Glidden brands).
          Their color expertise spans automotive, industrial, and residential markets.
        </p>
        <p>
          Top product lines include <strong>PPG Timeless</strong> (premium, one-coat guarantee) and{" "}
          <strong>PPG Diamond</strong> (durable mid-range). PPG&apos;s 2025 Color of the Year —
          Cracked Pepper — is a dramatic charcoal that broke from the warm earth tone trend.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Finding PPG Equivalents</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Click any PPG color below to see the closest matches from Sherwin-Williams, Benjamin Moore,
          and all other brands in our database. Use our{" "}
          <Link href="/compare" className="text-brand-blue hover:underline">compare tool</Link> to
          check the exact Delta E difference between any two colors.
        </p>
      </div>
    ),
  },

  valspar: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Valspar is a major paint brand now owned by Sherwin-Williams, sold exclusively at Lowe&apos;s.
          Their palette offers a wide range of colors at competitive prices, making them a popular
          choice for budget-conscious DIYers. Valspar&apos;s 2025 Color of the Year — Encore — is a
          warm sandy beige that reflects the broader shift toward earth tones.
        </p>
        <p>
          Top product lines include <strong>Valspar Reserve</strong> (premium) and{" "}
          <strong>Valspar Signature</strong> (one-coat, ScuffShield technology). Price range: $30–$50
          per gallon at Lowe&apos;s.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Cross-Brand Matching</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Found a color from another brand you love? Click any Valspar color below to see the closest
          equivalents from all 14 brands, ranked by{" "}
          <Link href="/blog/how-to-find-perfect-color-match-across-brands" className="text-brand-blue hover:underline">
            Delta E accuracy
          </Link>. You can also search by hex code in our{" "}
          <Link href="/search" className="text-brand-blue hover:underline">color search</Link>.
        </p>
      </div>
    ),
  },

  "dunn-edwards": {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Dunn-Edwards is a premium regional brand based in California, known for high-quality
          formulations engineered for Western climates — including intense sun, dry heat, and coastal
          salt air. Their paints are favored by West Coast architects and designers for exceptional
          durability and color accuracy.
        </p>
        <p>
          Top product lines include <strong>Suprema</strong> (premium interior) and{" "}
          <strong>Evershield</strong> (exterior). Dunn-Edwards is sold through their own stores
          primarily in California, Arizona, Nevada, New Mexico, and Texas.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Find Dunn-Edwards Matches Nationwide</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Love a Dunn-Edwards color but live outside their retail area? Click any color below to find
          the closest match from nationally available brands like{" "}
          <Link href="/brands/sherwin-williams" className="text-brand-blue hover:underline">Sherwin-Williams</Link>,{" "}
          <Link href="/brands/benjamin-moore" className="text-brand-blue hover:underline">Benjamin Moore</Link>, and{" "}
          <Link href="/brands/behr" className="text-brand-blue hover:underline">Behr</Link>.
        </p>
      </div>
    ),
  },

  "farrow-ball": {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Farrow & Ball is a British luxury paint brand renowned for its deeply pigmented, richly
          textured finishes. Each color is handcrafted in Dorset, England, using high concentrations of
          pigment that create an extraordinary depth of color — especially visible as light changes
          throughout the day. Farrow & Ball paints have a cult following among interior designers.
        </p>
        <p>
          Their palette is deliberately curated at approximately 150 colors rather than thousands.
          Price range: $100–$115+ per gallon — the most expensive major brand, reflecting the
          artisanal manufacturing process and pigment concentration.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Budget Alternatives to Farrow & Ball</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Love a Farrow & Ball color but not the price? Click any color below to see the closest
          matches from more affordable brands. Our Delta E matching finds near-identical shades from{" "}
          <Link href="/brands/benjamin-moore" className="text-brand-blue hover:underline">Benjamin Moore</Link>,{" "}
          <Link href="/brands/sherwin-williams" className="text-brand-blue hover:underline">Sherwin-Williams</Link>,
          and others — often at half the price per gallon.
        </p>
      </div>
    ),
  },

  "pratt-lambert": {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Pratt & Lambert is one of America&apos;s oldest paint brands, founded in 1849. Now part of
          the Sherwin-Williams family, P&L maintains its own distinct color palette and premium
          positioning. The brand is known for rich, nuanced colors and smooth application, sold
          through independent paint dealers and select hardware stores.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Cross-Brand Color Matching</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Click any Pratt & Lambert color to see the closest equivalents from all 14 brands in our
          database. Use our{" "}
          <Link href="/search" className="text-brand-blue hover:underline">color search</Link> to
          find any color by name, number, or hex code.
        </p>
      </div>
    ),
  },

  "california-paints": {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          California Paints is a regional brand with a strong presence on the East Coast and in
          California, sold through independent dealers. Now part of the PPG family, California Paints
          maintains a distinct palette focused on designer-friendly, nuanced colors. Their formulas
          are known for excellent hide and smooth leveling.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Find Matches Anywhere</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Click any California Paints color to see the closest match from nationally available brands.
          Our{" "}
          <Link href="/compare" className="text-brand-blue hover:underline">compare tool</Link> shows
          the exact Delta E difference between any two colors so you can match with confidence.
        </p>
      </div>
    ),
  },

  dulux: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Dulux is one of the world&apos;s most recognized paint brands, manufactured by AkzoNobel.
          While Dulux is the dominant brand in the UK, Australia, and many international markets, their
          palette offers a distinct color perspective that includes shades not found in North American
          brands. Dulux paints are known for consistent quality and excellent coverage.
        </p>
      </div>
    ),
    details: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Match Dulux to North American Brands</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Found a Dulux color you love? Click any color below to see the closest equivalents from{" "}
          <Link href="/brands/sherwin-williams" className="text-brand-blue hover:underline">Sherwin-Williams</Link>,{" "}
          <Link href="/brands/benjamin-moore" className="text-brand-blue hover:underline">Benjamin Moore</Link>,{" "}
          <Link href="/brands/behr" className="text-brand-blue hover:underline">Behr</Link>, and more
          — all ranked by Delta E accuracy.
        </p>
      </div>
    ),
  },
};

export function getBrandContent(slug: string): BrandContent | undefined {
  return content[slug];
}
