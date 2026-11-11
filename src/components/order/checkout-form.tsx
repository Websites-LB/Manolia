"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { SplitWords } from "@/components/motion/split-words";
import { ProductImage } from "@/components/shop/product-image";
import { cartItems, usd, useCart } from "@/lib/cart-store";
import { PAY_LABEL, type OrderRequest, type PayMethod, type PayMode } from "@/lib/orders";
import { DELIVERY_ZONES, SLOTS } from "@/lib/site";
import { cn } from "@/lib/utils";

import { VoiceNote } from "./voice-note";

const PAY: { id: PayMethod; line: string }[] = [
  { id: "whish", line: "From your Whish wallet, confirmed on your phone." },
  { id: "card", line: "Visa or Mastercard, on the bank's secure page." },
];

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-ink/12 py-9">
      <legend className="display float-left mb-6 w-full text-[36px] md:text-[44px]">{title}</legend>
      <div className="clear-both space-y-1">{children}</div>
    </fieldset>
  );
}

const Choice = ({ on, onClick, children, disabled }: { on: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={on}
    className={cn("label rounded-full border px-5 py-3 transition-colors duration-500 disabled:cursor-not-allowed disabled:opacity-35", on ? "border-night bg-night text-paper" : "border-ink/15 text-ink/70 hover:border-ink/45")}
  >
    {children}
  </button>
);

/**
 * The checkout: who, when, where, what to write on the card, and how to pay. Nothing is paid here;
 * the button places the order and hands over to the payment provider's own page.
 */
export function CheckoutForm({ modes }: { modes: Record<PayMethod, PayMode> }) {
  const lines = useCart((s) => s.lines);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const items = cartItems(lines);
  const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0);

  const firstOn = (PAY.find((p) => modes[p.id] !== "off")?.id ?? "whish") as PayMethod;
  const [f, setF] = useState({ name: "", phone: "", email: "", date: "", slot: SLOTS[0], type: "pickup" as "pickup" | "delivery", zone: DELIVERY_ZONES[0].id, address: "", recipient: "", recipientPhone: "", cardMessage: "", note: "", voiceNote: "", method: firstOn });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((v) => ({ ...v, [k]: e.target.value }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const fee = f.type === "delivery" ? (DELIVERY_ZONES.find((z) => z.id === f.zone)?.fee ?? 0) : 0;
  const total = subtotal + fee;
  const today = ready ? new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10) : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const body: OrderRequest = {
      lines: items.map((i) => ({ id: i.id, qty: i.qty, recipe: i.recipe, requestId: i.request?.id })),
      customer: { name: f.name, phone: f.phone, email: f.email || undefined },
      fulfilment: { type: f.type, date: f.date, slot: f.slot, zone: f.zone, address: f.address, recipient: f.recipient, recipientPhone: f.recipientPhone },
      cardMessage: f.cardMessage,
      note: f.note,
      voiceNote: f.voiceNote || undefined,
      method: f.method,
    };
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error || "Something went wrong. Nothing was charged.");
      window.location.href = json.url; // the payment provider's page
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Nothing was charged.");
      setBusy(false);
    }
  }

  if (ready && !items.length)
    return (
      <div className="gutter flex min-h-[80svh] flex-col items-center justify-center bg-paper pb-24 pt-40 text-center text-ink">
        <p className="display text-[clamp(56px,9vw,140px)]">
          Your bag is <em>empty.</em>
        </p>
        <Link href="/shop" className="pill mt-10 bg-night text-paper hover:bg-moss">
          To the shop <span aria-hidden>→</span>
        </Link>
      </div>
    );

  return (
    <form onSubmit={submit} className="gutter grid grid-cols-[minmax(0,1fr)] gap-x-[6vw] bg-paper pb-28 pt-32 text-ink md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:pt-44">
      <div>
        <p className="label text-ink/50">Checkout</p>
        <SplitWords as="h1" immediate delay={0.1} text="Nearly *theirs.*" className="display mb-12 mt-5 text-[clamp(60px,9vw,160px)]" />

        <Part title="You">
          <input className="field" required minLength={2} autoComplete="name" placeholder="Your name" value={f.name} onChange={set("name")} />
          <input className="field" required type="tel" inputMode="tel" autoComplete="tel" placeholder="Phone, so we can reach you about the order" value={f.phone} onChange={set("phone")} />
          <input className="field" type="email" autoComplete="email" placeholder="Email (optional)" value={f.email} onChange={set("email")} />
        </Part>

        <Part title="When">
          <label className="label block pt-1 text-ink/45" htmlFor="day">
            The day you need them
          </label>
          <input id="day" className="field" required type="date" min={today} value={f.date} onChange={set("date")} />
          <div className="flex flex-wrap gap-2 pt-5">
            {SLOTS.map((s) => (
              <Choice key={s} on={f.slot === s} onClick={() => setF((v) => ({ ...v, slot: s }))}>
                {s}
              </Choice>
            ))}
          </div>
        </Part>

        <Part title="Where">
          <div className="flex flex-wrap gap-2">
            <Choice on={f.type === "pickup"} onClick={() => setF((v) => ({ ...v, type: "pickup" }))}>
              Pick up in Jbeil
            </Choice>
            <Choice on={f.type === "delivery"} onClick={() => setF((v) => ({ ...v, type: "delivery" }))}>
              Deliver it
            </Choice>
          </div>
          {f.type === "delivery" && (
            <div className="pt-6">
              <div className="flex flex-wrap gap-2">
                {DELIVERY_ZONES.map((z) => (
                  <Choice key={z.id} on={f.zone === z.id} onClick={() => setF((v) => ({ ...v, zone: z.id }))}>
                    {z.name} · {usd(z.fee)}
                  </Choice>
                ))}
              </div>
              <input className="field mt-3" required minLength={6} autoComplete="street-address" placeholder="Street, building, floor" value={f.address} onChange={set("address")} />
              <input className="field" placeholder="Who is it for? (if not you)" value={f.recipient} onChange={set("recipient")} />
              <input className="field" type="tel" inputMode="tel" placeholder="Their phone, for the driver (optional)" value={f.recipientPhone} onChange={set("recipientPhone")} />
            </div>
          )}
        </Part>

        <Part title="The card">
          <textarea className="field min-h-24 resize-none" maxLength={400} placeholder="What should we write? We do it by hand. (optional)" value={f.cardMessage} onChange={set("cardMessage")} />
          <VoiceNote value={f.voiceNote} onChange={(id) => setF((v) => ({ ...v, voiceNote: id }))} />
          <input className="field mt-4" maxLength={400} placeholder="Anything we should know? (optional)" value={f.note} onChange={set("note")} />
        </Part>

        <Part title="Payment">
          <div className="grid gap-3 sm:grid-cols-2">
            {PAY.map((p) => {
              const mode = modes[p.id];
              const on = f.method === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={mode === "off"}
                  aria-pressed={on}
                  onClick={() => setF((v) => ({ ...v, method: p.id }))}
                  className={cn("rounded-[6px] border p-5 text-left transition-colors duration-500 disabled:cursor-not-allowed disabled:opacity-40", on ? "border-night bg-night text-paper" : "border-ink/15 hover:border-ink/45")}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="display text-[34px]">{PAY_LABEL[p.id]}</span>
                    {mode !== "live" && <span className={cn("label", on ? "text-blush" : "text-clay")}>{mode === "test" ? "Test mode" : "Not available yet"}</span>}
                  </span>
                  <span className={cn("mt-2 block text-[13px] leading-snug", on ? "text-paper/65" : "text-ink/55")}>{p.line}</span>
                </button>
              );
            })}
          </div>
          <p className="pt-4 text-[13px] text-ink/50">Orders placed here are paid online. We never see or store your card or wallet details.</p>
        </Part>
      </div>

      {/* the order, and the one button */}
      <aside className="md:sticky md:top-28 md:self-start">
        <div className="rounded-[8px] bg-paper-2/70 p-6 md:p-8">
          <p className="label text-ink/45">Your order</p>
          <ul className="mt-4 divide-y divide-ink/10">
            {(ready ? items : []).map((i) => (
              <li key={i.id} className="flex gap-4 py-4">
                <div className="h-24 w-[4.8rem] shrink-0 overflow-hidden rounded-[4px]">
                  <ProductImage product={i.product} recipe={i.recipe} brief={i.brief} image={i.image} mode="static" frame={false} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <p className="display text-[26px]">{i.name}</p>
                    <p className="text-sm tabular-nums">{usd(i.price * i.qty)}</p>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-snug text-ink/50">{i.detail}</p>
                  {i.qty > 1 && <p className="label mt-2 text-ink/45">× {i.qty}</p>}
                </div>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-2 border-t border-ink/10 pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink/55">Subtotal</dt>
              <dd className="tabular-nums">{usd(ready ? subtotal : 0)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/55">{f.type === "delivery" ? "Delivery" : "Pick-up"}</dt>
              <dd className="tabular-nums">{fee ? usd(fee) : "Free"}</dd>
            </div>
            <div className="flex items-baseline justify-between pt-3">
              <dt className="label text-ink/45">Total</dt>
              <dd className="display text-[52px] tabular-nums">{usd(ready ? total : 0)}</dd>
            </div>
          </dl>
          <button type="submit" disabled={busy || !ready || modes[f.method] === "off"} className="pill mt-5 w-full justify-center bg-night text-paper hover:bg-moss disabled:cursor-wait disabled:opacity-60">
            {busy ? "One moment…" : `Pay ${usd(ready ? total : 0)} with ${PAY_LABEL[f.method]}`} {!busy && <span aria-hidden>→</span>}
          </button>
          {error && (
            <p role="alert" className="mt-4 rounded-[4px] bg-clay/10 px-4 py-3 text-[13px] text-clay">
              {error}
            </p>
          )}
          <p className="label mt-4 text-center text-ink/40">The boutique receives your order the moment it is paid</p>
        </div>
      </aside>
    </form>
  );
}
