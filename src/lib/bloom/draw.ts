import { MAX_SLOTS, css, mixRgb, shade, type Blend, type Rgb, type Whorl } from "./kinds";

/**
 * A flower drawn in 2D like a botanical illustration: each petal is a flat shape laid out around the
 * flower's axis and seen from slightly above, so "opening" is just the petals leaning outward.
 * Gradient fill from heart to tip, a fine ink outline, a vein, and a light/shadow tone per petal.
 */

export type Frame = {
  /** blended flower to draw */
  f: Blend;
  /** 0 → bud, 1 → open */
  open: number;
  time: number;
  /** centre of the flower head and its radius, in canvas px */
  cx: number;
  cy: number;
  r: number;
  /** camera elevation (radians above horizon) and slow turn of the whole flower */
  elev: number;
  spin: number;
  /** 0 → 1: the illustration drawing itself in (outlines first, then colour) */
  draw: number;
  /** canvas height in px, for the stem to reach the bottom edge */
  floor: number;
};

type V3 = [number, number, number];
type Petal = { pts: [number, number][]; depth: number; base: [number, number]; tip: [number, number]; fill: Rgb; tipFill: Rgb; ink: Rgb; vein: [number, number][]; len: number };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/* light from upper left, slightly toward the viewer */
const LIGHT: V3 = (() => {
  const l: V3 = [-0.45, 0.8, 0.45];
  const m = Math.hypot(...l);
  return [l[0] / m, l[1] / m, l[2] / m];
})();

const SEG_V = 14;

function halfWidth(v: number, w: Whorl) {
  const a = 0.75 + (0.45 - 0.75) * w.round;
  const b = 1 + (0.45 - 1) * w.round;
  const ruffle = 1 + w.ruffle * 0.06 * Math.sin(v * 17) * v;
  return w.wid * 0.5 * Math.pow(Math.sin(Math.PI * Math.min(0.999, 0.02 + Math.pow(v, a) * 0.98)), b) * ruffle;
}

export function drawFlower(ctx: CanvasRenderingContext2D, fr: Frame) {
  const { f, open, time, cx, cy, r, elev, spin, draw } = fr;
  const ce = Math.cos(elev), se = Math.sin(elev);
  const project = (p: V3): [number, number] => [cx + p[0] * r, cy - (p[1] * ce - p[2] * se) * r];
  const depthOf = (p: V3) => p[1] * se + p[2] * ce;
  const view: V3 = [0, se, ce];

  const ink = Math.max(0, Math.min(1, draw * 1.6));
  const paint = smooth(0.35, 1, draw);

  /* ---------- stem and leaves first: they sit behind the head */
  drawStem(ctx, fr, project, ink, paint);

  /* ---------- petals */
  const petals: Petal[] = [];
  f.whorls.forEach((w, wi) => {
    if (w.n <= 0.01) return;
    const slots = Math.min(MAX_SLOTS, Math.ceil(w.n));
    for (let i = 0; i < slots; i++) {
      const presence = clamp01(w.n - i);
      if (presence <= 0.01) continue;
      // petals spread evenly over the (fractional) count, so they slide round as the count changes
      const theta = w.offset + spin + (i * Math.PI * 2) / Math.max(w.n, 1) + wi * 0.21;
      const breathe = Math.sin(time * 0.9 + i * 1.7 + wi) * 0.025 * (0.3 + open);
      // outer whorls open first, the heart follows
      const o = smooth(0, 1, open * (1 + (2 - wi) * 0.12) - wi * 0.04);
      const tilt = w.tiltClosed + (w.tiltOpen - w.tiltClosed) * o + breathe;
      const len = w.len * (0.55 + 0.45 * presence) * (0.82 + 0.18 * o);
      const wid = presence;
      const cupK = w.cup * (1 - 0.35 * o);

      const ct = Math.cos(theta), st = Math.sin(theta);
      const across: V3 = [-st, 0, ct];
      const ringR = w.ring * (0.4 + 0.6 * o);
      // walk up the petal's midline, bending outward toward the tip if it recurves
      const mid: V3[] = [];
      const inner: V3[] = [];
      let p: V3 = [ct * ringR, wi * 0.03 * (1 - o), st * ringR];
      for (let j = 0; j <= SEG_V; j++) {
        const v = j / SEG_V;
        const phi = tilt + w.recurve * o * v * v;
        mid.push(p);
        inner.push([-Math.cos(phi) * ct, Math.sin(phi), -Math.cos(phi) * st]);
        const step = len / SEG_V;
        p = [p[0] + Math.sin(phi) * ct * step, p[1] + Math.cos(phi) * step, p[2] + Math.sin(phi) * st * step];
      }

      const right: [number, number][] = [];
      const left: [number, number][] = [];
      let dsum = 0;
      for (let j = 0; j <= SEG_V; j++) {
        const v = j / SEG_V;
        const hw = halfWidth(v, w) * wid * (0.65 + 0.35 * o);
        // a notched tip pulls the centre of the tip back
        const m = mid[j], n = inner[j];
        const curl = cupK * hw;
        const edge = (s: number): V3 => [m[0] + across[0] * hw * s + n[0] * curl, m[1] + n[1] * curl, m[2] + across[2] * hw * s + n[2] * curl];
        right.push(project(edge(1)));
        left.push(project(edge(-1)));
        dsum += depthOf(m);
      }
      let tipPt: [number, number] = project(mid[SEG_V]);
      if (w.notch > 0.01) {
        const back = mid[Math.round(SEG_V * (1 - 0.12 * w.notch))];
        tipPt = project(back);
      }
      const pts = [...right, tipPt, ...left.reverse()];

      // which face we see, and how lit it is
      const nMid = inner[Math.round(SEG_V * 0.4)];
      const facing = nMid[0] * view[0] + nMid[1] * view[1] + nMid[2] * view[2];
      const nSide: V3 = facing >= 0 ? nMid : [-nMid[0], -nMid[1], -nMid[2]];
      const lit = nSide[0] * LIGHT[0] + nSide[1] * LIGHT[1] + nSide[2] * LIGHT[2];
      // gentle modelling only: an illustration, not a render
      const tone = 0.94 + 0.1 * Math.max(0, lit) - (facing < 0 ? 0.03 : 0) + wi * 0.015;

      petals.push({
        pts,
        depth: dsum / (SEG_V + 1) + wi * 0.002,
        base: project(mid[0]),
        tip: project(mid[SEG_V]),
        // the outside of a petal shows more of the tip colour, like real petals
        fill: shade(facing < 0 ? mixRgb(f.base, f.tip, 0.35) : mixRgb(f.base, f.tip, wi * 0.12), tone),
        tipFill: shade(f.tip, tone),
        ink: shade(f.tip, 0.55),
        vein: mid.slice(1, Math.round(SEG_V * 0.85)).map(project),
        len: perimeter(pts),
      });
    }
  });

  petals.sort((a, b) => a.depth - b.depth);

  // the flower's heart is at depth ~0: everything behind it first, then the heart, then the rest
  const centreDepth = 0.02;
  let centreDrawn = false;
  for (const pt of petals) {
    if (!centreDrawn && pt.depth > centreDepth) {
      drawCentre(ctx, fr, project, paint);
      centreDrawn = true;
    }
    drawPetal(ctx, pt, ink, paint);
  }
  if (!centreDrawn) drawCentre(ctx, fr, project, paint);
}

function perimeter(pts: [number, number][]) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return s;
}

function path(ctx: CanvasRenderingContext2D, pts: [number, number][]) {
  // smooth the polygon with midpoint quadratics so edges read as drawn curves, not facets
  ctx.beginPath();
  const n = pts.length;
  ctx.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
  }
  ctx.closePath();
}

function drawPetal(ctx: CanvasRenderingContext2D, p: Petal, ink: number, paint: number) {
  path(ctx, p.pts);
  if (paint > 0) {
    const g = ctx.createLinearGradient(p.base[0], p.base[1], p.tip[0], p.tip[1]);
    g.addColorStop(0, css(p.fill, paint));
    g.addColorStop(0.35, css(mixRgb(p.fill, p.tipFill, 0.25), paint));
    g.addColorStop(1, css(p.tipFill, paint));
    ctx.fillStyle = g;
    ctx.fill();
  }
  if (ink > 0) {
    ctx.save();
    if (ink < 1) {
      ctx.setLineDash([p.len * ink, p.len]);
    }
    ctx.strokeStyle = css(p.ink, 0.42);
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.restore();
    // vein: a single fine stroke up the middle
    if (p.vein.length > 2) {
      ctx.beginPath();
      ctx.moveTo(p.vein[0][0], p.vein[0][1]);
      for (const v of p.vein) ctx.lineTo(v[0], v[1]);
      ctx.strokeStyle = css(p.ink, 0.12 * ink);
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }
}

function drawCentre(ctx: CanvasRenderingContext2D, fr: Frame, project: (p: V3) => [number, number], paint: number) {
  const { f, open, r, elev, time, spin } = fr;
  const a = paint * smooth(0.2, 0.7, open);
  if (a <= 0) return;
  const c = project([0, 0.06, 0]);

  if (f.disc > 0.02) {
    // cosmos: a domed golden disc of tiny florets
    const rd = 0.16 * f.disc * r;
    const ry = rd * Math.sin(elev) + rd * 0.25;
    const g = ctx.createRadialGradient(c[0] - rd * 0.3, c[1] - ry * 0.4, rd * 0.1, c[0], c[1], rd);
    g.addColorStop(0, css([248, 214, 92], a));
    g.addColorStop(1, css(shade(f.stamenColor, 0.8), a));
    ctx.beginPath();
    ctx.ellipse(c[0], c[1], rd, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = css(shade(f.stamenColor, 0.62), 0.55 * a);
    for (let i = 0; i < 40; i++) {
      const rr = Math.sqrt(i / 40) * 0.88;
      const t = i * 2.39996 + spin;
      ctx.beginPath();
      ctx.arc(c[0] + Math.cos(t) * rr * rd, c[1] + Math.sin(t) * rr * ry, Math.max(0.6, rd * 0.045), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (f.stamens > 0.02) {
    // lily / tulip: long filaments fanning out of the throat, each tipped with an anther
    const n = 6;
    for (let i = 0; i < n; i++) {
      const t = spin + (i / n) * Math.PI * 2 + 0.3;
      const lean = 0.35 + 0.3 * open;
      const L = (0.22 + 0.32 * f.stamens) * open;
      const sway = Math.sin(time * 1.1 + i) * 0.03;
      const tip: V3 = [Math.cos(t) * Math.sin(lean + sway) * L, 0.06 + Math.cos(lean) * L, Math.sin(t) * Math.sin(lean + sway) * L];
      const p0 = c, p1 = project(tip);
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      ctx.quadraticCurveTo((p0[0] + p1[0]) / 2, Math.min(p0[1], p1[1]) - r * 0.03, p1[0], p1[1]);
      ctx.strokeStyle = css(mixRgb([236, 226, 196], f.stamenColor, 0.25), a * f.stamens);
      ctx.lineWidth = Math.max(1, r * 0.008);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(p1[0], p1[1], r * 0.022, r * 0.011, t, 0, Math.PI * 2);
      ctx.fillStyle = css(f.stamenColor, a * f.stamens);
      ctx.fill();
    }
  }
}

function drawStem(ctx: CanvasRenderingContext2D, fr: Frame, project: (p: V3) => [number, number], ink: number, paint: number) {
  const { f, r, time, floor } = fr;
  const top = project([0, -0.02, 0]);
  const sway = Math.sin(time * 0.5) * r * 0.03;
  const bottom: [number, number] = [top[0] - r * 0.18 + sway, floor + 10];
  const ctrl: [number, number] = [top[0] + r * 0.12, (top[1] + bottom[1]) / 2];
  const stemLen = Math.hypot(bottom[0] - top[0], bottom[1] - top[1]) * 1.1;

  ctx.save();
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(bottom[0], bottom[1]);
  ctx.quadraticCurveTo(ctrl[0], ctrl[1], top[0], top[1]);
  if (ink < 1) ctx.setLineDash([stemLen * ink, stemLen]);
  ctx.strokeStyle = css(f.leaf, 0.35 + 0.65 * paint);
  ctx.lineWidth = Math.max(2, r * 0.035);
  ctx.stroke();
  ctx.restore();

  // two leaves along the stem, each a pointed blade with a midrib
  const at = (t: number): [number, number] => {
    const u = 1 - t;
    return [u * u * bottom[0] + 2 * u * t * ctrl[0] + t * t * top[0], u * u * bottom[1] + 2 * u * t * ctrl[1] + t * t * top[1]];
  };
  const leaves: [number, number, number][] = [
    [0.42, -1, 0.95],
    [0.62, 1, 0.75],
  ];
  for (const [t, side, size] of leaves) {
    const [x, y] = at(t);
    const flutter = Math.sin(time * 0.8 + t * 9) * 0.05;
    const ang = -Math.PI / 2 + side * (0.95 + flutter);
    const L = r * 0.62 * size;
    const W = L * 0.24;
    const dx = Math.cos(ang), dy = Math.sin(ang);
    const nx = -dy, ny = dx;
    const tipX = x + dx * L, tipY = y + dy * L;
    const bend = side * L * 0.12;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + dx * L * 0.3 + nx * W, y + dy * L * 0.3 + ny * W, tipX - dx * L * 0.25 + nx * (W * 0.6 + bend), tipY - dy * L * 0.25 + ny * (W * 0.6 + bend), tipX, tipY);
    ctx.bezierCurveTo(tipX - dx * L * 0.3 - nx * (W * 0.4 - bend), tipY - dy * L * 0.3 - ny * (W * 0.4 - bend), x + dx * L * 0.25 - nx * W * 0.8, y + dy * L * 0.25 - ny * W * 0.8, x, y);
    if (paint > 0) {
      const g = ctx.createLinearGradient(x, y, tipX, tipY);
      g.addColorStop(0, css(shade(f.leaf, 0.85), paint));
      g.addColorStop(1, css(shade(f.leaf, 1.12), paint));
      ctx.fillStyle = g;
      ctx.fill();
    }
    ctx.save();
    if (ink < 1) ctx.setLineDash([L * 2.2 * ink, L * 3]);
    ctx.strokeStyle = css(shade(f.leaf, 0.6), 0.45);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + dx * L * 0.5 + nx * bend * 0.6, y + dy * L * 0.5 + ny * bend * 0.6, tipX, tipY);
    ctx.strokeStyle = css(shade(f.leaf, 0.7), 0.3 * ink);
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}
