"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Minus, Plus, X } from "lucide-react";
import { useState } from "react";

import { cartItems, usd, useCart } from "@/lib/cart-store";
import { waLink } from "@/lib/site";

import { ProductImage } from "./product-image";

export function CartSheet() {
  const { lines, open, setOpen, setQty } = useCart();
  const items = cartItems(lines);
  const total = items.reduce((n, i) => n + i.qty * i.product.price, 0);
  const [form, setForm] = useState({ name: "", when: "", delivery: "pickup", address: "", note: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const message = [
    "Hello Manolia! I'd like to order:",
    "",
    ...items.map((i) => `• ${i.qty} × ${i.product.name} (${usd(i.product.price)})`),
    "",
    `Total: ${usd(total)}`,
    form.name && `Name: ${form.name}`,
    form.when && `For: ${form.when}`,
    form.delivery === "delivery" ? `Delivery to: ${form.address || "(address to confirm)"}` : "Pick-up at the boutique",
    form.note && `Card message: “${form.note}”`,
  ]
    .filter(Boolean)
    .join("\n");

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
          <Dialog.Description className="sr-only">Review your flowers and send the order on WhatsApp.</Dialog.Description>

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <p className="display text-[56px] text-ink/80"><em>Nothing yet</em></p>
              <p className="mt-3 text-sm text-ink/60">Choose a bouquet and it will wait for you here.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <ul className="divide-y divide-ink/10 px-6">
                {items.map((i) => (
                  <li key={i.id} className="flex gap-4 py-5">
                    <div className="h-24 w-20 shrink-0 overflow-hidden rounded-[3px] bg-paper-2">
                      <ProductImage product={i.product} />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-2">
                        <p className="display text-[28px]">{i.product.name}</p>
                        <p className="text-sm tabular-nums text-ink/80">{usd(i.product.price * i.qty)}</p>
                      </div>
                      <p className="label text-ink/45">{i.product.stems}</p>
                      <div className="mt-auto flex items-center gap-3">
                        <button className="qty" onClick={() => setQty(i.id, i.qty - 1)} aria-label="Remove one">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-4 text-center text-sm tabular-nums">{i.qty}</span>
                        <button className="qty" onClick={() => setQty(i.id, i.qty + 1)} aria-label="Add one">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 border-t border-ink/10 px-6 py-6">
                <p className="label text-ink/45">Order details</p>
                <input className="field" placeholder="Your name" value={form.name} onChange={set("name")} />
                <input className="field" placeholder="Date & time you need them" value={form.when} onChange={set("when")} />
                <div className="grid grid-cols-2 gap-2 pt-3">
                  {(["pickup", "delivery"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, delivery: d }))}
                      className={`label rounded-full border py-3 transition-colors duration-500 ${form.delivery === d ? "border-night bg-night text-paper" : "border-ink/15 text-ink/70 hover:border-ink/40"}`}
                    >
                      {d === "pickup" ? "Pick up" : "Delivery"}
                    </button>
                  ))}
                </div>
                {form.delivery === "delivery" && <input className="field" placeholder="Delivery address" value={form.address} onChange={set("address")} />}
                <textarea className="field min-h-20 resize-none" placeholder="Card message (optional)" value={form.note} onChange={set("note")} />
              </div>
            </div>
          )}

          {items.length > 0 && (
            <div className="border-t border-ink/10 px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="label text-ink/45">Total</span>
                <span className="display text-[44px] tabular-nums">{usd(total)}</span>
              </div>
              <a
                href={waLink(message)}
                target="_blank"
                rel="noreferrer"
                className="pill mt-4 w-full justify-center bg-night text-paper hover:bg-moss"
              >
                Send order on WhatsApp
              </a>
              <p className="label mt-3 text-center text-ink/40">We confirm availability and payment with you on WhatsApp.</p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
