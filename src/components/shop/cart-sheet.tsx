"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Minus, Plus, X } from "lucide-react";
import Link from "next/link";

import { cartItems, usd, useCart } from "@/lib/cart-store";

import { ProductImage } from "./product-image";

/** The bag: what you chose, and one way out of it, to the checkout. */
export function CartSheet() {
  const { lines, open, setOpen, setQty } = useCart();
  const items = cartItems(lines);
  const total = items.reduce((n, i) => n + i.qty * i.price, 0);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-night/60 backdrop-blur-[3px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          data-lenis-prevent
          className="fixed inset-y-0 right-0 z-[71] flex w-full max-w-md flex-col bg-paper text-ink duration-700 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right"
        >
          <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
            <Dialog.Title className="display text-[44px]">Your bag</Dialog.Title>
            <Dialog.Close className="label flex items-center gap-2 text-ink/60 hover:text-ink" aria-label="Close">
              Close <X className="h-3.5 w-3.5" strokeWidth={1.4} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Review your flowers, then go to the checkout.</Dialog.Description>

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <p className="display text-[56px] text-ink/80">
                <em>Nothing yet</em>
              </p>
              <p className="mt-3 text-sm text-ink/60">Choose a bouquet, or compose your own, and it will wait for you here.</p>
              <Link href="/shop/build" onClick={() => setOpen(false)} className="pill mt-8 bg-night text-paper hover:bg-moss">
                Compose your own <span aria-hidden>→</span>
              </Link>
              <Link href="/shop#florist" onClick={() => setOpen(false)} className="label link-u mt-5 text-ink/60">
                Not sure what to send? Let us choose
              </Link>
            </div>
          ) : (
            <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto px-6">
              {items.map((i) => (
                <li key={i.id} className="flex gap-4 py-5">
                  <div className="h-28 w-[5.6rem] shrink-0 overflow-hidden rounded-[4px]">
                    <ProductImage product={i.product} recipe={i.recipe} brief={i.brief} image={i.image} mode="static" frame={false} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <p className="display text-[28px]">{i.name}</p>
                      <p className="text-sm tabular-nums text-ink/80">{usd(i.price * i.qty)}</p>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-snug text-ink/50">{i.detail}</p>
                    <div className="mt-auto flex items-center gap-3 pt-3">
                      <button className="qty" onClick={() => setQty(i.id, i.qty - 1)} aria-label="Remove one">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-4 text-center text-sm tabular-nums">{i.qty}</span>
                      {!i.request && (
                        <button className="qty" onClick={() => setQty(i.id, i.qty + 1)} aria-label="Add one">
                          <Plus className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {items.length > 0 && (
            <div className="border-t border-ink/10 px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="label text-ink/45">Subtotal</span>
                <span className="display text-[44px] tabular-nums">{usd(total)}</span>
              </div>
              <Link href="/checkout" onClick={() => setOpen(false)} className="pill mt-4 w-full justify-center bg-night text-paper hover:bg-moss">
                Checkout <span aria-hidden>→</span>
              </Link>
              <p className="label mt-3 text-center text-ink/40">Pay by Whish or card · pick-up or delivery</p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
