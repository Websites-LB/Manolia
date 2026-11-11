/**
 * Engraved botanical parts. Every part is drawn the way a copper-plate botanical is: a fine outline,
 * shading by short hatch lines that run from the base of a petal or leaf, and a fill of the ground
 * colour so nearer petals hide the lines behind them.
 */
import { applyAll, bentLine, chain, lerp, rotate, scale, smooth, translate, type Mat, type Pt, type Rng } from "./geometry";

export type Stroke = {
  d: string;
  /** stroke width in viewBox units */
  w: number;
  /** stroke opacity */
  o: number;
  /** filled with the ground colour, so it hides what is behind it */
  fill?: boolean;
  /** 0–1: how much of the piece's tint colours the fill (hand-coloured print) */
  tone?: number;
};

const OUT = 1.7;
const HATCH = 0.75;

/* ─────────────────────────── petals ─────────────────────────── */

type PetalSpec = {
  len: number;
  /** half-angle of the petal fan, radians */
  spread: number;
  /** roundness: lower = broader, squarer tip */
  k: number;
  /** edge frills */
  ruffle: number;
  freq: number;
  hatch: number;
  /** draw a rolled lip line under the edge (roses) */
  lip?: boolean;
};

function petalOutline(s: PetalSpec, r: Rng): Pt[] {
  const pts: Pt[] = [];
  const phase = r.range(0, Math.PI * 2);
  const n = 22;
  for (let i = 1; i < n; i++) {
    const th = lerp(-s.spread, s.spread, i / n);
    const u = th / s.spread;
    const base = Math.pow(Math.cos((u * Math.PI) / 2), s.k);
    const fr = 1 + s.ruffle * Math.sin(th * s.freq + phase) * base + r.jitter(0.025);
    const rr = s.len * base * fr;
    pts.push([rr * Math.sin(th), -rr * Math.cos(th)]);
  }
  pts.push([0, 0]);
  return pts;
}

function petalHatch(s: PetalSpec, r: Rng): Pt[][] {
  const lines: Pt[][] = [];
  for (let j = 0; j < s.hatch; j++) {
    // denser toward the shaded (right) side
    const u = Math.pow(r.next(), 0.75) * 1.7 - 0.85;
    const th = u * s.spread;
    const reach = s.len * Math.pow(Math.cos((u * Math.PI) / 2), s.k);
    const r0 = s.len * r.range(0.06, 0.16);
    const r1 = reach * r.range(0.32, 0.72);
    const bow = r.jitter(0.06);
    const pts: Pt[] = [0, 0.5, 1].map((t) => {
      const rr = lerp(r0, r1, t);
      const a = th + bow * Math.sin(Math.PI * t);
      return [rr * Math.sin(a), -rr * Math.cos(a)] as Pt;
    });
    lines.push(pts);
  }
  return lines;
}

function petal(m: Mat, s: PetalSpec, r: Rng, tone: number): Stroke[] {
  const out: Stroke[] = [{ d: smooth(applyAll(m, petalOutline(s, r)), true), w: OUT, o: 0.95, fill: true, tone }];
  for (const h of petalHatch(s, r)) out.push({ d: smooth(applyAll(m, h)), w: HATCH, o: 0.62 });
  if (s.lip) {
    const lip: Pt[] = [];
    for (let i = 0; i <= 8; i++) {
      const th = lerp(-s.spread * 0.55, s.spread * 0.55, i / 8);
      const rr = s.len * 0.86 * Math.pow(Math.cos((th / s.spread) * (Math.PI / 2)), s.k);
      lip.push([rr * Math.sin(th), -rr * Math.cos(th)]);
    }
    out.push({ d: smooth(applyAll(m, lip)), w: OUT * 0.8, o: 0.85 });
  }
  return out;
}

/* ─────────────────────────── flower heads ─────────────────────────── */

export type HeadKind = "peony" | "rose" | "ranunculus" | "anemone";

export type HeadSpec = {
  kind: HeadKind;
  at: Pt;
  radius: number;
  /** degrees: which way the face turns */
  tilt: number;
  /** 1 = seen from above, 0.5 = seen from the side */
  squash: number;
};

type Layer = { count: number; len: number; spread: number; k: number; ruffle: number; freq: number; hatch: number; base: number; lip?: boolean };

const LAYERS: Record<HeadKind, Layer[]> = {
  peony: [
    { count: 6, len: 1, spread: 0.72, k: 0.28, ruffle: 0.05, freq: 7, hatch: 12, base: 0.08 },
    { count: 7, len: 0.86, spread: 0.66, k: 0.3, ruffle: 0.07, freq: 9, hatch: 10, base: 0.08 },
    { count: 8, len: 0.7, spread: 0.6, k: 0.32, ruffle: 0.1, freq: 11, hatch: 7, base: 0.06 },
    { count: 10, len: 0.54, spread: 0.52, k: 0.38, ruffle: 0.13, freq: 13, hatch: 5, base: 0.05 },
    { count: 11, len: 0.4, spread: 0.46, k: 0.42, ruffle: 0.16, freq: 15, hatch: 3, base: 0.04 },
    { count: 9, len: 0.27, spread: 0.5, k: 0.48, ruffle: 0.2, freq: 17, hatch: 2, base: 0.03 },
    { count: 7, len: 0.16, spread: 0.6, k: 0.5, ruffle: 0.22, freq: 18, hatch: 0, base: 0.02 },
  ],
  rose: [
    { count: 5, len: 1, spread: 0.78, k: 0.3, ruffle: 0.03, freq: 5, hatch: 8, base: 0.12, lip: true },
    { count: 5, len: 0.78, spread: 0.74, k: 0.32, ruffle: 0.03, freq: 5, hatch: 6, base: 0.1, lip: true },
    { count: 4, len: 0.55, spread: 0.85, k: 0.35, ruffle: 0.02, freq: 4, hatch: 4, base: 0.06, lip: true },
  ],
  ranunculus: [
    { count: 12, len: 1, spread: 0.34, k: 0.4, ruffle: 0.02, freq: 6, hatch: 3, base: 0.1 },
    { count: 12, len: 0.84, spread: 0.34, k: 0.42, ruffle: 0.02, freq: 6, hatch: 3, base: 0.08 },
    { count: 11, len: 0.68, spread: 0.36, k: 0.45, ruffle: 0.02, freq: 6, hatch: 2, base: 0.06 },
    { count: 10, len: 0.52, spread: 0.38, k: 0.45, ruffle: 0.02, freq: 6, hatch: 2, base: 0.05 },
    { count: 9, len: 0.37, spread: 0.42, k: 0.5, ruffle: 0.02, freq: 6, hatch: 0, base: 0.04 },
  ],
  anemone: [{ count: 6, len: 1, spread: 0.5, k: 0.3, ruffle: 0.04, freq: 7, hatch: 10, base: 0.12 }],
};

export function head(spec: HeadSpec, r: Rng): Stroke[] {
  const { at, radius, tilt, squash, kind } = spec;
  const frame = chain(translate(at[0], at[1]), rotate(tilt), scale(1, squash));
  const out: Stroke[] = [];

  LAYERS[kind].forEach((layer, li, all) => {
    const tone = 0.55 + (li / Math.max(1, all.length - 1)) * 0.4;
    const offset = r.range(0, 360);
    const petals = Array.from({ length: layer.count }, (_, i) => offset + (360 / layer.count) * i + r.jitter(8));
    // paint the petals that face away first, so the ones toward us cover them
    petals.sort((a, b) => Math.cos((a * Math.PI) / 180) - Math.cos((b * Math.PI) / 180));
    for (const a of petals) {
      const len = radius * layer.len * r.range(0.9, 1.06);
      const m = chain(frame, rotate(a), translate(0, -radius * layer.base));
      out.push(...petal(m, { len, spread: layer.spread * r.range(0.9, 1.1), k: layer.k, ruffle: layer.ruffle, freq: layer.freq, hatch: layer.hatch, lip: layer.lip }, r, tone * r.range(0.9, 1.08)));
    }
  });

  // hearts
  if (kind === "rose") {
    const pts: Pt[] = [];
    const turns = 2.4;
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const a = t * turns * Math.PI * 2;
      const rr = radius * 0.36 * (1 - t * 0.85) + r.jitter(0.6);
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    out.push({ d: smooth(applyAll(frame, pts)), w: OUT, o: 0.95, fill: true, tone: 0.9 });
  } else if (kind === "peony") {
    for (let i = 0; i < 9; i++) {
      const a = r.range(0, Math.PI * 2);
      const rr = radius * r.range(0, 0.12);
      const c: Pt = [Math.cos(a) * rr, Math.sin(a) * rr];
      const arc: Pt[] = [0, 1, 2, 3].map((j) => {
        const b = a + j * 0.5 + r.jitter(0.1);
        const q = radius * (0.06 + j * 0.012);
        return [c[0] + Math.cos(b) * q, c[1] + Math.sin(b) * q] as Pt;
      });
      out.push({ d: smooth(applyAll(frame, arc)), w: OUT * 0.8, o: 0.9 });
    }
  } else if (kind === "ranunculus") {
    const pts: Pt[] = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      const rr = radius * 0.12 * (1 + r.jitter(0.12));
      return [Math.cos(a) * rr, Math.sin(a) * rr] as Pt;
    });
    out.push({ d: smooth(applyAll(frame, pts), true), w: OUT, o: 0.95, fill: true, tone: 0.2 });
  } else if (kind === "anemone") {
    // dark velvet eye and a crown of stamens
    const eye: Pt[] = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      const rr = radius * 0.2 * (1 + r.jitter(0.06));
      return [Math.cos(a) * rr, Math.sin(a) * rr] as Pt;
    });
    out.push({ d: smooth(applyAll(frame, eye), true), w: OUT, o: 0.95, fill: true, tone: 0 });
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + r.jitter(0.08);
      const r1 = radius * r.range(0.3, 0.42);
      const p1: Pt = [Math.cos(a) * radius * 0.2, Math.sin(a) * radius * 0.2];
      const p2: Pt = [Math.cos(a) * r1, Math.sin(a) * r1];
      out.push({ d: smooth(applyAll(frame, [p1, p2])), w: HATCH, o: 0.8 });
      out.push({ d: dot(applyAll(frame, [p2])[0], 2.1), w: OUT * 0.8, o: 0.9 });
    }
    for (let i = 0; i < 18; i++) {
      const a = r.range(0, Math.PI * 2);
      const q = radius * r.range(0.02, 0.15);
      out.push({ d: dot(applyAll(frame, [[Math.cos(a) * q, Math.sin(a) * q]])[0], 1.2), w: OUT, o: 0.8 });
    }
  }
  return out;
}

const dot = ([x, y]: Pt, rr: number) => {
  const pts: Pt[] = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return [x + Math.cos(a) * rr, y + Math.sin(a) * rr] as Pt;
  });
  return smooth(pts, true);
};

/* ─────────────────────────── buds ─────────────────────────── */

/** A closed bud seen from the side, wrapped in sepals. Base at `at`, pointing along `angle` (0 = up). */
export function bud(at: Pt, size: number, angle: number, r: Rng): Stroke[] {
  const m = chain(translate(at[0], at[1]), rotate(angle));
  const out: Stroke[] = [];
  const body: Pt[] = [];
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * Math.PI * 2;
    // teardrop: wide at the bottom third, pointed at the top
    const y = -size * (0.5 - 0.5 * Math.cos(a));
    const w = size * 0.42 * Math.sin(a) * (1 - 0.55 * Math.pow((-y / size), 1.6));
    body.push([w, y]);
  }
  out.push({ d: smooth(applyAll(m, body), true), w: OUT, o: 0.95, fill: true, tone: 0.6 });
  // the petal seams spiralling up
  for (let i = 0; i < 3; i++) {
    const x0 = lerp(-0.3, 0.3, i / 2) * size;
    const seam: Pt[] = [
      [x0 * 0.6, -size * 0.12],
      [x0 + r.jitter(2), -size * 0.5],
      [x0 * 0.3, -size * 0.92],
    ];
    out.push({ d: smooth(applyAll(m, seam)), w: HATCH * 1.2, o: 0.7 });
  }
  for (let i = 0; i < 9; i++) {
    const x0 = r.range(0.05, 0.38) * size;
    const y0 = -r.range(0.15, 0.55) * size;
    out.push({ d: smooth(applyAll(m, [[x0, y0], [x0 * 0.85, y0 - size * r.range(0.15, 0.3)]])), w: HATCH, o: 0.5 });
  }
  // sepals
  for (const side of [-1, 1, 0]) {
    const s = side === 0 ? 0.4 : 1;
    const sep: Pt[] = [
      [0, 0],
      [side * size * 0.3 * s, -size * 0.14],
      [side * size * 0.26 * s + r.jitter(2), -size * 0.42],
      [side * size * 0.12 * s, -size * 0.18],
    ];
    out.push({ d: smooth(applyAll(m, sep), true), w: OUT, o: 0.95, fill: true, tone: 0.05 });
  }
  return out;
}

/* ─────────────────────────── leaves ─────────────────────────── */

/** A pointed leaf with midrib, veins and shading on one half. Base at `at`, pointing along `angle`. */
export function leaf(at: Pt, len: number, width: number, angle: number, bend: number, r: Rng): Stroke[] {
  const m = chain(translate(at[0], at[1]), rotate(angle));
  const side = (t: number, s: number): Pt => {
    const w = width * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.9) * (1 - 0.15 * t);
    const x = bend * len * t * t + s * w;
    return [x, -len * t];
  };
  const n = 14;
  const outline: Pt[] = [];
  for (let i = 0; i <= n; i++) outline.push(side(i / n, -1));
  for (let i = n - 1; i > 0; i--) outline.push(side(i / n, 1));
  const out: Stroke[] = [{ d: smooth(applyAll(m, outline), true), w: OUT, o: 0.95, fill: true, tone: r.range(0.3, 0.45) }];
  const rib: Pt[] = [0, 0.25, 0.5, 0.75, 0.97].map((t) => [bend * len * t * t, -len * t]);
  out.push({ d: smooth(applyAll(m, rib)), w: OUT * 0.75, o: 0.85 });
  const veins = Math.round(len / 22);
  for (let i = 1; i < veins; i++) {
    const t = i / veins;
    for (const s of [-1, 1]) {
      const a: Pt = [bend * len * t * t, -len * t];
      const t2 = Math.min(0.98, t + 0.13);
      const b = side(t2, s);
      const tip: Pt = [lerp(a[0], b[0], 0.88), lerp(a[1], b[1], 0.88)];
      out.push({ d: smooth(applyAll(m, [a, lerpPtBow(a, tip, 0.5, s * 2), tip])), w: HATCH, o: 0.6 });
      if (s === 1) {
        // shade the far half with short strokes between the veins
        for (let k = 0; k < 2; k++) {
          const tt = t + 0.035 + k * 0.03;
          const c: Pt = [bend * len * tt * tt + 3, -len * tt];
          const e = side(Math.min(0.98, tt + 0.1), 1);
          out.push({ d: smooth(applyAll(m, [c, [lerp(c[0], e[0], 0.6), lerp(c[1], e[1], 0.6) + r.jitter(1)]])), w: HATCH * 0.8, o: 0.4 });
        }
      }
    }
  }
  return out;
}

const lerpPtBow = (a: Pt, b: Pt, t: number, bow: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return [a[0] + dx * t + (-dy / l) * bow, a[1] + dy * t + (dx / l) * bow];
};

/* ─────────────────────────── stems & sprays ─────────────────────────── */

export function stem(a: Pt, b: Pt, bend: number, double: boolean, r: Rng): Stroke[] {
  const pts = bentLine(a, b, bend, 8, r, 1.2);
  const out: Stroke[] = [{ d: smooth(pts), w: OUT, o: 0.9 }];
  if (double) {
    const off = bentLine([a[0] + 3.2, a[1]], [b[0] + 2.4, b[1]], bend, 8, r, 0.6);
    out.push({ d: smooth(off), w: OUT * 0.7, o: 0.65 });
  }
  return out;
}

/** Silver-dollar eucalyptus: a wandering stalk with pairs of round leaves that shrink toward the tip. */
export function eucalyptus(a: Pt, b: Pt, bend: number, r: Rng): Stroke[] {
  const pts = bentLine(a, b, bend, 12, r, 3);
  const out: Stroke[] = [{ d: smooth(pts), w: OUT * 0.85, o: 0.85 }];
  const pairs = 7;
  for (let i = 1; i <= pairs; i++) {
    const t = i / (pairs + 0.6);
    const idx = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1)));
    const p = pts[idx];
    const q = pts[idx + 1];
    const ang = (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
    const size = lerp(30, 13, t) * r.range(0.85, 1.1);
    for (const s of [-1, 1]) {
      const m = chain(translate(p[0], p[1]), rotate(ang + 90 * s + r.jitter(14)));
      const disc: Pt[] = Array.from({ length: 12 }, (_, k) => {
        const a2 = (k / 12) * Math.PI * 2;
        return [Math.cos(a2) * size * 0.82 + size, Math.sin(a2) * size * (0.95 + r.jitter(0.05))] as Pt;
      });
      out.push({ d: smooth(applyAll(m, disc), true), w: OUT * 0.9, o: 0.9, fill: true, tone: r.range(0.25, 0.45) });
      out.push({ d: smooth(applyAll(m, [[2, 0], [size, r.jitter(2)], [size * 1.7, 0]])), w: HATCH, o: 0.55 });
    }
  }
  return out;
}

/** Baby's breath: forking hair-fine branches ending in tiny florets. */
export function gypsophila(at: Pt, angle: number, len: number, r: Rng): Stroke[] {
  const out: Stroke[] = [];
  const grow = (p: Pt, ang: number, l: number, depth: number) => {
    const rad = ((ang - 90) * Math.PI) / 180;
    const q: Pt = [p[0] + Math.cos(rad) * l, p[1] + Math.sin(rad) * l];
    out.push({ d: smooth([p, [lerp(p[0], q[0], 0.5) + r.jitter(2), lerp(p[1], q[1], 0.5) + r.jitter(2)], q]), w: HATCH * 1.1, o: 0.75 });
    if (depth === 0) {
      out.push({ d: dot(q, r.range(2.6, 3.8)), w: OUT * 0.75, o: 0.95 });
      return;
    }
    const kids = depth > 1 ? 2 + (r.next() > 0.6 ? 1 : 0) : 3;
    for (let i = 0; i < kids; i++) grow(q, ang + lerp(-38, 38, kids === 1 ? 0.5 : i / (kids - 1)) + r.jitter(10), l * r.range(0.55, 0.72), depth - 1);
  };
  grow(at, angle, len, 3);
  return out;
}

/** The silk tie: a band round the stems, two loops and two trailing tails. */
export function ribbon(at: Pt, r: Rng): Stroke[] {
  const [x, y] = at;
  const out: Stroke[] = [];
  const band: Pt[] = [
    [x - 34, y - 10],
    [x, y - 14],
    [x + 34, y - 9],
    [x + 33, y + 12],
    [x, y + 9],
    [x - 33, y + 13],
  ];
  out.push({ d: smooth(band, true, 0.4), w: OUT, o: 0.95, fill: true, tone: 0.55 });
  for (let i = 0; i < 6; i++) out.push({ d: smooth([[x - 30 + i * 12, y - 9], [x - 31 + i * 12, y + 10]]), w: HATCH, o: 0.45 });
  const tail = (s: number, len: number) => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push([x + s * (8 + t * 46) + Math.sin(t * 5) * 12 * s, y + 6 + t * len]);
    }
    const back = pts.map(([px, py], i) => [px + s * (7 + i * 0.6), py + 4] as Pt).reverse();
    return smooth([...pts, ...back], true, 0.8);
  };
  out.push({ d: tail(-1, 120), w: OUT, o: 0.95, fill: true, tone: 0.55 });
  out.push({ d: tail(1, 96), w: OUT, o: 0.95, fill: true, tone: 0.55 });
  for (const s of [-1, 1]) {
    const loop: Pt[] = [
      [x, y],
      [x + s * 40, y - 34 + r.jitter(3)],
      [x + s * 82, y - 22],
      [x + s * 74, y + 8],
      [x + s * 34, y + 6],
    ];
    out.push({ d: smooth(loop, true, 0.9), w: OUT, o: 0.95, fill: true, tone: 0.55 });
    out.push({ d: smooth([[x + s * 12, y - 2], [x + s * 46, y - 20], [x + s * 70, y - 10]]), w: HATCH, o: 0.55 });
  }
  const knot: Pt[] = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return [x + Math.cos(a) * 12, y + Math.sin(a) * 10] as Pt;
  });
  out.push({ d: smooth(knot, true), w: OUT, o: 0.95, fill: true, tone: 0.55 });
  return out;
}

/* ─────────────────────────── hydrangea & tulip ─────────────────────────── */

/** A hydrangea mophead: a dome of small four-petalled florets, painted from the back to the front. */
export function hydrangea(at: Pt, radius: number, r: Rng): Stroke[] {
  const out: Stroke[] = [];
  const florets: Pt[] = [];
  // the dome itself, so gaps between florets read as shadowed florets behind
  const dome: Pt[] = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return [at[0] + Math.cos(a) * radius * 0.96, at[1] + Math.sin(a) * radius * 0.74] as Pt;
  });
  out.push({ d: smooth(dome, true), w: OUT * 0.6, o: 0.4, fill: true, tone: 0.3 });
  for (let i = 0; i < 400 && florets.length < 72; i++) {
    const a = r.range(0, Math.PI * 2);
    const d = Math.sqrt(r.next());
    const p: Pt = [at[0] + Math.cos(a) * radius * d, at[1] + Math.sin(a) * radius * 0.76 * d];
    if (florets.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > radius * 0.15)) florets.push(p);
  }
  florets.sort((a, b) => a[1] - b[1]);
  for (const f of florets) {
    // florets near the rim are seen edge-on, so they squash
    const rim = Math.hypot((f[0] - at[0]) / radius, (f[1] - at[1]) / (radius * 0.78));
    const size = radius * r.range(0.15, 0.19);
    const frame = chain(translate(f[0], f[1]), rotate(r.range(0, 90)), scale(1, lerp(0.95, 0.6, rim)));
    for (let k = 0; k < 4; k++) {
      out.push(...petal(chain(frame, rotate(k * 90 + r.jitter(8))), { len: size, spread: 0.62, k: 0.3, ruffle: 0.02, freq: 4, hatch: 2 }, r, r.range(0.55, 0.95)));
    }
    out.push({ d: dot(f, size * 0.12), w: OUT * 0.8, o: 0.9 });
  }
  return out;
}

/** A tulip seen from the side: three petals behind, two in front, each with a soft point. Base at `at`. */
export function tulip(at: Pt, size: number, angle: number, r: Rng): Stroke[] {
  const out: Stroke[] = [];
  const shape = (w: number, h: number): Pt[] => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      pts.push([-w * Math.sin(Math.PI * Math.pow(t, 0.7)) * (1 - 0.35 * t), -h * t]);
    }
    for (let i = 9; i > 0; i--) {
      const t = i / 10;
      pts.push([w * Math.sin(Math.PI * Math.pow(t, 0.7)) * (1 - 0.35 * t), -h * t]);
    }
    return pts;
  };
  const petals: { x: number; rot: number; w: number; h: number; tone: number }[] = [
    { x: -size * 0.2, rot: -14, w: size * 0.3, h: size * 0.98, tone: 0.5 },
    { x: size * 0.2, rot: 14, w: size * 0.3, h: size * 0.98, tone: 0.5 },
    { x: 0, rot: 0, w: size * 0.3, h: size * 1.02, tone: 0.55 },
    { x: -size * 0.1, rot: -5, w: size * 0.33, h: size * 0.9, tone: 0.8 },
    { x: size * 0.12, rot: 7, w: size * 0.31, h: size * 0.88, tone: 0.9 },
  ];
  for (const p of petals) {
    const m = chain(translate(at[0], at[1]), rotate(angle), translate(p.x, 0), rotate(p.rot));
    out.push({ d: smooth(applyAll(m, shape(p.w, p.h)), true), w: OUT, o: 0.95, fill: true, tone: p.tone });
    for (let k = 0; k < 6; k++) {
      const x = r.range(-0.6, 0.7) * p.w;
      const y0 = -p.h * r.range(0.05, 0.2);
      out.push({ d: smooth(applyAll(m, [[x * 0.5, y0], [x, y0 - p.h * 0.3], [x * 0.8, y0 - p.h * r.range(0.4, 0.6)]])), w: HATCH, o: 0.55 });
    }
  }
  return out;
}
