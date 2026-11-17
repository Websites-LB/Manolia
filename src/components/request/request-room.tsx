"use client";

import { Check, Link2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ProductImage } from "@/components/shop/product-image";
import { useCart } from "@/lib/cart-store";
import { briefSummary, occasionLabel, PALETTES } from "@/lib/custom";
import { money, prettyDate } from "@/lib/orders";
import type { PublicRequest } from "@/lib/requests";

import { Thread } from "./thread";

const STATE: Record<PublicRequest["status"], [string, string]> = {
  open: ["With the florist", "They have your note. Their reply arrives here; keep this page, or its link, to come back to it."],
  proposed: ["A proposal is waiting", "Look at what the florist suggests. Say yes, or ask for anything to be changed."],
  accepted: ["Agreed", "It is in your bag. Finish at the checkout whenever you are ready."],
  ordered: ["Ordered", "Paid and on the bench. Thank you."],
  closed: ["Closed", "This conversation has ended. Start a new one any time."],
};

/**
 * The customer's room with the florist: their brief on one side, the conversation on the other.
 * It refreshes itself every few seconds; saying yes to a proposal puts it in the bag at the agreed price.
 */
export function RequestRoom({ initial }: { initial: PublicRequest }) {
  const [r, setR] = useState(initial);
  const [copied, setCopied] = useState(false);
  const addRequest = useCart((s) => s.addRequest);
  const router = useRouter();
  const live = r.status !== "ordered" && r.status !== "closed";

  useEffect(() => {
    if (!live) return;
    const t = setInterval(async () => {
      if (document.hidden) return;
      const res = await fetch(`/api/requests/${r.id}`, { cache: "no-store" }).catch(() => null);
      if (res?.ok) setR(await res.json());
    }, 4000);
    return () => clearInterval(t);
  }, [r.id, live]);

  async function call(path: string, body: unknown) {
    const res = await fetch(`/api/requests/${r.id}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "That did not go through. Please try again.");
    setR(json as PublicRequest);
    return json as PublicRequest;
  }

  const toBag = (x: PublicRequest) => x.accepted && addRequest({ id: x.id, title: x.accepted.title, price: x.accepted.price, brief: x.brief, image: x.accepted.image });

  async function accept(msgId: string) {
    const next = await call("accept", { message: msgId }).catch(() => null);
    if (!next?.accepted) return;
    toBag(next);
    router.push("/checkout");
  }

  const occasion = occasionLabel(r.brief.occasion);
  const palette = r.brief.palette === "surprise" ? "Florist's choice" : PALETTES.find((p) => p.id === r.brief.palette)?.name;

  const [head, ...rest] = STATE[r.status][0].split(" ").reverse();
  const tint = r.brief.palette === "surprise" ? null : PALETTES.find((p) => p.id === r.brief.palette)?.tints;

  return (
    <div className="relative overflow-x-clip text-line" style={{ background: "linear-gradient(#13241a, #0f1b13 30%, #0b140f)" }}>
      <div className="pointer-events-none absolute -left-[15%] top-[-8%] h-[70vh] w-[70vw] blur-3xl" style={{ background: "radial-gradient(closest-side, rgb(240 185 174 / 0.12), transparent)" }} />
      <div className="gutter relative grid grid-cols-[minmax(0,1fr)] gap-x-[5vw] gap-y-10 pb-24 pt-28 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:pt-40">
        <aside className="md:sticky md:top-28 md:self-start">
          <p className="text-[16px] italic text-line/55">Request {r.ref}</p>
          <h1 className="display mt-3 text-[clamp(56px,6.6vw,112px)] text-paper">
            {rest.reverse().join(" ")} <em>{head}</em>
          </h1>
          <p className="mt-5 max-w-[34ch] text-[19px] italic leading-snug text-line/65">{STATE[r.status][1]}</p>

          {r.status === "accepted" && r.accepted && (
            <button onClick={() => (toBag(r), router.push("/checkout"))} className="mt-7 flex items-center gap-2 rounded-full bg-blush px-7 py-4 text-[18px] text-night transition-colors duration-500 hover:bg-paper">
              Pay {money(r.accepted.price)} at the checkout <span aria-hidden>→</span>
            </button>
          )}
          {r.status === "ordered" && r.orderId && (
            <Link href={`/order/${r.orderId}`} className="mt-7 inline-flex items-center gap-2 rounded-full bg-paper px-7 py-4 text-[18px] text-night transition-colors duration-500 hover:bg-blush">
              Follow your order <span aria-hidden>→</span>
            </Link>
          )}

          {/* what they asked for, as the note they wrote */}
          <div className="mt-10 max-w-[440px] -rotate-1 rounded-[10px] bg-paper p-5 text-ink shadow-[0_40px_80px_-40px_rgb(0_0_0/0.9)] md:p-6">
            <div className="flex gap-4">
              <div className="aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-[10px]">
                <ProductImage brief={r.brief} mode="static" frame={false} />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] italic text-ink/45">Your note</p>
                <p className="display text-[28px] leading-tight">{occasion}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-ink/65">
                  <span className="flex items-center gap-1.5">
                    {tint && <span className="h-3.5 w-3.5 rounded-full ring-1 ring-ink/10" style={{ background: `linear-gradient(135deg, ${tint[0]} 50%, ${tint[1]} 50%)` }} />}
                    {palette}
                  </span>
                  <span>About {money(r.brief.budget)}</span>
                  {r.neededBy && <span>{prettyDate(r.neededBy)}</span>}
                </p>
              </div>
            </div>
            {r.brief.about && <p className="mt-4 border-t border-ink/10 pt-3 text-[19px] italic leading-snug">“{r.brief.about}”</p>}
          </div>

          {live && (
            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href).then(() => (setCopied(true), setTimeout(() => setCopied(false), 2400)))}
              className="mt-7 flex items-center gap-2 text-[16px] italic text-line/55 transition-colors duration-500 hover:text-paper"
            >
              {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              {copied ? "Link copied" : "Copy the link to come back here"}
            </button>
          )}
        </aside>

        {/* the conversation, on paper like every chat on the site */}
        <section className="flex h-[min(78svh,780px)] flex-col overflow-hidden rounded-[28px] bg-paper text-ink shadow-[0_80px_140px_-60px_rgb(0_0_0/0.9)]" aria-label={`Conversation about ${briefSummary(r.brief)}`}>
          <header className="flex items-center gap-3 border-b border-ink/10 px-5 py-4">
            <span className="display flex h-11 w-11 items-center justify-center rounded-full bg-night text-[22px] text-paper">M</span>
            <div className="flex-1">
              <p className="display text-[22px] leading-none">Manolia</p>
              <p className="mt-1 text-[14px] italic leading-none text-ink/50">Your florist in Jbeil</p>
            </div>
            {live && (
              <span className="flex items-center gap-2 text-[14px] italic text-ink/45">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-clay/60" />
                  <span className="relative h-2 w-2 rounded-full bg-clay" />
                </span>
                Live
              </span>
            )}
          </header>
          <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 md:px-5">
            <Thread
              tone="paper"
              messages={r.messages}
              me="customer"
              acceptedId={r.accepted?.msgId}
              closed={!live}
              onSend={(m) => call("messages", m).then(() => undefined)}
              onAccept={accept}
              placeholder="Write to the florist…"
              empty={`Thank you, ${r.firstName}. Your note is with the florist. Anything to add? A colour to avoid, a favourite flower, a photo of the place it's going?`}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
