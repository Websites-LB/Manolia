"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ProductImage } from "@/components/shop/product-image";
import { useCart } from "@/lib/cart-store";
import { money, PAY_LABEL, prettyDate, TRACK, type PayMethod, type PayMode, type PublicOrder } from "@/lib/orders";
import { PRODUCTS } from "@/lib/products";
import { cn } from "@/lib/utils";

const LIVE = new Set(["awaiting_payment", "new", "arranging", "out"]);

/**
 * The customer's view of their order after paying: the same four steps the boutique moves it
 * through on its board, updating by itself every few seconds.
 */
export function OrderTracker({ initial, modes }: { initial: PublicOrder; modes: Record<PayMethod, PayMode> }) {
  const [o, setO] = useState(initial);
  const [busy, setBusy] = useState<PayMethod | null>(null);
  const [error, setError] = useState("");
  const clear = useCart((s) => s.clear);
  // the progress line draws itself once the page has arrived
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 400);
    return () => clearTimeout(t);
  }, []);
  const paid = o.payment.status === "paid";

  // the bag is only emptied once the money has actually arrived
  useEffect(() => {
    if (paid) clear();
  }, [paid, clear]);

  useEffect(() => {
    if (!LIVE.has(o.status)) return;
    const t = setInterval(async () => {
      if (document.hidden) return;
      const res = await fetch(`/api/orders/${o.id}`, { cache: "no-store" }).catch(() => null);
      if (res?.ok) setO(await res.json());
    }, 5000);
    return () => clearInterval(t);
  }, [o.id, o.status]);

  async function payAgain(method: PayMethod) {
    setBusy(method);
    setError("");
    try {
      const res = await fetch(`/api/orders/${o.id}/pay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method }) });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error || "We could not start the payment.");
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not start the payment.");
      setBusy(null);
    }
  }

  const pickup = o.fulfilment.type === "pickup";
  const at = TRACK.findIndex((s) => s.status === o.status);
  const headline = paid
    ? o.status === "cancelled"
      ? ["This order was", "cancelled."]
      : o.status === "done"
        ? [pickup ? "Collected." : "Delivered.", "Thank you."]
        : [`Thank you, ${o.firstName}.`, "We have it."]
    : o.status === "payment_failed"
      ? ["The payment", "did not go through."]
      : ["Waiting for", "your payment."];

  const steps = TRACK.map((s) => ({ ...s, title: (pickup && s.pickup) || s.title }));
  const reached = o.status === "done" ? steps.length - 1 : Math.max(0, at);
  const current = steps[reached];
  const live = paid && LIVE.has(o.status);

  return (
    <div className="relative overflow-x-clip text-line" style={{ background: "linear-gradient(#13241a, #0f1b13 30%, #0b140f)" }}>
      <div className="pointer-events-none absolute -left-[15%] top-[-8%] h-[70vh] w-[70vw] blur-3xl" style={{ background: "radial-gradient(closest-side, rgb(240 185 174 / 0.12), transparent)" }} />
      <div className="gutter relative grid grid-cols-[minmax(0,1fr)] gap-x-[5vw] gap-y-12 pb-28 pt-28 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:pt-40">
        <div>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[16px] italic text-line/55">
            <span>Order {o.ref}</span>
            {o.payment.mode === "test" && <span className="text-blush">Test payment</span>}
            {live && (
              <span className="flex items-center gap-2 text-line/45">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-blush/70" />
                  <span className="relative h-2 w-2 rounded-full bg-blush" />
                </span>
                Updates by itself
              </span>
            )}
          </p>
          <h1 className="display mt-5 text-[clamp(56px,8vw,140px)] text-paper">
            {headline[0]}
            <br />
            <em>{headline[1]}</em>
          </h1>

          {paid && o.status !== "cancelled" && (
            <div className="mt-14 max-w-[640px]">
              <p className="text-[22px] italic leading-snug text-line/75 md:text-[26px]">
                <span className="display not-italic text-paper">{current.title}.</span> {current.line}
              </p>

              {/* the journey: four stops on one line, filled up to where the order is now */}
              <div className="relative mt-10">
                <div className="absolute left-3 right-3 top-3 h-[2px] rounded-full bg-line/12" />
                <div
                  className="absolute left-3 top-3 h-[2px] origin-left rounded-full bg-blush transition-transform duration-[1800ms] ease-[cubic-bezier(.16,1,.3,1)]"
                  style={{ width: "calc(100% - 1.5rem)", transform: `scaleX(${shown ? reached / (steps.length - 1) : 0})` }}
                />
                <ol className="relative grid grid-cols-4">
                  {steps.map((s, i) => {
                    const done = i < reached || o.status === "done";
                    const now = i === reached && o.status !== "done";
                    const when = o.history.find((h) => h.status === s.status)?.at;
                    return (
                      <li key={s.status} className={cn("flex flex-col", i === 0 ? "items-start" : i === steps.length - 1 ? "items-end text-right" : "items-center text-center")}>
                        <span
                          className={cn(
                            "relative flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors duration-1000",
                            done ? "border-blush bg-blush" : now ? "border-blush bg-night" : "border-line/20 bg-night",
                          )}
                        >
                          {done && <Check className="h-3.5 w-3.5 text-night" strokeWidth={3} />}
                          {now && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blush" />}
                        </span>
                        <p className={cn("display mt-3 text-[18px] leading-tight transition-colors duration-1000 md:text-[24px]", done || now ? "text-paper" : "text-line/35")}>{s.title}</p>
                        {when && <p className="mt-1 text-[13px] italic text-line/40">{new Date(when).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>}
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          )}

          {paid && o.status === "cancelled" && <p className="mt-8 max-w-[40ch] text-[19px] italic leading-snug text-line/65">The boutique cancelled this order and will be in touch about your refund.</p>}

          {!paid && (
            <div className="mt-10 max-w-[520px]">
              <p className="text-[19px] italic leading-snug text-line/65">
                {o.status === "payment_failed" ? "Nothing was charged, and your order is saved. You can try again." : "If you already paid, this page catches up in a few seconds. Otherwise you can pay now; your order is saved."}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                {(Object.keys(PAY_LABEL) as PayMethod[])
                  .filter((m) => modes[m] !== "off")
                  .map((m) => (
                    <button key={m} onClick={() => payAgain(m)} disabled={!!busy} className="rounded-full bg-paper px-6 py-3.5 text-[17px] text-night transition-colors duration-500 hover:bg-blush disabled:opacity-60">
                      {busy === m ? "One moment…" : `Pay ${money(o.total)} with ${PAY_LABEL[m]}`}
                    </button>
                  ))}
              </div>
              {error && (
                <p role="alert" className="mt-4 text-[15px] text-blush">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* the order itself: the same paper slip as at the checkout */}
        <aside className="relative self-start md:sticky md:top-28">
          <div className="rounded-[26px] bg-paper p-6 text-ink shadow-[0_80px_140px_-60px_rgb(0_0_0/0.9)] md:p-8">
            <p className="text-[16px] italic text-ink/55">{pickup ? "Pick-up at the boutique in Jbeil" : `Delivery to ${o.fulfilment.zone}`}</p>
            <p className="display mt-1 text-[34px] leading-tight">{prettyDate(o.fulfilment.date)}</p>
            <p className="text-[16px] text-ink/60">{o.fulfilment.slot}</p>
            <ul className="mt-5 divide-y divide-ink/10 border-t border-ink/10">
              {o.lines.map((l) => {
                const product = PRODUCTS.find((p) => p.id === l.id);
                return (
                  <li key={l.id} className="flex items-center gap-4 py-4">
                    {(product || l.recipe || l.image) && (
                      <div className="h-20 w-16 shrink-0 overflow-hidden rounded-[12px] bg-night">
                        <ProductImage product={product} recipe={l.recipe} image={l.image} mode="static" frame={false} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="display text-[24px] leading-tight">
                        {l.name} {l.qty > 1 && <span className="text-[18px] text-ink/45">× {l.qty}</span>}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[13.5px] italic leading-snug text-ink/50">{l.detail}</p>
                    </div>
                    <p className="shrink-0 text-[17px] tabular-nums">{money(l.price * l.qty)}</p>
                  </li>
                );
              })}
            </ul>
            <dl className="space-y-2 border-t border-ink/10 pt-4 text-[16px]">
              {o.deliveryFee > 0 && (
                <div className="flex justify-between text-ink/60">
                  <dt>Delivery</dt>
                  <dd className="tabular-nums">{money(o.deliveryFee)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between pt-1">
                <dt className="text-[17px] italic text-ink/55">{paid ? `Paid by ${PAY_LABEL[o.payment.method]}` : "Total"}</dt>
                <dd className="display text-[52px] leading-none tabular-nums">{money(o.total)}</dd>
              </div>
            </dl>
          </div>
          <Link href="/shop" className="link-u mt-6 inline-block text-[17px] italic text-line/60">
            Back to the shop
          </Link>
        </aside>
      </div>
    </div>
  );
}
