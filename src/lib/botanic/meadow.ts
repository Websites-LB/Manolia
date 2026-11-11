/**
 * The footer: a flower bed seen from the side. Above the ground line a row of small plants and
 * grasses; below it plain earth with a few bulbs and stones. Drawn at the real pixel width of the
 * page, so nothing is stretched.
 */
import type { Piece } from "./bouquet";
import { lerp, rng, smooth, type Pt, type Rng } from "./geometry";
import { bud, gypsophila, head, leaf, LEAF, stem, tulip, type Stroke } from "./parts";

/** height of the plate, and how far down the ground line sits */
export const MEADOW = { h: 470, ground: 214 };
export const SOIL = "#2e2016";
const TINTS = ["#f0b9ae", "#e3909a", "#f5c78f", "#c9b5e6", "#f3eadb", "#e98b80", "#9fb6e0"];

function grass(x: number, r: Rng): Stroke[] {
  const out: Stroke[] = [];
  const n = 4 + Math.floor(r.next() * 5);
  for (let i = 0; i < n; i++) {
    const h = r.range(18, 62);
    const lean = r.jitter(22);
    const x0 = x + r.jitter(9);
    out.push({ d: smooth([[x0, MEADOW.ground + 2], [x0 + lean * 0.3, MEADOW.ground - h * 0.55], [x0 + lean, MEADOW.ground - h]]), w: r.range(1.1, 2), o: 0.9, ink: r.range(0.28, 0.6), hue: LEAF });
  }
  return out;
}

export function buildMeadow(width: number, seed = 23): Piece[] {
  const r = rng(seed);
  const G = MEADOW.ground;
  const pieces: Piece[] = [];
  const add = (id: string, strokes: Stroke[], tint = LEAF) => pieces.push({ id, strokes, tint, sway: 0 });

  // the ground itself: a low, uneven line of earth
  const surf: Pt[] = [];
  for (let x = -20; x <= width + 20; x += 34) surf.push([x, G + Math.sin(x * 0.011 + 1) * 5 + r.jitter(2.5)]);
  add("ground", [{ d: `${smooth(surf)}L${width + 20} ${G + 40}L-20 ${G + 40}Z`, w: 0, o: 0, fill: true, tone: 0.5, sh: 0 }], SOIL);

  // stones and specks through the soil
  const stones: Stroke[] = [];
  for (let i = 0; i < Math.round(width / 26); i++) {
    const x = r.range(8, width - 8);
    const y = r.range(G + 26, MEADOW.h - 8);
    const a = r.range(2, i % 5 ? 6 : 13);
    const b = a * r.range(0.55, 0.85);
    const rot = r.range(0, Math.PI);
    const ring: Pt[] = Array.from({ length: 9 }, (_, k) => {
      const t = (k / 9) * Math.PI * 2;
      const px = Math.cos(t) * a * (1 + r.jitter(0.12));
      const py = Math.sin(t) * b * (1 + r.jitter(0.12));
      return [x + px * Math.cos(rot) - py * Math.sin(rot), y + px * Math.sin(rot) + py * Math.cos(rot)] as Pt;
    });
    stones.push({ d: smooth(ring, true), w: 0.7, o: 0.45, ink: 0.75, fill: true, tone: r.range(0.16, 0.42) });
  }
  add("stones", stones, "#8d7a68");

  // plants along the bed
  let x = r.range(28, 70);
  let i = 0;
  const step = width < 768 ? [58, 96] : [78, 132];
  while (x < width - 24) {
    const tint = TINTS[Math.floor(r.next() * TINTS.length)];
    const pick = r.next();
    const h = r.range(86, 176);
    const top: Pt = [x + r.jitter(16), G - h];
    const id = `p${i++}`;
    if (pick < 0.24) {
      // a tulip, with the bulb it grows from
      const bulb: Pt[] = [
        [x, G - 2],
        [x + 13, G + 14],
        [x + 11, G + 30],
        [x, G + 36],
        [x - 11, G + 30],
        [x - 13, G + 14],
      ];
      add(`${id}-bulb`, [{ d: smooth(bulb, true), w: 1, o: 0.6, ink: 0.85, fill: true, paint: { kind: "linear", a: [x - 13, G], b: [x + 13, G + 30], stops: [[0, 0.62], [1, 0.22]] } }, { d: smooth([[x - 3, G + 4], [x - 5, G + 30]]), w: 0.7, o: 0.4, ink: 0.1 }], "#c79f6a");
      add(`${id}-stem`, [...stem([x, G], [top[0], top[1] + 30], r.jitter(8), false, r, 4.2), ...leaf([x - 2, G], h * 0.72, 13, -11, 0.1, r), ...leaf([x + 2, G], h * 0.6, 12, 14, -0.12, r)]);
      add(`${id}-head`, tulip([top[0], top[1] + 34], 44, r.jitter(5), r), tint);
    } else if (pick < 0.62) {
      const kind = pick < 0.36 ? "anemone" : pick < 0.5 ? "ranunculus" : "rose";
      add(`${id}-stem`, [...stem([x, G], top, r.jitter(12), false, r, 3.8), ...leaf([lerp(x, top[0], 0.3), G - h * 0.3], h * 0.36, 11, -58, 0.14, r), ...leaf([lerp(x, top[0], 0.5), G - h * 0.5], h * 0.32, 10, 56, -0.14, r)]);
      add(`${id}-head`, head({ kind, at: top, radius: r.range(21, 31), tilt: r.jitter(16), squash: 0.66 }, r), tint);
    } else if (pick < 0.76) {
      add(`${id}-stem`, [...stem([x, G], top, r.jitter(10), false, r, 3.4), ...leaf([lerp(x, top[0], 0.4), G - h * 0.4], h * 0.34, 10, 52, -0.12, r)]);
      add(`${id}-bud`, bud(top, r.range(26, 38), r.jitter(10), r), tint);
    } else if (pick < 0.9) {
      add(`${id}-spray`, [...stem([x, G], [top[0], top[1] + 30], r.jitter(8), false, r, 2.2), ...gypsophila([top[0], top[1] + 30], r.jitter(10), 30, r)]);
    }
    add(`${id}-grass`, [...grass(x - 22, r), ...grass(x + 30, r)]);
    x += r.range(step[0], step[1]);
  }
  return pieces;
}
