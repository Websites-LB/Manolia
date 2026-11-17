"use client";

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
      <div className="gutter sticky top-0 z-30 bg-night/70 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-6 overflow-x-auto py-3 [scrollbar-width:none]">
          <div className="flex gap-2">
            {CATEGORIES.map((c) => {
              const n = c.id === "all" ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === c.id).length;
              return (
                <button key={c.id} onClick={() => setCat(c.id)} className={cn("shrink-0 rounded-full border px-5 py-2.5 text-[17px] transition-colors duration-500", cat === c.id ? "border-paper bg-paper text-night" : "border-line/20 text-line/70 hover:border-line/60")}>
                  {c.label} <span className="ml-0.5 text-[13px] opacity-50">{n}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* keyed by category, so choosing one replays the arrival of its pieces (plain CSS, no animation library) */}
      <div key={cat} className="gutter mt-10 grid gap-x-[1.8vw] gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => (
          <div key={p.id} className="animate-[rise_1.2s_cubic-bezier(.16,1,.3,1)_both]" style={{ animationDelay: `${i * 0.06}s` }}>
            <ProductCard product={p} onOpen={() => setOpen(p)} />
          </div>
        ))}
      </div>
      <ProductDialog product={open} onClose={() => setOpen(null)} />
    </>
  );
}
