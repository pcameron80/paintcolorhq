import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorIdentifier } from "./identifier";

export const metadata: Metadata = {
  title: "Photo Color Identifier - Find Paint Colors from Photos",
  description:
    "Upload a photo and click any spot to find matching paint colors from Sherwin-Williams, Benjamin Moore, Behr, and more. Free, instant, cross-brand results.",
  alternates: {
    canonical: "https://www.paintcolorhq.com/tools/color-identifier",
  },
};

export default function ColorIdentifierPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/tools" className="hover:text-gray-900">
            Tools
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Photo Color Identifier</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900">
          Photo Color Identifier
        </h1>
        <p className="mt-2 text-gray-600">
          Upload a photo, click any spot, and instantly find the closest
          matching paint colors from all major brands.
        </p>

        <ColorIdentifier />

        <section className="mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900">
            How It Works
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700">
            <p>
              <strong>1. Upload a photo</strong> from your device or snap one
              with your camera. Any image format works.
            </p>
            <p>
              <strong>2. Click a spot</strong> on the image to sample the color.
              The tool reads the exact pixel color at that point.
            </p>
            <p>
              <strong>3. Get matches</strong> instantly. We compare your sampled
              color against 25,000+ paint colors from Sherwin-Williams, Benjamin
              Moore, Behr, PPG, and more using the Delta E 2000 formula for
              perceptually accurate matching.
            </p>
            <p>
              Keep in mind that screen colors differ from physical paint. Always
              verify with a swatch or sample before purchasing.
            </p>
          </div>
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "Find Paint Colors from a Photo",
            description:
              "Upload a photo, click any spot, and instantly find matching paint colors from Sherwin-Williams, Benjamin Moore, Behr, and more.",
            step: [
              {
                "@type": "HowToStep",
                name: "Upload a photo",
                text: "Upload a photo from your device or snap one with your camera. Any image format works.",
              },
              {
                "@type": "HowToStep",
                name: "Click a spot",
                text: "Click a spot on the image to sample the color. The tool reads the exact pixel color at that point.",
              },
              {
                "@type": "HowToStep",
                name: "Get matches",
                text: "Instantly see the closest matching paint colors from 25,000+ colors across 14 major brands, matched using the Delta E 2000 formula.",
              },
            ],
          }),
        }}
      />

      <Footer />
    </div>
  );
}
