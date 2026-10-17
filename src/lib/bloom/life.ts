import { css, mixRgb, shade, type Rgb } from "./kinds";

/**
 * Small living things for the illustration: butterflies that wander, glide, sometimes land on the
 * flower and shy away from the cursor, and petals that drift down. Drawn in the same flat,
 * fine-ink style as the flower. Everything works in CSS pixels on a 2D canvas.
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

export type Pointer = { x: number; y: number; active: boolean };

export class Butterfly {
  x: number;
  y: number;
  private vx = 0;
  private vy = 0;
  private heading = 0;
  private flap = Math.random() * TAU;
  private wander = Math.random() * 100;
  private wing: Wing;
  private size: number;
  /** "fly" → free; "approach" → heading to a perch; "perch" → resting with slow wings */
  private mode: "fly" | "approach" | "perch" = "fly";
  private timer: number;
  private alpha = 0;
  private passTo: [number, number] | null;
  done = false;

  constructor(
    x: number,
    y: number,
    opts: { wing?: number; size?: number; /** crossing butterflies leave the screen when done */ passTo?: [number, number] } = {},
  ) {
    this.x = x;
    this.y = y;
    this.wing = WINGS[opts.wing ?? Math.floor(Math.random() * WINGS.length)];
    this.size = opts.size ?? 17 + Math.random() * 4;
    this.timer = 6 + Math.random() * 8;
    this.passTo = opts.passTo ?? null;
  }

  /**
   * @param home   point the butterfly loosely circles (the flower), with the radius it keeps to
   * @param perch  landing spot on the flower, or null when the flower isn't open enough to land on
   */
  update(dt: number, time: number, bounds: { w: number; h: number; /** keep clear of the copy on the left */ minX?: number }, pointer: Pointer, home: { x: number; y: number; r: number } | null, perch: { x: number; y: number } | null) {
    this.alpha = Math.min(1, this.alpha + dt * 0.8);
    this.timer -= dt;
    this.wander += dt;

    // steering target
    let tx: number, ty: number, speed: number;
    if (this.passTo) {
      tx = this.passTo[0];
      ty = this.passTo[1] + Math.sin(this.wander * 0.9) * 60;
      speed = 70;
      if (Math.hypot(this.x - this.passTo[0], this.y - this.passTo[1]) < 40) this.done = true;
    } else {
      if (this.mode === "fly" && this.timer <= 0 && perch) {
        this.mode = "approach";
      } else if (this.mode === "fly" && this.timer <= 0) {
        this.timer = 4 + Math.random() * 6;
      }
      if (this.mode !== "fly" && !perch) {
        this.mode = "fly";
        this.timer = 5 + Math.random() * 6;
      }
      if (this.mode === "approach" && perch) {
        tx = perch.x;
        ty = perch.y;
        speed = 55;
        if (Math.hypot(this.x - tx, this.y - ty) < 5) {
          this.mode = "perch";
          this.timer = 3 + Math.random() * 3;
        }
      } else if (this.mode === "perch" && perch) {
        tx = perch.x;
        ty = perch.y;
        speed = 0;
        if (this.timer <= 0) {
          this.mode = "fly";
          this.timer = 8 + Math.random() * 10;
          this.vy = -60;
        }
      } else {
        // loose figure-of-eights around the flower, wandering by layered sines
        const h = home ?? { x: bounds.w * 0.5, y: bounds.h * 0.4, r: Math.min(bounds.w, bounds.h) * 0.3 };
        const a = this.wander * 0.23;
        tx = h.x + Math.sin(a * 1.3 + 1) * h.r * 1.35 + Math.sin(a * 2.9) * h.r * 0.3;
        ty = h.y + Math.sin(a * 2.1) * h.r * 0.7 + Math.cos(a * 3.7) * h.r * 0.2 - h.r * 0.15;
        speed = 48 + Math.sin(a * 5) * 14;
      }
      if (bounds.minX) tx = Math.max(tx, bounds.minX + 30);
      ty = Math.min(Math.max(ty, 90), bounds.h - 60);
    }

    // shy of the cursor: a nearby pointer startles it away (and off its perch)
    if (pointer.active) {
      const dx = this.x - pointer.x, dy = this.y - pointer.y;
      const d = Math.hypot(dx, dy);
      if (d < 110) {
        const push = (1 - d / 110) * 260;
        this.vx += (dx / (d || 1)) * push * dt;
        this.vy += (dy / (d || 1)) * push * dt;
        if (this.mode !== "fly") {
          this.mode = "fly";
          this.timer = 6 + Math.random() * 6;
        }
      }
    }

    if (this.mode === "perch") {
      this.vx *= Math.exp(-dt * 10);
      this.vy *= Math.exp(-dt * 10);
      this.x += (tx - this.x) * clamp01(dt * 8);
      this.y += (ty - this.y) * clamp01(dt * 8);
    } else {
      const dx = tx - this.x, dy = ty - this.y;
      const d = Math.hypot(dx, dy) || 1;
      // butterflies don't fly straight: add a bobbing flutter on top of the steering
      const bob = Math.sin(time * 6 + this.wander) * 22;
      this.vx += ((dx / d) * speed - this.vx) * clamp01(dt * 1.6);
      this.vy += ((dy / d) * speed - this.vy + bob) * clamp01(dt * 1.6);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    const want = Math.atan2(this.vy, this.vx) + Math.PI / 2;
    if (this.mode !== "perch" && Math.hypot(this.vx, this.vy) > 8) {
      let diff = want - this.heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.heading += diff * clamp01(dt * 4);
    }

    // wingbeat: quick in flight with the odd glide, slow and wide when resting
    const gliding = this.mode === "fly" && Math.sin(this.wander * 0.7) > 0.75;
    const rate = this.mode === "perch" ? 1.6 : gliding ? 1.2 : 11;
    this.flap += dt * rate * TAU * 0.5;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const s = this.size;
    // wing opening as seen from above: 1 = spread flat, ~0.15 = folded up
    const spread = this.mode === "perch" ? 0.55 + 0.45 * Math.abs(Math.cos(this.flap)) : 0.15 + 0.85 * Math.abs(Math.cos(this.flap));
    const { fore, hind, edge, spot } = this.wing;
    ctx.save();
    ctx.globalAlpha = this.alpha;
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
