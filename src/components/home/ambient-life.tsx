"use client";

import { useEffect, useRef } from "react";

import type { Rgb } from "@/lib/bloom/kinds";
import { Butterfly, FallingPetal, type Pointer } from "@/lib/bloom/life";

/** Petal colours borrowed from the hero's flowers. */
const PETALS: Rgb[] = [
  [239, 160, 166],
  [241, 160, 110],
  [216, 85, 124],
  [190, 168, 226],
  [234, 123, 114],
];

/**
 * Below the hero: now and then a butterfly crosses the page and a stray petal drifts down.
 * Sparse on purpose — something you notice on the second look, never something in the way.
 */
export function AmbientLife() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = canvas.current!;
    const ctx = el.getContext("2d")!;
    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const near: Pointer = { x: -999, y: -999, active: false };
    const onMove = (e: PointerEvent) => {
      near.x = e.clientX;
      near.y = e.clientY;
      near.active = e.pointerType === "mouse";
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const hero = document.querySelector<HTMLElement>("[data-hero]");
    const butterflies: Butterfly[] = [];
    const petals: FallingPetal[] = [];
    let nextButterfly = 4 + Math.random() * 4;
    let nextPetal = 6;
    let last = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const time = now / 1000;
      // the hero has its own butterflies; this layer only lives once it has scrolled away
      const live = !hero || hero.getBoundingClientRect().bottom < h * 0.4;

      if (live) {
        nextButterfly -= dt;
        if (nextButterfly <= 0 && butterflies.length < 1) {
          const fromLeft = Math.random() < 0.5;
          const y0 = h * (0.25 + Math.random() * 0.45);
          butterflies.push(
            new Butterfly(fromLeft ? -40 : w + 40, y0, { passTo: [fromLeft ? w + 80 : -80, h * (0.2 + Math.random() * 0.5)], size: 15 + Math.random() * 3 }),
          );
          nextButterfly = 15 + Math.random() * 10;
        }
        nextPetal -= dt;
        if (nextPetal <= 0 && petals.length < 2) {
          petals.push(new FallingPetal(w * (0.1 + Math.random() * 0.8), -20, PETALS[Math.floor(Math.random() * PETALS.length)], 6 + Math.random() * 4, 14));
          nextPetal = 7 + Math.random() * 6;
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (!butterflies.length && !petals.length) return;
      for (const p of petals) {
        p.update(dt, h);
        p.draw(ctx);
      }
      for (const b of butterflies) {
        b.update(dt, time, { w, h }, near, null, null);
        b.draw(ctx);
      }
      for (let i = petals.length - 1; i >= 0; i--) if (petals[i].done) petals.splice(i, 1);
      for (let i = butterflies.length - 1; i >= 0; i--) if (butterflies[i].done) butterflies.splice(i, 1);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden className="pointer-events-none fixed inset-0 z-30 h-full w-full" />;
}
