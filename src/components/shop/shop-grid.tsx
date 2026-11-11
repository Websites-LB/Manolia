"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { CATEGORIES, PRODUCTS, type Category, type Product } from "@/lib/products";
import { waLink } from "@/lib/site";
import { cn } from "@/lib/utils";

import { ProductCard } from "./product-card";
import { ProductDialog } from "./product-dialog";

const EASE = [0.16, 1, 0.3, 1] as const;

export function ShopGrid() {
  const [cat, setCat] = useState<Category | "all">("all");
  const [open, setOpen] = useState<Product | null>(null);
  const list = PRODUCTS.filter((p) => cat === "all" || p.category === cat);

  return (
    <>
      <div className="gutter sticky top-0 z-30 border-y border-ink/10 bg-paper/90 backdrop-blur-md">
        <div className="flex items-center justify-between gap-6 overflow-x-auto py-4 pl-[min(30vw,140px)] [scrollbar-width:none] md:pl-0">
          <div className="flex gap-6 md:gap-10">
            {CATEGORIES.map((c) => {
              const n = c.id === "all" ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === c.id).length;
              return (
                <button key={c.id} onClick={() => setCat(c.id)} className={cn("label relative shrink-0 transition-colors duration-500", cat === c.id ? "text-ink" : "text-ink/40 hover:text-ink/70")}>
                  {c.label} <sup className="text-[9px]">{n}</sup>
                  {cat === c.id && <motion.span layoutId="cat" className="absolute -bottom-[17px] left-0 right-0 h-px bg-ink" transition={{ duration: 0.7, ease: EASE }} />}
                </button>
              );
            })}
          </div>
          <span className="label hidden shrink-0 text-ink/40 md:block">Prices in USD · confirmed on WhatsApp</span>
        </div>
      </div>

      <motion.div layout className="gutter mt-12 grid gap-x-[2.2vw] gap-y-20 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 1.2, delay: i * 0.06, ease: EASE } }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              className={cn(i % 3 === 1 && "lg:mt-24")}
            >
              <ProductCard product={p} index={PRODUCTS.indexOf(p)} onOpen={() => setOpen(p)} />
            </motion.div>
          ))}
          <motion.a
            key="bespoke"
            layout
            href={waLink("Hello Manolia! I'd like something bespoke.")}
            target="_blank"
            rel="noreferrer"
            data-cursor="Write"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="night-glow flex aspect-[4/5] flex-col justify-between self-start rounded-[4px] p-8 text-paper sm:mt-[30px]"
          >
            <p className="label text-paper/50">Bespoke</p>
            <div>
              <p className="display text-[56px] md:text-[68px]">
                Something only <em>for them?</em>
              </p>
              <p className="mt-5 max-w-[34ch] text-[14px] leading-relaxed text-paper/65">
                Tell us the person, the colours, the occasion. We compose it and send you a photo before it leaves the boutique.
              </p>
              <p className="label link-u mt-8 inline-block text-paper/85">Ask on WhatsApp →</p>
            </div>
          </motion.a>
        </AnimatePresence>
      </motion.div>
      <ProductDialog product={open} onClose={() => setOpen(null)} />
    </>
  );
}
