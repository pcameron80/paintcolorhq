// Guide lane — every indexable blog post as a programmatic Pinterest pin
// (board: Paint Color Guides). Uses /api/pin/blog for the pin image, or the
// post's custom pinImage when present.
import { getAllPosts } from "../../../src/lib/blog-posts.tsx";
import type { PinSpec } from "../batch-may26.ts";

const SITE = "https://www.paintcolorhq.com";
const UTM = "?utm_source=Pinterest&utm_medium=organic&utm_campaign=guide-drip";

export function guidePins(): PinSpec[] {
  return getAllPosts()
    .filter((p) => !p.noindex)
    .map((p) => {
      const imageUrl = p.pinImage
        ? `${SITE}${p.pinImage}`
        : `${SITE}/api/pin/blog?title=${encodeURIComponent(p.title)}&cover=${encodeURIComponent(
            p.coverImage ? SITE + p.coverImage : "",
          )}&color=${encodeURIComponent(p.coverColor)}`;
      const title = p.title.length > 100 ? p.title.slice(0, 97) + "..." : p.title;
      return {
        id: 0,
        key: `guide-${p.slug}`,
        type: "guide",
        board: "Paint Color Guides",
        theme: p.tags?.[0] ?? "guide",
        format: "guide",
        name: p.title,
        image: "",
        imageUrl,
        prompt: "",
        title,
        description: p.excerpt,
        link: `${SITE}/blog/${p.slug}${UTM}`,
      } as PinSpec;
    });
}
