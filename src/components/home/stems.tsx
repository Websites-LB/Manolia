"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const ROW_A = ["Peonies", "Garden roses", "Ranunculus", "Anemones", "Lisianthus"];
const ROW_B = ["Eucalyptus", "Gypsophila", "Hydrangea", "Tulips", "Sweet peas"];

function Glyph() {
  return (
    <svg viewBox="-20 -20 40 40" className="mx-[0.35em] inline-block h-[0.42em] w-[0.42em] align-middle text-clay" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <ellipse key={i} cx="0" cy="-9" rx="5" ry="9" transform={`rotate(${i * 60})`} fill="none" stroke="currentColor" strokeWidth="1.6" />
      ))}
      <circle r="3" fill="currentColor" />
    </svg>
  );
}

function Row({ words, reverse, italic }: { words: string[]; reverse?: boolean; italic?: boolean }) {
  const line = (
    <span className="flex shrink-0 items-center pr-[0.3em]">
      {words.map((w) => (
        <span key={w} className="flex items-center whitespace-nowrap">
          {italic ? <em>{w}</em> : w}
          <Glyph />
        </span>
      ))}
    </span>
  );
  return (
    <div className="flex overflow-hidden">
      <div className={`mq flex w-max will-change-transform ${reverse ? "mq-rev" : ""}`}>
        {line}
        {line}
      </div>
    </div>
  );
}

/** Interlude: the week's stems, drifting past — faster when you scroll faster. */
export function Stems() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const a = gsap.fromTo(".mq:not(.mq-rev)", { xPercent: 0 }, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
      const b = gsap.fromTo(".mq-rev", { xPercent: -50 }, { xPercent: 0, duration: 42, ease: "none", repeat: -1 });
      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const boost = 1 + Math.min(5, Math.abs(self.getVelocity()) / 400);
          gsap.to([a, b], { timeScale: boost, duration: 0.3, overwrite: true, onComplete: () => void gsap.to([a, b], { timeScale: 1, duration: 1.2 }) });
        },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="overflow-hidden bg-paper-2 py-[clamp(72px,9vw,140px)] text-ink" aria-label="Flowers we work with">
      <p className="label gutter mb-10 text-ink/50">(04) — In the buckets this week</p>
      <div className="display space-y-[0.06em] text-[clamp(64px,10.5vw,190px)]">
        <Row words={ROW_A} />
        <Row words={ROW_B} reverse italic />
      </div>
      <p className="gutter mt-10 max-w-[52ch] text-[14px] leading-relaxed text-ink/60 md:ml-[40%]">
        We buy what is at its best each week and build around it. Tell us who the flowers are for, and we choose the stems that suit them.
      </p>
    </section>
  );
}
