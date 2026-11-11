"use client";

import NumberFlow from "@number-flow/react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { SplitWords } from "@/components/motion/split-words";
import { usd } from "@/lib/cart-store";
import { ABOUT_MAX, BUDGET_MAX, BUDGET_MIN, BUDGETS, OCCASIONS, PALETTES, type Brief } from "@/lib/custom";
import { cn } from "@/lib/utils";

import { ProductImage } from "./product-image";

function Row({ n, label, children }: { n: number; label: string; children: ReactNode }) {
  return (
    <div className="grid gap-x-6 gap-y-3 border-t border-ink/12 py-6 sm:grid-cols-[9.5rem_minmax(0,1fr)]">
      <p className="label pt-2.5 text-ink/50">
        <span className="mr-2 font-serif text-[17px] normal-case italic tracking-normal text-clay">{n}</span>
        {label}
      </p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) => (
  <button type="button" onClick={onClick} aria-pressed={on} className={cn("label flex items-center gap-2.5 rounded-full border px-4 py-2.5 transition-colors duration-500", on ? "border-night bg-night text-paper" : "border-ink/15 text-ink/70 hover:border-ink/45")}>
    {children}
  </button>
);

/**
 * For the customer who does not know flowers: a note to the florist instead of a product.
 * The occasion, the colours, a few words about the person, a budget, and how to reach them.
 * Sending it opens a conversation; the florist proposes something and nothing is paid until they say yes.
 * Set on paper, so it reads as a card being written rather than one more plate in the shop.
 */
export function FloristChoice() {
  const router = useRouter();
  const [b, setB] = useState<Brief>({ occasion: "birthday", palette: "surprise", about: "", budget: BUDGETS[1] });
  const [own, setOwn] = useState(false);
  const [who, setWho] = useState({ name: "", phone: "", email: "", neededBy: "" });
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
        body: JSON.stringify({ brief: b, customer: { name: who.name, phone: who.phone, email: who.email }, neededBy: who.neededBy }),
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
      <form onSubmit={send} className="grid grid-cols-[minmax(0,1fr)] gap-x-[5vw] gap-y-10 rounded-[12px] bg-paper p-6 text-ink shadow-[0_60px_120px_-60px_rgb(0_0_0/0.8)] md:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] md:p-[4vw]">
        <div className="flex flex-col">
          <p className="label text-clay">Florist&apos;s choice</p>
          <SplitWords text={"Not sure\n*what to send?*"} className="display mt-5 text-[clamp(56px,7.2vw,132px)]" />
          <p className="mt-7 max-w-[38ch] text-[15px] leading-relaxed text-ink/65">
            Tell us the occasion, the colours and who it is for. The florist reads it, writes back to you here with what they would make, and you only pay once you love it.
          </p>
          <ol className="label mt-8 space-y-2.5 text-ink/55">
            {["You write the note", "The florist proposes what they would make", "You say yes, or ask for a change", "Then you pay"].map((t, i) => (
              <li key={t} className="flex items-baseline gap-3">
                <span className="font-serif text-[17px] normal-case italic tracking-normal text-clay">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
          <div className="hidden md:mt-auto md:block md:pt-12">
            <div className="aspect-[4/5] w-full max-w-[280px] overflow-hidden rounded-[6px]">
              <ProductImage brief={b} mode="static" frame={false} />
            </div>
            <p className="label mt-3 text-ink/40">A sketch of the mood, not the bouquet</p>
          </div>
        </div>

        <div>
          <Row n={1} label="The occasion">
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((o) => (
                <Chip key={o.id} on={b.occasion === o.id} onClick={() => setB((v) => ({ ...v, occasion: o.id }))}>
                  {o.name}
                </Chip>
              ))}
            </div>
          </Row>

          <Row n={2} label="The colours">
            <div className="flex flex-wrap gap-2">
              <Chip on={b.palette === "surprise"} onClick={() => setB((v) => ({ ...v, palette: "surprise" }))}>
                You choose
              </Chip>
              {PALETTES.filter((p) => p.id !== "garden").map((p) => (
                <Chip key={p.id} on={b.palette === p.id} onClick={() => setB((v) => ({ ...v, palette: p.id }))}>
                  <span className="flex">
                    {p.tints.slice(0, 2).map((t, k) => (
                      <span key={t} className={cn("h-3.5 w-3.5 rounded-full border border-ink/15", k && "-ml-1.5")} style={{ background: t }} />
                    ))}
                  </span>
                  {p.name}
                </Chip>
              ))}
            </div>
          </Row>

          <Row n={3} label="Who it is for">
            <textarea
              className="field min-h-24 resize-none !pt-1.5"
              maxLength={ABOUT_MAX}
              placeholder="My grandmother, turning 80. She loves her garden and anything that smells good."
              value={b.about}
              onChange={(e) => setB((v) => ({ ...v, about: e.target.value }))}
              aria-label="A few words about the person receiving it"
            />
          </Row>

          <Row n={4} label="Your budget">
            <div className="flex flex-wrap items-center gap-2">
              {BUDGETS.map((n) => (
                <Chip key={n} on={!own && b.budget === n} onClick={() => (setOwn(false), setB((v) => ({ ...v, budget: n })))}>
                  {usd(n)}
                </Chip>
              ))}
              <Chip on={own} onClick={() => setOwn(true)}>
                Another amount
              </Chip>
            </div>
            {own && (
              <div className="mt-4">
                <input
                  type="range"
                  min={BUDGET_MIN}
                  max={400}
                  step={5}
                  value={Math.min(400, b.budget)}
                  onChange={(e) => setB((v) => ({ ...v, budget: Number(e.target.value) }))}
                  aria-label="Budget in dollars"
                  className="budget w-full"
                />
                <p className="label mt-2 flex justify-between text-ink/40">
                  <span>{usd(BUDGET_MIN)}</span>
                  <span>For more than {usd(400)}, tell the florist in the conversation</span>
                </p>
              </div>
            )}
            <p className="display mt-4 text-[52px] tabular-nums">
              <NumberFlow value={Math.min(BUDGET_MAX, b.budget)} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} />
              <span className="label ml-3 align-middle text-ink/45">or close to it</span>
            </p>
          </Row>

          <Row n={5} label="You">
            <div className="grid gap-x-6 sm:grid-cols-2">
              <input className="field" required minLength={2} autoComplete="name" placeholder="Your name" value={who.name} onChange={set("name")} />
              <input className="field" required type="tel" inputMode="tel" autoComplete="tel" placeholder="Your phone number" value={who.phone} onChange={set("phone")} />
              <input className="field" type="email" autoComplete="email" placeholder="Email, to hear when we reply (optional)" value={who.email} onChange={set("email")} />
              <label className="block">
                <span className="label block pt-3 text-ink/40">Needed by (optional)</span>
                <input className="field !pt-1" type="date" value={who.neededBy} onChange={set("neededBy")} />
              </label>
            </div>
          </Row>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/12 pt-6">
            <p className="max-w-[34ch] text-[13px] leading-snug text-ink/50">Nothing is charged now. You pay only after you say yes to the florist&apos;s proposal.</p>
            <button type="submit" disabled={busy} className="pill bg-night text-paper hover:bg-moss disabled:cursor-wait disabled:opacity-60" data-cursor="Send">
              {busy ? "Sending…" : "Send it to the florist"} {!busy && <span aria-hidden>→</span>}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-4 rounded-[4px] bg-clay/10 px-4 py-3 text-[13px] text-clay">
              {error}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
