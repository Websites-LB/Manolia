/**
 * The Manolia bouquet: a hand-tied arrangement engraved stem by stem.
 * Pieces are listed in drawing order — back sprays, stems, leaves, flowers from back to front,
 * the gathered stems and finally the silk tie — so the bouquet assembles itself the way a florist builds one.
 */
import { rng, type Pt } from "./geometry";
import { bud, eucalyptus, gypsophila, head, leaf, ribbon, stem, type HeadSpec, type Stroke } from "./parts";

export type Wash = { cx: number; cy: number; rx: number; ry: number; color: string; rot?: number };

export type Piece = {
  id: string;
  /** colour the fills are tinted with */
  tint: string;
  strokes: Stroke[];
  wash?: Wash;
  /** how much this piece sways in the air, degrees */
  sway: number;
};

export const VIEW = { w: 1000, h: 1100 };
export const TIE: Pt = [500, 800];

const C = {
  blush: "#f0b9ae",
  peach: "#f2b48c",
  rose: "#e3909a",
  apricot: "#f5c78f",
  lilac: "#c9b5e6",
  sage: "#8fb08a",
  ribbon: "#f3d6cc",
};

export function buildBouquet(seed = 7): Piece[] {
  const r = rng(seed);
  const pieces: Piece[] = [];
  const add = (id: string, strokes: Stroke[], sway = 0.6, wash?: Wash, tint = C.sage) => pieces.push({ id, strokes, sway, wash, tint });

  // back: airy sprays that set the silhouette
  add("gyp-left", [...stem(TIE, [245, 420], 40, false, r), ...gypsophila([245, 420], -38, 70, r)], 1.4);
  add("gyp-right", [...stem(TIE, [770, 330], -36, false, r), ...gypsophila([770, 330], 34, 66, r)], 1.4);
  add("gyp-top", [...stem(TIE, [560, 190], -18, false, r), ...gypsophila([560, 190], 8, 62, r)], 1.2);
  add("euca-left", eucalyptus(TIE, [120, 560], 60, r), 1.1, { cx: 260, cy: 640, rx: 170, ry: 90, color: C.sage, rot: -25 });
  add("euca-right", eucalyptus(TIE, [890, 610], -60, r), 1.1, { cx: 740, cy: 670, rx: 170, ry: 80, color: C.sage, rot: 20 });

  // stems up to each bloom, drawn before the leaves and heads that hide their tops
  const heads: (HeadSpec & { id: string; color: string; bend: number })[] = [
    { id: "ranunculus", kind: "ranunculus", at: [640, 285], radius: 62, tilt: 12, squash: 0.72, color: C.apricot, bend: -14 },
    { id: "anemone", kind: "anemone", at: [345, 330], radius: 74, tilt: -14, squash: 0.66, color: C.lilac, bend: 18 },
    { id: "peony", kind: "peony", at: [505, 430], radius: 150, tilt: -6, squash: 0.56, color: C.blush, bend: 6 },
    { id: "rose-right", kind: "rose", at: [720, 505], radius: 98, tilt: 16, squash: 0.64, color: C.peach, bend: -12 },
    { id: "rose-left", kind: "rose", at: [300, 530], radius: 92, tilt: -18, squash: 0.66, color: C.rose, bend: 12 },
    { id: "rose-low", kind: "rose", at: [590, 655], radius: 64, tilt: 8, squash: 0.68, color: C.blush, bend: -4 },
  ];
  const buds: { id: string; at: Pt; size: number; angle: number }[] = [
    { id: "bud-top", at: [430, 205], size: 74, angle: -8 },
    { id: "bud-right", at: [830, 400], size: 56, angle: 26 },
    { id: "bud-left", at: [190, 405], size: 52, angle: -30 },
  ];
  add(
    "stems",
    [
      ...heads.flatMap((h) => stem(TIE, h.at, h.bend, h.radius > 90, r)),
      ...buds.flatMap((b) => stem(TIE, b.at, b.angle * -0.8, false, r)),
    ],
    0.3,
  );
  for (const b of buds) add(b.id, bud(b.at, b.size, b.angle, r), 1.2, { cx: b.at[0], cy: b.at[1] - b.size * 0.45, rx: b.size * 0.7, ry: b.size * 0.9, color: C.rose }, C.rose);

  // leaves gathered at the tie
  add(
    "leaves",
    [
      ...leaf([478, 712], 230, 46, -58, 0.18, r),
      ...leaf([522, 712], 220, 44, 60, -0.18, r),
      ...leaf([488, 752], 170, 36, -84, 0.2, r),
      ...leaf([512, 752], 180, 38, 86, -0.2, r),
      ...leaf([495, 690], 150, 32, -24, 0.1, r),
    ],
    0.5,
    { cx: 500, cy: 680, rx: 260, ry: 90, color: C.sage },
  );

  for (const h of heads) {
    add(h.id, head(h, r), h.radius > 120 ? 0.35 : 0.8, {
      cx: h.at[0],
      cy: h.at[1],
      rx: h.radius * 1.15,
      ry: h.radius * h.squash * 1.2,
      color: h.color,
      rot: h.tilt,
    }, h.color);
  }

  // gathered stems below the tie, each cut on the slant
  const below: Stroke[] = [];
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const x0 = 474 + t * 52;
    const x1 = 432 + t * 136 + r.jitter(6);
    const y1 = 1060 + r.jitter(22);
    below.push(...stem([x0, TIE[1] - 10], [x1, y1], r.jitter(5), false, r));
    below.push({ d: `M${x1 - 3.5} ${y1 + 3}L${x1 + 3.5} ${y1 - 3}`, w: 1.2, o: 0.8 });
  }
  add("gathered", below, 0);
  add("ribbon", ribbon(TIE, r), 0, undefined, C.ribbon);

  return pieces;
}
