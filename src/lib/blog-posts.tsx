import { type ReactNode } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface BlogPost {
  slug: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  excerpt: string;
  coverColor: string; // hex for card accent
  tags: string[];
  content: () => ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function Swatch({ hex, name, brand }: { hex: string; name: string; brand?: string }) {
  return (
    <span className="my-1 inline-flex items-center gap-2">
      <span
        className="inline-block h-5 w-5 rounded border border-gray-200"
        style={{ backgroundColor: hex }}
        aria-hidden="true"
      />
      <span className="text-sm font-medium text-gray-800">{name}</span>
      {brand && <span className="text-sm text-gray-500">({brand})</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Posts                                                               */
/* ------------------------------------------------------------------ */

const blogPosts: BlogPost[] = [
  /* ──────────────── Post 1 ──────────────── */
  {
    slug: "2025-colors-of-the-year-every-brand-compared",
    title: "2025 Colors of the Year: Every Major Brand Compared",
    date: "2025-04-15",
    excerpt:
      "See every major paint brand's 2025 Color of the Year side by side — from Sherwin-Williams to Benjamin Moore to Behr — with closest cross-brand matches.",
    coverColor: "#A4785F",
    tags: ["Trends", "Color of the Year", "2025"],
    content: () => (
      <>
        <p className="text-lg leading-relaxed text-gray-800">
          Every year, the biggest paint brands announce their Color of the Year — a single shade they believe captures the cultural mood. For 2025, the picks reveal a clear trend: warm, grounding tones inspired by nature. Let&apos;s break down every major selection and find the closest matches across brands.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Sherwin-Williams: Wholesome</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#A4785F" name="Wholesome" brand="Sherwin-Williams" /> is a warm, earthy terracotta that evokes clay pots, sun-dried landscapes, and handmade ceramics. Sherwin-Williams describes it as a color that &ldquo;grounds your space and nourishes the soul.&rdquo; It sits squarely in the brown family with noticeable orange undertones.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Looking for this shade from another brand? Check out <Link href="/colors/benjamin-moore/mesa-rust" className="text-blue-600 hover:underline">Benjamin Moore Mesa Rust</Link> or <Link href="/colors/behr/canyon-dusk" className="text-blue-600 hover:underline">Behr Canyon Dusk</Link> for similar warm clay tones. Use our <Link href="/search" className="text-blue-600 hover:underline">color search</Link> to find the closest Delta E match from any brand.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Benjamin Moore: Cinnamon Slate</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#7B5B4C" name="Cinnamon Slate" brand="Benjamin Moore" /> is a muted, sophisticated brown with violet-gray undertones. It&apos;s darker and cooler than Sherwin-Williams&apos; pick, landing in a space between chocolate and plum. This is a color that works beautifully on accent walls, cabinetry, and exterior doors.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Browse all <Link href="/brands/benjamin-moore" className="text-blue-600 hover:underline">Benjamin Moore colors</Link> to find complementary shades for a full palette.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Behr: Rumors</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#7D6B5D" name="Rumors" brand="Behr" /> is a muted mushroom-brown with gray undertones. It&apos;s the most neutral of the 2025 picks — versatile enough for whole-home use. Behr positions it as a &ldquo;modern neutral that replaces gray.&rdquo;
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Compare it against the full <Link href="/colors/family/brown" className="text-blue-600 hover:underline">brown color family</Link> to see how it stacks up against thousands of similar shades.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">PPG: Cracked Pepper</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#4B4A4E" name="Cracked Pepper" brand="PPG" /> breaks from the warm trend with a deep charcoal that has the faintest purple undertone. It&apos;s dramatic, modern, and perfect for creating contrast. Think statement kitchen islands, front doors, and accent walls.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Valspar: Encore</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#A28974" name="Encore" brand="Valspar" /> is a warm sandy beige that bridges the gap between tan and terracotta. It&apos;s the lightest of this year&apos;s picks and the easiest to use in large doses.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">The Common Thread</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Four out of five brands chose a shade in the brown-to-terracotta spectrum. The era of cool grays is officially over. If you&apos;re planning a 2025 refresh, start with warm earth tones and build outward.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Want to see how all these colors compare scientifically? Use our <Link href="/compare" className="text-blue-600 hover:underline">color compare tool</Link> to calculate the exact Delta E 2000 difference between any two shades.
        </p>
      </>
    ),
  },

  /* ──────────────── Post 2 ──────────────── */
  {
    slug: "best-sherwin-williams-alternatives-to-benjamin-moore",
    title: "Best Sherwin-Williams Alternatives to Benjamin Moore's Most Popular Colors",
    date: "2025-05-20",
    excerpt:
      "Found the perfect Benjamin Moore shade but prefer Sherwin-Williams? Here are the closest SW matches for BM's top sellers, verified by Delta E 2000.",
    coverColor: "#D4C5A9",
    tags: ["Cross-Brand Matching", "Sherwin-Williams", "Benjamin Moore"],
    content: () => (
      <>
        <p className="text-lg leading-relaxed text-gray-800">
          Benjamin Moore and Sherwin-Williams are the two most popular paint brands in North America, but their colors don&apos;t always cross-reference neatly. If your painter stocks Sherwin-Williams but you fell in love with a Benjamin Moore swatch, this guide shows you the closest match — backed by Delta E 2000 color science.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">How We Match Colors</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          We use the <strong>Delta E 2000</strong> formula, which measures the perceptible difference between two colors in a way that aligns with human vision. A Delta E under 1.0 is virtually indistinguishable; under 2.0 is a very close match that most people won&apos;t notice. Our database covers <Link href="/brands" className="text-blue-600 hover:underline">14 major paint brands</Link> with over 25,000 colors.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Revere Pewter → Accessible Beige</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#C2B9A7" name="Revere Pewter" brand="Benjamin Moore" /> is one of the most specced neutral colors in residential design. Its warm greige tone has dominated builder-grade homes for a decade. The closest Sherwin-Williams match is <Swatch hex="#D1C4A9" name="Accessible Beige" brand="Sherwin-Williams" />, which leans slightly warmer and lighter but reads nearly identical on walls.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Simply White → Extra White</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#F1EDE3" name="Simply White" brand="Benjamin Moore" /> is a clean, warm white that avoids going yellow. Sherwin-Williams&apos; <Swatch hex="#F1E9D8" name="Extra White" brand="Sherwin-Williams" /> is the closest match, though <Swatch hex="#F3EEE0" name="Pure White" brand="Sherwin-Williams" /> is also worth sampling. Browse our <Link href="/colors/family/white" className="text-blue-600 hover:underline">white paint colors</Link> guide for the full rundown.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Hale Navy → Naval</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#3E4450" name="Hale Navy" brand="Benjamin Moore" /> is a rich, sophisticated navy that works on cabinets, accent walls, and front doors. Sherwin-Williams&apos; <Swatch hex="#34405A" name="Naval" brand="Sherwin-Williams" /> is deeper and slightly more saturated but occupies the same design niche. For a closer lightness match, also consider <Swatch hex="#454C5E" name="Charcoal Blue" brand="Sherwin-Williams" />.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Edgecomb Gray → Agreeable Gray</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#D3CBBA" name="Edgecomb Gray" brand="Benjamin Moore" /> is a warm gray-beige that has been the go-to neutral for transitional interiors. <Swatch hex="#D0C8B5" name="Agreeable Gray" brand="Sherwin-Williams" /> is remarkably similar and consistently ranks as SW&apos;s best-selling color. View the full <Link href="/colors/family/gray" className="text-blue-600 hover:underline">gray family</Link> to explore alternatives.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Chantilly Lace → High Reflective White</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#F5F1EB" name="Chantilly Lace" brand="Benjamin Moore" /> is BM&apos;s crispest, most popular true white. The SW equivalent is <Swatch hex="#F6F0E4" name="High Reflective White" brand="Sherwin-Williams" />, which is also the whitest shade in their deck. Both have minimal undertones and photograph cleanly.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Finding Your Own Matches</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Don&apos;t see your color here? Every color page on Paint Color HQ shows the <strong>closest matches from every other brand</strong> automatically. Just search for your Benjamin Moore color in our <Link href="/search" className="text-blue-600 hover:underline">color search</Link> and scroll to the cross-brand matches section.
        </p>
      </>
    ),
  },

  /* ──────────────── Post 3 ──────────────── */
  {
    slug: "understanding-paint-color-undertones",
    title: "Understanding Undertones: Why Your Gray Looks Blue",
    date: "2025-06-18",
    excerpt:
      "Learn what undertones are, why they matter, and how to identify them before you commit to a paint color. Avoid the most common color selection mistake.",
    coverColor: "#B0B7BB",
    tags: ["Color Theory", "Tips", "Gray"],
    content: () => (
      <>
        <p className="text-lg leading-relaxed text-gray-800">
          You picked a gorgeous gray from the paint chip wall. You painted the whole living room. And now it looks… blue. Or purple. Or green. Welcome to the world of undertones — the hidden pigments lurking beneath every &ldquo;neutral&rdquo; color.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">What Are Undertones?</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Every paint color is created by mixing pigments, and the secondary pigments that give a color its subtle bias are called undertones. A gray might be mixed with blue, green, purple, or brown pigments — and while the color still reads as &ldquo;gray&rdquo; on a tiny paint chip, those undertones become unmistakable on a 12-foot wall with natural light bouncing around.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">The Most Common Gray Undertones</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>Blue undertone:</strong> <Swatch hex="#B0B7BB" name="Stonington Gray" brand="Benjamin Moore" /> — looks cool and airy in north-facing light, but can feel cold in rooms without much natural light.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>Green undertone:</strong> <Swatch hex="#B5B8AC" name="Revere Pewter" brand="Benjamin Moore" /> — in certain lighting, warm grays with green undertones can look almost sage-like. This is especially common with greige colors.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>Purple undertone:</strong> <Swatch hex="#ACA4A0" name="Agreeable Gray" brand="Sherwin-Williams" /> — some warm grays carry a slight violet cast, especially under LED lighting.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>Brown undertone:</strong> <Swatch hex="#B5AD9E" name="Balanced Beige" brand="Sherwin-Williams" /> — these &ldquo;greige&rdquo; colors are the most popular neutrals because the warm brown undertone prevents them from feeling cold.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">How to Identify Undertones</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>1. Compare against a true reference.</strong> Hold your paint chip next to a piece of pure white paper. The undertone will suddenly pop — you&apos;ll see the blue, green, or purple cast that was invisible in isolation.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>2. Look at the darkest shade on the strip.</strong> Paint chip cards typically show four to six shades of the same hue. The darkest shade on the strip reveals the undertone most clearly because the secondary pigments are more concentrated.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>3. Test in your actual lighting.</strong> Paint a large sample (at least 2 feet square) and observe it at different times of day. North-facing rooms amplify blue undertones. South-facing rooms warm everything up. LED bulbs add blue cast; incandescent bulbs add yellow.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Why Lighting Changes Everything</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          The same gray will look dramatically different depending on the light. A north-facing room receives cool, indirect light that enhances blue and green undertones. A south-facing room gets warm, direct light that can make the same gray feel like a warm beige. This is why painting samples on your actual walls is non-negotiable.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Choosing Safe Neutrals</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          If you want a gray that truly reads as gray in most lighting conditions, look for colors that designers call &ldquo;balanced grays&rdquo; — shades where no single undertone dominates. Browse our <Link href="/colors/family/gray" className="text-blue-600 hover:underline">gray color family</Link> to compare hundreds of grays side by side and spot their undertones before you buy.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          You can also use our <Link href="/compare" className="text-blue-600 hover:underline">color compare tool</Link> to put two grays next to each other and see the exact Delta E difference — if two grays have a Delta E under 2.0, most people can&apos;t tell them apart.
        </p>
      </>
    ),
  },

  /* ──────────────── Post 4 ──────────────── */
  {
    slug: "best-kitchen-paint-colors-2025",
    title: "The 15 Best Kitchen Paint Colors for 2025",
    date: "2025-07-22",
    excerpt:
      "From crisp whites for a clean look to moody greens for drama, these are the 15 kitchen paint colors designers are reaching for in 2025.",
    coverColor: "#4A5D4F",
    tags: ["Kitchen", "2025", "Design"],
    content: () => (
      <>
        <p className="text-lg leading-relaxed text-gray-800">
          The kitchen is the most-repainted room in the house, and 2025 is bringing a fresh wave of choices. We asked designers, scoured social media trends, and analyzed search data to find the 15 colors defining kitchens this year. Whether you&apos;re painting cabinets, walls, or an island, there&apos;s a shade here for you.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Crisp Whites</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          White kitchens aren&apos;t going anywhere, but the specific whites are evolving. The trend is away from stark, blue-white tones toward warmer whites that feel lived-in.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#F5F1EB" name="Chantilly Lace" brand="Benjamin Moore" /> — the gold standard for a clean, true white with no yellow cast. Perfect for modern kitchens with lots of stainless steel.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#F3EEE0" name="Pure White" brand="Sherwin-Williams" /> — a slightly warmer alternative that pairs beautifully with butcher block countertops and brass hardware.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#EDE6D3" name="White Dove" brand="Benjamin Moore" /> — for kitchens that want warmth without crossing into cream territory. Explore more in our <Link href="/colors/family/white" className="text-blue-600 hover:underline">white paint guide</Link>.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Moody Greens</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Green is the biggest color story in kitchens right now. Dark, forest-inspired greens on cabinetry create a grounding, organic feel that plays beautifully with natural materials.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#4A5D4F" name="Essex Green" brand="Benjamin Moore" /> — deep, dramatic, and incredibly sophisticated on lower cabinets with white uppers.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#6B7C6E" name="Pewter Green" brand="Sherwin-Williams" /> — a softer sage-forest hybrid that&apos;s forgiving in both warm and cool light.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#52625B" name="Tarrytown Green" brand="Benjamin Moore" /> — a mid-tone green with blue undertones for a more modern feel. Browse the full <Link href="/colors/family/green" className="text-blue-600 hover:underline">green family</Link>.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Warm Neutrals</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          The gray kitchen era has given way to warm neutrals — creams, tans, and mushroom tones that add personality without being loud.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#D3CBBA" name="Edgecomb Gray" brand="Benjamin Moore" /> — a warm greige that&apos;s become the default cabinet color for transitional kitchens.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#C2B59B" name="Accessible Beige" brand="Sherwin-Williams" /> — slightly warmer and works beautifully with oak flooring and stone countertops.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#B5A898" name="Shiitake" brand="Sherwin-Williams" /> — a trendy mushroom tone for a kitchen that feels organic and current.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Bold Statement Colors</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          For homeowners who want to make their kitchen the star of the house, these bold choices are designer-approved.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#34405A" name="Naval" brand="Sherwin-Williams" /> — a rich navy for island cabinetry that pairs with white countertops and gold hardware.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#3B3B3B" name="Wrought Iron" brand="Benjamin Moore" /> — a soft black that reads as a very deep charcoal, perfect for modern kitchen cabinets.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#A4785F" name="Wholesome" brand="Sherwin-Williams" /> — the 2025 Color of the Year works as a surprising kitchen accent. Read our <Link href="/blog/2025-colors-of-the-year-every-brand-compared" className="text-blue-600 hover:underline">Color of the Year breakdown</Link>.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Soft Blues</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Light, airy blues offer a fresh alternative to all-white kitchens without the commitment of a dark color.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#C3D1D6" name="Boothbay Gray" brand="Benjamin Moore" /> — a blue-gray that feels coastal without being literal about it.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#B8CAD0" name="Sleepy Blue" brand="Sherwin-Williams" /> — a muted powder blue that&apos;s calming and clean for kitchen walls. See more options in the <Link href="/colors/family/blue" className="text-blue-600 hover:underline">blue color family</Link>.
        </p>
      </>
    ),
  },

  /* ──────────────── Post 5 ──────────────── */
  {
    slug: "behr-vs-sherwin-williams-vs-benjamin-moore",
    title: "Behr vs Sherwin-Williams vs Benjamin Moore: Which Paint Brand Is Best?",
    date: "2025-08-19",
    excerpt:
      "An honest comparison of the three biggest paint brands in America — covering quality, price, color selection, availability, and who each brand is best for.",
    coverColor: "#5B7A6E",
    tags: ["Brands", "Comparison", "Buying Guide"],
    content: () => (
      <>
        <p className="text-lg leading-relaxed text-gray-800">
          These three brands account for the vast majority of residential paint sold in America. But they serve different customers, at different price points, through different channels. Here&apos;s an honest breakdown to help you decide.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Price Comparison</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>Behr</strong> is the most affordable of the three, with premium lines like Marquee starting around $45–50 per gallon at Home Depot. <strong>Sherwin-Williams</strong> sits in the middle at $55–75+ per gallon depending on the product line, though their frequent 30–40% off sales close the gap. <strong>Benjamin Moore</strong> is the premium option at $60–80+ per gallon, sold exclusively through independent dealers.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Where to Buy</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Link href="/brands/behr" className="text-blue-600 hover:underline">Behr</Link> is a Home Depot exclusive — you won&apos;t find it anywhere else. <Link href="/brands/sherwin-williams" className="text-blue-600 hover:underline">Sherwin-Williams</Link> sells through their own 4,000+ stores, plus Lowe&apos;s carries their HGTV line. <Link href="/brands/benjamin-moore" className="text-blue-600 hover:underline">Benjamin Moore</Link> sells only through independent paint stores and hardware stores.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Color Selection</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          All three brands offer extensive palettes. Benjamin Moore has roughly 3,500 colors, Sherwin-Williams has over 1,700, and Behr has approximately 3,000+. But numbers don&apos;t tell the whole story — what matters is whether the specific shade you want exists in each brand&apos;s deck. That&apos;s where <Link href="/search" className="text-blue-600 hover:underline">cross-brand color matching</Link> comes in.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          On Paint Color HQ, every color page shows the closest equivalents from all other brands, so you&apos;re never locked into a single brand&apos;s ecosystem.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Paint Quality</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>Benjamin Moore Regal Select and Aura</strong> are widely considered the best consumer paints available. They offer exceptional coverage (often true one-coat), rich color depth, and durability. Professional painters consistently rank BM at the top.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>Sherwin-Williams Emerald</strong> is a very close second and preferred by many contractors for its excellent self-leveling and workability. Their Duration line is also excellent for high-traffic areas.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>Behr Marquee and Dynasty</strong> have improved dramatically in recent years. Consumer Reports has ranked Behr Marquee at or near the top in blind tests. For DIYers, the thick consistency and one-coat coverage make it very forgiving.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Best For…</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>DIYers on a budget:</strong> Behr. The convenience of Home Depot, competitive pricing, and excellent DIY-friendly formulas make it hard to beat for weekend warriors.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>Hiring a painter:</strong> Sherwin-Williams or Benjamin Moore. Professional painters prefer these brands for their workability, and most contractors have SW or BM accounts with trade discounts.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>Color-critical projects:</strong> Benjamin Moore. If getting the exact right color matters (and you&apos;re willing to pay for it), BM&apos;s Gennex color system produces the most accurate and consistent color matches.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Can You Mix Brands?</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Absolutely. Many designers specify Benjamin Moore colors but have them mixed in Sherwin-Williams paint (or vice versa) to get the best of both worlds. Just bring the color formula or hex code to any paint store and they can custom-match it. You can also use our <Link href="/compare" className="text-blue-600 hover:underline">color compare tool</Link> to verify how close the match is before committing.
        </p>
      </>
    ),
  },

  /* ──────────────── Post 6 ──────────────── */
  {
    slug: "calming-bedroom-paint-colors",
    title: "10 Calming Bedroom Colors Designers Love",
    date: "2025-09-16",
    excerpt:
      "Create a serene retreat with these designer-approved bedroom paint colors — soft blues, warm neutrals, and muted greens that promote relaxation.",
    coverColor: "#8BA7B0",
    tags: ["Bedroom", "Design", "Relaxation"],
    content: () => (
      <>
        <p className="text-lg leading-relaxed text-gray-800">
          Your bedroom should be the most restful room in your home. Color psychology research consistently shows that soft, muted tones — particularly blues, greens, and warm neutrals — promote relaxation and better sleep. Here are 10 designer-approved picks.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Soft Blues</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Blue is the most universally calming color. Studies show people in blue rooms fall asleep faster and report feeling more rested. The key is choosing muted, desaturated blues rather than bright or electric ones.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#8BA7B0" name="Quiet Moments" brand="Benjamin Moore" /> — a blue-green-gray that shifts beautifully with light throughout the day. It&apos;s calm without being cold.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#A5B8C4" name="Silver Mist" brand="Benjamin Moore" /> — a silvery blue-gray that feels like morning fog. Browse more in the <Link href="/colors/family/blue" className="text-blue-600 hover:underline">blue family</Link>.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#B8CAD0" name="Sleepy Blue" brand="Sherwin-Williams" /> — the name says it all. A powder blue with gray undertones that&apos;s genuinely soothing.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Muted Greens</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Green connects us to nature, and muted sage tones have become incredibly popular for bedrooms. They pair beautifully with natural wood furniture and linen textiles.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#B2BAA4" name="Saybrook Sage" brand="Benjamin Moore" /> — a warm, dusty sage that&apos;s serene without feeling sterile.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#C2C5B4" name="Softened Green" brand="Sherwin-Williams" /> — an incredibly gentle green-gray that reads almost neutral. See the full <Link href="/colors/family/green" className="text-blue-600 hover:underline">green color family</Link>.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Warm Neutrals</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          If you prefer neutrals but want to avoid the &ldquo;cold gray bedroom&rdquo; trap, warm undertones are essential. These colors create a cocoon-like feeling.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#D3CBBA" name="Edgecomb Gray" brand="Benjamin Moore" /> — a warm greige that feels like cashmere. One of the most popular bedroom neutrals.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#D5C8B5" name="Shoji White" brand="Sherwin-Williams" /> — a warm, creamy white with yellow-beige undertones that glows in evening light.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#C8BFB0" name="Balboa Mist" brand="Benjamin Moore" /> — another BM best-seller that splits the difference between gray and beige.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Soft Lavender</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Lavender has natural associations with relaxation (think lavender essential oil), and very muted purples can be surprisingly calming.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#C7BFC3" name="Silver Peony" brand="Benjamin Moore" /> — not quite purple, not quite gray. A subtle, sophisticated choice for a serene bedroom.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Tips for Bedroom Colors</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Keep the ceiling white or very light to maintain a sense of openness. Paint your largest wall as a test before committing to the whole room. And consider the color of your bedding — a soft blue wall with warm white linens is a classic combination that never fails. Read our guide on <Link href="/blog/understanding-paint-color-undertones" className="text-blue-600 hover:underline">understanding undertones</Link> to avoid surprises.
        </p>
      </>
    ),
  },

  /* ──────────────── Post 7 ──────────────── */
  {
    slug: "how-to-find-perfect-color-match-across-brands",
    title: "How to Find Your Perfect Color Match Across Brands",
    date: "2025-10-14",
    excerpt:
      "A step-by-step guide to matching paint colors across brands using Delta E 2000 color science — no more guessing at paint store equivalents.",
    coverColor: "#6B8F71",
    tags: ["How-To", "Cross-Brand Matching", "Color Science"],
    content: () => (
      <>
        <p className="text-lg leading-relaxed text-gray-800">
          You found the perfect color in a magazine, on Pinterest, or at a friend&apos;s house — but it&apos;s from a brand your painter doesn&apos;t carry. Or maybe you&apos;re getting quotes from multiple painters who each stock different brands. Here&apos;s how to find an accurate match across any paint brand.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Why Paint Store Matching Falls Short</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Paint stores can scan a chip and mix a custom color, but the result is only as good as the scan. Spectrophotometers in stores vary in quality and calibration, and even a good scan can produce a noticeable mismatch. A better approach: find the manufacturer&apos;s closest existing color, which was specifically formulated for their paint base.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Understanding Delta E 2000</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Delta E (ΔE) measures the perceptual difference between two colors. The 2000 revision of the formula — which we use on Paint Color HQ — accounts for the fact that human eyes are more sensitive to some color differences than others.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>ΔE {"<"} 1.0:</strong> Imperceptible to most people.<br />
          <strong>ΔE 1.0–2.0:</strong> Perceptible through close observation but very close.<br />
          <strong>ΔE 2.0–3.5:</strong> Perceptible at a glance — most people would say these are different colors.<br />
          <strong>ΔE {">"} 5.0:</strong> Clearly different colors.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Step-by-Step: Finding Your Match</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>Step 1: Identify the original color.</strong> Find the exact name, number, and brand. If you only have a photo, our <Link href="/search" className="text-blue-600 hover:underline">color search</Link> lets you search by hex code.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>Step 2: Look up the color on Paint Color HQ.</strong> Search for it by name or browse the <Link href="/brands" className="text-blue-600 hover:underline">brand page</Link>. Every color page automatically shows the closest matches from all 14 brands in our database.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>Step 3: Check the Delta E score.</strong> We show the ΔE 2000 value for every match. Aim for under 2.0 for a nearly invisible difference. Under 3.0 is acceptable for most residential projects.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>Step 4: Always sample.</strong> Even with a low Delta E, always paint a physical sample. Digital screens can&apos;t perfectly represent paint colors, and your specific lighting conditions matter enormously. Read our <Link href="/blog/understanding-paint-color-undertones" className="text-blue-600 hover:underline">undertones guide</Link> for more on why lighting matters.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Cross-Brand Matching in Action</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Let&apos;s say you love <Swatch hex="#D3CBBA" name="Edgecomb Gray" brand="Benjamin Moore" /> but your painter stocks Sherwin-Williams. Head to the Edgecomb Gray page and you&apos;ll see the closest SW matches ranked by Delta E. For this popular color, <Swatch hex="#D0C8B5" name="Agreeable Gray" brand="Sherwin-Williams" /> is typically the top match.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          You can also use the <Link href="/compare" className="text-blue-600 hover:underline">compare tool</Link> to put any two colors side by side and see the exact ΔE score, RGB values, and visual difference.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">When a Perfect Match Doesn&apos;t Exist</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Sometimes the closest match from another brand has a ΔE above 3.0. In those cases, you have two options: ask the paint store to custom-match using the original brand&apos;s formula, or explore adjacent colors that might work even better for your space. Often, the &ldquo;imperfect&rdquo; match ends up being the better choice once you see it in context.
        </p>
      </>
    ),
  },

  /* ──────────────── Post 8 ──────────────── */
  {
    slug: "best-white-paint-colors-guide",
    title: "The Best White Paint Colors: A Definitive Guide",
    date: "2025-11-18",
    excerpt:
      "Choosing white paint is deceptively hard. This guide covers warm whites, cool whites, and true whites from every major brand — plus how to pick the right one.",
    coverColor: "#F0EBE0",
    tags: ["White", "Guide", "Design"],
    content: () => (
      <>
        <p className="text-lg leading-relaxed text-gray-800">
          White is the most popular paint color category by far — and the most difficult to get right. There are hundreds of &ldquo;white&rdquo; paints across major brands, and each one has different undertones that can make or break a room. This guide breaks down the best whites and helps you pick the right one.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">The Three Categories of White</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>True whites</strong> have minimal undertones and read as clean, bright white in most lighting. <strong>Warm whites</strong> lean cream, yellow, or pink and feel cozy. <strong>Cool whites</strong> lean blue or gray and feel crisp and modern. Understanding which category you need is the first decision. Browse all options in our <Link href="/colors/family/white" className="text-blue-600 hover:underline">white color family</Link>.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Best True Whites</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#F5F1EB" name="Chantilly Lace" brand="Benjamin Moore" /> — BM&apos;s cleanest white. Virtually no undertone. The go-to for trim, ceilings, and modern all-white rooms.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#F6F0E4" name="High Reflective White" brand="Sherwin-Williams" /> — SW&apos;s equivalent. The whitest white in their deck. Perfect for trim that won&apos;t compete with wall colors.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#F2ECE0" name="Ultra Pure White" brand="Behr" /> — Behr&apos;s standard base white. Clean and affordable.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Best Warm Whites</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#EDE6D3" name="White Dove" brand="Benjamin Moore" /> — the most popular warm white in America. A soft, creamy white that never looks yellow. Designers use it for everything from cabinets to whole-house color.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#F3EEE0" name="Pure White" brand="Sherwin-Williams" /> — despite the name, this is actually a warm white with a slight cream undertone. It&apos;s one of SW&apos;s all-time best sellers.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#F1EDE3" name="Simply White" brand="Benjamin Moore" /> — sits between true white and warm white. A versatile choice when you want warmth without obvious cream tones.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Best Cool Whites</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#EEF0EC" name="Decorator's White" brand="Benjamin Moore" /> — a white with a faint blue-gray undertone that reads as fresh and modern. Popular in contemporary and Scandinavian-style spaces.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#ECEDE8" name="Snowbound" brand="Sherwin-Williams" /> — a cool white with a barely-there gray cast. Excellent for trim in rooms with warm wall colors.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">How to Choose</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>Match your fixed elements.</strong> If your countertops, tile, or flooring have warm tones (yellow, orange, brown), choose a warm white. If they have cool tones (gray, blue), choose a cool white. True whites work as a neutral bridge.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>Consider your trim.</strong> Your wall white and trim white should come from the same temperature family. Warm wall + cool trim creates a jarring disconnect.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>Test multiple samples.</strong> Buy at least three whites and paint large swatches. What looks identical in the can often looks wildly different on the wall. Read our <Link href="/blog/understanding-paint-color-undertones" className="text-blue-600 hover:underline">undertones guide</Link> for the full explanation.
        </p>
      </>
    ),
  },

  /* ──────────────── Post 9 ──────────────── */
  {
    slug: "warm-vs-cool-paint-colors",
    title: "Warm vs Cool Paint Colors: How to Choose",
    date: "2025-12-10",
    excerpt:
      "Learn the difference between warm and cool paint colors, how lighting affects temperature, and how to build a cohesive palette that flows room to room.",
    coverColor: "#C4A882",
    tags: ["Color Theory", "Tips", "Design"],
    content: () => (
      <>
        <p className="text-lg leading-relaxed text-gray-800">
          The warm-vs-cool distinction is the single most important concept in choosing paint colors. Get it right, and your whole home feels cohesive. Get it wrong, and individual rooms will feel disconnected — or worse, your &ldquo;gray&rdquo; will look purple. Here&apos;s everything you need to know.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">What Makes a Color Warm or Cool?</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          The color wheel is divided into two halves. <strong>Warm colors</strong> — reds, oranges, yellows, and their derivatives — evoke sunlight, earth, and fire. <strong>Cool colors</strong> — blues, greens, purples — evoke water, sky, and shadow. But here&apos;s the nuance: every color exists on a warm-to-cool spectrum.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          A <em>warm gray</em> like <Swatch hex="#D3CBBA" name="Edgecomb Gray" brand="Benjamin Moore" /> has yellow-brown undertones. A <em>cool gray</em> like <Swatch hex="#B0B7BB" name="Stonington Gray" brand="Benjamin Moore" /> has blue undertones. Both are &ldquo;gray,&rdquo; but they create completely different moods.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">How Lighting Shifts Temperature</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>North-facing rooms</strong> receive cool, blue-tinted light that amplifies cool undertones. Warm colors can help compensate. <strong>South-facing rooms</strong> receive warm, golden light that amplifies warm undertones. Cool colors balance nicely here.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>East-facing rooms</strong> get warm morning light and cool afternoon light, so colors shift dramatically throughout the day. <strong>West-facing rooms</strong> get the reverse — cool mornings, warm golden-hour light in the evening.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Building a Cohesive Palette</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          The most important rule: <strong>stay in the same temperature family</strong> for connected spaces. If your living room is a warm greige, your adjoining kitchen should also use warm tones. Jumping from warm to cool across an open floor plan creates visual tension.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          This doesn&apos;t mean every room must be the same color — just the same temperature. <Swatch hex="#D5C8B5" name="Shoji White" brand="Sherwin-Williams" /> in the living room flows naturally into <Swatch hex="#C2B59B" name="Accessible Beige" brand="Sherwin-Williams" /> in the dining room because both are warm. Visit our <Link href="/inspiration" className="text-blue-600 hover:underline">inspiration gallery</Link> for curated palette ideas.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Warm Colors for Your Home</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Warm tones create intimacy and coziness. They work beautifully in bedrooms, dining rooms, and any space where you want people to linger. Good examples include <Swatch hex="#C4A882" name="Accessible Beige" brand="Sherwin-Williams" /> for walls and <Swatch hex="#EDE6D3" name="White Dove" brand="Benjamin Moore" /> for trim.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Cool Colors for Your Home</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Cool tones create a sense of openness and calm. They work well in bathrooms, home offices, and spaces where you want focus and clarity. Try <Swatch hex="#8BA7B0" name="Quiet Moments" brand="Benjamin Moore" /> for walls with <Swatch hex="#ECEDE8" name="Snowbound" brand="Sherwin-Williams" /> for trim. Explore more in the <Link href="/colors/family/blue" className="text-blue-600 hover:underline">blue</Link> and <Link href="/colors/family/green" className="text-blue-600 hover:underline">green</Link> color families.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">When to Break the Rules</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Closed-off rooms — powder rooms, bedrooms with doors, home offices — can be any temperature. The warm/cool consistency rule primarily applies to open, connected spaces. A cool-toned powder room off a warm-toned hallway is perfectly fine. Use our <Link href="/compare" className="text-blue-600 hover:underline">compare tool</Link> to see how colors from different temperature families look next to each other.
        </p>
      </>
    ),
  },

  /* ──────────────── Post 10 ──────────────── */
  {
    slug: "most-popular-paint-colors-2025",
    title: "The Most Popular Paint Colors of 2025",
    date: "2026-01-21",
    excerpt:
      "Based on search trends, designer picks, and real project data — these are the paint colors that defined 2025 across every major brand.",
    coverColor: "#6E7E6A",
    tags: ["Trends", "2025", "Popular"],
    content: () => (
      <>
        <p className="text-lg leading-relaxed text-gray-800">
          We analyzed search data, designer recommendations, and trending projects to identify the most popular paint colors of 2025. No surprise: warm neutrals dominated, green had a breakout year, and the era of cool gray is definitively over.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">The Top 5 Overall</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>1.</strong> <Swatch hex="#D0C8B5" name="Agreeable Gray" brand="Sherwin-Williams" /> — For the fifth year running, this warm greige remains the single most popular paint color in America. It works in virtually every room and lighting condition.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>2.</strong> <Swatch hex="#EDE6D3" name="White Dove" brand="Benjamin Moore" /> — The warm white that designers can&apos;t stop specifying. See our <Link href="/blog/best-white-paint-colors-guide" className="text-blue-600 hover:underline">white paint guide</Link> for the full breakdown.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>3.</strong> <Swatch hex="#D3CBBA" name="Edgecomb Gray" brand="Benjamin Moore" /> — A warm greige that holds its ground in the age of beige-is-back.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>4.</strong> <Swatch hex="#6E7E6A" name="Pewter Green" brand="Sherwin-Williams" /> — The green that launched a thousand kitchen renovations. A soft sage-forest tone that represents 2025&apos;s biggest color trend.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <strong>5.</strong> <Swatch hex="#F3EEE0" name="Pure White" brand="Sherwin-Williams" /> — The most popular trim color in the country, and increasingly used as a wall color for those who want warmth without commitment.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Biggest Trend: Green Everything</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          2025 was the year green went mainstream. From sage kitchens to forest-green front doors, every shade of <Link href="/colors/family/green" className="text-blue-600 hover:underline">green</Link> saw massive growth. The trend was driven by biophilic design — the idea that incorporating nature into interiors improves well-being.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Standout greens include <Swatch hex="#B2BAA4" name="Saybrook Sage" brand="Benjamin Moore" />, <Swatch hex="#4A5D4F" name="Essex Green" brand="Benjamin Moore" />, and <Swatch hex="#6B8F71" name="Restful" brand="Sherwin-Williams" />. We covered the kitchen-specific options in our <Link href="/blog/best-kitchen-paint-colors-2025" className="text-blue-600 hover:underline">kitchen colors guide</Link>.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">The Warm Neutral Takeover</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Cool gray ruled the 2010s, but 2025 confirmed its replacement: warm greige, beige, and cream tones are the new default. The <Link href="/blog/2025-colors-of-the-year-every-brand-compared" className="text-blue-600 hover:underline">Colors of the Year</Link> reflect this — four out of five brands chose warm earth tones.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          For homeowners looking to transition from gray to warm, the easiest path is a greige like Agreeable Gray or Edgecomb Gray. These colors bridge the gap and work with both cool-toned and warm-toned furnishings. Check out our <Link href="/blog/warm-vs-cool-paint-colors" className="text-blue-600 hover:underline">warm vs cool guide</Link> for more on making the transition.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Navy Holds Strong</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          <Swatch hex="#34405A" name="Naval" brand="Sherwin-Williams" /> and <Swatch hex="#3E4450" name="Hale Navy" brand="Benjamin Moore" /> continued to dominate as accent colors — kitchen islands, front doors, accent walls, and cabinetry. Navy offers drama without the commitment of true black.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900">Looking Ahead to 2026</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Early signals suggest 2026 will continue the warm trend while introducing more saturated colors — think terracotta, olive, and warm plum. The pendulum is swinging from the ultra-neutral 2020s toward more expressive color choices.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Whatever direction you choose, use our <Link href="/search" className="text-blue-600 hover:underline">color search</Link> to explore 25,000+ colors across 14 brands, and find the perfect match for your next project.
        </p>
      </>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Exports                                                            */
/* ------------------------------------------------------------------ */

/** All posts, newest first */
export function getAllPosts(): BlogPost[] {
  return [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/** Single post by slug */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

/** All slugs — for generateStaticParams and sitemap */
export function getAllBlogSlugs(): string[] {
  return blogPosts.map((p) => p.slug);
}
