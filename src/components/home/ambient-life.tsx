"use client";

import { useEffect, useRef } from "react";

import type { Rgb } from "@/lib/bloom/kinds";
import { Butterfly, FallingPetal } from "@/lib/bloom/life";

/** Petal colours borrowed from the hero's flowers. */
const PETALS: Rgb[] = [
  [239, 160, 166],
  [241, 160, 110],
  [216, 85, 124],
  [190, 168, 226],
  [234, 123, 114],
];

/**
 * Over the whole home page: every so often a single butterfly drifts across the screen, and below the
 * hero a stray petal falls. Sparse on purpose — something you notice on a second look, never in the way.
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

    const hero = document.querySelector<HTMLElement>("[data-hero]");
    let butterfly: Butterfly | null = null;
    const petals: FallingPetal[] = [];
    let nextButterfly = 5 + Math.random() * 3;
    let nextPetal = 6;
    let last = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const time = now / 1000;

      // one butterfly at a time, from one side to the other on a gentle diagonal
      if (!butterfly) {
        nextButterfly -= dt;
        if (nextButterfly <= 0) {
          const fromLeft = Math.random() < 0.5;
          // keep to a band above or below where the copy sits, so it never flies through the words
          const band: [number, number] = w < 768 ? [0.12, 0.4] : Math.random() < 0.5 ? [0.12, 0.26] : [0.74, 0.88];
          const pick = () => h * (band[0] + Math.random() * (band[1] - band[0]));
          const y0 = pick();
          const y1 = pick();
          butterfly = new Butterfly([fromLeft ? -30 : w + 30, y0], [fromLeft ? w + 30 : -30, y1], { speed: w < 768 ? 34 : 46 });
          nextButterfly = 15 + Math.random() * 10;
        }
      }

      // the hero drops its own petals; out here they only fall once it has scrolled away
      const pastHero = !hero || hero.getBoundingClientRect().bottom < h * 0.4;
      nextPetal -= dt;
      if (pastHero && nextPetal <= 0 && petals.length < 2) {
        petals.push(new FallingPetal(w * (0.1 + Math.random() * 0.8), -20, PETALS[Math.floor(Math.random() * PETALS.length)], 6 + Math.random() * 4, 14));
        nextPetal = 7 + Math.random() * 6;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (const p of petals) {
        p.update(dt, h);
        p.draw(ctx);
      }
      for (let i = petals.length - 1; i >= 0; i--) if (petals[i].done) petals.splice(i, 1);
      if (butterfly) {
        butterfly.update(dt, time);
        if (butterfly.done) butterfly = null;
        else butterfly.draw(ctx);
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden className="pointer-events-none fixed inset-0 z-30 h-full w-full" />;
}
