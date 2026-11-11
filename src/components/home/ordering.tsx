import { FadeUp } from "@/components/motion/fade-up";
import { SplitWords } from "@/components/motion/split-words";

const STEPS = [
  ["Choose", "Pick a bouquet in the shop, or ask us for something bespoke in your colours."],
  ["Write the card", "Tell us who it is for, when, and what the card should say. We write it by hand."],
  ["Send on WhatsApp", "Your order arrives as a message. We confirm the stems, the delivery and the payment with you directly."],
];

/** Chapter five: how an order actually happens — three steps, nothing hidden. */
export function Ordering() {
  return (
    <section className="gutter bg-paper py-[clamp(96px,13vw,200px)] text-ink">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <p className="label text-ink/50">(05) — How to order</p>
        <SplitWords text="Three steps, *one message.*" className="display h-section" />
      </div>
      <FadeUp className="mt-16 grid gap-px overflow-hidden rounded-[4px] bg-ink/12 md:mt-24 md:grid-cols-3" stagger={0.12}>
        {STEPS.map(([t, d], i) => (
          <div key={t} className="flex min-h-[260px] flex-col bg-paper p-7 md:min-h-[340px] md:p-9">
            <span className="display text-[88px] leading-none text-clay/80 md:text-[120px]">{i + 1}</span>
            <p className="display mt-auto text-[36px] md:text-[42px]">{t}</p>
            <p className="mt-3 max-w-[36ch] text-[14px] leading-relaxed text-ink/60">{d}</p>
          </div>
        ))}
      </FadeUp>
    </section>
  );
}
