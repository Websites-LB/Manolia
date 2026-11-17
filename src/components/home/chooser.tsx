"use client";

import { FadeUp } from "@/components/motion/fade-up";
import { SplitWords } from "@/components/motion/split-words";
import { ProductImage } from "@/components/shop/product-image";
import { STARTER } from "@/lib/custom";
import { PRODUCTS } from "@/lib/products";

const DOORS = [
  { href: "#ready", title: "Ready to *send*", art: <ProductImage product={PRODUCTS[1]} frame={false} /> },
  { href: "#build", title: "Make your *own*", art: <ProductImage recipe={STARTER} frame={false} /> },
  { href: "#ask", title: "Let us *choose*", art: <ProductImage brief={{ occasion: "Birthday", palette: "lavender", about: "", budget: 70 }} frame={false} /> },
];

const italic = (t: string) => t.split(/(\*[^*]+\*)/).map((c, i) => (c.startsWith("*") ? <em key={i}>{c.slice(1, -1)}</em> : c));

/** Right after the hero: the three ways to order, as three tall pictures anyone can tap. */
export function Chooser() {
  return (
    <section className="relative z-10 pt-[clamp(120px,18vh,200px)] text-line">
      <span data-vine className="absolute right-[14px] top-[clamp(60px,9vh,100px)] h-px w-px md:left-[3.6vw] md:right-auto" />
      <div className="gutter md:pl-[8vw]">
        <SplitWords text={"Send something\n*beautiful.*"} className="display text-[clamp(56px,9.4vw,172px)] text-paper" />
      </div>
      <FadeUp className="gutter mt-12 grid gap-3 md:mt-16 md:grid-cols-3 md:gap-[1.4vw] md:pl-[8vw]" stagger={0.12}>
        {DOORS.map((d, i) => (
          <a key={d.href} href={d.href} data-cursor="Go" className={`group relative block overflow-hidden rounded-[16px] ${i === 1 ? "md:translate-y-[6vw]" : ""}`}>
            <div className="aspect-[4/3] md:aspect-[3/4]">
              <div className="h-full w-full transition-transform duration-[1800ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.07]">{d.art}</div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-night/90 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 md:p-7">
              <p className="display text-[40px] text-paper md:text-[clamp(40px,3.6vw,60px)]">{italic(d.title)}</p>
              <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-paper/40 text-paper transition-colors duration-700 group-hover:border-blush group-hover:bg-blush group-hover:text-night">↓</span>
            </div>
          </a>
        ))}
      </FadeUp>
    </section>
  );
}
