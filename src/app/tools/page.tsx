import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Paint Tools | Paint Color HQ",
  description:
    "Free paint tools: calculate how much paint you need and identify paint colors from photos. Works with all major brands.",
  alternates: { canonical: "https://paintcolorhq.com/tools" },
};

const tools = [
  {
    title: "Paint Calculator",
    description:
      "Find out exactly how many gallons of paint you need for your room. Enter dimensions, doors, and windows for an instant estimate.",
    href: "/tools/paint-calculator",
    icon: (
      <svg
        className="h-8 w-8 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25v-.008Zm2.25-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H12.75v-.008Zm0 2.25h.008v.008H12.75v-.008Zm2.25-2.25h.008v.008H15v-.008Zm0 2.25h.008v.008H15v-.008ZM5.25 6.75h13.5a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V7.5a.75.75 0 0 1 .75-.75ZM6 3v3.75M18 3v3.75"
        />
      </svg>
    ),
  },
  {
    title: "Photo Color Identifier",
    description:
      "Upload a photo and pick any pixel to find the closest matching paint colors from all major brands.",
    href: "/tools/color-identifier",
    icon: (
      <svg
        className="h-8 w-8 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
        />
      </svg>
    ),
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Tools</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900">Paint Tools</h1>
        <p className="mt-2 text-gray-600">
          Free tools to help you plan your next paint project.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-lg"
            >
              <div className="mb-4">{tool.icon}</div>
              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                {tool.title}
              </h2>
              <p className="mt-2 text-sm text-gray-600">{tool.description}</p>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
