"use client";

import { useEffect, useRef, useState } from "react";

import { usd, useCart } from "@/lib/cart-store";
import { PRODUCTS } from "@/lib/products";

import { ProductImage } from "./product-image";

/** this week's three, shown in turn on the cover */
const FEATURED = ["old-souk", "lavender-hour", "velvet-box"].map((id) => PRODUCTS.find((p) => p.id === id)!).filter(Boolean);

/**
 * The shop's cover picture: one bouquet at a time, leaning slightly like a print pinned to a wall,
 * changing every few seconds while it is on screen, with its name, price and a way to take it.
 */
export function ShopCover() {
  const add = useCart((s) => s.add);
  const [i, setI] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let on = false;
    const io = new IntersectionObserver((e) => (on = e.some((x) => x.isIntersecting)));
    io.observe(el);
    const t = setInterval(() => on && !document.hidden && setI((n) => (n + 1) % FEATURED.length), 7000);
    return () => {
      clearInterval(t);
      io.disconnect();
    };
  }, []);

  const p = FEATURED[i];
  return (
    <div ref={box} className="relative mx-auto w-full max-w-[340px] md:mr-0 md:max-w-[420px]">
      <div className="pointer-events-none absolute inset-[-18%] blur-3xl transition-[background] duration-[1500ms]" style={{ background: `radial-gradient(closest-side, ${p.art.tint}38, transparent)` }} />
      <div className="relative rotate-[2deg] overflow-hidden rounded-[22px] shadow-[0_70px_120px_-50px_rgb(0_0_0/0.9)] transition-transform duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] hover:rotate-0">
        <div className="aspect-[4/5]">
          <div key={p.id} className="h-full w-full animate-[arrive_1.2s_cubic-bezier(.16,1,.3,1)_both]">
            <ProductImage product={p} mode="load" frame={false} />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-night/90 to-transparent p-5 pt-16">
          <div>
            <p className="text-[15px] italic text-line/60">This week</p>
            <p className="display text-[36px] text-paper">{p.name}</p>
          </div>
          <button onClick={() => add(p.id)} className="mb-1 flex h-12 shrink-0 items-center gap-2 rounded-full bg-paper pl-5 pr-4 text-[16px] text-night transition-colors duration-500 hover:bg-blush" aria-label={`Add ${p.name} to bag`}>
            {usd(p.price)} <span className="text-[20px] leading-none">+</span>
          </button>
        </div>
      </div>
      <div className="mt-5 flex justify-center gap-2" aria-hidden>
        {FEATURED.map((f, k) => (
          <span key={f.id} className={`h-1 rounded-full transition-all duration-700 ${k === i ? "w-8 bg-blush" : "w-3 bg-line/20"}`} />
        ))}
      </div>
    </div>
  );
}
