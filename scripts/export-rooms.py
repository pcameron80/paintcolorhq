"""
Publish finished visualizer rooms from room-src/ to the site.

For every room-src/<id>/ that has base.png, meta.json and its masks (run
scripts/build-room-masks.py first), writes two sets of files:
  public/rooms/<id>/base.<hash>.webp              the room photo, full size
  public/rooms/<id>/mask-<surface>.<hash>.png     one grayscale mask per surface
  public/rooms/<id>/base-800.<hash>.webp          the photo at 800 px wide
  public/rooms/<id>/mask-<surface>-800.<hash>.png each mask at 800 px wide
  src/lib/room-scenes.json                        the room list read by src/lib/rooms.ts

The 800 px set is what phones and the color-page pairing preview load (see
room-canvas.tsx). <hash> is the first 10 hex digits of the file's SHA-256, so a
changed file gets a new URL and next.config.ts can serve /rooms/* as immutable.

A surface whose mask covers under 0.2% of the frame is left out, so the visualizer
never offers a region the room doesn't really have.

Usage: python3 scripts/export-rooms.py
"""
import hashlib
import io
import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "room-src"
OUT = ROOT / "public" / "rooms"
SURFACES = ("main", "accent", "trim", "window")
# Display order in the room picker.
CATEGORIES = ("living", "bedroom", "kitchen", "dining", "bathroom")
SMALL_WIDTH = 800


def write_hashed(dest: Path, stem: str, img: Image.Image, fmt: str, **opts) -> str:
    """Encode img, write it as <stem>.<hash>.<ext> and return the file name."""
    buf = io.BytesIO()
    img.save(buf, fmt, **opts)
    data = buf.getvalue()
    ext = "webp" if fmt == "WEBP" else "png"
    name = f"{stem}.{hashlib.sha256(data).hexdigest()[:10]}.{ext}"
    (dest / name).write_bytes(data)
    return name


scenes = []
for room in sorted(SRC.iterdir()):
    meta_file = room / "meta.json"
    if not (room / "base.png").exists() or not meta_file.exists():
        continue
    meta = json.loads(meta_file.read_text())
    dest = OUT / room.name
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True)
    url = f"/rooms/{room.name}"

    base = Image.open(room / "base.png").convert("RGB")
    w, h = base.size
    sw, sh = SMALL_WIDTH, round(h * SMALL_WIDTH / w)
    # The canvas computes its downscaled height the same way: round(h * 800 / w).
    small_base = base.resize((sw, sh), Image.Resampling.LANCZOS)

    full = {"width": w, "height": h, "masks": {}}
    small = {"width": sw, "height": sh, "masks": {}}
    full["image"] = f"{url}/{write_hashed(dest, 'base', base, 'WEBP', quality=86, method=6)}"
    small["image"] = f"{url}/{write_hashed(dest, f'base-{SMALL_WIDTH}', small_base, 'WEBP', quality=86, method=6)}"

    for s in SURFACES:
        f = room / f"mask-{s}.png"
        if not f.exists():
            continue
        m = Image.open(f).convert("L")
        if (np.asarray(m) > 127).mean() < 0.002:
            continue
        full["masks"][s] = f"{url}/{write_hashed(dest, f'mask-{s}', m, 'PNG', optimize=True)}"
        # Area-average (BOX) keeps each small pixel's value its true coverage, with
        # no ringing past the surface edge the way a sharpening filter would add.
        sm = m.resize((sw, sh), Image.Resampling.BOX)
        small["masks"][s] = f"{url}/{write_hashed(dest, f'mask-{s}-{SMALL_WIDTH}', sm, 'PNG', optimize=True)}"

    scenes.append(
        {
            "id": room.name,
            "name": meta["name"],
            "category": meta["category"],
            "width": w,
            "height": h,
            "image": full["image"],
            "masks": full["masks"],
            "small": small,
        }
    )

scenes.sort(key=lambda r: (CATEGORIES.index(r["category"]), r["id"]))
(ROOT / "src" / "lib" / "room-scenes.json").write_text(json.dumps(scenes, indent=2) + "\n")
total = sum(f.stat().st_size for f in OUT.rglob("*") if f.is_file() and f.parent != OUT)
print(f"{len(scenes)} rooms → public/rooms ({total / 1024:.0f} KB)")
for r in scenes:
    print(f"  {r['id']:<11} {', '.join(r['masks'])}")
