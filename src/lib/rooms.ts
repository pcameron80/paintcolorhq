/**
 * Room scenes for the color-page visualizer (see <RoomPreview />).
 *
 * Each scene is a real room photo (stored as a webp in /public/rooms) plus the
 * paintable regions traced over it as SVG polygon point strings. RoomPreview
 * fills those polygons with the chosen paint color using multiply + soft-light
 * blend passes, so the color reads as real paint over the photo's lighting.
 *
 * Adding a room:
 *  1. Trace the room in Illustrator with three named groups — `Main_Wall`,
 *     `Accent_Walls`, `Trim` — over the embedded photo, then SVG-export.
 *  2. Extract the embedded photo to /public/rooms/<id>.webp (resize ~1600px wide).
 *  3. Copy each group's polygon `points` strings into a new entry below.
 *  4. Set width/height to the SVG viewBox dimensions (must match the photo ratio).
 * The visualizer picks up extra rooms automatically and shows a room switcher
 * once more than one scene exists.
 */

export interface RoomScene {
  id: string;
  /** Display name, e.g. "Living Room" */
  name: string;
  /** Path under /public, e.g. "/rooms/living-room.jpg" */
  image: string;
  /** SVG viewBox dimensions — must match the photo's aspect ratio */
  width: number;
  height: number;
  /** Polygon point strings ("x y x y …") for each paint region */
  wall: string[];
  accent: string[];
  trim: string[];
}

export const ROOMS: RoomScene[] = [
  {
    id: "living-room",
    name: "Living Room",
    image: "/rooms/living-room.jpg",
    width: 1200,
    height: 742.56,
    // #Main_Wall — the large back wall (primary color)
    wall: [
      "144.6 128.84 185.23 189.79 185.23 457.3 1014.79 457.12 1014.79 190.16 1054.86 129.1 1054.86 510.44 145.58 510.54 144.6 128.84",
      "144.6 128.84 185.23 189.79 417.65 189.79 418.75 457.25 483.8 457.23 484.06 189.99 716.4 189.79 716.46 457.18 782 457.17 782 190.16 1014.79 190.16 1054.86 129.1 144.6 128.84",
    ],
    // #Accent_Walls — the two angled side walls (accent color)
    accent: [
      "1200 544.73 1191.77 542.86 1192.02 125.97 1190.02 125.97 1102.91 166.52 1103.92 521.7 1054.86 510.44 1054.86 129.1 1200 41.24 1200 544.73",
      "0 474.02 117.5 459.99 117.34 176.51 0 121.39 0 41.5 144.6 128.84 145.58 510.54 0 544.8 0 475.88 0 475.88",
    ],
    // #Trim — crown, baseboard, window frames (trim color)
    trim: [
      "782 457.17 795.17 444.17 794.91 202.91 782 190.16 782 457.17",
      "1200 544.73 1191.77 542.86 1191.77 125.97 1102.91 166.52 1103.92 521.7 1054.86 510.44 145.58 510.54 0 544.8 0 583.37 146.41 539.43 1053.79 539.46 1106.77 555.9 1112.36 556.28 1112.24 178.11 1181.09 147.74 1180.91 578.02 1184.99 579.65 1187.95 579.47 1200 583.37 1200 544.73",
      "782 190.16 794.91 202.91 1002.37 202.62 1002.31 444.23 795.17 444.17 782 457.17 1014.79 457.12 1014.79 190.16 782 190.16",
      "496.58 202.74 496.63 444.13 483.8 457.23 484.06 189.99 496.58 202.74",
      "484.06 189.99 496.58 202.74 702.95 202.45 703.29 444.33 496.63 444.13 483.8 457.23 716.46 457.18 716.4 189.79 484.06 189.99",
      "185.23 189.79 198.33 202.52 198.33 444.13 185.23 457.3 185.23 189.79",
      "185.23 189.79 417.65 189.79 418.75 457.25 185.23 457.3 198.33 444.13 405.11 444.31 405.24 202.54 198.33 202.52 185.23 189.79",
      "0 474.02 117.5 459.99 117.34 176.51 0 121.39 0 160.73 68.58 187.75 68.86 447.01 0 452.56 0 474.02 0 474.02",
      "0 41.5 144.6 128.84 1054.86 129.1 1200 41.24 1200 17.06 1052.91 111.61 147.03 111.93 0 16.85",
    ],
  },
];

export const DEFAULT_ROOM = ROOMS[0];
