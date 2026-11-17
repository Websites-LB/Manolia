import type { Metadata } from "next";

import Link from "next/link";

import { SplitWords } from "@/components/motion/split-words";
import { BuildBanner } from "@/components/shop/build-banner";
import { FloristChoice } from "@/components/shop/florist-choice";
import { ShopGrid } from "@/components/shop/shop-grid";

export const metadata: Metadata = {
  title: "Shop · Manolia The Floral Boutique",
  description: "Hand-tied bouquets, hat boxes and vase arrangements from Manolia in Jbeil, Byblos. Compose your own or leave it to the florist, pay by Whish or card, and follow your order.",
};

export default function ShopPage() {
  return (
    <div className="relative overflow-hidden pb-[clamp(96px,12vw,180px)] text-line" style={{ background: "linear-gradient(#13241a, #0f1b13 22%, #0c1610 70%, #0b140f)" }}>
      <div className="pointer-events-none absolute -left-[12%] top-[-6%] h-[70vh] w-[60vw] blur-3xl" style={{ background: "radial-gradient(closest-side, rgb(240 185 174 / 0.13), transparent)" }} />
      <div className="gutter relative pb-14 pt-32 md:pb-20 md:pt-44">
        <p className="label text-blush">The shop</p>
        <SplitWords as="h1" immediate delay={0.1} text={"Fresh flowers,\n*this morning.*"} className="display mt-6 text-[clamp(60px,11vw,200px)] text-paper" />
        <p className="mt-8 max-w-[44ch] text-[17px] leading-relaxed text-line/65">
          Three ways to order. Pay by Whish or card, and follow it from our bench to their door.
        </p>
        <div className="mt-10 grid gap-3 md:grid-cols-3 md:gap-4">
          {[
            ["#pieces", "Ready bouquets", "Pick one, pay, done."],
            ["/shop/build", "Build your own", "Choose flowers, colours and wrap."],
            ["#florist", "Let the florist choose", "Describe them, get a proposal first."],
          ].map(([href, t, d]) => (
            <Link key={href} href={href} data-cursor="Go" className="group flex items-center justify-between gap-4 rounded-[14px] border border-line/15 bg-[#0e1a12]/80 p-5 transition-colors duration-700 hover:border-blush md:p-7">
              <span>
                <span className="display block text-[30px] text-paper md:text-[38px]">{t}</span>
                <span className="mt-1 block text-[15px] text-line/60">{d}</span>
              </span>
              <span className="display text-[34px] text-blush transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-2">→</span>
            </Link>
          ))}
        </div>
      </div>
      <div id="pieces" className="scroll-mt-4">
        <ShopGrid />
      </div>
      <div className="mt-[clamp(96px,12vw,180px)]">
        <BuildBanner />
      </div>
      <div className="mt-[clamp(96px,12vw,180px)]">
        <FloristChoice />
      </div>
    </div>
  );
}
