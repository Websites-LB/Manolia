"use client";

import { ImagePlus, SendHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { money } from "@/lib/orders";
import { clock, dayLabel, uploadUrl, type Msg, type Proposal } from "@/lib/requests";
import { cn } from "@/lib/utils";

/** Send a file to the server and get back the id to attach to a message. */
export async function upload(file: File, kind: "image" | "audio" = "image"): Promise<string> {
  const form = new FormData();
  form.set("file", file);
  form.set("kind", kind);
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const json = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
  if (!res.ok || !json.id) throw new Error(json.error || "That file could not be sent.");
  return json.id;
}

/** The chat comes in two finishes: paper for the customer (like every chat on the site), night for the boutique's board. */
export type Tone = "paper" | "night";
const T = {
  paper: {
    mine: "rounded-br-[6px] bg-night text-paper",
    theirs: "rounded-bl-[6px] bg-white text-ink shadow-[0_10px_30px_-18px_rgb(0_0_0/0.35)]",
    meta: "text-ink/40",
    day: "text-ink/40",
    empty: "text-ink/50",
    rule: "border-ink/10",
    photo: "border-ink/10",
    field: "border-ink/12 bg-white focus-within:border-ink/40",
    text: "text-ink placeholder:text-ink/35",
    attach: "text-ink/50 hover:bg-ink/5 hover:text-ink",
    send: "bg-night text-paper hover:bg-moss",
    chip: "bg-paper text-night",
    error: "text-clay",
  },
  night: {
    mine: "rounded-br-[6px] bg-paper text-ink",
    theirs: "rounded-bl-[6px] bg-[#1c3024] text-line",
    meta: "text-line/35",
    day: "text-line/35",
    empty: "text-line/45",
    rule: "border-line/12",
    photo: "border-line/12",
    field: "border-line/15 bg-night/60 focus-within:border-line/45",
    text: "text-paper placeholder:text-line/35",
    attach: "text-line/60 hover:bg-line/10 hover:text-paper",
    send: "bg-blush text-night hover:bg-paper",
    chip: "bg-paper text-night",
    error: "text-blush",
  },
};

/** A proposal as the customer sees it: what the florist would make, the price, and the two answers. */
export function ProposalCard({ p, state, onAccept, onChange, tone = "night" }: { p: Proposal; state?: "open" | "accepted" | "past"; onAccept?: () => void; onChange?: () => void; tone?: Tone }) {
  const paper = tone === "paper";
  return (
    <div
      className={cn(
        "w-full max-w-[380px] overflow-hidden rounded-[22px] border animate-[msg_0.6s_cubic-bezier(.16,1,.3,1)_both]",
        paper ? "bg-white shadow-[0_24px_50px_-28px_rgb(0_0_0/0.5)]" : "bg-[#16271d]",
        state === "accepted" ? (paper ? "border-clay/60" : "border-blush") : paper ? "border-ink/8" : "border-line/15",
      )}
    >
      {p.image && (
        // eslint-disable-next-line @next/next/no-img-element -- uploaded at runtime, served by our own route
        <img src={uploadUrl(p.image)} alt={`The florist's photo of ${p.title}`} className="aspect-[4/5] w-full object-cover" />
      )}
      <div className="p-5">
        <p className={cn("text-[15px] italic", paper ? "text-clay" : "text-blush")}>{state === "accepted" ? "You said yes to this" : "The florist proposes"}</p>
        <div className="mt-1 flex items-baseline justify-between gap-4">
          <p className={cn("display text-[32px] leading-tight", paper ? "text-ink" : "text-paper")}>{p.title}</p>
          <p className={cn("display text-[30px] tabular-nums", paper ? "text-ink" : "text-paper")}>{money(p.price)}</p>
        </div>
        {p.note && <p className={cn("mt-2 whitespace-pre-line text-[15px] leading-relaxed", paper ? "text-ink/65" : "text-line/70")}>{p.note}</p>}
        {state === "open" && onAccept && (
          <div className="mt-5 grid gap-2">
            <button onClick={onAccept} className={cn("flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[17px] transition-colors duration-500", paper ? "bg-night text-paper hover:bg-moss" : "bg-blush text-night hover:bg-paper")}>
              Yes, make this <span aria-hidden>→</span>
            </button>
            <button onClick={onChange} className={cn("w-full rounded-full border py-3 text-[16px] transition-colors duration-500", paper ? "border-ink/15 text-ink/75 hover:border-ink/45" : "border-line/20 text-line/80 hover:border-line/50")}>
              Ask for a change
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type Props = {
  messages: Msg[];
  me: Msg["from"];
  /** id of the proposal message the customer accepted, if any */
  acceptedId?: string;
  closed?: boolean;
  onSend: (m: { text?: string; image?: string }) => Promise<void>;
  onAccept?: (msgId: string) => void;
  placeholder: string;
  /** what to show before anyone has written */
  empty: string;
  tone?: Tone;
};

/**
 * The conversation between a customer and the florist, used on both sides. Messages group by day,
 * photos open full size, proposals are cards, and the composer sends on Enter.
 */
export function Thread({ messages, me, acceptedId, closed, onSend, onAccept, placeholder, empty, tone = "night" }: Props) {
  const t = T[tone];
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);

  // keep the newest message in view by scrolling the conversation only, never the page around it
  const count = messages.length;
  const first = useRef(true);
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: first.current ? "auto" : "smooth" });
    first.current = false;
  }, [count]);

  async function attach(f?: File) {
    if (!f) return;
    setBusy(true);
    setError("");
    try {
      setImage(await upload(f));
    } catch (e) {
      setError(e instanceof Error ? e.message : "That photo could not be sent.");
    }
    setBusy(false);
  }

  async function send() {
    const t = text.trim();
    if (busy || (!t && !image)) return;
    setBusy(true);
    setError("");
    try {
      await onSend({ text: t || undefined, image: image || undefined });
      setText("");
      setImage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "That did not send. Please try again.");
    }
    setBusy(false);
  }

  const lastProposal = [...messages].reverse().find((m) => m.proposal)?.id;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={list} data-lenis-prevent className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-1 py-3">
        {!messages.length && <p className={cn("mx-auto max-w-[34ch] py-16 text-center text-[17px] italic leading-snug", t.empty)}>{empty}</p>}
        {messages.map((m, i) => {
          const mine = m.from === me;
          const newDay = !i || messages[i - 1].at.slice(0, 10) !== m.at.slice(0, 10);
          return (
            <div key={m.id}>
              {newDay && <p className={cn("py-3 text-center text-[14px] italic", t.day)}>{dayLabel(m.at)}</p>}
              <div className={cn("flex flex-col gap-1.5", mine ? "items-end" : "items-start")}>
                {m.image && (
                  <a href={uploadUrl(m.image)} target="_blank" rel="noreferrer" className={cn("block max-w-[min(78%,340px)] overflow-hidden rounded-[18px] border animate-[msg_0.6s_cubic-bezier(.16,1,.3,1)_both]", t.photo)}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- uploaded at runtime */}
                    <img src={uploadUrl(m.image)} alt={mine ? "A photo you sent" : "A photo from the other side"} className="max-h-[420px] w-full object-cover" />
                  </a>
                )}
                {m.text && (
                  <p className={cn("max-w-[min(84%,460px)] whitespace-pre-line rounded-[20px] px-4 py-3 text-[17px] leading-snug animate-[msg_0.6s_cubic-bezier(.16,1,.3,1)_both]", mine ? t.mine : t.theirs)}>
                    {m.text}
                  </p>
                )}
                {m.proposal && (
                  <ProposalCard
                    p={m.proposal}
                    state={acceptedId === m.id ? "accepted" : m.id === lastProposal && !acceptedId && me === "customer" && !closed ? "open" : "past"}
                    onAccept={onAccept && (() => onAccept(m.id))}
                    onChange={() => input.current?.focus()}
                    tone={tone}
                  />
                )}
                <p className={cn("px-1 text-[13px] italic", t.meta)}>
                  {mine ? "You" : m.from === "florist" ? "Manolia" : "Customer"} · {clock(m.at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {closed ? (
        <p className={cn("border-t py-5 text-center text-[16px] italic", t.rule, t.day)}>This conversation is closed</p>
      ) : (
        <div className={cn("border-t pt-3", t.rule)}>
          {image && (
            <div className="relative mb-3 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element -- uploaded at runtime */}
              <img src={uploadUrl(image)} alt="The photo you are about to send" className="h-20 w-20 rounded-[8px] object-cover" />
              <button onClick={() => setImage("")} aria-label="Remove the photo" className={cn("absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full shadow", t.chip)}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className={cn("flex items-end gap-2 rounded-[26px] border py-1.5 pl-2 pr-1.5 transition-colors duration-500", t.field)}>
            <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => (attach(e.target.files?.[0]), (e.target.value = ""))} />
            <button onClick={() => file.current?.click()} disabled={busy} aria-label="Attach a photo" className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-500", t.attach)}>
              <ImagePlus className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
            <textarea
              ref={input}
              rows={1}
              value={text}
              maxLength={1200}
              placeholder={placeholder}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              className={cn("max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2 text-[17px] outline-none [field-sizing:content]", t.text)}
            />
            <button onClick={send} disabled={busy || (!text.trim() && !image)} aria-label="Send" className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-[background-color,opacity] duration-500 disabled:opacity-25", t.send)}>
              <SendHorizontal className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
          {error && (
            <p role="alert" className={cn("mt-2 px-2 text-[15px]", t.error)}>
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
