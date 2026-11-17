"use client";

import { ImagePlus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Thread, upload } from "@/components/request/thread";
import { briefSummary } from "@/lib/custom";
import { money, prettyDate } from "@/lib/orders";
import { clock, unreadFor, uploadUrl, type FlowerRequest } from "@/lib/requests";
import { cn } from "@/lib/utils";

const LABEL: Record<FlowerRequest["status"], string> = { open: "Waiting for you", proposed: "Proposal sent", accepted: "Accepted, not paid yet", ordered: "Ordered", closed: "Closed" };

/** The form a florist fills to put something concrete in front of the customer. */
function ProposalForm({ budget, onSend, onCancel }: { budget: number; onSend: (p: { title: string; price: number; note?: string; image?: string }) => Promise<void>; onCancel: () => void }) {
  const [p, setP] = useState({ title: "", price: String(budget), note: "", image: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);

  async function attach(f?: File) {
    if (!f) return;
    setBusy(true);
    setError("");
    try {
      const id = await upload(f);
      setP((v) => ({ ...v, image: id }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "That photo could not be sent.");
    }
    setBusy(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSend({ title: p.title.trim(), price: Math.round(Number(p.price)), note: p.note.trim() || undefined, image: p.image || undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not send.");
      setBusy(false);
    }
  }

  const field = "w-full border-b border-line/20 bg-transparent py-2.5 text-[17px] text-paper outline-none placeholder:text-line/35 focus:border-paper";
  return (
    <form onSubmit={submit} className="mt-3 rounded-[20px] border border-blush/60 bg-blush/[0.06] p-4">
      <p className="text-[15px] italic text-blush">Your proposal · their budget is about {money(budget)}</p>
      <div className="mt-2 grid gap-x-4 sm:grid-cols-[1fr_7rem]">
        <input className={field} required minLength={2} maxLength={80} placeholder="What you would make, in a few words" value={p.title} onChange={(e) => setP((v) => ({ ...v, title: e.target.value }))} />
        <label className="relative block">
          <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-line/50">$</span>
          <input className={cn(field, "pl-4 tabular-nums")} required type="number" min={5} step={1} inputMode="numeric" aria-label="Price in dollars" value={p.price} onChange={(e) => setP((v) => ({ ...v, price: e.target.value }))} />
        </label>
      </div>
      <textarea className={cn(field, "min-h-20 resize-none")} maxLength={600} placeholder="The stems, the colours, the wrap, why it suits them (optional)" value={p.note} onChange={(e) => setP((v) => ({ ...v, note: e.target.value }))} />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => (attach(e.target.files?.[0]), (e.target.value = ""))} />
        {p.image ? (
          <span className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element -- uploaded at runtime */}
            <img src={uploadUrl(p.image)} alt="The photo attached to the proposal" className="h-16 w-16 rounded-[6px] object-cover" />
            <button type="button" onClick={() => setP((v) => ({ ...v, image: "" }))} aria-label="Remove the photo" className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-paper text-night">
              <X className="h-3 w-3" />
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => file.current?.click()} disabled={busy} className="flex items-center gap-2 text-[15px] text-line/65 hover:text-paper">
            <ImagePlus className="h-4 w-4" strokeWidth={1.5} /> Add a photo or a sketch
          </button>
        )}
        <div className="flex items-center gap-4">
          <button type="button" onClick={onCancel} className="text-[15px] italic text-line/50 hover:text-paper">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="rounded-full bg-blush px-6 py-3 text-[17px] text-night transition-colors duration-500 hover:bg-paper disabled:opacity-50">
            Send the proposal
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-blush">
          {error}
        </p>
      )}
    </form>
  );
}

/**
 * The florist's side of "not sure what to send?": every request on the left, the open conversation
 * on the right. They can simply talk, send photos, or send a proposal the customer can accept and pay.
 */
export function AtelierRequests({ onUnread, onNew }: { onUnread: (n: number) => void; onNew: () => void }) {
  const [list, setList] = useState<FlowerRequest[] | null>(null);
  const [openId, setOpenId] = useState("");
  const [proposing, setProposing] = useState(false);
  const heard = useRef<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/atelier/requests", { cache: "no-store" }).catch(() => null);
    if (!res?.ok) return;
    const { requests } = (await res.json()) as { requests: FlowerRequest[] };
    // ring for anything new from a customer: a first note, or a reply
    const waiting = requests.reduce((n, r) => n + unreadFor(r, "florist") + (r.messages.length ? 0 : r.seen.florist ? 0 : 1), 0);
    if (heard.current !== null && waiting > heard.current) onNew();
    heard.current = waiting;
    onUnread(waiting);
    setList(requests);
  }, [onNew, onUnread]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000); // the board keeps polling in a background tab on purpose: that is when the bell matters
    return () => clearInterval(t);
  }, [load]);

  const open = list?.find((r) => r.id === openId) ?? null;
  const act = (id: string, method: "POST" | "PATCH", body: unknown) => fetch(`/api/atelier/requests/${id}`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  // opening a conversation, or receiving in the open one, marks it read
  const openUnread = open ? unreadFor(open, "florist") + (open.seen.florist ? 0 : 1) : 0;
  useEffect(() => {
    if (open && openUnread) act(open.id, "PATCH", { action: "seen" }).then(load);
  }, [open, openUnread, load]);

  async function send(body: unknown) {
    if (!open) return;
    const res = await act(open.id, "POST", body);
    if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error || "That did not send.");
    await load();
  }

  if (list === null) return <p className="mt-16 text-center text-[17px] italic text-line/40">Loading…</p>;
  if (!list.length) return <p className="mx-auto mt-16 max-w-[40ch] rounded-[26px] border border-dashed border-line/12 px-5 py-12 text-center text-[16px] italic leading-relaxed text-line/40">No requests yet. When a customer fills in “Not sure what to send?”, their note lands here and you can write back.</p>;

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <ul className={cn("space-y-2", open && "hidden lg:block")}>
        {list.map((r) => {
          const n = unreadFor(r, "florist") + (r.seen.florist ? 0 : 1);
          const last = r.messages.at(-1);
          return (
            <li key={r.id}>
              <button onClick={() => (setOpenId(r.id), setProposing(false))} className={cn("w-full rounded-[20px] border p-4 text-left transition-colors duration-500", r.id === openId ? "border-blush/70 bg-[#16271d]" : "border-line/12 bg-night/35 hover:border-line/35")}>
                <span className="flex items-baseline justify-between gap-3">
                  <span className="display text-[26px] text-paper">{r.customer.name}</span>
                  {n > 0 ? <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blush px-1.5 text-[13px] tabular-nums text-night">{n}</span> : <span className="text-[14px] italic text-line/40">{clock(last?.at ?? r.createdAt)}</span>}
                </span>
                <span className="mt-1 block truncate text-[15px] text-line/60">{last ? `${last.from === "florist" ? "You: " : ""}${last.text ?? (last.proposal ? `Proposal: ${last.proposal.title}` : "A photo")}` : briefSummary(r.brief)}</span>
                <span className="mt-2 flex justify-between text-[14px] italic text-line/45">
                  <span className={cn(r.status === "open" && "text-blush")}>{LABEL[r.status]}</span>
                  <span>{money(r.brief.budget)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {open ? (
        <section className="flex h-[calc(100svh-14rem)] min-h-[520px] flex-col rounded-[26px] border border-line/12 bg-[#101c15]/90 p-4 backdrop-blur-sm md:p-6">
          <header className="border-b border-line/12 pb-4">
            <button onClick={() => setOpenId("")} className="mb-3 text-[16px] italic text-line/55 lg:hidden">
              ← All requests
            </button>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="display text-[34px] text-paper">
                  {open.customer.name} <span className="ml-2 align-middle text-[16px] italic tracking-normal text-line/40">{open.ref}</span>
                </h2>
                <a className="link-u text-[14px] text-blush" href={`tel:${open.customer.phone}`}>
                  {open.customer.phone}
                </a>
              </div>
              <div className="text-right">
                <p className="display text-[30px] tabular-nums text-paper">{money(open.brief.budget)}</p>
                <p className="text-[14px] italic text-line/50">{open.neededBy ? `For ${prettyDate(open.neededBy)}` : "No date given"}</p>
              </div>
            </div>
            <p className="mt-3 rounded-[14px] bg-night/60 px-4 py-3 text-[15px] leading-relaxed text-line/85">{briefSummary(open.brief)}</p>
          </header>
          <Thread
            key={open.id}
            messages={open.messages}
            me="florist"
            acceptedId={open.accepted?.msgId}
            closed={open.status === "ordered" || open.status === "closed"}
            onSend={send}
            placeholder={`Write to ${open.customer.name.split(/\s+/)[0]}…`}
            empty="Their note is above. Ask them anything, or send a proposal straight away."
          />
          {open.status !== "ordered" && open.status !== "closed" && (
            <>
              {proposing ? (
                <ProposalForm budget={open.brief.budget} onCancel={() => setProposing(false)} onSend={async (p) => (await send({ proposal: p }), setProposing(false))} />
              ) : (
                <div className="mt-3 flex items-center justify-between">
                  <button onClick={() => window.confirm("Close this conversation? The customer will not be able to reply.") && act(open.id, "PATCH", { action: "close" }).then(load)} className="text-[15px] italic text-line/45 hover:text-blush">
                    Close the conversation
                  </button>
                  <button onClick={() => setProposing(true)} className="flex items-center gap-2 rounded-full bg-paper px-6 py-3 text-[17px] text-night transition-colors duration-500 hover:bg-blush">
                    Send a proposal <span aria-hidden>→</span>
                  </button>
                </div>
              )}
            </>
          )}
          {open.status === "accepted" && open.accepted && <p className="mt-3 text-center text-[15px] italic text-blush">They said yes to “{open.accepted.title}” at {money(open.accepted.price)}. It becomes an order once they pay.</p>}
        </section>
      ) : (
        <p className="hidden items-center justify-center rounded-[26px] border border-dashed border-line/12 text-[16px] italic text-line/35 lg:flex">Choose a request to read it and reply.</p>
      )}
    </div>
  );
}
