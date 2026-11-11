"use client";

import Link from "next/link";
import { useState } from "react";

import { CATEGORIES, PRODUCTS, type Category, type Product } from "@/lib/products";
import { cn } from "@/lib/utils";

import { ProductCard } from "./product-card";
import { ProductDialog } from "./product-dialog";

export function ShopGrid() {
  const [cat, setCat] = useState<Category | "all">("all");
  const [open, setOpen] = useState<Product | null>(null);
  const list = PRODUCTS.filter((p) => cat === "all" || p.category === cat);

  return (
    <>
      <div className="gutter sticky top-0 z-30 border-y border-line/10 bg-night/75 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-6 overflow-x-auto py-4 pl-[min(30vw,140px)] [scrollbar-width:none] md:pl-0">
          <div className="flex gap-6 md:gap-10">
            {CATEGORIES.map((c) => {
              const n = c.id === "all" ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === c.id).length;
              return (
                <button key={c.id} onClick={() => setCat(c.id)} className={cn("label relative shrink-0 transition-colors duration-500", cat === c.id ? "text-paper" : "text-line/40 hover:text-line/75")}>
                  {c.label} <sup className="text-[9px]">{n}</sup>
                  <span className={cn("absolute -bottom-[17px] left-0 right-0 h-px origin-left bg-blush transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)]", cat === c.id ? "scale-x-100" : "scale-x-0")} />
                </button>
              );
            })}
          </div>
          <div className="hidden shrink-0 gap-8 md:flex">
            <a href="#florist" className="label link-u text-line/70">
              Not sure? Let us choose ↓
            </a>
            <Link href="/shop/build" className="label link-u text-blush">
              Compose your own →
            </Link>
          </div>
        </div>
      </div>

      {/* keyed by category, so choosing one replays the arrival of its pieces (plain CSS, no animation library) */}
      <div key={cat} className="gutter mt-16 grid gap-x-[2.6vw] gap-y-24 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => (
          <div key={p.id} className={cn("animate-[rise_1.2s_cubic-bezier(.16,1,.3,1)_both]", i % 3 === 1 && "lg:mt-28")} style={{ animationDelay: `${i * 0.06}s` }}>
            <ProductCard product={p} onOpen={() => setOpen(p)} />
          </div>
        ))}
      </div>
      <ProductDialog product={open} onClose={() => setOpen(null)} />
    </>
  );
}
