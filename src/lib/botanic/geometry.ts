/** Small geometry kit for the engraved botanicals: seeded randomness, transforms and smooth paths. */

export type Pt = [number, number];

/** Deterministic PRNG (mulberry32) so server and client draw the exact same bouquet. */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (lo: number, hi: number) => lo + (hi - lo) * next(),
    jitter: (amount: number) => (next() * 2 - 1) * amount,
  };
}
export type Rng = ReturnType<typeof rng>;

/** Affine transform as [a, b, c, d, e, f] (same layout as SVG matrix()). */
export type Mat = [number, number, number, number, number, number];
export const I: Mat = [1, 0, 0, 1, 0, 0];

export const mul = (m: Mat, n: Mat): Mat => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];
export const translate = (x: number, y: number): Mat => [1, 0, 0, 1, x, y];
export const rotate = (deg: number): Mat => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [c, s, -s, c, 0, 0];
};
export const scale = (x: number, y = x): Mat => [x, 0, 0, y, 0, 0];
/** Compose left to right: chain(A, B, C) applies C first, then B, then A. */
export const chain = (...ms: Mat[]) => ms.reduce((acc, m) => mul(acc, m), I);
export const apply = (m: Mat, [x, y]: Pt): Pt => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
export const applyAll = (m: Mat, pts: Pt[]) => pts.map((p) => apply(m, p));

const f = (n: number) => (Math.round(n * 10) / 10).toString();

/** Smooth curve through points (Catmull-Rom converted to cubic Béziers). */
export function smooth(pts: Pt[], closed = false, tension = 1): string {
  if (pts.length < 2) return "";
  const n = pts.length;
  const at = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const k = tension / 6;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? d + "Z" : d;
}

/** Points along a quadratic-ish bent line, for stems and stalks. */
export function bentLine(a: Pt, b: Pt, bend: number, steps = 8, r?: Rng, wobble = 0): Pt[] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const off = Math.sin(Math.PI * t) * bend + (r && i > 0 && i < steps ? r.jitter(wobble) : 0);
    out.push([a[0] + dx * t + nx * off, a[1] + dy * t + ny * off]);
  }
  return out;
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export const lerpPt = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
