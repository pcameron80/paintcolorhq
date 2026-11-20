#!/usr/bin/env python3
"""
Measure and correct the wall color of a Nano Banana repaint
(scripts/blog/paint-photo.ts) before it is published.

The original room's off-white walls are a light probe. Dividing the repaint by
the original, per pixel, removes the room's light and falloff and leaves the
paint color the model used. Its median over the wall mask (from the
generate-room.ts key pass, magenta) is compared with the published hex in
CIEDE2000. A plain average of wall pixels would read 12-15 off just from
shading.

Gates, before correction:
  - wall color within PASS_DE (5, "very similar"), else regenerate;
  - pixels outside the walls changed by under MAX_DRIFT on average, else the
    edit moved or restyled the room: regenerate.
A passing image gets per-channel gains on the walls so the measured median
equals the published color, then is measured again, and is written as
<out>.webp (1200 px wide) with a JSON line of the numbers.

Tested 2026-10-31: SW Accessible Beige came out at dE 3.3, BM Pale Oak at 2.2,
both 0.0 after correction, with non-wall drift ~5/255.

Usage:
  python3 scripts/blog/verify-paint-photo.py --base room/base.png --key room/key.png \
    --paint room/pale-oak.png --hex DDD9CE --out public/blog/best-beige-pale-oak
"""
import argparse, json, sys
import numpy as np
from PIL import Image, ImageFilter

PASS_DE = 5.0
MAX_DRIFT = 12.0
BASE_REFLECTANCE = 0.80  # the generator's "very light warm gray-white", about LRV 80

M = np.array([[.4124, .3576, .1805], [.2126, .7152, .0722], [.0193, .1192, .9505]])
WP = np.array([.95047, 1, 1.08883])


def s2l(c):
    c = c / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def l2s(c):
    c = np.clip(c, 0, 1)
    return 255 * np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def lab(lin):
    x = (lin @ M.T) / WP
    f = np.where(x > 0.008856, np.cbrt(x), 7.787 * x + 16 / 116)
    return np.array([116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])])


def de2000(p, q):
    L1, a1, b1 = p
    L2, a2, b2 = q
    C1, C2 = np.hypot(a1, b1), np.hypot(a2, b2)
    Cb = (C1 + C2) / 2
    G = 0.5 * (1 - np.sqrt(Cb**7 / (Cb**7 + 25**7)))
    a1p, a2p = (1 + G) * a1, (1 + G) * a2
    C1p, C2p = np.hypot(a1p, b1), np.hypot(a2p, b2)
    h1, h2 = np.degrees(np.arctan2(b1, a1p)) % 360, np.degrees(np.arctan2(b2, a2p)) % 360
    dL, dC, dh = L2 - L1, C2p - C1p, h2 - h1
    if C1p * C2p == 0:
        dh = 0
    elif dh > 180:
        dh -= 360
    elif dh < -180:
        dh += 360
    dH = 2 * np.sqrt(C1p * C2p) * np.sin(np.radians(dh / 2))
    Lb, Cbp = (L1 + L2) / 2, (C1p + C2p) / 2
    hb = (h1 + h2) / 2 if abs(h1 - h2) <= 180 else (h1 + h2 + 360) / 2
    T = 1 - .17 * np.cos(np.radians(hb - 30)) + .24 * np.cos(np.radians(2 * hb)) + .32 * np.cos(np.radians(3 * hb + 6)) - .2 * np.cos(np.radians(4 * hb - 63))
    SL = 1 + .015 * (Lb - 50) ** 2 / np.sqrt(20 + (Lb - 50) ** 2)
    SC, SH = 1 + .045 * Cbp, 1 + .015 * Cbp * T
    RT = -2 * np.sqrt(Cbp**7 / (Cbp**7 + 25**7)) * np.sin(np.radians(60 * np.exp(-((hb - 275) / 25) ** 2)))
    return float(np.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH)))


def closeness(d):
    # Same thresholds as src/lib/closeness.ts.
    return "Nearly identical" if d < 2 else "Very similar" if d < 5 else "Visible difference"


def main():
    ap = argparse.ArgumentParser()
    for a in ("base", "key", "paint", "hex", "out"):
        ap.add_argument(f"--{a}", required=True)
    o = ap.parse_args()

    base = np.asarray(Image.open(o.base).convert("RGB")).astype(float)
    size = base.shape[1::-1]
    key = np.asarray(Image.open(o.key).convert("RGB").resize(size)).astype(float)
    paint = np.asarray(Image.open(o.paint).convert("RGB").resize(size)).astype(float)

    # Magenta by hue, not brightness: sunlit patches of the key read lighter.
    walls = ((key[..., 0] - key[..., 1] > 100) & (key[..., 2] - key[..., 1] > 100)).astype(np.uint8) * 255
    core = np.asarray(Image.fromarray(walls).filter(ImageFilter.MinFilter(9))) > 0
    # Sun patches that blew the original wall out to white carry no light information.
    core &= base.max(axis=2) < 250
    near = np.asarray(Image.fromarray(walls).filter(ImageFilter.MaxFilter(15))) > 0
    feather = np.asarray(Image.fromarray(walls).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(2)))[..., None] / 255.0
    if core.mean() < 0.05:
        sys.exit(f"Wall mask covers only {core.mean():.1%} of the image; check the key pass.")

    h = o.hex.lstrip("#")
    target = s2l(np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], float))
    bl, pl = s2l(base), s2l(paint)

    def measured(img):
        return np.median(img[core] / np.maximum(bl[core], 1e-4) * BASE_REFLECTANCE, axis=0)

    before = measured(pl)
    de_before = de2000(lab(before), lab(target))
    drift = float(np.abs(paint[~near] - base[~near]).mean())
    report = {"paint": o.paint, "hex": f"#{h.upper()}", "de_before": round(de_before, 2),
              "closeness_before": closeness(de_before), "non_wall_drift": round(drift, 1)}
    if de_before >= PASS_DE or drift >= MAX_DRIFT:
        report["result"] = "regenerate"
        print(json.dumps(report))
        sys.exit(2)

    gain = target / before
    corrected = pl * (1 - feather) + np.clip(pl * gain, 0, 1) * feather
    de_after = de2000(lab(measured(corrected)), lab(target))
    out = Image.fromarray(l2s(corrected).round().astype(np.uint8))
    w = 1200
    out.resize((w, round(out.height * w / out.width)), Image.LANCZOS).save(f"{o.out}.webp", quality=86, method=6)
    report.update({"de_after": round(de_after, 2), "gains": [round(g, 3) for g in gain], "result": "ok", "written": f"{o.out}.webp"})
    print(json.dumps(report))


if __name__ == "__main__":
    main()
