"use client";

import { usd, useCart } from "@/lib/cart-store";
import { CATEGORIES, type Product } from "@/lib/products";
import { cn } from "@/lib/utils";

import { ProductImage } from "./product-image";

/** Editorial product card: big photograph, the name in the display serif, the facts in mono. */
export function ProductCard({ product, index, onOpen, className, sizes }: { product: Product; index: number; onOpen: () => void; className?: string; sizes?: string }) {
  const add = useCart((s) => s.add);
  const cat = CATEGORIES.find((c) => c.id === product.category)?.label;

  return (
    <article className={cn("group", className)}>
      <div className="label mb-3 flex justify-between text-current/50">
        <span>N°{String(index + 1).padStart(2, "0")}</span>
        <span>{cat}</span>
      </div>
      <button onClick={onOpen} className="block w-full overflow-hidden rounded-[4px]" aria-label={`View ${product.name}`} data-cursor="View">
        <div className="aspect-[4/5] transition-transform duration-[1600ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.045]">
          <ProductImage product={product} sizes={sizes} />
        </div>
      </button>
      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="display text-[40px] md:text-[48px]">{product.name}</h3>
          <p className="label mt-2 truncate text-current/50">{product.stems}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3">
          <span className="display text-[28px] tabular-nums">{usd(product.price)}</span>
          <button onClick={() => add(product.id)} className="label link-u" aria-label={`Add ${product.name} to bag`}>
            Add +
          </button>
        </div>
      </div>
    </article>
  );
}
