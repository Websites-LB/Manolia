"use client";

import { Check, Link2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ProductImage } from "@/components/shop/product-image";
import { useCart } from "@/lib/cart-store";
import { briefSummary, OCCASIONS, PALETTES } from "@/lib/custom";
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

  const occasion = OCCASIONS.find((o) => o.id === r.brief.occasion)?.name;
  const palette = r.brief.palette === "surprise" ? "Florist's choice" : PALETTES.find((p) => p.id === r.brief.palette)?.name;

  return (
    <div className="night-glow text-line">
      <div className="gutter grid grid-cols-[minmax(0,1fr)] gap-x-[5vw] gap-y-10 pb-20 pt-28 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:pt-40">
        <aside className="md:sticky md:top-28 md:self-start">
          <p className="label text-line/50">Request {r.ref}</p>
          <h1 className="display mt-4 text-[clamp(48px,6vw,104px)] text-paper">
            {STATE[r.status][0].split(" ").slice(0, -1).join(" ")} <em>{STATE[r.status][0].split(" ").slice(-1)}</em>
          </h1>
          <p className="mt-5 max-w-[40ch] text-[15px] leading-relaxed text-line/65">{STATE[r.status][1]}</p>

          {r.status === "accepted" && r.accepted && (
            <button onClick={() => (toBag(r), router.push("/checkout"))} className="pill mt-7 bg-blush text-night hover:bg-paper">
              Pay {money(r.accepted.price)} at the checkout <span aria-hidden>→</span>
            </button>
          )}
          {r.status === "ordered" && r.orderId && (
            <Link href={`/order/${r.orderId}`} className="pill mt-7 bg-paper text-night hover:bg-blush">
              Follow your order <span aria-hidden>→</span>
            </Link>
          )}

          <div className="mt-10 flex gap-5 rounded-[10px] border border-line/12 p-5">
            <div className="hidden aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-[6px] sm:block">
              <ProductImage brief={r.brief} mode="static" frame={false} />
            </div>
            <dl className="min-w-0 flex-1 space-y-2.5 text-[13.5px]">
              {[
                ["Occasion", occasion],
                ["Colours", palette],
                ["Budget", `About ${money(r.brief.budget)}`],
                ...(r.neededBy ? [["For", prettyDate(r.neededBy)]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="label pt-0.5 text-line/40">{k}</dt>
                  <dd className="text-right text-line/85">{v}</dd>
                </div>
              ))}
              {r.brief.about && <dd className="border-t border-line/10 pt-3 font-serif text-[18px] italic leading-snug text-paper">“{r.brief.about}”</dd>}
            </dl>
          </div>

          {live && (
            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href).then(() => (setCopied(true), setTimeout(() => setCopied(false), 2400)))}
              className="label mt-5 flex items-center gap-2 text-line/50 transition-colors duration-500 hover:text-paper"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
              {copied ? "Link copied" : "Copy the link to come back to this conversation"}
            </button>
          )}
        </aside>

        <section className="flex h-[min(74svh,760px)] flex-col rounded-[14px] border border-line/12 bg-[#0e1a13]/80 p-4 backdrop-blur md:p-6" aria-label={`Conversation about ${briefSummary(r.brief)}`}>
          <header className="flex items-center gap-3 border-b border-line/12 pb-4">
            <span className="display flex h-11 w-11 items-center justify-center rounded-full bg-blush text-[26px] text-night">M</span>
            <div>
              <p className="text-[15px] text-paper">Manolia, the florist</p>
              <p className="label mt-0.5 text-line/45">Jbeil · replies here</p>
            </div>
          </header>
          <Thread
            messages={r.messages}
            me="customer"
            acceptedId={r.accepted?.msgId}
            closed={!live}
            onSend={(m) => call("messages", m).then(() => undefined)}
            onAccept={accept}
            placeholder="Write to the florist…"
            empty={`Thank you, ${r.firstName}. Your note is with the florist. Anything to add? A colour to avoid, a favourite flower, a photo of the place it is going?`}
          />
        </section>
      </div>
    </div>
  );
}
