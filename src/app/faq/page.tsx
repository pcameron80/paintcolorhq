import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Frequently Asked Questions About Paint Colors",
  description:
    "Answers to common questions about paint colors, matching colors across brands, choosing undertones, calculating paint quantities, and using Paint Color HQ tools.",
  alternates: { canonical: "https://www.paintcolorhq.com/faq" },
  openGraph: {
    title: "Paint Color FAQ - Common Questions Answered",
    description:
      "Answers to common questions about paint colors, matching across brands, undertones, and more.",
    type: "website",
    url: "https://www.paintcolorhq.com/faq",
  },
};

const faqs = [
  {
    question: "How do I match a paint color from one brand to another?",
    answer:
      "Search for any color on Paint Color HQ and we'll show you the closest matches from every other brand in our database. We use CIEDE2000, the industry-standard formula for measuring perceptual color difference, to compute how close each match is. Every result includes a Delta E score — below 1.0 means the difference is invisible to most people, and below 3.0 means it's very close. You can also use our Color Search to find a specific color by name, number, or hex code.",
  },
  {
    question: "What is Delta E and what do the numbers mean?",
    answer:
      "Delta E (ΔE) is a number that represents the perceptual difference between two colors. A Delta E of 0 means the colors are identical. Below 1.0, most people can't see any difference. Between 1.0 and 3.0, a trained eye might notice. Above 3.0, the difference is clearly visible. Above 5.0, the colors are noticeably different. Paint Color HQ uses the CIEDE2000 formula, which is the most accurate version of Delta E for how humans actually perceive color differences.",
  },
  {
    question: "What paint undertone should I choose?",
    answer:
      "Undertone is the subtle base color beneath a paint's surface color. Whites can lean warm (yellow, cream) or cool (blue, gray). Grays can lean blue, green, or purple. Choosing the right undertone depends on your room's lighting, flooring, and fixed elements like countertops or cabinets. A warm-toned room (wood floors, warm lighting) usually looks best with warm or neutral undertones. A cool-toned room (gray tile, north-facing light) pairs well with cool undertones. On Paint Color HQ, every color is tagged warm, cool, or neutral so you can filter by undertone.",
  },
  {
    question: "How much paint do I need for a room?",
    answer:
      "A gallon of paint typically covers about 350–400 square feet with one coat. For a standard 12×12 room with 8-foot ceilings, you'd need about 1.5 gallons for two coats on the walls. Our Paint Calculator lets you enter your exact room dimensions, number of doors and windows, and desired number of coats to get a precise estimate. It accounts for the areas you won't be painting.",
  },
  {
    question: "Can I match Sherwin-Williams colors to Benjamin Moore?",
    answer:
      "Yes. Paint Color HQ has the complete color libraries for both Sherwin-Williams and Benjamin Moore (plus 12 other brands). Search for any Sherwin-Williams color and you'll see the closest Benjamin Moore equivalents ranked by Delta E accuracy — and vice versa. For example, Sherwin-Williams Agreeable Gray (SW 7029) has very close matches in the Benjamin Moore lineup that we'll surface automatically.",
  },
  {
    question: "What's the difference between paint sheen levels?",
    answer:
      "Paint sheen refers to how glossy or matte the finish is. From least to most shiny: Flat/Matte has no shine and hides imperfections well — good for ceilings and low-traffic walls. Eggshell has a slight soft sheen and is the most popular for living rooms and bedrooms. Satin has a noticeable sheen, cleans easily, and works well for kitchens, bathrooms, and kids' rooms. Semi-Gloss is shiny and very durable — ideal for trim, doors, and cabinets. High-Gloss is the shiniest and most durable — used for accent pieces and doors.",
  },
  {
    question: "How do I identify a paint color from a photo?",
    answer:
      "Use our Photo Color Identifier tool. Upload any photo — a room you love on Pinterest, a picture of your neighbor's house, or a swatch from a magazine. Click any spot on the image and we'll find the closest matching paint colors from all 14 brands in our database. The tool extracts the exact color value at that pixel and runs it through our CIEDE2000 matching algorithm.",
  },
  {
    question: "Are the colors on screen accurate to real paint?",
    answer:
      "Digital colors are always approximations. Every screen displays colors slightly differently, and real paint looks different depending on the finish (matte vs. satin vs. semi-gloss), the number of coats, the primer underneath, and especially the lighting in your room. Natural light, warm incandescent bulbs, and cool LED bulbs all change how a color appears. We always recommend ordering physical paint samples or peel-and-stick swatches before committing to a color.",
  },
  {
    question: "What paint brands does Paint Color HQ cover?",
    answer:
      "We currently cover 14 major paint brands: Sherwin-Williams, Benjamin Moore, Behr, PPG, Valspar, Dunn-Edwards, Pratt & Lambert, California Paints, Farrow & Ball, Dulux, Clark+Kensington, Glidden, Olympic, and Dutch Boy. Our database includes over 25,000 individual colors across all brands, and we add new colors regularly.",
  },
  {
    question: "How do I choose a paint color for my room?",
    answer:
      "Start by looking at what's already in the room that you can't change — flooring, countertops, large furniture. Pick up on the undertones in those fixed elements and choose paint that has a complementary undertone. Next, consider the room's natural light: north-facing rooms benefit from warmer colors, while south-facing rooms can handle cooler tones. Use our Room Visualizer to preview colors on walls before buying, and our Palette Generator to build a coordinated scheme with wall color, trim, and accents.",
  },
  {
    question: "What is the most popular paint color?",
    answer:
      "Neutral tones dominate: warm whites, light grays, and greige (gray-beige) shades are consistently the best sellers across all major brands. Sherwin-Williams Agreeable Gray, Benjamin Moore White Dove, and Behr Silver Drop are perennial favorites. For 2025–2026, earthy tones like warm terracotta, sage green, and muted blues have been trending. You can browse the most popular colors from each brand on our brand pages.",
  },
  {
    question: "Is Paint Color HQ free to use?",
    answer:
      "Yes. All of our tools — color search, cross-brand matching, room visualizer, photo color identifier, palette generator, and paint calculator — are completely free. You can optionally create a free account to save colors to projects and organize them by room, but no account is required to use any tool.",
  },
];

export default function FAQPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      {/* FAQPage JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">FAQ</span>
          </nav>

          <h1 className="text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Common questions about paint colors, matching across brands, and
            using our tools.
          </p>

          <div className="mt-10 divide-y divide-gray-200">
            {faqs.map((faq, i) => (
              <details key={i} className="group py-6" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-semibold text-gray-900 hover:text-brand-blue">
                  {faq.question}
                  <svg
                    className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </summary>
                <p className="mt-4 leading-relaxed text-gray-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>

          <div className="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Still have questions?
            </h2>
            <p className="mt-2 text-gray-600">
              Can&apos;t find what you&apos;re looking for? Reach out and
              we&apos;ll get back to you within 1–2 business days.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-block rounded-lg bg-brand-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-blue-dark"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
