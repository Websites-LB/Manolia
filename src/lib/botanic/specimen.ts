/**
 * Single specimens (one plant growing up from a root) and small arrangements (posy, hat box, vase)
 * in the same engraved, hand-coloured hand as the hero bouquet.
 */
import { lerp, rng, smooth as smoothPath, type Pt, type Rng } from "./geometry";
import type { Piece } from "./bouquet";
import { bud, eucalyptus, gypsophila, head, hydrangea, leaf, ribbon, stem, tulip, type HeadKind, type Stroke } from "./parts";

export type Kind = HeadKind | "hydrangea" | "tulip" | "gypsophila" | "eucalyptus";

export const SPECIMEN_VIEW = { w: 400, h: 640 };
const SAGE = "#8fb08a";

export const bloom = (kind: Kind, at: Pt, radius: number, tilt: number, r: Rng): Stroke[] => {
  switch (kind) {
    case "hydrangea":
      return hydrangea(at, radius, r);
    case "tulip":
      return tulip([at[0], at[1] + radius * 0.9], radius * 1.6, tilt * 0.4, r);
    case "gypsophila":
    case "eucalyptus":
      return [];
    default:
      return head({ kind, at, radius, tilt, squash: kind === "anemone" ? 0.7 : 0.62 }, r);
  }
};

/** One plant rising from the bottom centre of a 400×640 plate: stem, leaves, the bloom on top. */
export function buildSpecimen(kind: Kind, tint: string, seed = 1): Piece[] {
  const r = rng(seed);
  const base: Pt = [200, 640];
  const pieces: Piece[] = [];
  const add = (id: string, strokes: Stroke[], t = SAGE) => pieces.push({ id, strokes, tint: t, sway: 0 });

  if (kind === "gypsophila") {
    add("stems", [...stem(base, [150, 260], 26, false, r, 2.6), ...stem(base, [250, 230], -24, false, r, 2.6), ...stem(base, [205, 210], -6, false, r, 2.6)]);
    add("spray-a", gypsophila([150, 260], -30, 64, r), tint);
    add("spray-b", gypsophila([250, 230], 28, 60, r), tint);
    add("spray-c", gypsophila([205, 210], 4, 64, r), tint);
    add("leaves", [...leaf([200, 520], 90, 12, -50, 0.1, r), ...leaf([200, 470], 80, 11, 48, -0.1, r)]);
    return pieces;
  }
  if (kind === "eucalyptus") {
    add("branch-a", eucalyptus(base, [150, 90], 50, r));
    add("branch-b", eucalyptus([200, 600], [300, 220], -40, r));
    return pieces;
  }

  const top: Pt = [200 + r.jitter(14), kind === "tulip" ? 230 : 220];
  const radius = kind === "peony" ? 118 : kind === "hydrangea" ? 112 : kind === "tulip" ? 70 : kind === "anemone" ? 92 : 96;
  add("stem", stem(base, top, r.jitter(18), kind !== "anemone", r));
  const leaves: Stroke[] = [];
  if (kind === "tulip") {
    leaves.push(...leaf([196, 610], 300, 34, -12, 0.12, r), ...leaf([204, 600], 250, 30, 16, -0.14, r));
  } else {
    leaves.push(...leaf([200, 470], 150, 32, -62, 0.16, r), ...leaf([202, 400], 140, 30, 60, -0.16, r), ...leaf([200, 540], 120, 26, 70, -0.12, r));
  }
  add("leaves", leaves);
  if (kind === "peony" || kind === "rose") add("bud", [...stem([200, 430], [300, 300], -10, false, r), ...bud([300, 300], 46, 24, r)], tint);
  add("bloom", bloom(kind, top, radius, r.jitter(10), r), tint);
  return pieces;
}

/** A round hat box seen slightly from above; whatever is drawn after it sits in its rim. */
export function hatBox(cx: number, rimY: number, rx: number, ry: number): Stroke[] {
  const ell: Pt[] = Array.from({ length: 24 }, (_, i) => [cx + Math.cos((i / 24) * Math.PI * 2) * rx, rimY + Math.sin((i / 24) * Math.PI * 2) * ry] as Pt);
  const body: Pt[] = [
    [cx - rx, rimY],
    [cx - rx + 4, rimY + 120],
    [cx - rx * 0.7, rimY + 166],
    [cx, rimY + 178],
    [cx + rx * 0.7, rimY + 166],
    [cx + rx - 4, rimY + 120],
    [cx + rx, rimY],
  ];
  const box: Stroke[] = [
    { d: smoothPath(body, true), w: 1.2, o: 0.7, ink: 0.9, fill: true, paint: { kind: "linear", a: [cx - rx, 0], b: [cx + rx, 0], stops: [[0, 0.3], [0.32, 0.58], [1, 0.16]] } },
  ];
  for (let i = 0; i < 26; i++) {
    const x = lerp(cx - rx + 14, cx + rx - 14, i / 25);
    const sag = Math.sqrt(1 - Math.pow((x - cx) / rx, 2)) * ry;
    box.push({ d: smoothPath([[x, rimY + sag + 6], [x, rimY + sag + 110 + (1 - Math.abs(x - cx) / rx) * 40]]), w: 0.7, o: 0.3, ink: 0.1 });
  }
  box.push({ d: smoothPath(ell, true), w: 1.2, o: 0.7, ink: 0.9, fill: true, tone: 0.08 });
  return box;
}

/** A plain glass vase, drawn as its outline and the lights on it so the stems show through. */
export function glassVase(): Stroke[] {
  const vase: Pt[] = [
    [240, 470],
    [214, 560],
    [222, 680],
    [300, 712],
    [378, 680],
    [386, 560],
    [360, 470],
  ];
  return [
    { d: smoothPath(vase, false), w: 1.7, o: 0.95 },
    { d: smoothPath([[226, 560], [232, 660], [270, 690]]), w: 0.9, o: 0.45 },
    { d: smoothPath([[230, 600], [370, 600]]), w: 0.8, o: 0.35 },
    { d: smoothPath([[244, 470], [356, 470]]), w: 1.4, o: 0.8 },
    { d: smoothPath([[364, 500], [374, 570], [370, 650]]), w: 2.4, o: 0.25 },
  ];
}

export type Style = "posy" | "box" | "vase";
export const PLATE_VIEW = { w: 600, h: 750 };

/** A small arrangement for a shop plate: a hand-tied posy, a hat box packed with heads, or a glass vase. */
export function buildArrangement(kind: Kind, style: Style, tint: string, seed = 1, boxTint = "#d8c4a6"): Piece[] {
  const r = rng(seed);
  const pieces: Piece[] = [];
  const add = (id: string, strokes: Stroke[], t = SAGE) => pieces.push({ id, strokes, tint: t, sway: 0 });
  const radius = kind === "hydrangea" ? 96 : kind === "peony" ? 92 : 82;

  if (style === "box") {
    const cx = 300;
    const rimY = 430;
    add("box", hatBox(cx, rimY, 200, 56), boxTint);
    const heads: Pt[] = [];
    const big = radius * 1.18;
    for (let row = 0; row < 2; row++) {
      const n = row === 0 ? 2 : 3;
      for (let i = 0; i < n; i++) heads.push([cx + (i - (n - 1) / 2) * big * 1.25 + r.jitter(8), rimY - 6 - (1 - row) * big * 0.55]);
    }
    heads.sort((a, b) => a[1] - b[1]);
    heads.forEach((h, i) => add(`h${i}`, bloom(kind, h, big, r.jitter(12), r), tint));
    return pieces;
  }

  if (style === "vase") {
    const stems: Stroke[] = [];
    const tops: Pt[] = [
      [210, 250],
      [330, 220],
      [270, 330],
      [390, 330],
    ];
    for (const t of tops) stems.push(...stem([300 + r.jitter(20), 690], t, r.jitter(20), false, r));
    add("stems", stems);
    add("leaves", [...leaf([280, 470], 150, 30, -58, 0.16, r), ...leaf([320, 470], 140, 28, 60, -0.16, r)]);
    tops.sort((a, b) => a[1] - b[1]).forEach((t, i) => add(`h${i}`, bloom(kind, t, radius * (i === 0 ? 0.95 : 0.85), r.jitter(14), r), tint));
    add("vase", glassVase(), "#c9d8d4");
    return pieces;
  }

  // posy
  const tie: Pt = [300, 560];
  const tops: Pt[] = [
    [300, 250],
    [190, 330],
    [410, 320],
    [250, 410],
    [360, 420],
  ];
  const stems: Stroke[] = [];
  for (const t of tops) stems.push(...stem(tie, t, r.jitter(16), false, r));
  add("stems", stems);
  add("euca", [...eucalyptus(tie, [110, 450], 40, r), ...eucalyptus(tie, [490, 470], -40, r)]);
  add("leaves", [...leaf([290, 520], 150, 30, -60, 0.16, r), ...leaf([310, 520], 150, 30, 62, -0.16, r)]);
  tops.sort((a, b) => a[1] - b[1]).forEach((t, i) => add(`h${i}`, bloom(kind, t, radius * (i === 0 ? 1 : 0.86), r.jitter(16), r), tint));
  const below: Stroke[] = [];
  for (let i = 0; i < 7; i++) {
    const x0 = 286 + i * 4.5;
    below.push(...stem([x0, 552], [262 + i * 8 + r.jitter(4), 730], r.jitter(4), false, r));
  }
  add("gathered", below);
  add("ribbon", ribbon(tie, r), "#f3d6cc");
  return pieces;
}

