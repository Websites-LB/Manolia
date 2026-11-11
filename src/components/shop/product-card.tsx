"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

import { usd, useCart } from "@/lib/cart-store";
import { CATEGORIES, type Product } from "@/lib/products";
import { cn } from "@/lib/utils";

import { ProductImage } from "./product-image";

/**
 * A plate that behaves like an object: it leans toward the pointer, a light in its own colour
 * follows the cursor across it, and its glow spills onto the night around it.
 */
export function ProductCard({ product, onOpen, className }: { product: Product; onOpen: () => void; className?: string }) {
  const add = useCart((s) => s.add);
  const cat = CATEGORIES.find((c) => c.id === product.category)?.label;
  const plate = useRef<HTMLDivElement>(null);
  const light = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = plate.current;
    const glow = light.current;
    if (!el || !glow || !window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rx = gsap.quickTo(el, "rotationX", { duration: 1.1, ease: "expo.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 1.1, ease: "expo.out" });
    const gx = gsap.quickTo(glow, "xPercent", { duration: 0.9, ease: "expo.out" });
    const gy = gsap.quickTo(glow, "yPercent", { duration: 0.9, ease: "expo.out" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      ry(nx * 9);
      rx(-ny * 7);
      gx(nx * 100);
      gy(ny * 100);
    };
    const leave = () => {
      rx(0);
      ry(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <article className={cn("group relative", className)}>
      {/* the piece's own colour, spilling onto the night */}
      <div
        className="pointer-events-none absolute -inset-x-8 -top-8 bottom-16 opacity-0 blur-3xl transition-opacity duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:opacity-100"
        style={{ background: `radial-gradient(closest-side, ${product.art.tint}40, transparent)` }}
      />
      <div style={{ perspective: 1100 }}>
        <div ref={plate} className="relative will-change-transform">
          <button onClick={onOpen} className="relative block aspect-[4/5] w-full overflow-hidden rounded-[6px]" aria-label={`View ${product.name}`} data-cursor="View">
            <div className="h-full w-full transition-transform duration-[1600ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05]">
              <ProductImage product={product} />
            </div>
            <div
              ref={light}
              className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-700 group-hover:opacity-100"
              style={{ background: "radial-gradient(42% 34% at 50% 50%, #fff6e6cc, transparent)" }}
            />
          </button>
          <span className="label pointer-events-none absolute left-4 top-4 rounded-full bg-night/55 px-3 py-1.5 text-line/75 backdrop-blur-md">{cat}</span>
        </div>
      </div>
      <div className="relative mt-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h3 className="display text-[40px] text-paper md:text-[52px]">{product.name}</h3>
          <p className="label mt-2 truncate text-line/45">{product.stems}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2.5">
          <span className="display text-[32px] tabular-nums text-blush">{usd(product.price)}</span>
          <button
            onClick={() => add(product.id)}
            className="label rounded-full border border-line/25 px-4 py-2 text-line/85 transition-colors duration-500 hover:border-paper hover:bg-paper hover:text-night"
            aria-label={`Add ${product.name} to bag`}
          >
            Add to bag +
          </button>
        </div>
      </div>
    </article>
  );
}
