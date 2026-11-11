/**
 * The root system that runs down the page. A main root threads through every anchor (the base of
 * each flower) with a lazy meander, and fibrous side roots with fine root hairs branch off it,
 * bending downward the way real roots follow gravity. Everything is in page pixels.
 */
import { lerp, rng, smooth, type Pt, type Rng } from "./geometry";

export type RootPath = { d: string; w: number; o: number; /** page y where it starts growing */ y0: number; /** page y where it is fully grown */ y1: number };

export type RootSystem = {
  /**
   * The main root cut into short consecutive pieces. Only the piece at the growing tip changes while
   * you scroll, so the browser repaints a small area instead of a path as tall as the page.
   */
  main: { d: string; echo: string; y0: number; y1: number }[];
  lateral: RootPath[];
};

function rootlet(out: RootPath[], start: Pt, dir: number, len: number, depth: number, r: Rng) {
  const pts: Pt[] = [start];
  let a = Math.PI / 2 - dir * r.range(0.6, 1.1); // outward and down
  let p = start;
  const steps = Math.max(4, Math.round(len / 18));
  for (let i = 0; i < steps; i++) {
    // gravitropism: the tip keeps turning back toward straight down
    a = lerp(a, Math.PI / 2, 0.12) + r.jitter(0.22);
    const step = len / steps;
    p = [p[0] + Math.cos(a) * step, p[1] + Math.sin(a) * step];
    pts.push(p);
  }
  const ys = pts.map((q) => q[1]);
  out.push({ d: smooth(pts), w: lerp(0.55, 1.3, depth / 2), o: lerp(0.45, 0.8, depth / 2), y0: start[1], y1: Math.max(...ys) });
  // root hairs
  for (let i = 1; i < pts.length - 1; i += 1) {
    if (r.next() > 0.55) continue;
    const q = pts[i];
    const side = r.next() > 0.5 ? 1 : -1;
    const h = r.range(5, 12);
    const ang = a + side * r.range(0.9, 1.5);
    out.push({ d: smooth([q, [q[0] + Math.cos(ang) * h, q[1] + Math.sin(ang) * h]]), w: 0.5, o: 0.4, y0: q[1], y1: q[1] + 10 });
  }
  if (depth > 0) {
    const forks = 1 + (r.next() > 0.5 ? 1 : 0);
    for (let k = 0; k < forks; k++) {
      const at = pts[Math.floor(r.range(0.3, 0.8) * (pts.length - 1))];
      rootlet(out, at, r.next() > 0.5 ? dir : -dir, len * r.range(0.4, 0.6), depth - 1, r);
    }
  }
}

export function buildRoots(anchors: Pt[], width: number, opts: { crowns?: Pt[]; narrow?: boolean; seed?: number } = {}): RootSystem {
  const { crowns = [], narrow = false, seed = 11 } = opts;
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    const span = b[1] - a[1];
    const n = Math.max(3, Math.round(span / 46));
    // long vertical runs wander; short crossings stay taut
    const amp = Math.min(width * 0.05, 60, span * 0.12) * (i % 2 ? 1 : -1);
    for (let k = 0; k < n; k++) {
      const t = k / n;
      // ease in/out of each anchor so the root arrives under the stem, and swing wide between
      const x = lerp(a[0], b[0], t * t * (3 - 2 * t)) + Math.sin(Math.PI * t) * amp + r.jitter(6);
      pts.push([x, a[1] + span * t]);
    }
  }
  pts.push(anchors[anchors.length - 1]);

  const echo = pts.map(([x, y], i) => [x + 3 + Math.sin(i * 0.7) * 1.2, y + 1] as Pt);
  const main: RootSystem["main"] = [];
  const SEG = 6;
  for (let i = 0; i < pts.length - 1; i += SEG) {
    // overlap by one point (and lean on the neighbours for tangents) so the joins stay smooth
    const a = Math.max(0, i - 1);
    const b = Math.min(pts.length, i + SEG + 2);
    const piece = pts.slice(i, Math.min(pts.length, i + SEG + 1));
    const ctx = pts.slice(a, b);
    main.push({
      d: smoothPiece(ctx, i - a, piece.length),
      echo: smoothPiece(echo.slice(a, b), i - a, piece.length),
      y0: piece[0][1],
      y1: piece[piece.length - 1][1],
    });
  }
  const lateral: RootPath[] = [];
  pts.forEach((p, i) => {
    if (i < 2 || i > pts.length - 3 || i % 3) return;
    // on a phone the root hugs the right edge, so its side roots stay short and lean outward
    if (narrow) rootlet(lateral, p, i % 9 ? 1 : -1, r.range(30, 70), 1, r);
    else rootlet(lateral, p, i % 6 ? 1 : -1, r.range(70, Math.min(220, width * 0.2)), 2, r);
  });
  // a crown of feeder roots fanning out under every flower
  crowns.forEach((a) => {
    for (let k = 0; k < (narrow ? 3 : 5); k++) rootlet(lateral, [a[0] + r.jitter(6), a[1] + 4], k % 2 ? 1 : -1, r.range(40, narrow ? 70 : 130), 1, r);
  });
  return { main, lateral };
}

/** Catmull-Rom through `ctx`, emitting only the `count` points starting at `from` (neighbours shape the tangents). */
function smoothPiece(ctx: Pt[], from: number, count: number): string {
  const f = (n: number) => (Math.round(n * 10) / 10).toString();
  const at = (i: number) => ctx[Math.max(0, Math.min(ctx.length - 1, i))];
  let d = `M${f(ctx[from][0])} ${f(ctx[from][1])}`;
  for (let i = from; i < from + count - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}
