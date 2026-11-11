"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Fragment, useLayoutEffect, useRef } from "react";

import { photoUrl } from "@/lib/products";

gsap.registerPlugin(ScrollTrigger);

// [text] or {photo id} — the sentence carries small photographs inline, like pressed flowers in a letter
const SENTENCE: (string | { photo: string; alt: string })[] = [
  "We don't arrange flowers, we compose them",
  { photo: "1560583035-79c3e11ae176", alt: "Peonies in kraft paper" },
  "— slowly, by hand, stem by stem, a few steps from the old stones of Byblos.",
  { photo: "1578534102052-70f4c14ee0e7", alt: "A bridal bouquet of ivory roses" },
  "A bouquet for an ordinary Tuesday, a first dance, a long table at dusk: each one is tied the morning you need it.",
];

/**
 * Chapter one. A single sentence that brightens word by word as you scroll through it,
 * so reading it is the scroll.
 */
export function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".mf-w",
        { opacity: 0.13 },
        { opacity: 1, ease: "none", stagger: 0.05, scrollTrigger: { trigger: ".mf-text", start: "top 78%", end: "bottom 55%", scrub: true } },
      );
      gsap.from(".mf-pic", {
        scale: 0,
        ease: "expo.out",
        duration: 1.4,
        stagger: 0.2,
        scrollTrigger: { trigger: ".mf-text", start: "top 70%", once: true },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="gutter relative bg-paper py-[clamp(96px,16vw,240px)] text-ink">
      <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,4fr)]">
        <p className="label text-ink/50">(01) — The atelier</p>
        <p className="mf-text display text-[clamp(34px,5.2vw,88px)] leading-[1.02] tracking-[-0.03em]">
          {SENTENCE.map((part, i) =>
            typeof part === "string" ? (
              <Fragment key={i}>
                {part.split(" ").map((w, j) => (
                  <span key={j} className="mf-w">
                    {w}{" "}
                  </span>
                ))}
              </Fragment>
            ) : (
              <span key={i} className="mf-pic mx-[0.08em] inline-block h-[0.78em] w-[1.5em] overflow-hidden rounded-full bg-paper-2 align-[-0.06em]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl(part.photo, 240)} alt={part.alt} className="h-full w-full object-cover" loading="lazy" />
              </span>
            ),
          )}
        </p>
      </div>

      <div className="mt-[clamp(64px,9vw,140px)] grid gap-10 border-t border-ink/12 pt-8 sm:grid-cols-3 md:ml-[20%]">
        {[
          ["Everyday", "Hand-tied bouquets, boxes and vases, made to order the same morning."],
          ["Weddings", "Bridal bouquets, ceremony arches, aisles and long tables, from first sketch to last candle."],
          ["Events", "Engagements, christenings, launches and dinners. We design, deliver and install."],
        ].map(([t, d]) => (
          <div key={t}>
            <p className="label text-ink/45">{t}</p>
            <p className="mt-3 max-w-[30ch] text-[15px] leading-relaxed text-ink/70">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
