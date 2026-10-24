/**
 * Room scenes for the room visualizer (/tools/room-visualizer).
 *
 * Each scene is a generated room photo with plain off-white walls plus one grayscale
 * mask per paintable surface. The visualizer recolors a surface by multiplying the
 * paint color by the photo's own light and shadow (see room-canvas.tsx), so the paint
 * keeps the room's real shading.
 *
 * The list lives in room-scenes.json, written by scripts/export-rooms.py. Adding a room:
 *  1. npx tsx scripts/generate-room.ts --id=<id> --pass=base --prompt="..."   (review it)
 *  2. npx tsx scripts/generate-room.ts --id=<id> --pass=key --accent="..."    (review it)
 *  3. Write room-src/<id>/meta.json: { "name", "category", "windows" }. Set windows to
 *     true only after checking the window frames against the photo: the edit model
 *     sometimes invents or moves grilles.
 *  4. python3 scripts/build-room-masks.py room-src/<id> --preview   (check preview.jpg)
 *  5. python3 scripts/export-rooms.py
 *
 * File names carry a content hash (base.<hash>.webp), so /rooms/* is served as
 * immutable (next.config.ts). Never edit a published file in place: re-export.
 */
import scenes from "./room-scenes.json";

export type Surface = "main" | "accent" | "trim" | "window";

export type RoomCategory = "living" | "bedroom" | "kitchen" | "dining" | "bathroom";

export interface RoomScene {
  id: string;
  /** Display name, e.g. "Living room with fireplace" */
  name: string;
  category: RoomCategory;
  /** Pixel size of the photo and every mask */
  width: number;
  height: number;
  /** Path under /public to the room photo */
  image: string;
  /** Path under /public to each surface's mask; a missing surface isn't paintable here */
  masks: Partial<Record<Surface, string>>;
  /** The same photo and masks at 800 px wide, for phones and small embeds */
  small: RoomAssets;
}

/** One resolution of a room: its photo and masks, all the same pixel size */
export interface RoomAssets {
  width: number;
  height: number;
  image: string;
  masks: Partial<Record<Surface, string>>;
}

export const ROOMS = scenes as RoomScene[];
