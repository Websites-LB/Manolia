import type { Metadata } from "next";

import { SplitWords } from "@/components/motion/split-words";
import { ShopGrid } from "@/components/shop/shop-grid";

export const metadata: Metadata = {
  title: "Shop · Manolia The Floral Boutique",
  description: "Hand-tied bouquets, hat boxes and vase arrangements from Manolia in Jbeil, Byblos. Order online and confirm on WhatsApp.",
};

export default function ShopPage() {
  return (
    <div className="bg-paper pb-[clamp(96px,12vw,180px)] text-ink">
      <div className="gutter pb-12 pt-32 md:pb-16 md:pt-44">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="label text-ink/50">The shop — tied to order</p>
            <SplitWords as="h1" immediate delay={0.1} text="Fresh flowers, *this morning.*" className="display mt-5 text-[clamp(60px,10vw,180px)]" />
          </div>
          <p className="max-w-[36ch] text-[14px] leading-relaxed text-ink/60">
            Choose a piece, add a note for the card, and send the order on WhatsApp. We confirm availability, delivery and payment with you directly.
          </p>
        </div>
      </div>
      <ShopGrid />
    </div>
  );
}
