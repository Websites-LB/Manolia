"use client";

import { FadeUp } from "@/components/motion/fade-up";
import { SplitWords } from "@/components/motion/split-words";
import { ProductImage } from "@/components/shop/product-image";
import { STARTER } from "@/lib/custom";
import { PRODUCTS } from "@/lib/products";

const DOORS = [
  { href: "#ready", title: "Pick a ready bouquet", line: "Already designed by our florist. Choose one, pay, done.", art: <ProductImage product={PRODUCTS[0]} frame={false} /> },
  { href: "#build", title: "Build your own", line: "Choose the flowers, the colours and the wrap. Watch it come together.", art: <ProductImage recipe={STARTER} frame={false} /> },
  {
    href: "#ask",
    title: "Let the florist choose",
    line: "Tell us about the person. We send you a proposal before you pay.",
    art: <ProductImage brief={{ occasion: "birthday", palette: "sunset", about: "", budget: 70 }} frame={false} />,
  },
];

/** Right after the hero: the three ways to order, as three big doors anyone can tap. */
export function Chooser() {
  return (
    <section className="relative z-10 pb-6 pt-[clamp(110px,16vh,180px)] text-line">
      <div className="gutter flex flex-col items-center text-center">
        <span data-vine data-bloom="#f0b9ae" className="mb-12 hidden h-px w-px md:block" />
        <span data-vine data-bloom="#f0b9ae" className="absolute right-[14px] top-[clamp(110px,16vh,180px)] h-px w-px md:hidden" />
        <p className="label text-line/55">Three easy ways</p>
        <SplitWords text={"How would you like\nto *send flowers?*"} className="display mt-5 text-[clamp(48px,7vw,124px)] text-paper" />
      </div>
      <FadeUp className="gutter mt-14 grid gap-4 md:mt-20 md:grid-cols-3 md:gap-[1.6vw]" stagger={0.12}>
        {DOORS.map((d) => (
          <a key={d.href} href={d.href} data-cursor="Go" className="group relative flex overflow-hidden rounded-[14px] border border-line/12 bg-[#0e1a12]/90 backdrop-blur-sm transition-colors duration-700 hover:border-blush/50 md:flex-col">
            <div className="relative aspect-square w-[34%] shrink-0 overflow-hidden md:aspect-[5/4] md:w-full">
              <div className="h-full w-full transition-transform duration-[1600ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]">{d.art}</div>
            </div>
            <div className="flex flex-1 flex-col justify-center p-5 md:p-7">
              <p className="display text-[30px] text-paper md:text-[40px]">{d.title}</p>
              <p className="mt-2 text-[15px] leading-snug text-line/65 md:text-[16px]">{d.line}</p>
              <span className="label mt-4 inline-flex items-center gap-2 text-blush md:mt-6">
                Start here
                <span aria-hidden className="transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-y-1">↓</span>
              </span>
            </div>
          </a>
        ))}
      </FadeUp>
    </section>
  );
}
