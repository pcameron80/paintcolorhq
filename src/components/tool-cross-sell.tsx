import Link from "next/link";

const tools = [
  {
    slug: "room-visualizer",
    title: "Room Visualizer",
    href: "/tools/room-visualizer",
    description: "Preview colors on walls before buying",
  },
  {
    slug: "color-identifier",
    title: "Photo Color Identifier",
    href: "/tools/color-identifier",
    description: "Find paint matches from any photo",
  },
  {
    slug: "palette-generator",
    title: "Palette Generator",
    href: "/tools/palette-generator",
    description: "Build coordinating color schemes",
  },
  {
    slug: "paint-calculator",
    title: "Paint Calculator",
    href: "/tools/paint-calculator",
    description: "Calculate exactly how many gallons you need",
  },
];

export function ToolCrossSell({ exclude }: { exclude: string }) {
  const filtered = tools.filter((t) => t.slug !== exclude);

  return (
    <section className="mt-16 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900">More Tools</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {filtered.map((tool) => (
          <Link
            key={tool.slug}
            href={tool.href}
            className="group rounded-xl border border-gray-200 p-6 transition hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900 group-hover:text-brand-blue">
              {tool.title}
            </h3>
            <p className="mt-1 text-sm text-gray-600">{tool.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
