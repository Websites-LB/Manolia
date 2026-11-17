"use client";

import * as Dialog from "@radix-ui/react-dialog";
import NumberFlow from "@number-flow/react";
import { Minus, Plus, X } from "lucide-react";
import Link from "next/link";

import { STARTER } from "@/lib/custom";
import { cartItems, usd, useCart } from "@/lib/cart-store";

import { ProductImage } from "./product-image";

/**
 * The bag: a panel of night glass that slides in from the right (the whole screen on a phone), each
 * bouquet on its own tile with its picture, and one way out of it, to the checkout.
 */
export function CartSheet() {
  const { lines, open, setOpen, setQty } = useCart();
  const items = cartItems(lines);
  const total = items.reduce((n, i) => n + i.qty * i.price, 0);
  const count = items.reduce((n, i) => n + i.qty, 0);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-night/55 backdrop-blur-[6px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          data-lenis-prevent
          className="fixed inset-0 z-[71] flex flex-col overflow-clip text-line duration-700 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:inset-y-3 sm:left-auto sm:right-3 sm:w-[460px] sm:rounded-[30px] sm:border sm:border-line/10 sm:shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)]"
          style={{ background: "linear-gradient(#13241a, #0b140f)" }}
        >
          <div className="pointer-events-none absolute -right-[30%] -top-[10%] h-[50%] w-[90%] blur-3xl" style={{ background: "radial-gradient(closest-side, rgb(240 185 174 / 0.12), transparent)" }} />

          <div className="relative flex items-center justify-between px-6 pb-4 pt-6">
            <div>
              <Dialog.Title className="display text-[46px] leading-none text-paper">
                Your <em>bag</em>
              </Dialog.Title>
              {count > 0 && (
                <p className="mt-1.5 text-[15px] italic text-line/50">
                  {count} {count === 1 ? "piece" : "pieces"}
                </p>
              )}
            </div>
            <Dialog.Close className="flex h-11 w-11 items-center justify-center rounded-full border border-line/20 text-line/80 transition-colors duration-500 hover:border-paper hover:text-paper" aria-label="Close">
              <X className="h-4 w-4" strokeWidth={1.5} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Review your flowers, then go to the checkout.</Dialog.Description>

          {items.length === 0 ? (
            <div className="relative flex flex-1 flex-col items-center justify-center px-8 pb-10 text-center">
              <div className="h-48 w-40 overflow-hidden rounded-[22px] opacity-90">
                <ProductImage recipe={STARTER} mode="static" frame={false} />
              </div>
              <p className="display mt-8 text-[48px] leading-none text-paper">
                Nothing <em>yet.</em>
              </p>
              <p className="mt-3 max-w-[28ch] text-[17px] italic leading-snug text-line/55">Pick a bouquet, make your own, or let us choose. It waits for you here.</p>
              <div className="mt-8 flex w-full max-w-[300px] flex-col gap-2.5">
                <Link href="/shop" onClick={() => setOpen(false)} className="rounded-full bg-paper py-3.5 text-[17px] text-night transition-colors duration-500 hover:bg-blush">
                  See the bouquets
                </Link>
                <Link href="/shop/build" onClick={() => setOpen(false)} className="rounded-full border border-line/20 py-3.5 text-[17px] text-line/85 transition-colors duration-500 hover:border-line/50">
                  Make your own
                </Link>
              </div>
            </div>
          ) : (
            <ul className="relative flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-4 pb-4">
              {items.map((i, k) => (
                <li
                  key={i.id}
                  className="flex gap-4 rounded-[22px] border border-line/10 bg-night/40 p-3 animate-[msg_0.6s_cubic-bezier(.16,1,.3,1)_both]"
                  style={{ animationDelay: `${0.1 + k * 0.06}s` }}
                >
                  <div className="h-[7.5rem] w-24 shrink-0 overflow-hidden rounded-[16px]">
                    <ProductImage product={i.product} recipe={i.recipe} brief={i.brief} image={i.image} mode="static" frame={false} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="display text-[26px] leading-tight text-paper">{i.name}</p>
                      <p className="display shrink-0 text-[22px] tabular-nums text-blush">{usd(i.price * i.qty)}</p>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[14px] italic leading-snug text-line/50">{i.detail}</p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center gap-1 rounded-full border border-line/15 p-1">
                        <button className="flex h-8 w-8 items-center justify-center rounded-full text-line/80 transition-colors duration-500 hover:bg-line/10" onClick={() => setQty(i.id, i.qty - 1)} aria-label={`One ${i.name} less`}>
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-[16px] tabular-nums text-paper">{i.qty}</span>
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-full text-line/80 transition-colors duration-500 hover:bg-line/10 disabled:opacity-25"
                          onClick={() => setQty(i.id, i.qty + 1)}
                          disabled={!!i.request}
                          aria-label={`One ${i.name} more`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button onClick={() => setQty(i.id, 0)} className="text-[14px] italic text-line/40 transition-colors duration-500 hover:text-blush">
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {items.length > 0 && (
            <div className="relative border-t border-line/10 bg-night/50 px-6 pb-6 pt-5 backdrop-blur-md">
              <div className="flex items-baseline justify-between">
                <span className="text-[17px] italic text-line/55">Total</span>
                <span className="display text-[48px] leading-none tabular-nums text-paper">
                  <NumberFlow value={total} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} />
                </span>
              </div>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-blush py-4 text-[18px] text-night transition-colors duration-500 hover:bg-paper"
              >
                Checkout <span aria-hidden>→</span>
              </Link>
              <p className="mt-3 text-center text-[14px] italic text-line/45">Whish or card · pick-up or delivery</p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
