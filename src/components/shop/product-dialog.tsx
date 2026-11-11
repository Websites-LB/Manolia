"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { usd, useCart } from "@/lib/cart-store";
import { CATEGORIES, type Product } from "@/lib/products";

import { ProductImage } from "./product-image";

/** Full product view: the plate on one side, the note card on the other. */
export function ProductDialog({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const add = useCart((s) => s.add);
  const cat = CATEGORIES.find((c) => c.id === product?.category)?.label;

  return (
    <Dialog.Root open={!!product} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-night/60 backdrop-blur-[3px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        {product && (
          <Dialog.Content
            data-lenis-prevent
            className="fixed inset-x-2 bottom-2 top-12 z-[71] mx-auto flex max-w-6xl flex-col overflow-y-auto rounded-[6px] bg-paper text-ink duration-700 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-6 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-10 md:inset-8 md:my-auto md:grid md:h-fit md:max-h-[88vh] md:grid-cols-[1.15fr_1fr] md:overflow-hidden"
          >
            <div className="relative aspect-[4/5] shrink-0 overflow-hidden md:aspect-auto md:min-h-[620px]">
              <ProductImage product={product} frame={false} />
            </div>
            <div className="relative flex flex-col p-6 md:p-12">
              <Dialog.Close
                className="label absolute right-4 top-4 flex items-center gap-2 rounded-full bg-paper/90 px-3 py-2 text-ink/70 hover:text-ink md:right-8 md:top-8"
                aria-label="Close"
              >
                Close <X className="h-3.5 w-3.5" strokeWidth={1.4} />
              </Dialog.Close>
              <p className="label text-ink/45 md:mt-10">{cat}</p>
              <Dialog.Title className="display mt-4 text-[64px] md:text-[96px]">{product.name}</Dialog.Title>
              <p className="label mt-4 text-ink/55">{product.stems}</p>
              <Dialog.Description className="mt-6 max-w-[42ch] text-[15px] leading-relaxed text-ink/70">{product.blurb}</Dialog.Description>
              <dl className="mt-10 grid grid-cols-2 gap-y-4 border-t border-ink/12 pt-6 text-[13px] text-ink/65">
                <dt className="label text-ink/40">Made</dt>
                <dd>The morning you need it</dd>
                <dt className="label text-ink/40">Collect</dt>
                <dd>In Jbeil, or delivered by our team</dd>
                <dt className="label text-ink/40">Card</dt>
                <dd>Handwritten, your words</dd>
              </dl>
              <div className="mt-auto flex items-end justify-between gap-4 pt-12">
                <span className="display text-[56px] tabular-nums">{usd(product.price)}</span>
                <Dialog.Close asChild>
                  <button className="pill bg-night text-paper hover:bg-moss" onClick={() => add(product.id)}>
                    Add to bag <span aria-hidden>+</span>
                  </button>
                </Dialog.Close>
              </div>
            </div>
          </Dialog.Content>
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
}
