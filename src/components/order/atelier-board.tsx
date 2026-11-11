"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { money, PAY_LABEL, prettyDate, type Order, type OrderStatus } from "@/lib/orders";
import { cn } from "@/lib/utils";

import { AtelierRequests } from "./atelier-requests";
import { VoiceCode } from "./voice-code";

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string; pickup?: string }>> = {
  new: { to: "arranging", label: "Accept & start arranging" },
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

function Card({ o, onMove, busy }: { o: Order; onMove: (to: OrderStatus) => void; busy: boolean }) {
  const f = o.fulfilment;
  const pickup = f.type === "pickup";
  const next = NEXT[o.status];
  return (
    <article className={cn("rounded-[8px] border bg-[#16271d] p-5", o.status === "new" ? "border-blush" : "border-line/12")}>
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="display text-[34px] text-paper">{o.ref}</h3>
        <p className="label text-line/50">
          {new Date(o.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          {o.payment.mode === "test" && <span className="ml-2 text-blush">Test</span>}
        </p>
      </header>

      <p className="mt-3 rounded-[4px] bg-night/60 px-3 py-2.5 text-[14px] text-paper">
        <span className="label mr-2 text-blush">{pickup ? "Pick-up" : "Delivery"}</span>
        {prettyDate(f.date)}, {f.slot.toLowerCase()}
      </p>

      <ul className="mt-4 space-y-3">
        {o.lines.map((l) => (
          <li key={l.id}>
            <p className="text-[15px] text-paper">
              <span className="mr-1.5 tabular-nums text-blush">{l.qty} ×</span>
              {l.name}
            </p>
            <p className="mt-0.5 text-[13px] leading-snug text-line/55">{l.detail}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2 border-t border-line/10 pt-4 text-[13.5px] text-line/75">
        {o.cardMessage && (
          <div>
            <dt className="label text-line/40">Card</dt>
            <dd className="mt-1 font-serif text-[19px] italic leading-snug text-paper">“{o.cardMessage}”</dd>
          </div>
        )}
        {o.note && (
          <div>
            <dt className="label text-line/40">Note</dt>
            <dd className="mt-1">{o.note}</dd>
          </div>
        )}
        {o.voiceNote && (
          <div>
            <dt className="label text-line/40">Voice note · print this code on the card</dt>
            <dd className="mt-2">
              <VoiceCode id={o.voiceNote} />
            </dd>
          </div>
        )}
        {!pickup && (
          <div>
            <dt className="label text-line/40">Deliver to</dt>
            <dd className="mt-1">
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
          <dt className="label text-line/40">Customer</dt>
          <dd className="mt-1">
            {o.customer.name} ·{" "}
            <a className="link-u text-blush" href={`tel:${o.customer.phone}`}>
              {o.customer.phone}
            </a>
          </dd>
        </div>
      </dl>

      <footer className="mt-5 flex items-center justify-between gap-3 border-t border-line/10 pt-4">
        <p className="text-[13px] text-line/60">
          <span className="display mr-2 text-[26px] tabular-nums text-paper">{money(o.total)}</span>
          paid · {PAY_LABEL[o.payment.method]}
        </p>
        {next && (
          <button onClick={() => window.confirm(`Cancel order ${o.ref}? The customer will see it as cancelled.`) && onMove("cancelled")} disabled={busy} className="label text-line/40 hover:text-blush">
            Cancel
          </button>
        )}
      </footer>
      {next && (
        <button onClick={() => onMove(next.to)} disabled={busy} className={cn("pill mt-4 w-full justify-center disabled:opacity-50", o.status === "new" ? "bg-blush text-night hover:bg-paper" : "bg-paper text-night hover:bg-blush")}>
          {(pickup && next.pickup) || next.label} <span aria-hidden>→</span>
        </button>
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

  return (
    <main data-lenis-prevent className="min-h-[100svh] bg-night px-4 pb-24 pt-8 text-line md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line/12 pb-6">
        <div>
          <p className="label text-line/45">Manolia · Atelier</p>
          <h1 className="display mt-2 text-[56px] text-paper md:text-[72px]">
            The <em>bench</em>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {open && <p className="label text-blush">Open in development · set ATELIER_KEY to lock</p>}
          <button onClick={toggleSound} className={cn("pill border", sound ? "border-blush bg-blush text-night" : "border-line/25 text-line/80 hover:border-line/60")}>
            {sound ? "Bell is on" : "Turn the bell on"}
          </button>
        </div>
      </header>

      <nav className="mt-6 flex gap-2">
        {(
          [
            ["orders", "Orders", (orders ?? []).filter((o) => o.status === "new").length],
            ["requests", "Requests & chat", unread],
          ] as const
        ).map(([id, label, n]) => (
          <button key={id} onClick={() => setView(id)} className={cn("label flex items-center gap-2.5 rounded-full border px-5 py-3 transition-colors duration-500", view === id ? "border-paper bg-paper text-night" : "border-line/20 text-line/75 hover:border-line/50")}>
            {label}
            {n > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blush px-1.5 text-[11px] tabular-nums text-night">{n}</span>}
          </button>
        ))}
      </nav>

      {/* kept mounted so the bell still rings for a new message while the orders are showing */}
      <div className={cn(view !== "requests" && "hidden")}>
        <AtelierRequests onUnread={setUnread} onNew={ring} />
      </div>

      {view !== "orders" ? null : orders === null ? (
        <p className="label mt-16 text-center text-line/40">Loading…</p>
      ) : (
        <>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {COLUMNS.map((c) => {
              const list = orders.filter((o) => o.status === c.status);
              return (
                <section key={c.status}>
                  <h2 className="label mb-4 flex items-center justify-between text-line/55">
                    {c.title} <span className="tabular-nums">{list.length}</span>
                  </h2>
                  <div className="space-y-4">
                    {list.map((o) => (
                      <Card key={o.id} o={o} busy={busy === o.id} onMove={(to) => move(o.id, to)} />
                    ))}
                    {!list.length && <p className="rounded-[8px] border border-dashed border-line/12 px-5 py-10 text-center text-[13px] text-line/35">{c.status === "new" ? "Nothing waiting. New orders appear here by themselves." : "Empty"}</p>}
                  </div>
                </section>
              );
            })}
          </div>

          {past.length > 0 && (
            <section className="mt-14">
              <h2 className="label mb-3 text-line/55">Finished</h2>
              <ul className="divide-y divide-line/10 border-y border-line/10 text-[13.5px]">
                {past.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3">
                    <span className="text-paper">
                      {o.ref} · {o.customer.name}
                    </span>
                    <span className="text-line/55">{o.lines.map((l) => `${l.qty} × ${l.name}`).join(", ")}</span>
                    <span className={cn("label", o.status === "cancelled" ? "text-blush" : "text-line/45")}>
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
