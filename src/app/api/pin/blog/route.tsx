import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { capText, normalizeHex } from "@/lib/og-params";

export const runtime = "edge";

const SITE = "https://www.paintcolorhq.com";
const COVER_PATH_RE = /^\/blog\/[a-z0-9-]+\.(webp|jpe?g|png)$/;

// Only our own blog covers may be drawn under PaintColorHQ branding. Accepts a
// site-relative path ("/blog/foo.webp") or the same path as an absolute
// https://www.paintcolorhq.com URL (the Pinterest guide lane sends that form).
// Anything else, including userinfo tricks and other hosts, falls back to the
// color block.
function safeCoverPath(raw: string | null): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw, SITE);
  } catch {
    return null;
  }
  if (url.origin !== SITE || url.username || url.password || url.search || url.hash) return null;
  return COVER_PATH_RE.test(url.pathname) ? url.pathname : null;
}

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
  const title = capText(searchParams.get("title"), 200) || "Paint Color Guide";
  const cover = searchParams.get("cover");
  const fallbackColor = normalizeHex(searchParams.get("color")) ?? "#e5e7eb";
  const tag = capText(searchParams.get("tag"), 30);

  // Output size. Default is the Pinterest 2:3 (1000×1500). Instagram's feed only
  // accepts 4:5–1.91:1, so the IG drip requests ?ar=4:5 (1080×1350). The layout
  // below is percentage-based, so it reflows to either ratio unchanged.
  const ar = searchParams.get("ar");
  const [imgW, imgH] =
    ar === "4:5" ? [1080, 1350] : ar === "1:1" ? [1080, 1080] : [1000, 1500];

  // @vercel/og (the engine behind ImageResponse) decodes JPG/PNG/GIF but
  // not WebP. Cover images on disk are WebP for site performance — convert
  // the path to the JPG sibling for pin generation. Both formats are
  // shipped in /public/blog/ via scripts/convert-blog-covers-to-jpg.mjs.
  const coverPath = safeCoverPath(cover);
  const coverUrl = coverPath ? `${SITE}${coverPath.replace(/\.webp$/i, ".jpg")}` : null;

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
      width: imgW,
      height: imgH,
      headers: {
        "Cache-Control": "public, max-age=2592000, s-maxage=2592000, immutable",
      },
    },
  );
}
