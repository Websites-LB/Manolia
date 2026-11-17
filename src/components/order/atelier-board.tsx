"use client";

import { Bell, BellOff, Store, Truck, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { ProductImage } from "@/components/shop/product-image";

import { money, PAY_LABEL, prettyDate, type Order, type OrderStatus } from "@/lib/orders";
import { PRODUCTS } from "@/lib/products";
import { cn } from "@/lib/utils";

import { AtelierRequests } from "./atelier-requests";
import { VoiceCode } from "./voice-code";

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string; pickup?: string }>> = {
  new: { to: "arranging", label: "Accept and start" },
  arranging: { to: "out", label: "Hand to the driver", pickup: "Ready to collect" },
  out: { to: "done", label: "Delivered", pickup: "Collected" },
};
const COLUMNS: { status: OrderStatus; title: string }[] = [
  { status: "new", title: "New" },
  { status: "arranging", title: "On the bench" },
  { status: "out", title: "Out / ready" },
];

/** two soft notes, the way a shop bell sounds */
function chime(ctx: AudioContext) {
  [660, 880].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    const t = ctx.currentTime + i * 0.22;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1);
  });
}

const Small = ({ children }: { children: ReactNode }) => <dt className="text-[14px] italic text-line/45">{children}</dt>;

function Card({ o, onMove, busy }: { o: Order; onMove: (to: OrderStatus) => void; busy: boolean }) {
  const f = o.fulfilment;
  const pickup = f.type === "pickup";
  const next = NEXT[o.status];
  const fresh = o.status === "new";
  return (
    <article
      className={cn(
        "relative rounded-[22px] border bg-[#13241a]/90 p-5 backdrop-blur-sm animate-[msg_0.7s_cubic-bezier(.16,1,.3,1)_both]",
        fresh ? "border-blush/70 shadow-[0_0_0_4px_rgb(240_185_174/0.08),0_40px_80px_-40px_rgb(240_185_174/0.35)]" : "border-line/12",
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="display text-[34px] leading-none text-paper">{o.ref}</h3>
          <p className="mt-1.5 text-[14px] italic text-line/50">
            {new Date(o.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            {o.payment.mode === "test" && <span className="ml-2 text-blush">Test</span>}
          </p>
        </div>
        <p className="display text-[30px] leading-none tabular-nums text-paper">{money(o.total)}</p>
      </header>

      <p className="mt-4 flex items-center gap-2.5 rounded-[14px] bg-night/60 px-3.5 py-3 text-[16px] text-paper">
        {pickup ? <Store className="h-4 w-4 shrink-0 text-blush" strokeWidth={1.6} /> : <Truck className="h-4 w-4 shrink-0 text-blush" strokeWidth={1.6} />}
        <span>
          {prettyDate(f.date)}, <span className="italic text-line/70">{f.slot.toLowerCase()}</span>
        </span>
      </p>

      <ul className="mt-4 space-y-3">
        {o.lines.map((l) => {
          const product = PRODUCTS.find((p) => p.id === l.id);
          return (
            <li key={l.id} className="flex items-center gap-3">
              {(product || l.recipe || l.image) && (
                <div className="h-16 w-[3.25rem] shrink-0 overflow-hidden rounded-[10px]">
                  <ProductImage product={product} recipe={l.recipe} image={l.image} mode="static" frame={false} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[17px] text-paper">
                  <span className="mr-1.5 tabular-nums text-blush">{l.qty} ×</span>
                  {l.name}
                </p>
                <p className="mt-0.5 text-[14px] italic leading-snug text-line/55">{l.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {/* what goes on the card, shown as the card itself */}
      {o.cardMessage && (
        <div className="mt-5 -rotate-1 rounded-[6px] bg-paper px-5 py-4 text-ink shadow-[0_18px_40px_-20px_rgb(0_0_0/0.8)]">
          <p className="text-[13px] italic text-ink/45">Write on the card</p>
          <p className="mt-1 text-[20px] italic leading-snug">“{o.cardMessage}”</p>
        </div>
      )}

      <dl className="mt-5 space-y-3 text-[15px] text-line/80">
        {o.note && (
          <div>
            <Small>Note</Small>
            <dd className="mt-0.5">{o.note}</dd>
          </div>
        )}
        {o.voiceNote && (
          <div>
            <Small>Voice note: print this code on the card</Small>
            <dd className="mt-2">
              <VoiceCode id={o.voiceNote} />
            </dd>
          </div>
        )}
        {!pickup && (
          <div>
            <Small>Deliver to</Small>
            <dd className="mt-0.5">
              {f.recipient && <span className="text-paper">{f.recipient} · </span>}
              {f.zone}, {f.address}
              {f.recipientPhone && (
                <a className="link-u ml-2 text-blush" href={`tel:${f.recipientPhone}`}>
                  {f.recipientPhone}
                </a>
              )}
            </dd>
          </div>
        )}
        <div>
          <Small>From</Small>
          <dd className="mt-0.5">
            {o.customer.name} ·{" "}
            <a className="link-u text-blush" href={`tel:${o.customer.phone}`}>
              {o.customer.phone}
            </a>
            <span className="ml-2 italic text-line/45">paid by {PAY_LABEL[o.payment.method]}</span>
          </dd>
        </div>
      </dl>

      {next && (
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => onMove(next.to)}
            disabled={busy}
            className={cn("flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-[17px] text-night transition-colors duration-500 disabled:opacity-50", fresh ? "bg-blush hover:bg-paper" : "bg-paper hover:bg-blush")}
          >
            {(pickup && next.pickup) || next.label} <span aria-hidden>→</span>
          </button>
          <button
            onClick={() => window.confirm(`Cancel order ${o.ref}? The customer will see it as cancelled.`) && onMove("cancelled")}
            disabled={busy}
            aria-label={`Cancel order ${o.ref}`}
            title="Cancel the order"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line/15 text-line/45 transition-colors duration-500 hover:border-blush hover:text-blush"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </article>
  );
}

/**
 * The boutique's order board. It refreshes itself every few seconds; a new paid order arrives in the
 * first column with a chime, and each button moves it one step, which the customer sees on their page.
 */
export function AtelierBoard({ open }: { open: boolean }) {
  const audio = useRef<AudioContext | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [busy, setBusy] = useState("");
  const [sound, setSound] = useState(false);
  const [view, setView] = useState<"orders" | "requests">("orders");
  const [unread, setUnread] = useState(0);
  const ring = useCallback(() => {
    if (audio.current) chime(audio.current);
  }, []);
  const known = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/atelier/orders", { cache: "no-store" }).catch(() => null);
    if (res?.status === 401) return window.location.reload();
    if (!res?.ok) return;
    const { orders: list } = (await res.json()) as { orders: Order[] };
    const fresh = list.filter((o) => o.status === "new" && known.current && !known.current.has(o.id));
    if (fresh.length) {
      if (audio.current) chime(audio.current);
      document.title = `(${list.filter((o) => o.status === "new").length}) New order · Manolia`;
    }
    known.current = new Set(list.map((o) => o.id));
    setOrders(list);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  async function move(id: string, to: OrderStatus) {
    setBusy(id);
    await fetch(`/api/atelier/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: to }) }).catch(() => null);
    await load();
    setBusy("");
  }

  // browsers only allow sound after a tap, so the bell has to be switched on once
  function toggleSound() {
    if (!audio.current) audio.current = new AudioContext();
    if (!sound) chime(audio.current);
    setSound(!sound);
    if (sound) {
      audio.current.close();
      audio.current = null;
    }
  }

  const past = (orders ?? []).filter((o) => o.status === "done" || o.status === "cancelled");

  const list = orders ?? [];
  const today = new Date().toDateString();
  const takenToday = list.filter((o) => o.status !== "cancelled" && new Date(o.createdAt).toDateString() === today).reduce((n, o) => n + o.total, 0);

  return (
    <main data-lenis-prevent className="relative min-h-[100svh] overflow-x-clip px-4 pb-24 pt-8 text-line md:px-8" style={{ background: "linear-gradient(#13241a, #0f1b13 40%, #0b140f)" }}>
      <div className="pointer-events-none absolute right-[-15%] top-[-10%] h-[60vh] w-[60vw] blur-3xl" style={{ background: "radial-gradient(closest-side, rgb(240 185 174 / 0.1), transparent)" }} />
      <header className="relative flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[17px] italic text-line/55">Manolia</p>
          <h1 className="display text-[64px] text-paper md:text-[96px]">
            The <em>bench</em>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {orders && (
            <p className="mr-2 text-[16px] italic text-line/55">
              <span className="display not-italic text-[28px] tabular-nums text-paper">{money(takenToday)}</span> today
            </p>
          )}
          <button
            onClick={toggleSound}
            className={cn("flex items-center gap-2 rounded-full border px-5 py-3 text-[16px] transition-colors duration-500", sound ? "border-blush bg-blush text-night" : "border-line/25 text-line/80 hover:border-line/60")}
          >
            {sound ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />} {sound ? "Bell is on" : "Turn the bell on"}
          </button>
        </div>
      </header>
      {open && <p className="relative mt-3 text-[14px] italic text-blush">Open in development: set ATELIER_KEY to lock it.</p>}

      <nav className="relative mt-8 flex gap-2">
        {(
          [
            ["orders", "Orders", list.filter((o) => o.status === "new").length],
            ["requests", "Requests & chat", unread],
          ] as const
        ).map(([id, label, n]) => (
          <button key={id} onClick={() => setView(id)} className={cn("flex items-center gap-2.5 rounded-full border px-5 py-3 text-[17px] transition-colors duration-500", view === id ? "border-paper bg-paper text-night" : "border-line/20 text-line/75 hover:border-line/50")}>
            {label}
            {n > 0 && <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blush px-1.5 text-[13px] tabular-nums text-night">{n}</span>}
          </button>
        ))}
      </nav>

      {/* kept mounted so the bell still rings for a new message while the orders are showing */}
      <div className={cn("relative", view !== "requests" && "hidden")}>
        <AtelierRequests onUnread={setUnread} onNew={ring} />
      </div>

      {view !== "orders" ? null : orders === null ? (
        <p className="mt-16 text-center text-[17px] italic text-line/40">Loading…</p>
      ) : (
        <>
          <div className="relative mt-8 grid gap-5 lg:grid-cols-3">
            {COLUMNS.map((c) => {
              const col = orders.filter((o) => o.status === c.status);
              return (
                <section key={c.status} className="rounded-[26px] bg-night/35 p-3 md:p-4">
                  <h2 className="mb-4 flex items-center justify-between px-2 pt-1">
                    <span className="display text-[32px] text-paper">{c.title}</span>
                    <span className={cn("flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[15px] tabular-nums", c.status === "new" && col.length ? "bg-blush text-night" : "bg-line/10 text-line/60")}>{col.length}</span>
                  </h2>
                  <div className="space-y-3">
                    {col.map((o) => (
                      <Card key={o.id} o={o} busy={busy === o.id} onMove={(to) => move(o.id, to)} />
                    ))}
                    {!col.length && <p className="rounded-[20px] border border-dashed border-line/12 px-5 py-12 text-center text-[16px] italic text-line/35">{c.status === "new" ? "Nothing waiting. New orders appear here by themselves." : "Empty"}</p>}
                  </div>
                </section>
              );
            })}
          </div>

          {past.length > 0 && (
            <section className="relative mt-12">
              <h2 className="display mb-4 text-[32px] text-paper">Finished</h2>
              <ul className="divide-y divide-line/10 overflow-hidden rounded-[20px] border border-line/10 bg-night/35 text-[15px]">
                {past.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-3.5">
                    <span className="text-paper">
                      {o.ref} · {o.customer.name}
                    </span>
                    <span className="italic text-line/55">{o.lines.map((l) => `${l.qty} × ${l.name}`).join(", ")}</span>
                    <span className={cn(o.status === "cancelled" ? "text-blush" : "text-line/55")}>
                      {o.status === "cancelled" ? "Cancelled" : o.fulfilment.type === "pickup" ? "Collected" : "Delivered"} · {money(o.total)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
