"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Magnetic } from "@/components/motion/magnetic";
import { SplitWords } from "@/components/motion/split-words";
import { EMPTY_STEMS, recipePrice, type Recipe } from "@/lib/custom";
import { usd } from "@/lib/cart-store";

import { ProductImage } from "./product-image";

/** three bouquets nobody ordered yet, to show how far apart two recipes can land */
const IDEAS: Recipe[] = [
  { stems: { ...EMPTY_STEMS, peony: 3, rose: 4, ranunculus: 3 }, palette: "blush", greens: ["eucalyptus", "gypsophila"], wrap: "ivory" },
  { stems: { ...EMPTY_STEMS, anemone: 5, tulip: 6, ranunculus: 2 }, palette: "lavender", greens: ["eucalyptus"], wrap: "kraft" },
  { stems: { ...EMPTY_STEMS, hydrangea: 3, rose: 5 }, palette: "harbour", greens: ["gypsophila"], wrap: "vase" },
];

/** The invitation to compose your own: the same sentence, a different bouquet every few seconds (long enough for each to finish drawing). */
export function BuildBanner() {
  const [i, setI] = useState(0);
  const box = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // repainting a bouquet nobody is looking at is wasted work: only cycle while on screen
    let on = false;
    const io = new IntersectionObserver((e) => (on = e.some((x) => x.isIntersecting)));
    io.observe(el);
    const t = setInterval(() => on && !document.hidden && setI((n) => (n + 1) % IDEAS.length), 9000);
    return () => {
      clearInterval(t);
      io.disconnect();
    };
  }, []);
  const idea = IDEAS[i];

  return (
    <section ref={box} className="gutter relative">
      <div className="relative grid items-center gap-10 overflow-hidden rounded-[10px] border border-line/10 bg-[#0c1610] p-6 md:grid-cols-[1.1fr_1fr] md:gap-[5vw] md:p-[4vw]">
        <div className="pointer-events-none absolute -right-[10%] top-1/2 h-[120%] w-[60%] -translate-y-1/2 blur-3xl" style={{ background: "radial-gradient(closest-side, rgb(240 185 174 / 0.16), transparent)" }} />
        <div className="relative">
          <p className="label text-blush">Made for one person</p>
          <SplitWords text={"Compose\n*your own.*"} className="display mt-5 text-[clamp(64px,9vw,168px)] text-paper" />
          <p className="mt-7 max-w-[40ch] text-[15px] leading-relaxed text-line/65">
            Pick the stems, the colours, the greenery and the wrap. The bouquet draws itself as you go, the price follows, and we tie exactly that the morning you need it.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <Magnetic>
              <Link href="/shop/build" data-cursor="Compose" className="pill bg-blush text-night hover:bg-paper">
                Start with a stem <span aria-hidden>→</span>
              </Link>
            </Magnetic>
            <span className="label text-line/45">From {usd(12)} · no account needed</span>
          </div>
        </div>
        <Link href="/shop/build" data-cursor="Compose" aria-label="Compose your own bouquet" className="relative mx-auto block aspect-[4/5] w-full max-w-[460px] overflow-hidden rounded-[6px]">
          <ProductImage key={i} recipe={idea} mode="load" />
          <span className="label absolute bottom-4 left-4 right-4 flex justify-between rounded-full bg-night/60 px-4 py-2 text-line/80 backdrop-blur-md">
            <span>One idea of many</span>
            <span className="tabular-nums text-blush">{usd(recipePrice(idea))}</span>
          </span>
        </Link>
      </div>
    </section>
  );
}
