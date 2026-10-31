import type { RoomScene, Surface } from "@/lib/rooms";
import { cacheScene, cachedScene, prepareScene, renderScene, sceneKey } from "@/lib/room-render";
import { presetForHex } from "@/lib/visualizer-presets";

/** A painted surface listed in the credit band, e.g. { label: "Walls", hex: "#D6D0C4" }. */
export interface CreditSurface {
  label: string;
  hex: string;
}

const FONT_STACK = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const LEFT_TEXT = "Paint preview: paintcolorhq.com";
const SEPARATOR = "   |   ";

/** "Pure White (Sherwin-Williams)" for a known preset, else the hex. */
function paintLabel(hex: string): string {
  const preset = presetForHex(hex);
  return preset ? `${preset.name} (${preset.brand})` : hex.toUpperCase();
}

/** Renders the room at full size with the credit band and returns it as a JPEG. */
export async function renderRoomJpeg(
  room: RoomScene,
  colors: Partial<Record<Surface, string>>,
  surfaces: CreditSurface[],
): Promise<Blob> {
  const key = sceneKey(room, Infinity);
  const hit = cachedScene(key);
  const scene = hit ?? (await prepareScene(room, Infinity));
  if (!hit) cacheScene(key, scene);

  const canvas = document.createElement("canvas");
  canvas.width = scene.width;
  canvas.height = scene.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  const out = ctx.createImageData(scene.width, scene.height);
  renderScene(scene, colors, out);
  ctx.putImageData(out, 0, 0);

  // Credit band: font and padding scale with the image so it reads at full size.
  const fontSize = Math.max(14, Math.round(scene.width / 55));
  const padX = Math.round(fontSize * 1.1);
  const bandH = Math.round(fontSize * 2.4);
  const baseline = scene.height - bandH / 2;
  ctx.fillStyle = "rgba(17, 17, 17, 0.72)";
  ctx.fillRect(0, scene.height - bandH, scene.width, bandH);
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";

  ctx.font = `600 ${fontSize}px ${FONT_STACK}`;
  ctx.textAlign = "left";
  ctx.fillText(LEFT_TEXT, padX, baseline);
  const leftEnd = padX + ctx.measureText(LEFT_TEXT).width;

  // Right side: as many surfaces as fit on the one line, in order.
  ctx.font = `400 ${fontSize}px ${FONT_STACK}`;
  const items = surfaces.map((s) => `${s.label}: ${paintLabel(s.hex)}`);
  const available = scene.width - padX - leftEnd - fontSize * 2;
  while (items.length > 0 && ctx.measureText(items.join(SEPARATOR)).width > available) items.pop();
  if (items.length > 0) {
    ctx.textAlign = "right";
    ctx.fillText(items.join(SEPARATOR), scene.width - padX, baseline);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), "image/jpeg", 0.9);
  });
}
