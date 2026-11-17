"use client";

import NumberFlow from "@number-flow/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

import { Magnetic } from "@/components/motion/magnetic";
import { ProductImage } from "@/components/shop/product-image";
import { EMPTY_STEMS, recipePrice, type Recipe } from "@/lib/custom";
import { cn } from "@/lib/utils";

import { ChapterHead, Lane } from "./parts";

gsap.registerPlugin(ScrollTrigger);

const STEPS: { title: string; word: string; recipe: Recipe }[] = [
  {
    title: "Pick the flowers",
    word: "Flowers",
    recipe: { stems: { ...EMPTY_STEMS, peony: 3, rose: 5 }, palette: "blush", greens: [], wrap: "ivory" },
  },
  {
    title: "Then the colours",
    word: "Colours",
    recipe: { stems: { ...EMPTY_STEMS, peony: 3, rose: 5 }, palette: "sunset", greens: [], wrap: "ivory" },
  },
  {
    title: "And the wrap",
    word: "Wrap",
    recipe: { stems: { ...EMPTY_STEMS, peony: 3, rose: 5 }, palette: "sunset", greens: ["eucalyptus", "gypsophila"], wrap: "kraft" },
  },
];

/**
 * Chapter two: build your own. The page holds while you scroll through the three choices, and the
 * bouquet beside them repaints itself at each one, so you have seen the builder before you open it.
 */
export function BuildStory() {
  const stage = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (s) => setStep(Math.min(STEPS.length - 1, Math.floor(s.progress * STEPS.length * 0.999))),
    });
    return () => st.kill();
  }, []);

  const s = STEPS[step];
  return (
    <section className="relative text-line">
      <ChapterHead id="build" bloom="#f5c78f" title={"Or make it\n*your own.*"} />
      <div ref={stage} className="relative h-[300svh]">
        <div className="sticky top-0 z-10 grid h-[100svh] grid-rows-[minmax(0,1fr)_auto] items-center gap-4 py-20 md:grid-cols-2 md:grid-rows-1 md:gap-[5vw] md:py-0">
          {/* the bouquet, repainted at every step */}
          <div className="relative z-10 flex h-full min-w-0 items-center justify-center px-8 md:order-2 md:pr-[6vw]">
            <div className="relative aspect-[4/5] max-h-full w-[min(70vw,340px)] overflow-hidden md:h-full md:max-h-[min(72svh,620px)] md:w-auto rounded-[14px] shadow-[0_60px_120px_-50px_rgb(0_0_0/0.8)]">
              <ProductImage key={step} recipe={s.recipe} mode="load" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-full bg-night/65 px-5 py-2.5 backdrop-blur-md">
                <span className="text-[15px] italic text-line/75">{s.title}</span>
                <span className="display text-[26px] tabular-nums text-blush">
                  <NumberFlow value={recipePrice(s.recipe)} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} />
                </span>
              </div>
            </div>
          </div>

          {/* the three choices */}
          <div className="gutter relative z-10 min-w-0 md:pl-[8vw]">
            <ol className="flex gap-6 md:block md:space-y-0">
              {STEPS.map((x, i) => (
                <li key={x.title} className={cn("display text-[44px] leading-[1] transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] md:text-[clamp(72px,8vw,140px)]", i === step ? "text-paper" : "text-line/20", i === step && "italic md:translate-x-[1.5vw]")}>
                  {x.word}
                </li>
              ))}
            </ol>
            <div className="mt-6 flex gap-1.5 md:hidden" aria-hidden>
              {STEPS.map((_, i) => (
                <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors duration-700", i <= step ? "bg-blush" : "bg-line/15")} />
              ))}
            </div>
            <div className="mt-8 md:mt-12">
              <Magnetic>
                <Link href="/shop/build" data-cursor="Build" className="pill bg-blush text-night hover:bg-paper">
                  Start yours <span aria-hidden>→</span>
                </Link>
              </Magnetic>
            </div>
          </div>
        </div>
      </div>
      <Lane />
    </section>
  );
}
