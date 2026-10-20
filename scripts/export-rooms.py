"""
Publish finished visualizer rooms from room-src/ to the site.

For every room-src/<id>/ that has base.png, meta.json and its masks (run
scripts/build-room-masks.py first), writes:
  public/rooms/<id>/base.webp          the room photo
  public/rooms/<id>/mask-<surface>.png one grayscale mask per surface the room has
  src/lib/room-scenes.json             the room list read by src/lib/rooms.ts

A surface whose mask covers under 0.2% of the frame is left out, so the visualizer
never offers a region the room doesn't really have.

Usage: python3 scripts/export-rooms.py
"""
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

    base = Image.open(room / "base.png").convert("RGB")
    base.save(dest / "base.webp", quality=86, method=6)

    masks = {}
    for s in SURFACES:
        f = room / f"mask-{s}.png"
        if not f.exists():
            continue
        m = Image.open(f).convert("L")
        if (np.asarray(m) > 127).mean() < 0.002:
            continue
        m.save(dest / f"mask-{s}.png", optimize=True)
        masks[s] = f"/rooms/{room.name}/mask-{s}.png"

    scenes.append(
        {
            "id": room.name,
            "name": meta["name"],
            "category": meta["category"],
            "width": base.size[0],
            "height": base.size[1],
            "image": f"/rooms/{room.name}/base.webp",
            "masks": masks,
        }
    )

scenes.sort(key=lambda r: (CATEGORIES.index(r["category"]), r["id"]))
(ROOT / "src" / "lib" / "room-scenes.json").write_text(json.dumps(scenes, indent=2) + "\n")
total = sum(f.stat().st_size for f in OUT.rglob("*") if f.is_file() and f.parent != OUT)
print(f"{len(scenes)} rooms → public/rooms ({total / 1024:.0f} KB)")
for r in scenes:
    print(f"  {r['id']:<11} {', '.join(r['masks'])}")
