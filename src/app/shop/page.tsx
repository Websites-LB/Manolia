import type { Metadata } from "next";

import { ShopGrid } from "@/components/shop/shop-grid";

export const metadata: Metadata = {
  title: "Shop · Manolia The Floral Boutique",
  description: "Hand-tied bouquets, hat boxes and vase arrangements from Manolia in Jbeil, Byblos. Order online and confirm on WhatsApp.",
};

export default function ShopPage() {
  return (
    <div className="px-6 pb-32 pt-32 md:px-12 md:pt-44">
      <div className="mx-auto max-w-[1400px] pb-14">
        <p className="eyebrow animate-[rise_1s_ease-out_both]">The shop</p>
        <h1 className="mt-5 max-w-4xl animate-[rise_1.1s_0.08s_ease-out_both] font-display text-[clamp(3.2rem,7vw,6.5rem)] leading-[0.92] text-forest">
          Fresh flowers, <span className="font-script text-[0.82em] text-forest/75">tied for you</span> this morning.
        </h1>
        <p className="chapter-body animate-[rise_1.2s_0.16s_ease-out_both]">
          Choose a piece, add a note for the card, and send the order on WhatsApp. We confirm availability, delivery and payment with you directly.
        </p>
      </div>
      <ShopGrid />
    </div>
  );
}
