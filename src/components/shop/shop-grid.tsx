"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { CATEGORIES, PRODUCTS, type Category } from "@/lib/products";
import { waLink } from "@/lib/site";
import { cn } from "@/lib/utils";

import { ProductCard } from "./product-card";

export function ShopGrid() {
  const [cat, setCat] = useState<Category | "all">("all");
  const list = PRODUCTS.filter((p) => cat === "all" || p.category === cat);

  return (
    <>
      <div className="sticky top-16 z-30 -mx-6 border-b hairline bg-cream/85 px-6 backdrop-blur-md md:top-20 md:-mx-12 md:px-12">
        <div className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto py-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={cn(
                "relative shrink-0 rounded-full px-4 py-2 text-[0.72rem] uppercase tracking-[0.2em] transition-colors",
                cat === c.id ? "text-cream" : "text-forest hover:bg-forest/5",
              )}
            >
              {cat === c.id && <motion.span layoutId="cat" className="absolute inset-0 rounded-full bg-forest" transition={{ type: "spring", stiffness: 380, damping: 34 }} />}
              <span className="relative">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <motion.div layout className="mx-auto mt-14 grid max-w-[1400px] gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
          <motion.a
            key="bespoke"
            layout
            href={waLink("Hello Manolia! I'd like something bespoke.")}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="group flex aspect-[4/5] flex-col justify-between rounded-[1.25rem] bg-forest p-8 text-cream"
          >
            <p className="eyebrow !text-cream/55">Bespoke</p>
            <div>
              <p className="font-display text-5xl leading-[0.95]">Something only for them?</p>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/65">
                Tell us the person, the colours, the occasion. We&apos;ll compose it and send you a photo before it leaves the boutique.
              </p>
              <span className="mt-8 inline-block border-b border-cream/40 pb-1 text-[0.72rem] uppercase tracking-[0.2em] transition-colors group-hover:border-cream">
                Ask on WhatsApp
              </span>
            </div>
          </motion.a>
        </AnimatePresence>
      </motion.div>
    </>
  );
}
