import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Pinterest-optimized 1000×1500 pin image for a blog post.
 *
 * Layout:
 *   Top 55%  — cover-image fill (or coverColor block if no image)
 *   Middle   — eyebrow ("PAINT COLOR HQ") + bold title (up to ~3 lines)
 *   Bottom   — paintcolorhq.com footer
 *
 * Params:
 *   title (required), excerpt, cover (URL relative to site, e.g.
 *   /blog/foo.webp), color (fallback hex), tag (optional eyebrow extra)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") || "Paint Color Guide";
  const cover = searchParams.get("cover");
  const fallbackColor = searchParams.get("color") || "#e5e7eb";
  const tag = searchParams.get("tag") || "";

  // @vercel/og (the engine behind ImageResponse) decodes JPG/PNG/GIF but
  // not WebP. Cover images on disk are WebP for site performance — convert
  // the path to the JPG sibling for pin generation. Both formats are
  // shipped in /public/blog/ via scripts/convert-blog-covers-to-jpg.mjs.
  const coverPath = cover ? cover.replace(/\.webp$/i, ".jpg") : null;
  const coverUrl = coverPath
    ? coverPath.startsWith("http")
      ? coverPath
      : `https://www.paintcolorhq.com${coverPath}`
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Cover image / color block — top 55% */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "55%",
            backgroundColor: fallbackColor,
            overflow: "hidden",
          }}
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt=""
              width={1000}
              height={825}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
        </div>

        {/* Info area — bottom 45% */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "45%",
            padding: "60px 70px",
            justifyContent: "space-between",
            backgroundColor: "#ffffff",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 26,
                fontFamily: "sans-serif",
                color: "#dc2626",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                fontWeight: 700,
              }}
            >
              {tag || "Paint Color HQ"}
            </span>
            <span
              style={{
                fontSize: 56,
                fontWeight: 800,
                color: "#111827",
                lineHeight: 1.08,
                marginTop: 22,
                fontFamily: "sans-serif",
              }}
            >
              {title.length > 90 ? title.slice(0, 87) + "…" : title}
            </span>
          </div>

          <span
            style={{
              fontSize: 22,
              color: "#9ca3af",
              fontFamily: "sans-serif",
            }}
          >
            paintcolorhq.com · paint color guides
          </span>
        </div>
      </div>
    ),
    {
      width: 1000,
      height: 1500,
      headers: {
        "Cache-Control": "public, max-age=2592000, s-maxage=2592000, immutable",
      },
    },
  );
}
