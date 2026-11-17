"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";

import { ProductImage } from "@/components/shop/product-image";
import { usd, useCart } from "@/lib/cart-store";
import { PRODUCTS, type Product } from "@/lib/products";

import { ChapterHead, Lane } from "./parts";

gsap.registerPlugin(ScrollTrigger);

function Card({ p }: { p: Product }) {
  const add = useCart((s) => s.add);
  return (
    <article className="ready-card group w-[78vw] shrink-0 snap-start sm:w-[46vw] md:w-[clamp(300px,25vw,400px)]">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[12px]">
        <div className="h-full w-full transition-transform duration-[1600ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05]">
          <ProductImage product={p} />
        </div>
        <span className="display absolute right-4 top-4 rounded-full bg-night/70 px-4 py-1.5 text-[24px] text-blush backdrop-blur-md">{usd(p.price)}</span>
      </div>
      <h3 className="display mt-5 text-[38px] text-paper md:text-[46px]">{p.name}</h3>
      <p className="mt-2 line-clamp-2 min-h-[2.8em] text-[15px] leading-snug text-line/60">{p.blurb}</p>
      <button
        onClick={() => add(p.id)}
        className="pill mt-5 w-full justify-center bg-paper text-night hover:bg-blush"
        aria-label={`Add ${p.name} to bag, ${usd(p.price)}`}
      >
        Add to bag · {usd(p.price)}
      </button>
    </article>
  );
}

/**
 * Chapter one: ready bouquets. On a computer the page holds still and the bouquets slide past as you
 * scroll; on a phone they sit in a row you swipe, the way every app on the phone already works.
 */
export function Ready() {
  const stage = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = stage.current;
    const row = track.current;
    if (!el || !row) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const dist = () => Math.max(0, row.scrollWidth - window.innerWidth);
      const size = () => (el.style.height = `${dist() + window.innerHeight}px`);
      size();
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.8, invalidateOnRefresh: true, onRefreshInit: size },
      });
      tl.to(row, { x: () => -dist(), ease: "none" }, 0).fromTo(bar.current, { scaleX: 0 }, { scaleX: 1, ease: "none" }, 0);
      // each bouquet tips upright as it slides in from the right
      gsap.utils.toArray<HTMLElement>(".ready-card", row).forEach((c) => {
        gsap.fromTo(c, { rotate: 3, y: 40 }, { rotate: 0, y: 0, ease: "none", scrollTrigger: { trigger: c, containerAnimation: tl, start: "left right", end: "left 55%", scrub: true } });
      });
      return () => (el.style.height = "");
    });
    return () => mm.revert();
  }, []);

  return (
    <section className="relative text-line">
      <ChapterHead id="ready" bloom="#e3909a" kicker="Ready to send" title={"Get them something\n*special.*"}>
        <p className="mt-7 max-w-[44ch] text-[17px] leading-relaxed text-line/65">Bouquets, boxes and vases our florist designs every week. Tap one, pay by Whish or card, and we deliver it the same day.</p>
      </ChapterHead>

      <div ref={stage} className="relative mt-12 md:mt-0">
        <div className="relative z-10 md:sticky md:top-0 md:flex md:h-[100svh] md:flex-col md:justify-center md:overflow-hidden">
          <div
            ref={track}
            className="gutter relative z-10 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto pb-4 [scrollbar-width:none] md:w-max md:snap-none md:gap-[2.2vw] md:overflow-visible md:pl-[8vw] md:pr-[8vw]"
          >
            {PRODUCTS.map((p) => (
              <Card key={p.id} p={p} />
            ))}
            <Link
              href="/shop"
              data-cursor="Shop"
              className="ready-card group flex w-[60vw] shrink-0 snap-start flex-col justify-center rounded-[12px] border border-line/15 p-8 transition-colors duration-700 hover:border-blush sm:w-[40vw] md:w-[clamp(260px,20vw,340px)]"
            >
              <p className="label text-line/50">{PRODUCTS.length} pieces and more</p>
              <p className="display mt-4 text-[52px] text-paper md:text-[64px]">
                See the whole <em>shop</em>
              </p>
              <span className="display mt-6 text-[48px] text-blush transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-3">→</span>
            </Link>
          </div>
          <p className="label gutter mt-2 text-line/40 md:hidden">Swipe to see more →</p>
          <div className="gutter mt-10 hidden md:block md:pl-[8vw] md:pr-[8vw]">
            <div className="h-px w-full bg-line/12">
              <div ref={bar} className="h-px origin-left bg-blush" />
            </div>
          </div>
        </div>
      </div>
      <Lane />
    </section>
  );
}
