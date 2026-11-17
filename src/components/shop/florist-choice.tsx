"use client";

import { ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { SplitWords } from "@/components/motion/split-words";
import { usd } from "@/lib/cart-store";
import { ABOUT_MAX, BUDGET_MAX, BUDGET_MIN, BUDGETS, OCCASION_IDEAS, OCCASION_MAX, PALETTES, type Brief, type PaletteId } from "@/lib/custom";
import { cn } from "@/lib/utils";

type Answers = { occasion: string; about: string; palette: PaletteId | "surprise"; budget: number; name: string; phone: string; neededBy: string };
type StepId = "occasion" | "about" | "palette" | "budget" | "name" | "phone" | "when";

/** What the florist asks, in order. */
const ASK: Record<StepId, string> = {
  occasion: "Hello! What's the occasion?",
  about: "Lovely. Tell us a little about them: who they are, what they like.",
  palette: "Any colours you'd like?",
  budget: "What would you like to spend?",
  name: "And your name?",
  phone: "A phone number, so we can reach you?",
  when: "When do you need it?",
};
const ORDER: StepId[] = ["occasion", "about", "palette", "budget", "name", "phone", "when"];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayLabel = (s: string) => {
  if (!s) return "No rush";
  const today = new Date();
  const tomorrow = new Date(Date.now() + 864e5);
  if (s === iso(today)) return "Today";
  if (s === iso(tomorrow)) return "Tomorrow";
  return new Date(`${s}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
};

/** How each answer reads back as the customer's own bubble. */
function said(step: StepId, a: Answers): string {
  switch (step) {
    case "occasion":
      return a.occasion;
    case "about":
      return a.about || "I'll leave it to you";
    case "palette":
      return a.palette === "surprise" ? "You choose" : (PALETTES.find((p) => p.id === a.palette)?.name ?? "");
    case "budget":
      return `Around ${usd(a.budget)}`;
    case "name":
      return a.name;
    case "phone":
      return a.phone;
    case "when":
      return dayLabel(a.neededBy);
  }
}

function Bubble({ from, children, onClick }: { from: "you" | "us"; children: ReactNode; onClick?: () => void }) {
  const cls = cn(
    "max-w-[86%] rounded-[20px] px-4 py-3 text-left text-[17px] leading-snug animate-[msg_0.6s_cubic-bezier(.16,1,.3,1)_both]",
    from === "you" ? "rounded-br-[6px] bg-night text-paper" : "rounded-bl-[6px] bg-white text-ink shadow-[0_10px_30px_-18px_rgb(0_0_0/0.35)]",
  );
  return (
    <div className={cn("flex", from === "you" ? "justify-end" : "justify-start")}>
      {onClick ? (
        <button type="button" onClick={onClick} className={cn(cls, "transition-opacity hover:opacity-80")} title="Change this answer">
          {children}
        </button>
      ) : (
        <div className={cls}>{children}</div>
      )}
    </div>
  );
}

const Option = ({ on, onClick, children, className }: { on?: boolean; onClick: () => void; children: ReactNode; className?: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn("shrink-0 rounded-full border px-4 py-2 text-[16px] transition-colors duration-500", on ? "border-night bg-night text-paper" : "border-ink/15 bg-white text-ink/80 hover:border-ink/45", className)}
  >
    {children}
  </button>
);

/** One line to type into and a round send button, like any messaging app. */
function Composer({ value, onChange, onSend, placeholder, type = "text", max, min = 1, focus = true }: { value: string; onChange: (v: string) => void; onSend: () => void; placeholder: string; type?: string; max: number; min?: number; focus?: boolean }) {
  const ok = value.trim().length >= min;
  const field = useRef<HTMLInputElement>(null);
  // ready to type the moment the florist asks, without jumping the page to it
  useEffect(() => {
    if (focus) field.current?.focus({ preventScroll: true });
  }, [focus]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) onSend();
      }}
      className="flex items-center gap-2 rounded-full border border-ink/12 bg-white py-1.5 pl-5 pr-1.5"
    >
      <input
        ref={field}
        type={type}
        inputMode={type === "tel" ? "tel" : undefined}
        autoComplete={type === "tel" ? "tel" : undefined}
        className="min-w-0 flex-1 bg-transparent py-2 text-[17px] text-ink outline-none placeholder:text-ink/35"
        placeholder={placeholder}
        maxLength={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="submit" disabled={!ok} aria-label="Send" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-night text-paper transition-opacity duration-500 disabled:opacity-25">
        <ArrowUp className="h-4 w-4" />
      </button>
    </form>
  );
}

/**
 * For the customer who does not know what to send: a conversation with the florist instead of a form.
 * The florist asks one thing at a time; the customer taps an option or types. At the end the note is
 * sent and opens the real conversation, where the florist proposes something; nothing is paid before yes.
 */
export function FloristChoice() {
  const router = useRouter();
  const [a, setA] = useState<Answers>({ occasion: "", about: "", palette: "surprise", budget: BUDGETS[1], name: "", phone: "", neededBy: "" });
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [own, setOwn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const body = useRef<HTMLDivElement>(null);
  const done = step >= ORDER.length;
  const current = ORDER[step];

  // keep the newest message in view, inside the chat only
  useEffect(() => {
    const el = body.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [step, typing, own]);

  // the field starts with whatever was answered before, so going back to change something is one tap
  const go = (next: number) => {
    const s = ORDER[next];
    setDraft(s === "occasion" ? a.occasion : s === "about" ? a.about : s === "name" ? a.name : s === "phone" ? a.phone : s === "budget" ? String(a.budget) : "");
    setOwn(false);
    setStep(next);
  };
  const answer = (patch: Partial<Answers>) => {
    setA((v) => ({ ...v, ...patch }));
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      go(step + 1);
    }, 650);
  };

  async function send() {
    if (busy) return;
    setBusy(true);
    setError("");
    const brief: Brief = { occasion: a.occasion, palette: a.palette, about: a.about, budget: a.budget };
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, customer: { name: a.name, phone: a.phone }, neededBy: a.neededBy }),
      });
      const json = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !json.id) throw new Error(json.error || "That did not send. Please try again.");
      router.push(`/request/${json.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not send. Please try again.");
      setBusy(false);
    }
  }

  const today = iso(new Date());
  const tomorrow = iso(new Date(Date.now() + 864e5));

  return (
    <section id="florist" className="gutter relative scroll-mt-24">
      <div className="mx-auto max-w-[620px]">
        <SplitWords text={"No idea?\n*Tell us about them.*"} className="display text-center text-[clamp(52px,8vw,120px)] text-paper" />
        <p className="mx-auto mt-6 max-w-[34ch] text-center text-[18px] italic leading-snug text-line/70">Answer a few questions. We send you a photo and a price, and you pay only if you love it.</p>

        <div className="mt-12 overflow-hidden rounded-[28px] bg-paper text-ink shadow-[0_80px_140px_-60px_rgb(0_0_0/0.9)]">
          <div className="flex items-center gap-3 border-b border-ink/10 px-5 py-4">
            <span className="display flex h-11 w-11 items-center justify-center rounded-full bg-night text-[22px] text-paper">M</span>
            <div>
              <p className="display text-[22px] leading-none">Manolia</p>
              <p className="mt-1 text-[14px] italic leading-none text-ink/50">{typing ? "typing…" : "Your florist"}</p>
            </div>
          </div>

          {/* the conversation so far */}
          <div ref={body} data-lenis-prevent className="h-[min(46svh,480px)] space-y-3 overflow-y-auto overscroll-contain px-4 py-5">
            {ORDER.slice(0, step).map((s, i) => (
              <div key={s} className="space-y-3">
                <Bubble from="us">{ASK[s]}</Bubble>
                <Bubble from="you" onClick={busy ? undefined : () => go(i)}>
                  {said(s, a)}
                </Bubble>
              </div>
            ))}
            {typing ? (
              <div className="flex gap-1.5 px-3 py-2" aria-label="The florist is typing">
                {[0, 1, 2].map((k) => (
                  <span key={k} className="h-2 w-2 animate-pulse rounded-full bg-ink/35" style={{ animationDelay: `${k * 0.18}s` }} />
                ))}
              </div>
            ) : done ? (
              <Bubble from="us">
                Thank you, {a.name.split(" ")[0]}! Send it over and we&apos;ll reply here with a photo and a price for {a.occasion.toLowerCase().startsWith("my ") ? a.occasion.toLowerCase() : `the ${a.occasion.toLowerCase()}`}.
              </Bubble>
            ) : (
              <Bubble from="us">{ASK[current]}</Bubble>
            )}
          </div>

          {/* how to answer: tap an option, or type */}
          <div className="space-y-3 border-t border-ink/10 bg-[#ece5d8] p-3 md:p-4">
            {!typing && !done && current === "occasion" && (
              <>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
                  {OCCASION_IDEAS.map((o) => (
                    <Option key={o} onClick={() => answer({ occasion: o })}>
                      {o}
                    </Option>
                  ))}
                </div>
                <Composer value={draft} onChange={setDraft} onSend={() => answer({ occasion: draft.trim() })} placeholder="Or write it: my mum's birthday" max={OCCASION_MAX} min={2} focus={false} />
              </>
            )}
            {!typing && !done && current === "about" && (
              <>
                <div className="flex gap-2">
                  <Option onClick={() => answer({ about: "" })}>Skip, you choose</Option>
                </div>
                <Composer value={draft} onChange={setDraft} onSend={() => answer({ about: draft.trim() })} placeholder="She loves white flowers…" max={ABOUT_MAX} />
              </>
            )}
            {!typing && !done && current === "palette" && (
              <div className="flex flex-wrap items-center gap-2.5">
                <Option on={a.palette === "surprise"} onClick={() => answer({ palette: "surprise" })}>
                  You choose
                </Option>
                {PALETTES.filter((p) => p.id !== "garden").map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => answer({ palette: p.id })}
                    aria-label={p.name}
                    title={p.name}
                    className="h-10 w-10 rounded-full ring-1 ring-ink/15 ring-offset-2 ring-offset-[#ece5d8] transition-transform duration-500 hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${p.tints[0]} 50%, ${p.tints[1]} 50%)` }}
                  />
                ))}
              </div>
            )}
            {!typing && !done && current === "budget" &&
              (own ? (
                <Composer
                  type="number"
                  value={draft}
                  onChange={(v) => setDraft(v.replace(/\D/g, ""))}
                  onSend={() => answer({ budget: Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, Number(draft) || BUDGET_MIN)) })}
                  placeholder={`Amount in dollars, from ${BUDGET_MIN}`}
                  max={5}
                  min={2}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {BUDGETS.map((n) => (
                    <Option key={n} onClick={() => answer({ budget: n })}>
                      {usd(n)}
                    </Option>
                  ))}
                  <Option
                    onClick={() => {
                      setDraft("");
                      setOwn(true);
                    }}
                  >
                    Other
                  </Option>
                </div>
              ))}
            {!typing && !done && current === "name" && <Composer value={draft} onChange={setDraft} onSend={() => answer({ name: draft.trim() })} placeholder="Your name" max={80} min={2} />}
            {!typing && !done && current === "phone" && (
              <Composer type="tel" value={draft} onChange={setDraft} onSend={() => answer({ phone: draft.trim() })} placeholder="70 123 456" max={24} min={7} />
            )}
            {!typing && !done && current === "when" && (
              <div className="flex flex-wrap items-center gap-2">
                <Option onClick={() => answer({ neededBy: today })}>Today</Option>
                <Option onClick={() => answer({ neededBy: tomorrow })}>Tomorrow</Option>
                <Option onClick={() => answer({ neededBy: "" })}>No rush</Option>
                <label className="relative shrink-0 cursor-pointer rounded-full border border-ink/15 bg-white px-4 py-2 text-[16px] text-ink/80">
                  Pick a date
                  <input type="date" min={today} className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => e.target.value && answer({ neededBy: e.target.value })} aria-label="Pick a date" />
                </label>
              </div>
            )}
            {done && !typing && (
              <>
                <button onClick={send} disabled={busy} data-cursor="Send" className="flex w-full items-center justify-center gap-3 rounded-full bg-night py-4 text-[18px] text-paper transition-colors duration-500 hover:bg-moss disabled:cursor-wait disabled:opacity-60">
                  {busy ? "Sending…" : "Send to the florist"} {!busy && <span aria-hidden>→</span>}
                </button>
                <p className="text-center text-[15px] italic text-ink/50">Nothing is charged now. Tap any answer above to change it.</p>
              </>
            )}
            {error && (
              <p role="alert" className="rounded-[12px] bg-clay/10 px-4 py-3 text-[15px] text-clay">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
