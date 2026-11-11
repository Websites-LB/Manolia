"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef, type ReactNode } from "react";

gsap.registerPlugin(ScrollTrigger);

/** Children settle into place in sequence as the block scrolls into view. Transform and opacity only. */
export function FadeUp({ children, className, delay = 0, stagger = 0.08, immediate = false }: { children: ReactNode; className?: string; delay?: number; stagger?: number; immediate?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(el.children, {
        y: 28,
        opacity: 0,
        duration: 1.3,
        ease: "expo.out",
        stagger,
        delay,
        scrollTrigger: immediate ? undefined : { trigger: el, start: "top 90%", once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [delay, stagger, immediate]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
