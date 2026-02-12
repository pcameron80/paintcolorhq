import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PaletteGenerator } from "./generator";

export const metadata: Metadata = {
  title: "Palette Generator - Build a Paint Color Scheme",
  description:
    "Pick a starting color and instantly generate coordinated paint palettes with Walls, Trim, Accent, and Pop roles. Matched to real colors from 14 brands.",
  alternates: {
    canonical: "https://www.paintcolorhq.com/tools/palette-generator",
  },
};

export default function PaletteGeneratorPage() {
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
          <span className="text-gray-900">Palette Generator</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900">
          Palette Generator
        </h1>
        <p className="mt-2 text-gray-600">
          Pick a color and generate coordinated paint palettes matched to real
          colors.
        </p>

        <Suspense>
          <PaletteGenerator />
        </Suspense>

        <section className="mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-700">
            <ol className="list-inside list-decimal space-y-3 pl-2">
              <li>
                <strong>Pick a starting color</strong> — use the color picker or
                type a hex code. Optionally filter results to a single brand.
              </li>
              <li>
                <strong>Choose a scheme</strong> — five coordinated palettes
                appear instantly, each with Walls, Trim, Accent, and Pop roles
                matched to real paint colors.
              </li>
              <li>
                <strong>Save or visualize</strong> — open any palette in the
                Room Visualizer to preview it on walls, or save it to a project
                for later.
              </li>
            </ol>
          </div>
        </section>

        <div className="mt-8">
          <Link
            href="/tools/room-visualizer"
            className="text-sm font-medium text-brand-blue hover:underline"
          >
            Try the Room Visualizer &rarr;
          </Link>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "HowTo",
              name: "How to Generate a Paint Color Palette",
              description:
                "Pick a starting color and generate coordinated paint palettes with walls, trim, accent, and pop roles.",
              step: [
                {
                  "@type": "HowToStep",
                  name: "Pick a color",
                  text: "Use the color picker or type a hex code to choose your starting color. Optionally select a brand to filter results.",
                },
                {
                  "@type": "HowToStep",
                  name: "Choose a scheme",
                  text: "Five coordinated palettes appear instantly, each with Walls, Trim, Accent, and Pop roles matched to real paint colors.",
                },
                {
                  "@type": "HowToStep",
                  name: "Save or visualize",
                  text: "Open any palette in the Room Visualizer to preview on walls, or save it to a project for later reference.",
                },
              ],
            }),
          }}
        />
      </main>

      <Footer />
    </div>
  );
}
