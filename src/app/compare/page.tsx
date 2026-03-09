import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getColorById } from "@/lib/queries";
import { CompareClient } from "./compare-client";

export const metadata: Metadata = {
  title: "Compare Paint Colors Side by Side",
  description:
    "Compare any two paint colors side by side with hex codes, RGB values, LRV, and visual swatches.",
  alternates: { canonical: "https://www.paintcolorhq.com/compare" },
  openGraph: {
    title: "Compare Paint Colors Side by Side",
    description:
      "Compare any two paint colors side by side with hex codes, RGB values, LRV, and visual swatches.",
    url: "https://www.paintcolorhq.com/compare",
  },
};

interface PageProps {
  searchParams: Promise<{ color1?: string; color2?: string }>;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const { color1: color1Id, color2: color2Id } = await searchParams;

  const [color1, color2] = await Promise.all([
    color1Id ? getColorById(color1Id) : null,
    color2Id ? getColorById(color2Id) : null,
  ]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Compare Paint Colors
        </h1>
        <p className="mt-2 text-gray-600">
          Search for two paint colors to compare them side by side.
        </p>

        <CompareClient initialColor1={color1} initialColor2={color2} />
      </main>

      <Footer />
    </div>
  );
}
