/**
 * Paints botanical pieces onto a canvas the way light would: every petal and leaf first drops a soft
 * shadow on whatever lies under it, then takes its gradient colour, then the light of the scene
 * (from the upper left) and a thin translucent edge. No outlines: form comes from light and shadow.
 * Browser only (Path2D).
 */
import type { Piece } from "./bouquet";
import { HEAD_PHOTOS } from "../photos";
import { pigment } from "./color";
import type { Stroke } from "./parts";

type Box = [number, number, number, number];
export type Op = { path: Path2D; s: Stroke; hue: string; box: Box; size: number; light: Box; /** a photographed flower head, drawn instead of strokes */ photo?: { img: CanvasImageSource; at: [number, number]; w: number; h: number; tilt: number } };

const INK = "#efe6d2";

/* ───────── photographed flower heads ─────────
 * Each head is a cut-out photograph of a white flower (public/art/head-*.webp). Multiplying it by a
 * colour gives that flower in any palette with its real petals, shading and texture intact. */
const HEADS = HEAD_PHOTOS;
const loading = new Map<string, Promise<HTMLImageElement | null>>();
const loaded = new Map<string, HTMLImageElement | null>();
const tinted = new Map<string, HTMLCanvasElement>();

/** Load the photographs these pieces need. Resolves when they are ready (or have failed: then the painted flower stays). */
export function loadSprites(pieces: Piece[]): Promise<unknown> {
  const kinds = [...new Set(pieces.map((p) => p.sprite?.kind).filter((k): k is string => !!k && HEADS.includes(k)))];
  return Promise.all(
    kinds.map((k) => {
      if (!loading.has(k))
        loading.set(
          k,
          new Promise((resolve) => {
            const img = new Image();
            img.onload = () => (loaded.set(k, img), resolve(img));
            img.onerror = () => (loaded.set(k, null), resolve(null));
            img.src = `/art/head-${k}.webp`;
          }),
        );
      return loading.get(k)!;
    }),
  );
}

function tint(kind: string, img: HTMLImageElement, colour: string) {
  const key = `${kind}${colour}`;
  let c = tinted.get(key);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const x = c.getContext("2d")!;
  x.drawImage(img, 0, 0);
  x.globalCompositeOperation = "multiply";
  x.fillStyle = colour;
  x.fillRect(0, 0, c.width, c.height);
  // a little of the untinted photo back on top keeps the highlights from going flat
  x.globalCompositeOperation = "soft-light";
  x.globalAlpha = 0.35;
  x.drawImage(img, 0, 0);
  x.globalAlpha = 1;
  x.globalCompositeOperation = "destination-in";
  x.drawImage(img, 0, 0);
  tinted.set(key, c);
  return c;
}

function boxOf(d: string): Box {
  const n = d.match(/-?\d+(?:\.\d+)?/g);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  if (n)
    for (let i = 0; i + 1 < n.length; i += 2) {
      const x = +n[i];
      const y = +n[i + 1];
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  return [x0, y0, x1, y1];
}

/** Turn one piece into paint operations, in painting order. Done piece by piece, just before it is painted, so no frame carries the whole plate. */
export function compile(p: Piece): Op[] {
  const ops: Op[] = [];
  const photo = p.sprite && loaded.get(p.sprite.kind);
  if (p.sprite && photo) {
    const { at, radius, tilt: deg, kind } = p.sprite;
    // the photo is trimmed to the bloom, so its longer side is the bloom's diameter (a tulip is taller than wide)
    const d = radius * (kind === "tulip" ? 2.9 : 2.25);
    const k = d / Math.max(photo.naturalWidth, photo.naturalHeight);
    const w = photo.naturalWidth * k;
    const h = photo.naturalHeight * k;
    const box: Box = [at[0] - w / 2, at[1] - h / 2, at[0] + w / 2, at[1] + h / 2];
    return [{ path: new Path2D(), s: { d: "", w: 0, o: 0 }, hue: p.tint, box, size: d, light: box, photo: { img: tint(kind, photo, p.tint), at, w, h, tilt: kind === "tulip" ? deg * 0.4 : deg } }];
  }
  const light: Box = [Infinity, Infinity, -Infinity, -Infinity];
  for (const s of p.strokes) {
    const box = boxOf(s.d);
    if (s.fill) {
      light[0] = Math.min(light[0], box[0]);
      light[1] = Math.min(light[1], box[1]);
      light[2] = Math.max(light[2], box[2]);
      light[3] = Math.max(light[3], box[3]);
    }
    ops.push({ path: new Path2D(s.d), s, hue: s.hue ?? p.tint, box, size: Math.max(box[2] - box[0], box[3] - box[1]), light });
  }
  // a piece made of lines only still needs somewhere for its light to come from
  if (light[0] === Infinity) for (const op of ops) op.light = op.box;
  return ops;
}

const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/**
 * Paint one operation. `ctx` is already scaled so that one unit is one viewBox unit;
 * `px` is how many device pixels that unit covers (shadows are set in device pixels).
 */
export function paint(ctx: CanvasRenderingContext2D, op: Op, px: number, thin: boolean) {
  const { s, path, hue, box } = op;

  if (op.photo) {
    const { img, at, w, h, tilt: deg } = op.photo;
    ctx.save();
    ctx.shadowColor = "rgba(4,8,6,0.6)";
    ctx.shadowBlur = op.size * 0.09 * px;
    ctx.shadowOffsetX = op.size * 0.02 * px;
    ctx.shadowOffsetY = op.size * 0.05 * px;
    ctx.translate(at[0], at[1]);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
    return;
  }

  if (!s.fill) {
    // veins, hairs, fine branches
    if (thin && s.w <= 0.8 && s.o <= 0.6) return;
    ctx.strokeStyle = alpha(s.ink == null ? INK : pigment(hue, s.ink), s.o);
    ctx.lineWidth = s.w;
    ctx.stroke(path);
    return;
  }

  const flat = pigment(hue, s.paint ? 0.4 : (s.tone ?? 0.5));
  const a = s.a ?? 1;
  const cast = (s.sh ?? 1) * a;

  // 1. the shape and the shadow it casts on what is under it
  ctx.save();
  ctx.globalAlpha = a;
  if (cast > 0) {
    const blur = Math.max(1.2, Math.min(11, op.size * 0.075));
    ctx.shadowColor = `rgba(5,9,7,${0.5 * cast})`;
    ctx.shadowBlur = blur * px;
    ctx.shadowOffsetX = blur * 0.22 * px;
    ctx.shadowOffsetY = blur * 0.5 * px;
  }
  ctx.fillStyle = flat;
  ctx.fill(path);
  ctx.restore();

  // 2. inside the shape: its gradient, the light of the scene, a translucent edge
  ctx.save();
  ctx.globalAlpha = a;
  ctx.clip(path);
  const g = s.paint;
  if (g) {
    if (g.kind === "radial") {
      ctx.save();
      ctx.transform(...g.m);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, g.r);
      for (const [o, t] of g.stops) grad.addColorStop(o, pigment(hue, t));
      ctx.fillStyle = grad;
      ctx.fillRect(-g.r * 2.4, -g.r * 2.4, g.r * 4.8, g.r * 4.8);
      ctx.restore();
    } else {
      const grad = ctx.createLinearGradient(g.a[0], g.a[1], g.b[0], g.b[1]);
      for (const [o, t] of g.stops) grad.addColorStop(o, pigment(hue, t));
      ctx.fillStyle = grad;
      ctx.fillRect(box[0] - 2, box[1] - 2, box[2] - box[0] + 4, box[3] - box[1] + 4);
    }
  }
  if (cast > 0) {
    const L = op.light;
    const light = ctx.createLinearGradient(L[0], L[1], L[2], L[3]);
    light.addColorStop(0, "rgba(255,246,228,0.62)");
    light.addColorStop(0.5, "rgba(128,128,128,0)");
    light.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = light;
    ctx.fillRect(box[0] - 2, box[1] - 2, box[2] - box[0] + 4, box[3] - box[1] + 4);
    ctx.globalCompositeOperation = "source-over";
    // only the inner half of this line survives the clip: light caught in the edge of the petal
    if (s.w > 0) {
      ctx.strokeStyle = alpha(pigment(hue, s.ink ?? 0.9), s.o * 0.55);
      ctx.lineWidth = s.w * 1.5;
      ctx.stroke(path);
    }
  }
  ctx.restore();
}
