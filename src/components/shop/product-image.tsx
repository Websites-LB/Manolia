"use client";

import { Engraving } from "@/components/art/engraving";
import { buildArrangement, PLATE_VIEW } from "@/lib/botanic/specimen";
import type { Product } from "@/lib/products";
import { cn } from "@/lib/utils";

/**
 * A product shown as an engraved plate instead of a stock photograph: the arrangement drawn in
 * the house hand on night ground, framed like a page from a botanical folio.
 */
export function ProductImage({ product, className, mode = "view" }: { product: Product; className?: string; mode?: "view" | "static"; sizes?: string }) {
  return (
    <div
      className={cn("relative h-full w-full overflow-hidden bg-forest", className)}
      style={{ background: `radial-gradient(70% 55% at 50% 38%, ${product.art.tint}22, transparent 70%), #13241a` }}
    >
      <Engraving build={() => buildArrangement(product.art.flower, product.art.style, product.art.tint, product.art.seed)} view={PLATE_VIEW} mode={mode} pace={0.12} label={`${product.name}, drawn: ${product.stems}`} className="absolute inset-[6%] h-[88%] w-[88%]" />
      <div className="pointer-events-none absolute inset-[3%] border border-line/15" />
    </div>
  );
}
