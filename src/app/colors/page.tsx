import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getAllColorFamilies } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Paint Colors by Color Family",
  description:
    "Browse paint colors organized by color family - whites, grays, blues, greens, and more from all major brands.",
};

const familyColors: Record<string, string> = {
  red: "#DC2626",
  orange: "#EA580C",
  yellow: "#EAB308",
  green: "#16A34A",
  blue: "#2563EB",
  purple: "#9333EA",
  pink: "#EC4899",
  white: "#FFFFFF",
  "off-white": "#F5F0E8",
  black: "#1F2937",
  gray: "#9CA3AF",
  brown: "#8B6914",
  beige: "#D4C5A9",
  tan: "#C4A882",
  neutral: "#B8B0A0",
};

export default async function ColorsPage() {
  const families = await getAllColorFamilies();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Browse by Color Family
        </h1>
        <p className="mt-2 text-gray-600">
          Explore paint colors organized by color family.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {families.map((family) => {
            const displayColor = familyColors[family.slug] ?? "#9CA3AF";
            const isLight = family.slug === "white" || family.slug === "off-white";

            return (
              <Link
                key={family.id}
                href={`/colors/family/${family.slug}`}
                className="group overflow-hidden rounded-xl border border-gray-200 transition-shadow hover:shadow-lg"
              >
                <div
                  className={`flex h-28 items-end p-3 ${isLight ? "border-b border-gray-200" : ""}`}
                  style={{ backgroundColor: displayColor }}
                >
                  <span
                    className={`text-lg font-semibold ${
                      isLight ? "text-gray-900" : "text-white"
                    } drop-shadow-sm`}
                  >
                    {family.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
