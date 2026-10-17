import { css, mixRgb, shade, type Rgb } from "./kinds";

/**
 * Small living things for the illustration: a butterfly that now and then drifts across the page,
 * and petals that fall from the flower. Drawn in the same flat, fine-ink style as the flower.
 * Everything works in CSS pixels on a 2D canvas.
 */

type Wing = { fore: Rgb; hind: Rgb; edge: Rgb; spot: Rgb };

const WINGS: Wing[] = [
  // cabbage white: cream with grey-tipped forewings
  { fore: [252, 248, 236], hind: [248, 243, 225], edge: [120, 118, 112], spot: [96, 92, 88] },
  // powder blue
  { fore: [168, 192, 232], hind: [190, 208, 238], edge: [92, 112, 150], spot: [250, 250, 255] },
  // soft apricot
  { fore: [244, 190, 136], hind: [246, 206, 160], edge: [128, 84, 52], spot: [255, 246, 232] },
];

const TAU = Math.PI * 2;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * One unhurried crossing from one side of the screen to the other: a slow, wide wave rather than
 * zig-zags, the odd glide with wings held open, and turns that only ever ease in.
 */
export class Butterfly {
  x: number;
  y: number;
  private u = 0;
  private duration: number;
  private heading: number;
  private flap = Math.random() * TAU;
  private phase = Math.random() * TAU;
  private wing: Wing;
  private size: number;
  done = false;

  constructor(
    private from: [number, number],
    private to: [number, number],
    opts: { wing?: number; size?: number; /** px per second along the crossing */ speed?: number } = {},
  ) {
    [this.x, this.y] = from;
    this.wing = WINGS[opts.wing ?? Math.floor(Math.random() * WINGS.length)];
    this.size = opts.size ?? 15 + Math.random() * 3;
    this.duration = Math.hypot(to[0] - from[0], to[1] - from[1]) / (opts.speed ?? 42);
    this.heading = Math.atan2(to[1] - from[1], to[0] - from[0]) + Math.PI / 2;
  }

  private at(u: number, time: number): [number, number] {
    const dx = this.to[0] - this.from[0], dy = this.to[1] - this.from[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    // a long, lazy wave across the crossing, plus the faintest lift with each wingbeat
    const wave = Math.sin(u * TAU * 1.6 + this.phase) * 38 + Math.sin(u * TAU * 3.1 + this.phase * 2) * 10;
    const lift = Math.sin(time * 7) * 1.5;
    return [this.from[0] + dx * u + nx * wave, this.from[1] + dy * u + ny * wave + lift];
  }

  update(dt: number, time: number) {
    this.u += dt / this.duration;
    if (this.u >= 1) {
      this.done = true;
      return;
    }
    const [x, y] = this.at(this.u, time);
    const [ax, ay] = this.at(Math.min(1, this.u + 0.01), time);
    this.x = x;
    this.y = y;
    const want = Math.atan2(ay - y, ax - x) + Math.PI / 2;
    const diff = Math.atan2(Math.sin(want - this.heading), Math.cos(want - this.heading));
    this.heading += diff * clamp01(dt * 1.5);

    // wingbeat: steady and soft, with an occasional glide on open wings
    const gliding = Math.sin(time * 0.6 + this.phase) > 0.7;
    this.flap += dt * (gliding ? 0.6 : 6) * TAU * 0.5;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const s = this.size;
    // wing opening as seen from above: 1 = spread flat, ~0.15 = folded up
    const spread = 0.2 + 0.8 * Math.abs(Math.cos(this.flap));
    const { fore, hind, edge, spot } = this.wing;
    ctx.save();
    // ease in and out at the edges of its trip
    ctx.globalAlpha = Math.min(1, this.u * 12, (1 - this.u) * 12);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side * spread, 1);
      // hindwing
      ctx.beginPath();
      ctx.moveTo(0, s * 0.05);
      ctx.bezierCurveTo(s * 0.55, s * 0.05, s * 0.85, s * 0.45, s * 0.55, s * 0.78);
      ctx.bezierCurveTo(s * 0.35, s * 0.98, s * 0.08, s * 0.7, 0, s * 0.35);
      ctx.closePath();
      ctx.fillStyle = css(hind, 0.95);
      ctx.fill();
      ctx.strokeStyle = css(edge, 0.55);
      ctx.lineWidth = 0.7;
      ctx.stroke();
      // forewing
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.12);
      ctx.bezierCurveTo(s * 0.3, -s * 0.85, s * 1.05, -s * 0.95, s * 1.02, -s * 0.48);
      ctx.bezierCurveTo(s * 1.0, -s * 0.12, s * 0.5, s * 0.12, 0, s * 0.08);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, s, -s * 0.7);
      g.addColorStop(0, css(shade(fore, 0.95)));
      g.addColorStop(0.75, css(fore));
      g.addColorStop(1, css(mixRgb(fore, edge, 0.55)));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = css(edge, 0.6);
      ctx.stroke();
      // a single wing spot
      ctx.beginPath();
      ctx.arc(s * 0.6, -s * 0.45, s * 0.08, 0, TAU);
      ctx.fillStyle = css(spot, 0.75);
      ctx.fill();
      ctx.restore();
    }

    // body and antennae
    ctx.beginPath();
    ctx.ellipse(0, s * 0.08, s * 0.07, s * 0.42, 0, 0, TAU);
    ctx.fillStyle = css(shade(edge, 0.6));
    ctx.fill();
    ctx.strokeStyle = css(shade(edge, 0.6), 0.8);
    ctx.lineWidth = 0.6;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.3);
      ctx.quadraticCurveTo(side * s * 0.12, -s * 0.6, side * s * 0.22, -s * 0.7);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/** A single petal drifting down: it sways, turns over (foreshortening) and fades. */
export class FallingPetal {
  private age = 0;
  private spin = Math.random() * TAU;
  private flip = Math.random() * TAU;
  private sway = Math.random() * TAU;
  done = false;

  constructor(
    private x: number,
    private y: number,
    private color: Rgb,
    private size = 9 + Math.random() * 5,
    private life = 7 + Math.random() * 4,
  ) {}

  update(dt: number, floor: number) {
    this.age += dt;
    this.sway += dt * 1.3;
    this.spin += dt * 0.6;
    this.flip += dt * 2.2;
    this.x += Math.sin(this.sway) * 22 * dt + 6 * dt;
    this.y += (30 + Math.sin(this.sway * 2) * 8) * dt;
    if (this.age > this.life || this.y > floor + 20) this.done = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const a = Math.min(1, this.age * 1.5) * (1 - Math.max(0, (this.age - this.life + 2) / 2));
    if (a <= 0) return;
    const s = this.size;
    ctx.save();
    ctx.globalAlpha = a * 0.9;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.spin);
    ctx.scale(0.25 + 0.75 * Math.abs(Math.cos(this.flip)), 1);
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.7, -s * 0.6, s * 0.6, s * 0.6, 0, s);
    ctx.bezierCurveTo(-s * 0.6, s * 0.6, -s * 0.7, -s * 0.6, 0, -s);
    const g = ctx.createLinearGradient(0, -s, 0, s);
    g.addColorStop(0, css(this.color));
    g.addColorStop(1, css(mixRgb(this.color, [255, 250, 244], 0.55)));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = css(shade(this.color, 0.6), 0.35);
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.restore();
  }
}
