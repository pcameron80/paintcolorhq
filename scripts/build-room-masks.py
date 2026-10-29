"""
Build visualizer masks from a generated room (see scripts/generate-room.ts).

Reads <dir>/base.png and <dir>/key.png, classifies each key pixel by its flat key
color (magenta = main walls, cyan = accent wall, yellow = trim, green = window
frames, blue = cabinets from key-cabinets.png) and writes:
  <dir>/mask-<surface>.png  one grayscale coverage mask per surface (0-255). Separate
                            files rather than RGBA channels: browsers premultiply
                            alpha on canvas reads, which would corrupt a 4th channel.
  <dir>/report.txt          coverage per surface + how well key and base stay aligned

Optional <dir>/exclude.json: areas in base-image pixels that are never painted (e.g.
another room seen through a doorway, a range hood that picked up the key color). Each
entry is a rectangle [x0, y0, x1, y1] or a polygon [[x, y], [x, y], ...].
Optional "reassign" rules in <dir>/meta.json move a surface to another inside a box.

Coverage is soft: it scales with how saturated the key color is, so anti-aliased
edges and walls seen through sheer curtains get partial paint instead of a hard cut.

Usage: python3 scripts/build-room-masks.py <room-dir> [--preview]
  --preview  also writes preview.jpg: the room in four test colors, rendered with the
             same shading math the browser renderer uses.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

room = Path(sys.argv[1])
base_img = Image.open(room / "base.png").convert("RGB")
key_img = Image.open(room / "key.png").convert("RGB")
# Classify at the key's own resolution (2K) and only shrink the finished masks: edge
# pixels then get true partial coverage, and the edit's edge wobble shrinks with them.
# Resizing the key colors first would blend them at every seam.
scale = key_img.size[0] / base_img.size[0]
base = np.asarray(base_img, dtype=np.float32) / 255
work = np.asarray(base_img.resize(key_img.size, Image.LANCZOS), dtype=np.float32) / 255
key = np.asarray(key_img, dtype=np.float32) / 255

r, g, b = key[..., 0], key[..., 1], key[..., 2]
hi = np.maximum(np.maximum(r, g), b)
lo = np.minimum(np.minimum(r, g), b)
chroma = hi - lo


def coverage(score):
    """Map a 'how much this looks like the key color' score to 0-1 coverage."""
    return np.clip((score - 0.25) / 0.2, 0, 1)


# Each key color is two strong channels and one weak one; score = min(strong) - weak.
# The edit often keeps the room's shading on the key color, so channels are divided
# by the pixel's brightest channel: a shadowed magenta scores the same as a lit one.
# Near-black pixels carry no reliable hue and are dropped.
lit = np.clip((hi - 0.12) / 0.1, 0, 1)
rn, gn, bn = (c / np.maximum(hi, 1e-3) for c in (r, g, b))
main = coverage(np.minimum(rn, bn) - gn) * lit
accent = coverage(np.minimum(gn, bn) - rn) * lit
trim = coverage(np.minimum(rn, gn) - bn) * lit
# Green is one strong channel: score = strong - max(weak). A shaded cyan or yellow
# keeps its second channel high, so it never scores as green.
window = coverage(gn - np.maximum(rn, bn)) * lit

# Per-room settings (room-src/<id>/meta.json). Window frames are opt-in: the edit
# model likes to invent or move grilles, so a room only gets a window surface once its
# frames have been checked against the photo. key-window.png (a windows-only edit
# pass) replaces the main key's green when present, as it is usually more faithful.
meta_file = room / "meta.json"
meta = json.loads(meta_file.read_text()) if meta_file.exists() else {}
window_key = room / "key-window.png"
if not meta.get("windows", True):
    window = np.zeros_like(window)
elif window_key.exists():
    wk = np.asarray(Image.open(window_key).convert("RGB").resize(key_img.size, Image.LANCZOS), dtype=np.float32) / 255
    whi = wk.max(axis=2)
    wr, wg, wb = (wk[..., i] / np.maximum(whi, 1e-3) for i in range(3))
    window = coverage(wg - np.maximum(wr, wb)) * np.clip((whi - 0.12) / 0.1, 0, 1)
    # The window key wins where it claims a frame; elsewhere its green is ignored.
    main, accent, trim = (m * (1 - window) for m in (main, accent, trim))

# key-cabinets.png (a cabinets-only edit pass, kitchens) floods the cabinetry pure blue.
# Blue is one strong channel, scored like green above. Hardware keeps its own color in
# that pass, so pulls and knobs never score as blue and stay unpainted.
cabinet_key = room / "key-cabinets.png"
cabinets = np.zeros_like(window)
if cabinet_key.exists():
    ck = np.asarray(Image.open(cabinet_key).convert("RGB").resize(key_img.size, Image.LANCZOS), dtype=np.float32) / 255
    chi = ck.max(axis=2)
    cr, cg, cb = (ck[..., i] / np.maximum(chi, 1e-3) for i in range(3))
    cabinets = coverage(cb - np.maximum(cr, cg)) * np.clip((chi - 0.12) / 0.1, 0, 1)
    # The edit keeps hardware but tints dark pulls blue, so they still score as cabinet.
    # In the base they are far darker than the door around them: under 15-25% of the
    # local brightness, where the deepest real cabinet shadows stay above 45%.
    wlum = (np.where(work <= 0.04045, work / 12.92, ((work + 0.055) / 1.055) ** 2.4) @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)).astype(np.float32)
    local = np.asarray(Image.fromarray(wlum, mode="F").filter(ImageFilter.MedianFilter(2 * round(15 * scale) + 1)), dtype=np.float32)
    hardware = np.clip((0.25 - wlum / np.maximum(local, 1e-3)) / 0.1, 0, 1)
    cabinets *= 1 - hardware

SURFACES = ("main", "accent", "trim", "window")

# The base walls are near-neutral; anything strongly colored in the base (wood, art)
# can't be a painted surface even if the edit bled color onto it.
base_chroma = work.max(axis=2) - work.min(axis=2)
# Loose on purpose: off-white walls pick up warm bounce light from wood floors and
# sunlight, and a tight cutoff punches holes in exactly those patches.
neutral = np.clip((0.38 - base_chroma) / 0.1, 0, 1)
keep = np.ones_like(neutral)
exclude_file = room / "exclude.json"
if exclude_file.exists():
    polygons = Image.new("L", (keep.shape[1], keep.shape[0]), 0)
    for area in json.loads(exclude_file.read_text()):
        if isinstance(area[0], list):
            ImageDraw.Draw(polygons).polygon([(x * scale, y * scale) for x, y in area], fill=255)
        else:
            x0, y0, x1, y1 = area
            keep[round(y0 * scale) : round(y1 * scale), round(x0 * scale) : round(x1 * scale)] = 0
    keep *= np.asarray(polygons) == 0
masks = [m * neutral * keep for m in (main, accent, trim, window)]
cabinets *= neutral * keep

# meta.json "reassign": [{"rect": [x0, y0, x1, y1], "from": "main", "to": "accent"}, ...]
# moves one surface's coverage to another inside a box (base-image pixels). The key
# pass sometimes splits one wall in two, e.g. where a chandelier crosses it, or picks a
# less useful accent wall; drawing the box along the real wall corners fixes it.
for rule in meta.get("reassign", []):
    x0, y0, x1, y1 = (round(v * scale) for v in rule["rect"])
    src, dst = SURFACES.index(rule["from"]), SURFACES.index(rule["to"])
    box = (slice(y0, y1), slice(x0, x1))
    masks[dst][box] = np.maximum(masks[dst][box], masks[src][box])
    masks[src][box] = 0

# Seams where two surfaces meet (wall corners, wall/trim joints). Only pixels lying
# between two different surfaces are touched; an object edge borders a single
# surface, so lamps and furniture don't grow a painted halo.
stack = np.stack(masks, axis=2)


def grow(st):
    return np.stack(
        [np.asarray(Image.fromarray((st[..., i] * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * round(2 * scale) + 1)), dtype=np.float32) / 255 for i in range(st.shape[2])],
        axis=2,
    )


# Anti-aliased pixels where cyan meets yellow blend to green, which would draw a fake
# window-frame line along every accent/trim edge. Real window frames always sit inside
# their casing, so they never touch the accent wall and trim at once.
grown = grow(stack)
stack[..., 3] = np.where((grown[..., 1] > 0.5) & (grown[..., 2] > 0.5), 0, stack[..., 3])
grown = grow(stack)

# At a seam each surface claims only part of the edge pixels (the key colors blend
# there), so the white base would show through as a hairline. Between two surfaces,
# top the coverage up to 100%, split across the neighbouring surfaces in proportion
# to what each already claims. (Handing it all to the stronger side flips with pixel
# noise along the edge and draws a dashed line.)
near = (grown > 0.5).astype(np.float32)
between = (near.sum(axis=2) >= 2) & (neutral > 0.5)
total = stack.sum(axis=2)
short = np.clip(1 - total, 0, 1) * between
weight = (stack + 0.05) * near
stack += short[..., None] * weight / np.maximum(weight.sum(axis=2, keepdims=True), 1e-6)
total = stack.sum(axis=2, keepdims=True)
stack = np.where(total > 1, stack / np.maximum(total, 1e-3), stack)

# Cabinets are built apart and never change the other four masks, so pages that paint
# only walls and trim (the color-page pairing preview) render exactly as before. The
# renderer paints cabinets last, on top of any wall that strays onto them; at a seam
# the cabinets alone take whatever coverage the wall leaves short.
grown = grow(stack).max(axis=2)
cab_grown = grow(cabinets[..., None])[..., 0]
between = (cab_grown > 0.5) & (grown > 0.5) & (neutral > 0.5)
cabinets += np.clip(1 - stack.sum(axis=2) - cabinets, 0, 1) * between
stack = np.concatenate([stack, cabinets[..., None]], axis=2)
SURFACES += ("cabinets",)

masks = [stack[..., i] for i in range(len(SURFACES))]

soft = []
for name, m in zip(SURFACES, masks):
    img = Image.fromarray((m * 255).astype(np.uint8), mode="L")
    # Median clears speckle inside surfaces; the downscale anti-aliases the edges.
    img = img.filter(ImageFilter.MedianFilter(3)).resize(base_img.size, Image.BOX)
    if scale < 1.5:
        img = img.filter(ImageFilter.GaussianBlur(0.8))  # 1K key: feather instead
    img.save(room / f"mask-{name}.png", optimize=True)
    soft.append(np.asarray(img, dtype=np.float32) / 255)
soft = np.stack(soft, axis=2)

# Alignment check: outside the painted surfaces the edit should leave pixels unchanged.
untouched = (stack.max(axis=2) < 0.05) & (chroma < 0.5)
drift = np.abs(work - key).mean(axis=2)[untouched]
lines = [
    f"size {base_img.size[0]}x{base_img.size[1]}",
    *(f"{n}: {m.mean() * 100:.1f}% of frame" for n, m in zip(SURFACES, masks)),
    f"alignment: mean abs diff outside surfaces {drift.mean() * 255:.1f}/255, "
    f"{(drift > 0.15).mean() * 100:.1f}% of pixels moved noticeably",
]
if cabinet_key.exists():
    # The same check for the cabinets pass, outside the cabinets.
    cab_drift = np.abs(work - ck).mean(axis=2)[(stack[..., 4] < 0.05) & (cb - np.maximum(cr, cg) < 0.25)]
    lines.append(
        f"cabinets key alignment: mean abs diff outside cabinets {cab_drift.mean() * 255:.1f}/255, "
        f"{(cab_drift > 0.15).mean() * 100:.1f}% of pixels moved noticeably"
    )
(room / "report.txt").write_text("\n".join(lines) + "\n")
print("\n".join(lines))

if "--preview" in sys.argv:

    def to_linear(c):
        return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)

    def to_srgb(c):
        c = np.clip(c, 0, 1)
        return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)

    def hex_lin(h):
        return to_linear(np.array([int(h[i : i + 2], 16) / 255 for i in (1, 3, 5)], dtype=np.float32))

    lin = to_linear(base)
    lum = lin @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    # A 3px median takes the photo's pixel noise out of the shading: on dark paint the
    # noise is amplified into visible speckle, while real light and shadow survive it.
    lum = np.asarray(Image.fromarray(lum.astype(np.float32), mode="F").filter(ImageFilter.MedianFilter(3)), dtype=np.float32)
    def render(*hexes):
        out = base.copy()
        for i, h in enumerate(hexes):
            a = soft[..., i]
            sel = a > 0.5
            if not sel.any():
                continue
            # Shading = this pixel's brightness relative to the surface's typical brightness,
            # applied in linear light. Edges are then blended in sRGB like any browser
            # anti-aliasing: a linear-light blend turns a dark/light seam pixel pale.
            shade = lum / np.percentile(lum[sel], 60)
            paint = to_srgb(hex_lin(h)[None, None, :] * shade[..., None])
            out = out * (1 - a[..., None]) + paint * a[..., None]
        return np.clip(out, 0, 1)

    # (main, accent, trim, window, cabinets) — test colors near SW Sea Salt, Naval and
    # Agreeable Gray, plus sage, terracotta and charcoal. The last two show windows painted
    # apart from trim; cabinets go navy, sage, white and green.
    combos = [
        ("#CDD2CA", "#2F3D4C", "#F2F0EB", "#F2F0EB", "#2F3D4C"),
        ("#2F3D4C", "#2F3D4C", "#F2F0EB", "#F2F0EB", "#7A8B6F"),
        ("#D1CBC1", "#7A8B6F", "#F2F0EB", "#2B2B2B", "#F2F0EB"),
        ("#E8D9C0", "#B5654A", "#3B3B3B", "#F2F0EB", "#65816D"),
    ]
    tiles = [Image.fromarray((render(*c) * 255).astype(np.uint8)) for c in combos]
    w, h = tiles[0].size
    w2, h2 = w // 2, h // 2
    grid = Image.new("RGB", (w2 * 2, h2 * 2))
    for i, t in enumerate(tiles):
        grid.paste(t.resize((w2, h2), Image.LANCZOS), ((i % 2) * w2, (i // 2) * h2))
    grid.save(room / "preview.jpg", quality=88)
    for i, t in enumerate(tiles):
        t.save(room / f"render-{i + 1}.jpg", quality=90)
    print(f"preview → {room / 'preview.jpg'}")
