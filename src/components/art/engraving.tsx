"use client";

import { useEffect, useRef } from "react";

import type { Piece } from "@/lib/botanic/bouquet";
import { compile, loadSprites, paint, type Op } from "@/lib/botanic/paint";

type Props = {
  /**
   * What to paint, or a function that builds it. Pass a (memoised) function for anything below the
   * fold: the shapes are then only generated when the plate is about to be seen, not on page load.
   */
  pieces: Piece[] | (() => Piece[]);
  view: { w: number; h: number };
  label: string;
  className?: string;
  /** "load": paints itself on mount · "view": when scrolled into view · "static": as fast as the frame allows */
  mode?: "load" | "view" | "static";
  delay?: number;
  /** seconds the painting takes; longer for the hero, short for small plates */
  seconds?: number;
  /** soft colour glows behind the pieces that carry one */
  washes?: boolean;
  /** skip the finest veins on small screens, where they are invisible but costly */
  thinOnPhones?: boolean;
};

/**
 * A plate that paints itself. Pieces are painted in the order they are listed, back to front, a few
 * shapes every frame, so a bouquet builds up petal by petal the way it is arranged by hand.
 * Nothing is generated, loaded or painted until the plate is needed, and never more than a slice of
 * a frame at a time. (The name is historical: these used to be line engravings.)
 */
export function Engraving({ pieces, view, label, className, mode = "view", delay = 0, seconds = 1.5, washes = false, thinOnPhones = true }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const still = mode === "static" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let list: Piece[] | null = null;
    let alive = true;
    let raf = 0;
    let timer = 0;
    let done = false;

    const run = (animate: boolean) => {
      cancelAnimationFrame(raf);
      if (!list) return;
      const all = list;
      const phone = window.innerWidth < 768;
      // phones have dense screens and slower chips: 1.5× is indistinguishable there and nearly halves the work
      const dpr = Math.min(phone ? 1.5 : 2, window.devicePixelRatio || 1);
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (!cw || !ch) return;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      // fit the plate inside the element, centred
      const k = Math.min(cw / view.w, ch / view.h);
      const px = k * dpr;
      ctx.setTransform(px, 0, 0, px, ((cw - view.w * k) / 2) * dpr, ((ch - view.h * k) / 2) * dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const thin = thinOnPhones && phone;

      if (washes)
        for (const p of list) {
          if (!p.wash) continue;
          const { cx, cy, rx, ry, color } = p.wash;
          const r = Math.max(rx, ry) * 1.5;
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          g.addColorStop(0, `${color}44`);
          g.addColorStop(1, `${color}00`);
          ctx.fillStyle = g;
          ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        }

      // pieces are prepared one at a time, just before they are painted
      let piece = 0;
      let ops: Op[] = [];
      let i = 0;
      const total = all.reduce((n, p) => n + (p.sprite ? 1 : p.strokes.length), 0);
      const perFrame = animate ? Math.max(2, Math.ceil(total / (seconds * 60))) : Infinity;
      const frame = () => {
        // never hold the main thread for more than a slice of a frame
        const until = performance.now() + (animate ? 7 : 10);
        let n = 0;
        while (n < perFrame && performance.now() < until) {
          if (i >= ops.length) {
            if (piece >= all.length) break;
            ops = compile(all[piece++]);
            i = 0;
            continue;
          }
          paint(ctx, ops[i++], px, thin);
          n++;
        }
        if (i < ops.length || piece < all.length) raf = requestAnimationFrame(frame);
        else done = true;
      };
      frame();
    };

    // build the shapes, fetch any photographs they use, then paint
    const begin = async () => {
      const made = typeof pieces === "function" ? pieces() : pieces;
      if (made.some((p) => p.sprite)) await loadSprites(made);
      if (!alive) return;
      list = made;
      if (still || !delay) run(!still);
      else timer = window.setTimeout(() => run(true), delay * 1000);
    };

    let io: IntersectionObserver | null = null;
    if (mode !== "view") begin();
    else {
      io = new IntersectionObserver(
        (e) => {
          if (e.some((x) => x.isIntersecting)) {
            io?.disconnect();
            begin();
          }
        },
        // start a little before it scrolls in, so the first petals are already there
        { rootMargin: "120px 0px -8% 0px" },
      );
      io.observe(canvas);
    }

    // a resize repaints at the new size without replaying the entrance
    let w = canvas.clientWidth;
    let h = canvas.clientHeight;
    const ro = new ResizeObserver(() => {
      if (canvas.clientWidth === w && canvas.clientHeight === h) return;
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      if (list) run(!done && !still);
    });
    ro.observe(canvas);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      io?.disconnect();
      ro.disconnect();
    };
  }, [pieces, view.w, view.h, mode, delay, seconds, washes, thinOnPhones]);

  return <canvas ref={ref} className={className} style={{ display: "block" }} role="img" aria-label={label} />;
}
