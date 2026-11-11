"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useCart } from "@/lib/cart-store";
import { money, PAY_LABEL, prettyDate, TRACK, type PayMethod, type PayMode, type PublicOrder } from "@/lib/orders";
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

  return (
    <div className="night-glow text-line">
      <div className="gutter grid grid-cols-[minmax(0,1fr)] gap-x-[6vw] gap-y-14 pb-28 pt-32 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:pt-44">
        <div>
          <p className="label text-line/50">
            Order {o.ref}
            {o.payment.mode === "test" && <span className="ml-3 text-blush">Test payment</span>}
          </p>
          <h1 className="display mt-5 text-[clamp(52px,7.6vw,132px)] text-paper">
            {headline[0]}
            <br />
            <em>{headline[1]}</em>
          </h1>

          {paid && o.status !== "cancelled" && (
            <ol className="mt-14 max-w-[560px]">
              {TRACK.map((s, i) => {
                const done = i < at || o.status === "done";
                const now = i === at && o.status !== "done";
                const when = o.history.find((h) => h.status === s.status)?.at;
                return (
                  <li key={s.status} className="relative grid grid-cols-[2.4rem_1fr] gap-x-4 pb-9 last:pb-0">
                    {i < TRACK.length - 1 && <span className={cn("absolute left-[0.72rem] top-7 h-[calc(100%-1.75rem)] w-px transition-colors duration-1000", done ? "bg-blush" : "bg-line/15")} />}
                    <span className={cn("relative mt-1.5 h-6 w-6 rounded-full border transition-colors duration-1000", done ? "border-blush bg-blush" : now ? "border-blush" : "border-line/25")}>
                      {now && <span className="absolute inset-1 animate-pulse rounded-full bg-blush" />}
                    </span>
                    <div>
                      <p className={cn("display text-[34px] transition-colors duration-1000 md:text-[40px]", done || now ? "text-paper" : "text-line/35")}>{(pickup && s.pickup) || s.title}</p>
                      <p className={cn("mt-1 text-[14px]", done || now ? "text-line/60" : "text-line/30")}>
                        {s.line}
                        {when && <span className="label ml-3 text-line/40">{new Date(when).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {paid && o.status === "cancelled" && <p className="mt-8 max-w-[44ch] text-[15px] leading-relaxed text-line/65">The boutique cancelled this order and will be in touch about your refund.</p>}

          {!paid && (
            <div className="mt-10 max-w-[520px]">
              <p className="text-[15px] leading-relaxed text-line/65">
                {o.status === "payment_failed" ? "Nothing was charged, and your order is saved. You can try again with either method." : "If you already paid, this page will catch up in a few seconds. Otherwise you can pay now; your order is saved."}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                {(Object.keys(PAY_LABEL) as PayMethod[])
                  .filter((m) => modes[m] !== "off")
                  .map((m) => (
                    <button key={m} onClick={() => payAgain(m)} disabled={!!busy} className="pill bg-paper text-night hover:bg-blush disabled:opacity-60">
                      {busy === m ? "One moment…" : `Pay ${money(o.total)} with ${PAY_LABEL[m]}`}
                    </button>
                  ))}
              </div>
              {error && (
                <p role="alert" className="mt-4 text-[13px] text-blush">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        <aside className="self-start rounded-[8px] border border-line/12 p-6 md:p-8">
          <p className="label text-line/45">{pickup ? "Pick-up in Jbeil" : `Delivery · ${o.fulfilment.zone}`}</p>
          <p className="display mt-3 text-[34px] text-paper">{prettyDate(o.fulfilment.date)}</p>
          <p className="mt-1 text-[14px] text-line/60">{o.fulfilment.slot}</p>
          <ul className="mt-6 divide-y divide-line/10 border-t border-line/10">
            {o.lines.map((l) => (
              <li key={l.id} className="py-4">
                <div className="flex justify-between gap-3">
                  <p className="display text-[26px] text-paper">
                    {l.qty > 1 && <span className="mr-2 text-blush">{l.qty} ×</span>}
                    {l.name}
                  </p>
                  <p className="text-sm tabular-nums text-line/80">{money(l.price * l.qty)}</p>
                </div>
                <p className="mt-1 text-[12.5px] leading-snug text-line/45">{l.detail}</p>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-line/10 pt-5 text-sm">
            {o.deliveryFee > 0 && (
              <div className="flex justify-between text-line/60">
                <dt>Delivery</dt>
                <dd className="tabular-nums">{money(o.deliveryFee)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between">
              <dt className="label text-line/45">{paid ? `Paid by ${PAY_LABEL[o.payment.method]}` : "Total"}</dt>
              <dd className="display text-[44px] tabular-nums text-paper">{money(o.total)}</dd>
            </div>
          </dl>
          <Link href="/shop" className="label link-u mt-6 inline-block text-line/60">
            Back to the shop
          </Link>
        </aside>
      </div>
    </div>
  );
}
