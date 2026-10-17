"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X } from "lucide-react";
import dynamic from "next/dynamic";

import { usd, useCart } from "@/lib/cart-store";
import type { Product } from "@/lib/products";

import { ProductImage } from "./product-image";

const BouquetViewer = dynamic(() => import("./bouquet-viewer").then((m) => m.BouquetViewer), { ssr: false });

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);

  return (
    <Dialog.Root>
      <article className="group">
        <Dialog.Trigger asChild>
          <button className="block w-full text-left" aria-label={`View ${product.name}`}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem]">
              <div className="h-full w-full transition-transform duration-[1600ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.035]">
                <ProductImage product={product} />
              </div>
              <span className="absolute bottom-4 left-4 rounded-full bg-paper/80 px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-forest opacity-0 backdrop-blur transition-opacity duration-500 group-hover:opacity-100">
                View in 3D
              </span>
            </div>
          </button>
        </Dialog.Trigger>
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-[1.7rem] leading-none text-forest">{product.name}</h3>
            <p className="mt-2 text-xs tracking-wide text-ink/55">{product.stems}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-display text-xl tabular-nums text-forest">{usd(product.price)}</span>
            <button
              onClick={() => add(product.id)}
              className="flex h-9 w-9 items-center justify-center rounded-full border hairline text-forest transition-colors hover:border-forest hover:bg-forest hover:text-cream"
              aria-label={`Add ${product.name} to bag`}
            >
              <Plus className="h-4 w-4" strokeWidth={1.4} />
            </button>
          </div>
        </div>
      </article>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-forest-deep/35 backdrop-blur-[3px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          data-lenis-prevent
          className="fixed inset-x-3 bottom-3 top-14 z-50 mx-auto grid max-w-5xl overflow-y-auto rounded-[1.75rem] bg-paper shadow-2xl duration-500 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.98] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] md:inset-6 md:my-auto md:h-fit md:max-h-[86vh] md:grid-cols-[1.1fr_1fr] md:overflow-hidden"
        >
          <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[560px]">
            <BouquetViewer recipe={product.recipe} />
            <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[0.62rem] uppercase tracking-[0.25em] text-forest/50">Drag to turn</p>
          </div>
          <div className="flex flex-col p-8 md:p-12">
            <Dialog.Close className="ml-auto flex h-9 w-9 items-center justify-center rounded-full hover:bg-forest/5" aria-label="Close">
              <X className="h-4 w-4 text-forest" strokeWidth={1.4} />
            </Dialog.Close>
            <p className="eyebrow mt-2">{product.stems}</p>
            <Dialog.Title className="mt-4 font-display text-5xl leading-none text-forest md:text-6xl">{product.name}</Dialog.Title>
            <Dialog.Description className="chapter-body">{product.blurb}</Dialog.Description>
            <ul className="mt-8 space-y-2 border-t hairline pt-6 text-sm text-ink/65">
              <li>Tied to order the morning you need it</li>
              <li>Pick up in Jbeil, or delivered by our team</li>
              <li>Handwritten card included</li>
            </ul>
            <div className="mt-auto flex items-center justify-between gap-4 pt-10">
              <span className="font-display text-4xl tabular-nums text-forest">{usd(product.price)}</span>
              <Dialog.Close asChild>
                <button className="btn-primary" onClick={() => add(product.id)}>
                  Add to bag
                </button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
