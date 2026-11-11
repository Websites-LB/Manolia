import type { Metadata } from "next";

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
        <p className="label text-line/50">The shop, tied to order</p>
        <SplitWords as="h1" immediate delay={0.1} text={"Fresh flowers,\n*this morning.*"} className="display mt-6 text-[clamp(64px,12.5vw,230px)] text-paper" />
        <p className="mt-8 max-w-[40ch] text-[15px] leading-relaxed text-line/60 md:ml-auto md:mt-[-3.2em]">
          Choose a piece or compose your own. Pay by Whish or card, and follow it from our bench to their door.
        </p>
      </div>
      <BuildBanner />
      <div className="mt-[clamp(72px,9vw,140px)]">
        <ShopGrid />
      </div>
      <div className="mt-[clamp(96px,12vw,180px)]">
        <FloristChoice />
      </div>
    </div>
  );
}
