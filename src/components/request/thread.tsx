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

/** A proposal as the customer sees it: what the florist would make, the price, and the two answers. */
export function ProposalCard({ p, state, onAccept, onChange }: { p: Proposal; state?: "open" | "accepted" | "past"; onAccept?: () => void; onChange?: () => void }) {
  return (
    <div className={cn("w-full max-w-[400px] overflow-hidden rounded-[10px] border bg-[#16271d]", state === "accepted" ? "border-blush" : "border-line/15")}>
      {p.image && (
        // eslint-disable-next-line @next/next/no-img-element -- uploaded at runtime, served by our own route
        <img src={uploadUrl(p.image)} alt={`The florist's photo of ${p.title}`} className="aspect-[4/5] w-full object-cover" />
      )}
      <div className="p-5">
        <p className="label text-blush">{state === "accepted" ? "You said yes to this" : "The florist proposes"}</p>
        <div className="mt-2 flex items-baseline justify-between gap-4">
          <p className="display text-[34px] text-paper">{p.title}</p>
          <p className="display text-[30px] tabular-nums text-paper">{money(p.price)}</p>
        </div>
        {p.note && <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-line/70">{p.note}</p>}
        {state === "open" && onAccept && (
          <div className="mt-5 grid gap-2">
            <button onClick={onAccept} className="pill w-full justify-center bg-blush text-night hover:bg-paper">
              Yes, make this <span aria-hidden>→</span>
            </button>
            <button onClick={onChange} className="pill w-full justify-center border border-line/20 text-line/80 hover:border-line/50">
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
};

/**
 * The conversation between a customer and the florist, used on both sides. Messages group by day,
 * photos open full size, proposals are cards, and the composer sends on Enter.
 */
export function Thread({ messages, me, acceptedId, closed, onSend, onAccept, placeholder, empty }: Props) {
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);

  // keep the newest message in view, without yanking the page when nothing changed
  const count = messages.length;
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest", behavior: count ? "smooth" : "auto" });
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
      <div data-lenis-prevent className="min-h-0 flex-1 space-y-3 overflow-y-auto px-1 py-2">
        {!messages.length && <p className="mx-auto max-w-[36ch] py-16 text-center text-[14px] leading-relaxed text-line/45">{empty}</p>}
        {messages.map((m, i) => {
          const mine = m.from === me;
          const newDay = !i || messages[i - 1].at.slice(0, 10) !== m.at.slice(0, 10);
          return (
            <div key={m.id}>
              {newDay && <p className="label py-3 text-center text-line/35">{dayLabel(m.at)}</p>}
              <div className={cn("flex flex-col gap-1.5", mine ? "items-end" : "items-start")}>
                {m.image && (
                  <a href={uploadUrl(m.image)} target="_blank" rel="noreferrer" className="block max-w-[min(78%,340px)] overflow-hidden rounded-[10px] border border-line/12">
                    {/* eslint-disable-next-line @next/next/no-img-element -- uploaded at runtime */}
                    <img src={uploadUrl(m.image)} alt={mine ? "A photo you sent" : "A photo from the other side"} className="max-h-[420px] w-full object-cover" />
                  </a>
                )}
                {m.text && (
                  <p className={cn("max-w-[min(82%,460px)] whitespace-pre-line rounded-[16px] px-4 py-2.5 text-[14.5px] leading-relaxed", mine ? "rounded-br-[4px] bg-paper text-ink" : "rounded-bl-[4px] bg-[#1c3024] text-line")}>
                    {m.text}
                  </p>
                )}
                {m.proposal && (
                  <ProposalCard
                    p={m.proposal}
                    state={acceptedId === m.id ? "accepted" : m.id === lastProposal && !acceptedId && me === "customer" && !closed ? "open" : "past"}
                    onAccept={onAccept && (() => onAccept(m.id))}
                    onChange={() => input.current?.focus()}
                  />
                )}
                <p className="label px-1 text-line/30">
                  {mine ? "You" : m.from === "florist" ? "Manolia" : "Customer"} · {clock(m.at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>

      {closed ? (
        <p className="label border-t border-line/12 py-5 text-center text-line/40">This conversation is closed</p>
      ) : (
        <div className="border-t border-line/12 pt-3">
          {image && (
            <div className="relative mb-3 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element -- uploaded at runtime */}
              <img src={uploadUrl(image)} alt="The photo you are about to send" className="h-20 w-20 rounded-[8px] object-cover" />
              <button onClick={() => setImage("")} aria-label="Remove the photo" className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-paper text-night">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2 rounded-[22px] border border-line/15 bg-night/60 py-1.5 pl-2 pr-1.5 transition-colors duration-500 focus-within:border-line/45">
            <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => (attach(e.target.files?.[0]), (e.target.value = ""))} />
            <button onClick={() => file.current?.click()} disabled={busy} aria-label="Attach a photo" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-line/60 transition-colors duration-500 hover:bg-line/10 hover:text-paper">
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
              className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-2 text-[15px] text-paper outline-none [field-sizing:content] placeholder:text-line/35"
            />
            <button onClick={send} disabled={busy || (!text.trim() && !image)} aria-label="Send" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blush text-night transition-[background-color,opacity] duration-500 hover:bg-paper disabled:opacity-30">
              <SendHorizontal className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-2 px-2 text-[13px] text-blush">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
