"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { SplitWords } from "@/components/motion/split-words";
import { usd } from "@/lib/cart-store";
import { ABOUT_MAX, BUDGET_MAX, BUDGET_MIN, BUDGETS, OCCASION_IDEAS, OCCASION_MAX, PALETTES, type Brief } from "@/lib/custom";
import { cn } from "@/lib/utils";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[19px] text-ink">
        {label} {hint && <span className="text-[15px] italic text-ink/45">{hint}</span>}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

const Chip = ({ on, onClick, children, className }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={on}
    className={cn("rounded-full border px-4 py-2 text-[16px] transition-colors duration-500", on ? "border-night bg-night text-paper" : "border-ink/15 text-ink/75 hover:border-ink/45", className)}
  >
    {children}
  </button>
);

/**
 * For the customer who does not know what to send: a short note to the florist instead of a product.
 * The occasion in their own words, a few words about the person, a budget, and how to reach them.
 * Sending it opens a conversation; the florist proposes something and nothing is paid until they say yes.
 */
export function FloristChoice() {
  const router = useRouter();
  const [b, setB] = useState<Brief>({ occasion: "", palette: "surprise", about: "", budget: BUDGETS[1] });
  const [own, setOwn] = useState(false);
  const [who, setWho] = useState({ name: "", phone: "", neededBy: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof who) => (e: React.ChangeEvent<HTMLInputElement>) => setWho((v) => ({ ...v, [k]: e.target.value }));

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: b, customer: { name: who.name, phone: who.phone }, neededBy: who.neededBy }),
      });
      const json = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !json.id) throw new Error(json.error || "That did not send. Please try again.");
      router.push(`/request/${json.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not send. Please try again.");
      setBusy(false);
    }
  }

  return (
    <section id="florist" className="gutter relative scroll-mt-24">
      <div className="mx-auto max-w-[720px]">
        <SplitWords text={"Not sure\n*what to send?*"} className="display text-center text-[clamp(52px,8vw,120px)] text-paper" />
        <p className="mx-auto mt-6 max-w-[36ch] text-center text-[18px] italic leading-snug text-line/70">Tell us about them. We send you a photo and a price, and you pay only if you love it.</p>

        <form onSubmit={send} className="mt-12 space-y-9 rounded-[22px] bg-paper p-6 text-ink shadow-[0_60px_120px_-60px_rgb(0_0_0/0.8)] md:p-10">
          <Field label="What's the occasion?">
            <input
              className="input"
              required
              minLength={2}
              maxLength={OCCASION_MAX}
              placeholder="My mum's birthday"
              value={b.occasion}
              onChange={(e) => setB((v) => ({ ...v, occasion: e.target.value }))}
              aria-label="The occasion"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {OCCASION_IDEAS.map((o) => (
                <button key={o} type="button" onClick={() => setB((v) => ({ ...v, occasion: o }))} className="rounded-full bg-ink/[0.05] px-3.5 py-1.5 text-[15px] text-ink/65 transition-colors duration-500 hover:bg-ink/10">
                  {o}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Tell us about them" hint="optional">
            <textarea
              className="input min-h-28 resize-none"
              maxLength={ABOUT_MAX}
              placeholder="She's 60, loves white flowers and anything that smells nice."
              value={b.about}
              onChange={(e) => setB((v) => ({ ...v, about: e.target.value }))}
              aria-label="A few words about the person receiving it"
            />
          </Field>

          <Field label="Colours" hint="optional">
            <div className="flex flex-wrap items-center gap-2.5">
              <Chip on={b.palette === "surprise"} onClick={() => setB((v) => ({ ...v, palette: "surprise" }))}>
                You choose
              </Chip>
              {PALETTES.filter((p) => p.id !== "garden").map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setB((v) => ({ ...v, palette: p.id }))}
                  aria-pressed={b.palette === p.id}
                  aria-label={p.name}
                  title={p.name}
                  className={cn("h-10 w-10 rounded-full ring-offset-2 ring-offset-paper transition-shadow duration-500", b.palette === p.id ? "ring-2 ring-night" : "ring-1 ring-ink/15 hover:ring-ink/40")}
                  style={{ background: `linear-gradient(135deg, ${p.tints[0]} 50%, ${p.tints[1]} 50%)` }}
                />
              ))}
            </div>
          </Field>

          <Field label="Your budget">
            <div className="flex flex-wrap gap-2">
              {BUDGETS.map((n) => (
                <Chip key={n} on={!own && b.budget === n} onClick={() => (setOwn(false), setB((v) => ({ ...v, budget: n })))}>
                  {usd(n)}
                </Chip>
              ))}
              <Chip on={own} onClick={() => setOwn(true)}>
                Other
              </Chip>
            </div>
            {own && (
              <div className="relative mt-3 max-w-[200px]">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[17px] text-ink/50">$</span>
                <input
                  className="input !pl-8"
                  type="number"
                  inputMode="numeric"
                  min={BUDGET_MIN}
                  max={BUDGET_MAX}
                  value={b.budget}
                  onChange={(e) => setB((v) => ({ ...v, budget: Math.round(Number(e.target.value) || 0) }))}
                  aria-label="Budget in dollars"
                />
              </div>
            )}
          </Field>

          <Field label="Your details">
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" required minLength={2} autoComplete="name" placeholder="Your name" value={who.name} onChange={set("name")} />
              <input className="input" required type="tel" inputMode="tel" autoComplete="tel" placeholder="Phone number" value={who.phone} onChange={set("phone")} />
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-[15px] italic text-ink/50">When do you need it? (optional)</span>
                <input className="input" type="date" value={who.neededBy} onChange={set("neededBy")} />
              </label>
            </div>
          </Field>

          <div>
            <button type="submit" disabled={busy} data-cursor="Send" className="flex w-full items-center justify-center gap-3 rounded-full bg-night py-4 text-[18px] text-paper transition-colors duration-500 hover:bg-moss disabled:cursor-wait disabled:opacity-60">
              {busy ? "Sending…" : "Send to the florist"} {!busy && <span aria-hidden>→</span>}
            </button>
            <p className="mt-3 text-center text-[15px] italic text-ink/50">Nothing is charged now.</p>
            {error && (
              <p role="alert" className="mt-4 rounded-[10px] bg-clay/10 px-4 py-3 text-[15px] text-clay">
                {error}
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
