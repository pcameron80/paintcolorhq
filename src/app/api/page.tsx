import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

// Public RapidAPI listing for the cross-brand color-match API.
const RAPIDAPI_URL = "https://rapidapi.com/support-weGRmXmTU/api/paint-color-match-api1";

export const metadata: Metadata = {
  title: "Paint Color Match API — Cross-Brand Equivalents by Hex | Paint Color HQ",
  description:
    "A free, CORS-open REST API that returns the closest cross-brand paint color equivalents for any hex value, scored with the CIEDE2000 (Delta E) standard across 26,000+ colors and 13 brands.",
  alternates: { canonical: "https://www.paintcolorhq.com/api" },
  openGraph: {
    title: "Cross-Brand Paint Color Match API",
    description:
      "Closest paint color equivalents for any hex, across 13 brands, via CIEDE2000. Free tier + RapidAPI paid tier.",
    type: "website",
    url: "https://www.paintcolorhq.com/api",
  },
};

const Code = ({ children }: { children: React.ReactNode }) => (
  <pre className="mt-4 overflow-x-auto rounded-xl bg-surface-container-highest p-4 text-xs leading-relaxed text-on-surface">
    <code className="font-mono">{children}</code>
  </pre>
);

export default function ApiDocsPage() {
  return (
    <div className="bg-surface min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-6 md:px-12 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Developer API</p>
        <h1 className="mt-2 font-headline text-4xl md:text-5xl font-bold tracking-tight text-on-surface">
          Cross-Brand Paint Color Match API
        </h1>
        <p className="mt-4 text-lg text-on-surface-variant leading-relaxed">
          Send any hex value and get the closest paint color equivalents across 13 brands, scored with the
          industry-standard CIEDE2000 (Delta E) formula over 26,000+ colors. The same engine behind Paint Color HQ&apos;s
          cross-brand matching, as a simple REST endpoint.
        </p>

        <section className="mt-12">
          <h2 className="font-headline text-2xl font-bold text-on-surface">Endpoint</h2>
          <Code>GET https://www.paintcolorhq.com/api/color-match?hex=7F9B8E</Code>
          <p className="mt-3 text-sm text-on-surface-variant">
            CORS-open, no key required for the free tier. Responses are cached at the edge for 24 hours.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-headline text-2xl font-bold text-on-surface">Parameters</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-on-surface-variant border-b border-outline-variant/30">
                  <th className="py-2 pr-4 font-semibold">Param</th>
                  <th className="py-2 pr-4 font-semibold">Required</th>
                  <th className="py-2 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="text-on-surface">
                <tr className="border-b border-outline-variant/15">
                  <td className="py-2 pr-4 font-mono">hex</td>
                  <td className="py-2 pr-4">yes</td>
                  <td className="py-2">6-digit hex, with or without <code className="font-mono">#</code> (e.g. <code className="font-mono">7F9B8E</code>). Paid tier accepts a comma-separated list for batch lookups.</td>
                </tr>
                <tr className="border-b border-outline-variant/15">
                  <td className="py-2 pr-4 font-mono">brand</td>
                  <td className="py-2 pr-4">no</td>
                  <td className="py-2">Restrict matches to one brand slug (e.g. <code className="font-mono">sherwin-williams</code>, <code className="font-mono">benjamin-moore</code>).</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono">limit</td>
                  <td className="py-2 pr-4">no</td>
                  <td className="py-2">Number of matches. Free tier returns 10; paid tier accepts 1–50.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-headline text-2xl font-bold text-on-surface">Free response</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Top 10 matches, sorted by Delta E (lower = closer; under 2.0 is near-identical).</p>
          <Code>{`{
  "matches": [
    {
      "name": "Comfort Gray",
      "hex": "#9C9B8E",
      "brandName": "Sherwin-Williams",
      "brandSlug": "sherwin-williams",
      "colorSlug": "comfort-gray-6205",
      "colorNumber": "6205",
      "deltaE": 1.84
    }
  ]
}`}</Code>
        </section>

        <section className="mt-10">
          <h2 className="font-headline text-2xl font-bold text-on-surface">Paid tier (RapidAPI)</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            The paid tier adds up to 50 results, batch lookups (comma-separated <code className="font-mono">hex</code>), and per-match
            color-science fields — LAB, RGB, undertone, LRV, and color family — for design tools and palette engines.
            Authentication, rate limits, and billing are handled by RapidAPI.
          </p>
          <Code>{`{
  "matches": [
    {
      "name": "Comfort Gray", "hex": "#9C9B8E",
      "brandName": "Sherwin-Williams", "colorSlug": "comfort-gray-6205",
      "colorNumber": "6205", "deltaE": 1.84,
      "lab": { "L": 63.2, "a": -2.1, "b": 4.8 },
      "rgb": { "r": 156, "g": 155, "b": 142 },
      "undertone": "Green", "lrv": 31.4, "colorFamily": "green"
    }
  ]
}`}</Code>
          <a
            href={RAPIDAPI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block bg-secondary text-on-secondary px-6 py-3 rounded-xl font-headline font-bold text-sm shadow-lg shadow-secondary/20 hover:shadow-xl transition-all"
          >
            Get an API key on RapidAPI →
          </a>
        </section>

        <section className="mt-10">
          <h2 className="font-headline text-2xl font-bold text-on-surface">For AI agents (MCP server)</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            The same cross-brand matcher is exposed as a{" "}
            <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="text-secondary underline underline-offset-2 hover:no-underline">Model Context Protocol</a>{" "}
            (MCP) tool, so AI assistants and agents can call it directly. Point any MCP client at the
            stateless Streamable HTTP endpoint — no key required:
          </p>
          <Code>https://www.paintcolorhq.com/api/mcp</Code>
          <p className="mt-3 text-sm text-on-surface-variant">
            Tool <code className="font-mono">match_paint_color</code> — pass a <code className="font-mono">hex</code> value and
            get the closest real, purchasable paint colors across 13 brands, scored with CIEDE2000. Optional
            <code className="font-mono"> brand</code> and <code className="font-mono">limit</code> arguments.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-headline text-2xl font-bold text-on-surface">Notes</h2>
          <ul className="mt-3 space-y-2 text-sm text-on-surface-variant list-disc pl-5">
            <li>Match accuracy uses CIEDE2000 — see our <Link href="/methodology" className="text-secondary underline underline-offset-2 hover:no-underline">methodology</Link>. Always confirm a final choice with a physical sample.</li>
            <li>Color data spans 26,000+ colors across 13 brands and is updated as brand palettes change.</li>
            <li>Prefer no code? The same matcher is available as a free <Link href="/embed" className="text-secondary underline underline-offset-2 hover:no-underline">embeddable widget</Link>.</li>
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}
