"use client";

import { CreditCard, Lock, Wallet } from "lucide-react";
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
  { id: "whish", line: "Confirm it in your Whish app." },
  { id: "card", line: "Visa or Mastercard, on the bank's secure page." },
];

function Part({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-[22px] border border-line/12 bg-[#0e1a12]/70 p-5 backdrop-blur-sm md:p-7">
      <legend className="sr-only">{title}</legend>
      <p className="display text-[36px] text-paper md:text-[42px]" aria-hidden>
        {title} {hint && <span className="text-[17px] italic tracking-normal text-line/45">{hint}</span>}
      </p>
      <div className="mt-5 space-y-3">{children}</div>
    </fieldset>
  );
}

const Choice = ({ on, onClick, children, disabled }: { on: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={on}
    className={cn("rounded-full border px-4 py-2.5 text-[16px] transition-colors duration-500 disabled:cursor-not-allowed disabled:opacity-35", on ? "border-paper bg-paper text-night" : "border-line/20 text-line/75 hover:border-line/50")}
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
      <div className="night-glow gutter flex min-h-[80svh] flex-col items-center justify-center pb-24 pt-40 text-center text-line">
        <p className="display text-[clamp(56px,9vw,140px)] text-paper">
          Your bag is <em>empty.</em>
        </p>
        <Link href="/shop" className="pill mt-10 bg-paper text-night hover:bg-blush">
          To the shop <span aria-hidden>→</span>
        </Link>
      </div>
    );

  return (
    <form
      onSubmit={submit}
      className="relative grid grid-cols-[minmax(0,1fr)] gap-x-[4vw] gap-y-4 overflow-x-clip px-[clamp(16px,3.4vw,56px)] pb-28 pt-28 text-line md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:pt-40"
      style={{ background: "linear-gradient(#13241a, #0f1b13 30%, #0b140f)" }}
    >
      <div className="pointer-events-none absolute -right-[10%] top-[-5%] h-[60vh] w-[60vw] blur-3xl" style={{ background: "radial-gradient(closest-side, rgb(240 185 174 / 0.1), transparent)" }} />
      <div className="relative space-y-4">
        <SplitWords as="h1" immediate delay={0.1} text={"Nearly\n*theirs.*"} className="display mb-8 text-[clamp(64px,9vw,160px)] text-paper" />

        <Part title="You">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input-dark" required minLength={2} autoComplete="name" placeholder="Your name" value={f.name} onChange={set("name")} />
            <input className="input-dark" required type="tel" inputMode="tel" autoComplete="tel" placeholder="Your phone" value={f.phone} onChange={set("phone")} />
          </div>
          <input className="input-dark" type="email" autoComplete="email" placeholder="Email (optional)" value={f.email} onChange={set("email")} />
        </Part>

        <Part title="When">
          <input id="day" aria-label="The day you need them" className="input-dark" required type="date" min={today} value={f.date} onChange={set("date")} />
          <div className="flex flex-wrap gap-2">
            {SLOTS.map((s) => (
              <Choice key={s} on={f.slot === s} onClick={() => setF((v) => ({ ...v, slot: s }))}>
                {s}
              </Choice>
            ))}
          </div>
        </Part>

        <Part title="Where">
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["pickup", "Pick up", "At the boutique in Jbeil"],
                ["delivery", "Deliver it", "To their door"],
              ] as const
            ).map(([id, t, d]) => (
              <button
                key={id}
                type="button"
                aria-pressed={f.type === id}
                onClick={() => setF((v) => ({ ...v, type: id }))}
                className={cn("rounded-[16px] border p-4 text-left transition-colors duration-500", f.type === id ? "border-paper bg-paper text-night" : "border-line/15 text-line hover:border-line/45")}
              >
                <span className="display block text-[26px]">{t}</span>
                <span className={cn("mt-0.5 block text-[14px] italic", f.type === id ? "text-night/60" : "text-line/50")}>{d}</span>
              </button>
            ))}
          </div>
          {f.type === "delivery" && (
            <div className="space-y-3 pt-2 animate-[msg_0.6s_cubic-bezier(.16,1,.3,1)_both]">
              <div className="flex flex-wrap gap-2">
                {DELIVERY_ZONES.map((z) => (
                  <Choice key={z.id} on={f.zone === z.id} onClick={() => setF((v) => ({ ...v, zone: z.id }))}>
                    {z.name} <span className="opacity-60">· {usd(z.fee)}</span>
                  </Choice>
                ))}
              </div>
              <input className="input-dark" required minLength={6} autoComplete="street-address" placeholder="Street, building, floor" value={f.address} onChange={set("address")} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="input-dark" placeholder="Who is it for?" value={f.recipient} onChange={set("recipient")} />
                <input className="input-dark" type="tel" inputMode="tel" placeholder="Their phone (optional)" value={f.recipientPhone} onChange={set("recipientPhone")} />
              </div>
            </div>
          )}
        </Part>

        <Part title="The card" hint="optional">
          <textarea className="input-dark min-h-28 resize-none" maxLength={400} placeholder="What should we write? We write it by hand." value={f.cardMessage} onChange={set("cardMessage")} />
          <VoiceNote value={f.voiceNote} onChange={(id) => setF((v) => ({ ...v, voiceNote: id }))} />
          <input className="input-dark" maxLength={400} placeholder="Anything we should know?" value={f.note} onChange={set("note")} />
        </Part>

        <Part title="Payment">
          <div className="grid gap-2 sm:grid-cols-2">
            {PAY.map((p) => {
              const mode = modes[p.id];
              const on = f.method === p.id;
              const Icon = p.id === "whish" ? Wallet : CreditCard;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={mode === "off"}
                  aria-pressed={on}
                  onClick={() => setF((v) => ({ ...v, method: p.id }))}
                  className={cn("rounded-[16px] border p-4 text-left transition-colors duration-500 disabled:cursor-not-allowed disabled:opacity-40", on ? "border-paper bg-paper text-night" : "border-line/15 text-line hover:border-line/45")}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-3">
                      <Icon className="h-5 w-5" strokeWidth={1.5} />
                      <span className="display text-[28px]">{PAY_LABEL[p.id]}</span>
                    </span>
                    {mode !== "live" && <span className={cn("text-[13px] italic", on ? "text-clay" : "text-blush/80")}>{mode === "test" ? "Test mode" : "Soon"}</span>}
                  </span>
                  <span className={cn("mt-1.5 block text-[14px] italic leading-snug", on ? "text-night/60" : "text-line/50")}>{p.line}</span>
                </button>
              );
            })}
          </div>
          <p className="flex items-center gap-2 text-[14px] italic text-line/45">
            <Lock className="h-3.5 w-3.5" /> We never see or store your card or wallet details.
          </p>
        </Part>
      </div>

      {/* the order, and the one button: a slip of paper on the night */}
      <aside className="relative md:sticky md:top-28 md:self-start">
        <div className="rounded-[26px] bg-paper p-6 text-ink shadow-[0_80px_140px_-60px_rgb(0_0_0/0.9)] md:p-8">
          <p className="display text-[32px]">Your order</p>
          <ul className="mt-3 divide-y divide-ink/10">
            {(ready ? items : []).map((i) => (
              <li key={i.id} className="flex items-center gap-4 py-4">
                <div className="h-20 w-16 shrink-0 overflow-hidden rounded-[12px]">
                  <ProductImage product={i.product} recipe={i.recipe} brief={i.brief} image={i.image} mode="static" frame={false} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="display text-[24px] leading-tight">
                    {i.name} {i.qty > 1 && <span className="text-[18px] text-ink/45">× {i.qty}</span>}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[13.5px] italic leading-snug text-ink/50">{i.detail}</p>
                </div>
                <p className="shrink-0 text-[17px] tabular-nums">{usd(i.price * i.qty)}</p>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-ink/10 pt-4 text-[16px]">
            <div className="flex justify-between">
              <dt className="text-ink/55">Flowers</dt>
              <dd className="tabular-nums">{usd(ready ? subtotal : 0)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/55">{f.type === "delivery" ? "Delivery" : "Pick-up"}</dt>
              <dd className="tabular-nums">{fee ? usd(fee) : "Free"}</dd>
            </div>
            <div className="flex items-baseline justify-between pt-2">
              <dt className="text-[18px] italic text-ink/55">Total</dt>
              <dd className="display text-[56px] leading-none tabular-nums">{usd(ready ? total : 0)}</dd>
            </div>
          </dl>
          <button
            type="submit"
            disabled={busy || !ready || modes[f.method] === "off"}
            data-cursor="Pay"
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-night py-4 text-[18px] text-paper transition-colors duration-500 hover:bg-moss disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "One moment…" : `Pay ${usd(ready ? total : 0)} with ${PAY_LABEL[f.method]}`} {!busy && <span aria-hidden>→</span>}
          </button>
          {error && (
            <p role="alert" className="mt-4 rounded-[12px] bg-clay/10 px-4 py-3 text-[15px] text-clay">
              {error}
            </p>
          )}
          <p className="mt-4 text-center text-[14px] italic text-ink/45">The boutique gets your order the moment it is paid.</p>
        </div>
      </aside>
    </form>
  );
}
