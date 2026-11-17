import type { Metadata } from "next";

import Link from "next/link";

import { SplitWords } from "@/components/motion/split-words";
import { BuildBanner } from "@/components/shop/build-banner";
import { FloristChoice } from "@/components/shop/florist-choice";
import { ShopCover } from "@/components/shop/shop-cover";
import { ShopGrid } from "@/components/shop/shop-grid";

export const metadata: Metadata = {
  title: "Shop · Manolia The Floral Boutique",
  description: "Hand-tied bouquets, hat boxes and vase arrangements from Manolia in Jbeil, Byblos. Compose your own or leave it to the florist, pay by Whish or card, and follow your order.",
};

export default function ShopPage() {
  return (
    <div className="relative overflow-hidden pb-[clamp(96px,12vw,180px)] text-line" style={{ background: "linear-gradient(#13241a, #0f1b13 22%, #0c1610 70%, #0b140f)" }}>
      <div className="pointer-events-none absolute -left-[12%] top-[-6%] h-[70vh] w-[60vw] blur-3xl" style={{ background: "radial-gradient(closest-side, rgb(240 185 174 / 0.13), transparent)" }} />
      <div className="gutter relative grid items-end gap-10 pb-12 pt-32 md:grid-cols-[1.3fr_1fr] md:pb-16 md:pt-40">
        <div>
          <SplitWords as="h1" immediate delay={0.1} text={"Fresh flowers,\n*this morning.*"} className="display text-[clamp(60px,10vw,190px)] text-paper" />
          <nav className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-[20px] italic md:text-[24px]">
            <a href="#pieces" className="link-u text-paper">Ready bouquets ↓</a>
            <Link href="/shop/build" className="link-u text-line/70 hover:text-paper">Make your own →</Link>
            <a href="#florist" className="link-u text-line/70 hover:text-paper">Let us choose ↓</a>
          </nav>
        </div>
        <ShopCover />
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
