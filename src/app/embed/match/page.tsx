import type { Metadata } from "next";
import { MatchWidget } from "./match-widget";

// The widget is iframe content, not a destination page — keep it out of the index.
// (The /embed landing page is the indexable surface.) frame-ancestors is loosened
// to `*` for /embed/* in next.config.ts so other sites can embed this.
export const metadata: Metadata = {
  title: "Cross-brand paint color matcher",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.paintcolorhq.com/embed/match" },
};

export default function EmbedMatchPage() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-white">
      <MatchWidget />
    </main>
  );
}
