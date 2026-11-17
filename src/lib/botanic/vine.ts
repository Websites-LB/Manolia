/**
 * The vine that runs down the home page. A green stem leaves the hero bouquet's cut stems and climbs
 * down through every chapter: it sweeps across the empty space between them, unfurls a leaf every
 * hand-span, curls the odd tendril, and opens a flower at the start of each chapter.
 * Everything is in page pixels; the component grows it with your scroll.
 */
import { lerp, rng, smooth, type Pt } from "./geometry";

export type Way = { at: Pt; /** a flower opens here, in this colour */ bloom?: string };

export type VineSeg = { d: string; lit: string; w: number; y0: number; y1: number };
export type VineLeaf = { x: number; y: number; angle: number; size: number; tone: number };
export type VineCurl = { d: string; y0: number; y1: number };
export type VineBloom = { x: number; y: number; r: number; tint: string };
export type Vine = { segs: VineSeg[]; leaves: VineLeaf[]; curls: VineCurl[]; blooms: VineBloom[] };

const f = (n: number) => (Math.round(n * 10) / 10).toString();
const line = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${f(p[0])} ${f(p[1])}`).join("");

/** Catmull-Rom through the control points, sampled densely, so the stem can be cut anywhere. */
function sample(ctrl: Pt[], per = 10): Pt[] {
  const at = (i: number) => ctrl[Math.max(0, Math.min(ctrl.length - 1, i))];
  const out: Pt[] = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  // the stem only ever grows downward, so a page position always maps to one point on it
  for (let i = 1; i < out.length; i++) if (out[i][1] < out[i - 1][1]) out[i] = [out[i][0], out[i - 1][1]];
  return out;
}

export function buildVine(way: Way[], width: number, narrow: boolean, seed = 5): Vine {
  const r = rng(seed);
  // control points: each run between two waypoints wanders a little, eased in and out of both ends
  const ctrl: Pt[] = [];
  for (let i = 0; i < way.length - 1; i++) {
    const a = way[i].at;
    const b = way[i + 1].at;
    const span = Math.max(1, b[1] - a[1]);
    const n = Math.max(2, Math.round(span / (narrow ? 90 : 130)));
    const amp = (narrow ? Math.min(8, span * 0.05) : Math.min(width * 0.025, 34, span * 0.08)) * (i % 2 ? 1 : -1);
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const e = t * t * (3 - 2 * t);
      ctrl.push([lerp(a[0], b[0], e) + Math.sin(Math.PI * t * 2) * amp * (k ? 1 : 0), a[1] + span * t]);
    }
  }
  ctrl.push(way[way.length - 1].at);
  const pts = sample(ctrl);

  // cumulative length, for evenly spaced leaves
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = len[len.length - 1];

  // the stem, cut into short pieces so only the one at the growing tip repaints while you scroll
  const w0 = narrow ? 3.4 : 5.2;
  const w1 = narrow ? 1.8 : 2.6;
  const segs: VineSeg[] = [];
  const SEG = 28;
  for (let i = 0; i < pts.length - 1; i += SEG) {
    const piece = pts.slice(i, Math.min(pts.length, i + SEG + 1));
    const w = lerp(w0, w1, Math.pow(len[i] / total, 0.6));
    // the lit side: a thin line of light along the upper-left edge of the stem
    const lit = piece.map(([x, y]) => [x - w * 0.22, y - w * 0.12] as Pt);
    segs.push({ d: line(piece), lit: line(lit), w, y0: piece[0][1], y1: piece[piece.length - 1][1] });
  }

  const blooms: VineBloom[] = way.filter((w) => w.bloom).map((w, i) => ({ x: w.at[0], y: w.at[1], r: (narrow ? 11 : 17) * (i === 0 ? 1.15 : 1), tint: w.bloom! }));
  const nearBloom = (p: Pt) => blooms.some((b) => Math.hypot(b.x - p[0], b.y - p[1]) < b.r * 3);

  const leaves: VineLeaf[] = [];
  const curls: VineCurl[] = [];
  const gap = narrow ? 64 : 92;
  let side = 1;
  let n = 0;
  for (let s = gap * 0.8; s < total - 30; s += gap * r.range(0.75, 1.2)) {
    let i = len.findIndex((l) => l >= s);
    if (i < 1) continue;
    i = Math.min(i, pts.length - 2);
    const p = pts[i];
    if (nearBloom(p)) continue;
    const q = pts[i + 1];
    const o = pts[i - 1];
    const tangent = (Math.atan2(q[1] - o[1], q[0] - o[0]) * 180) / Math.PI;
    const big = 1 - (s / total) * 0.35;
    leaves.push({ x: p[0], y: p[1], angle: tangent + side * r.range(48, 72), size: (narrow ? r.range(10, 15) : r.range(17, 27)) * big, tone: r.next() });
    // every few leaves a tendril curls off the other side
    if (++n % 4 === 0 && !narrow) {
      const curl: Pt[] = [];
      const dir = -side;
      let a = ((tangent + dir * 70) * Math.PI) / 180;
      let rad = r.range(16, 24);
      let c = p;
      for (let k = 0; k < 16; k++) {
        c = [c[0] + Math.cos(a) * rad * 0.42, c[1] + Math.sin(a) * rad * 0.42];
        curl.push(c);
        a += dir * 0.52;
        rad *= 0.86;
      }
      const ys = curl.map((v) => v[1]);
      curls.push({ d: smooth([p, ...curl]), y0: Math.min(p[1], ...ys), y1: Math.max(...ys) + 20 });
    }
    side = -side;
  }

  return { segs, leaves, curls, blooms };
}
