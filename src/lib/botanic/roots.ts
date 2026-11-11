/**
 * The root system that runs down the page. A taproot threads through every anchor (the base of each
 * flower) with a lazy meander, thick where it leaves the bouquet and thinner the deeper it goes.
 * Side roots leave it sideways, turn down the way real roots follow gravity, taper to a thread and
 * carry fine root hairs. Everything is in page pixels.
 */
import { lerp, rng, smooth, type Pt, type Rng } from "./geometry";

export type RootPath = { d: string; w: number; o: number; /** page y where it starts growing */ y0: number; /** page y where it is fully grown */ y1: number };

export type RootSystem = {
  /**
   * The taproot cut into short consecutive pieces. Only the piece at the growing tip changes while
   * you scroll, so the browser repaints a small area instead of a path as tall as the page.
   * `lit` is the highlight that runs along its lit side.
   */
  main: { d: string; lit: string; w: number; y0: number; y1: number }[];
  lateral: RootPath[];
};

export type Crown = { at: Pt; /** half-width of the stems the roots hang from */ spread?: number };

/** One side root: thick where it leaves, a thread at the tip, forking as it goes. */
export function rootlet(out: RootPath[], start: Pt, dir: number, len: number, depth: number, r: Rng, girth = 1) {
  const pts: Pt[] = [start];
  let a = Math.PI / 2 - dir * r.range(0.7, 1.25); // outward first
  let p = start;
  const steps = Math.max(5, Math.round(len / 16));
  for (let i = 0; i < steps; i++) {
    // gravitropism: the tip keeps turning back toward straight down, with the odd kink round a stone
    a = lerp(a, Math.PI / 2, 0.14) + r.jitter(0.24) + (r.next() > 0.9 ? r.jitter(0.5) : 0);
    const step = len / steps;
    p = [p[0] + Math.cos(a) * step, p[1] + Math.sin(a) * step];
    pts.push(p);
  }
  // drawn as three overlapping lengths of falling thickness, so it tapers and still grows tip-first
  const base = [1.1, 2.4, 4.2][depth] * girth;
  const third = Math.max(2, Math.ceil(pts.length / 3));
  [1, 0.55, 0.26].forEach((k, j) => {
    const piece = pts.slice(Math.max(0, j * third - 1), Math.min(pts.length, (j + 1) * third + 1));
    if (piece.length < 2) return;
    const ys = piece.map((q) => q[1]);
    out.push({ d: smooth(piece), w: Math.max(0.55, base * k), o: lerp(0.9, 0.6, j / 2), y0: Math.min(...ys), y1: Math.max(...ys) });
  });
  // root hairs, densest toward the young tip
  for (let i = 1; i < pts.length; i++) {
    if (r.next() > lerp(0.25, 0.7, i / pts.length)) continue;
    const q = pts[i];
    const side = r.next() > 0.5 ? 1 : -1;
    const h = r.range(4, 11);
    const ang = Math.PI / 2 + side * r.range(0.7, 1.4);
    out.push({ d: smooth([q, [q[0] + Math.cos(ang) * h * 0.6, q[1] + Math.sin(ang) * h * 0.5 + 1], [q[0] + Math.cos(ang) * h, q[1] + Math.sin(ang) * h + 3]]), w: 0.5, o: 0.45, y0: q[1], y1: q[1] + 12 });
  }
  if (depth > 0) {
    const forks = 1 + (r.next() > 0.45 ? 1 : 0);
    for (let k = 0; k < forks; k++) {
      const at = pts[Math.floor(r.range(0.25, 0.8) * (pts.length - 1))];
      rootlet(out, at, r.next() > 0.5 ? dir : -dir, len * r.range(0.4, 0.62), depth - 1, r, girth);
    }
  }
}

export function buildRoots(anchors: Pt[], width: number, opts: { crowns?: Crown[]; narrow?: boolean; seed?: number } = {}): RootSystem {
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
    const phase = r.range(0, 6);
    for (let k = 0; k < n; k++) {
      const t = k / n;
      // ease in/out of each anchor so the root arrives under the stem, and swing wide between
      const x = lerp(a[0], b[0], t * t * (3 - 2 * t)) + Math.sin(Math.PI * t) * (amp + Math.sin(k * 1.7 + phase) * 7) + r.jitter(5);
      pts.push([x, a[1] + span * t]);
    }
  }
  pts.push(anchors[anchors.length - 1]);

  const w0 = narrow ? 7 : 11;
  const w1 = narrow ? 2.6 : 3.6;
  const lit = pts.map(([x, y], i) => [x - lerp(w0, w1, i / pts.length) * 0.22, y] as Pt);
  const main: RootSystem["main"] = [];
  const SEG = 6;
  for (let i = 0; i < pts.length - 1; i += SEG) {
    // overlap by one point (and lean on the neighbours for tangents) so the joins stay smooth
    const a = Math.max(0, i - 1);
    const b = Math.min(pts.length, i + SEG + 2);
    const piece = pts.slice(i, Math.min(pts.length, i + SEG + 1));
    const ys = piece.map((q) => q[1]);
    main.push({
      d: smoothPiece(pts.slice(a, b), i - a, piece.length),
      lit: smoothPiece(lit.slice(a, b), i - a, piece.length),
      w: lerp(w0, w1, Math.pow(i / pts.length, 0.7)),
      y0: Math.min(...ys),
      y1: Math.max(...ys),
    });
  }
  const lateral: RootPath[] = [];
  pts.forEach((p, i) => {
    if (i < 3 || i > pts.length - 3 || i % 3) return;
    const girth = lerp(1, 0.6, i / pts.length);
    // on a phone the root hugs the right edge, so its side roots stay short and lean inward
    if (narrow) rootlet(lateral, p, i % 9 ? 1 : -1, r.range(30, 70), 1, r, girth);
    else rootlet(lateral, p, i % 6 ? 1 : -1, r.range(70, Math.min(230, width * 0.2)), 2, r, girth);
  });
  // a crown of feeder roots fanning out under every plant
  crowns.forEach(({ at, spread = 6 }) => {
    const n = narrow ? 3 : spread > 20 ? 7 : 5;
    for (let k = 0; k < n; k++) {
      const u = (k / (n - 1)) * 2 - 1;
      rootlet(lateral, [at[0] + u * spread + r.jitter(3), at[1] + 2], u === 0 ? (k % 2 ? 1 : -1) : Math.sign(u), r.range(40, narrow ? 70 : 140), 1, r, 0.9);
    }
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
