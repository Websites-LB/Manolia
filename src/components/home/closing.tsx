"use client";

import { FadeUp } from "@/components/motion/fade-up";
import { Magnetic } from "@/components/motion/magnetic";
import { SplitWords } from "@/components/motion/split-words";
import { usd } from "@/lib/cart-store";
import { DELIVERY_ZONES, SITE, SLOTS, waLink } from "@/lib/site";

import { ChapterHead, Lane } from "./parts";

const MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.mapsQuery)}`;

const STEPS = [
  ["Choose", "A ready bouquet, your own, or the florist's choice. Add a card with your words."],
  ["Pay online", "By Whish or card, on a safe payment page. No cash, no phone calls."],
  ["We deliver", "Tied fresh the same morning. You follow it from our bench to their door."],
];

/** Chapter four: what happens after the tap, and where we go. */
export function HowItWorks() {
  return (
    <section className="relative text-line">
      <ChapterHead id="how" bloom="#f3eadb" kicker="How it works" title={"Simple from tap\nto *doorstep.*"} />
      <FadeUp className="gutter relative z-10 mt-14 grid gap-4 md:mt-20 md:grid-cols-3 md:gap-[1.6vw] md:pl-[8vw]" stagger={0.12}>
        {STEPS.map(([t, d], i) => (
          <div key={t} className="rounded-[14px] border border-line/12 bg-[#0e1a12]/80 p-6 backdrop-blur-sm md:p-8">
            <span className="display text-[64px] leading-none text-blush md:text-[88px]">{i + 1}</span>
            <p className="display mt-4 text-[34px] text-paper md:text-[42px]">{t}</p>
            <p className="mt-2 text-[16px] leading-snug text-line/62">{d}</p>
          </div>
        ))}
      </FadeUp>
      <FadeUp className="gutter relative z-10 mt-4 grid gap-4 md:mt-[1.6vw] md:grid-cols-[1.2fr_1fr] md:gap-[1.6vw] md:pl-[8vw]">
        <div className="rounded-[14px] border border-line/12 bg-[#0e1a12]/80 p-6 backdrop-blur-sm md:p-8">
          <p className="label text-line/50">Where we deliver</p>
          <ul className="mt-4">
            {DELIVERY_ZONES.map((z) => (
              <li key={z.id} className="flex items-baseline justify-between border-b border-line/10 py-3 last:border-0">
                <span className="text-[17px] text-line/85">{z.name}</span>
                <span className="display text-[24px] text-blush">{usd(z.fee)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[14px] border border-line/12 bg-[#0e1a12]/80 p-6 backdrop-blur-sm md:p-8">
          <p className="label text-line/50">When</p>
          <ul className="mt-4">
            {SLOTS.map((s) => (
              <li key={s} className="border-b border-line/10 py-3 text-[17px] text-line/85 last:border-0">
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[15px] leading-snug text-line/55">Order before noon for delivery the same day.</p>
        </div>
      </FadeUp>
      <Lane />
    </section>
  );
}

/** The end of the vine: weddings, and the door of the boutique. */
export function Visit() {
  return (
    <section className="relative text-line">
      <div className="gutter relative z-10 flex flex-col items-center pb-[16vh] text-center">
        <span data-vine data-bloom="#b4584d" className="mb-16 h-px w-px" />
        <p className="label text-line/50">Visit the boutique</p>
        <SplitWords text={"Come in and\n*smell them.*"} stagger={0.08} className="display mt-6 text-[clamp(64px,12vw,220px)] leading-[0.84] text-paper" />
        <p className="mt-8 max-w-[44ch] text-[17px] leading-relaxed text-line/65">
          Planning a wedding or an event? We design, deliver and install, from the bridal bouquet to the last table.
        </p>
        <div className="mt-14 grid w-full max-w-4xl items-center gap-10 md:grid-cols-[1fr_auto_1fr]">
          <div className="md:text-right">
            <p className="label text-line/45">Address</p>
            <p className="mt-2 text-[17px] text-line/85">{SITE.address}</p>
            <a href={MAPS} target="_blank" rel="noreferrer" className="label link-u mt-3 inline-block text-line/65">
              Open in Maps ↗
            </a>
          </div>
          <Magnetic strength={0.4} className="justify-self-center">
            <a
              href={waLink("Hello Manolia!")}
              target="_blank"
              rel="noreferrer"
              data-cursor="Write"
              className="flex h-44 w-44 flex-col items-center justify-center rounded-full bg-blush text-night transition-colors duration-700 hover:bg-paper md:h-52 md:w-52"
            >
              <span className="display text-[36px]">
                Message <em>us</em>
              </span>
              <span className="label mt-2 text-night/60">on WhatsApp</span>
            </a>
          </Magnetic>
          <div className="md:text-left">
            <p className="label text-line/45">Weddings & events</p>
            <p className="mt-2 text-[17px] text-line/85">{SITE.whatsappDisplay}</p>
            <a href={SITE.instagram} target="_blank" rel="noreferrer" className="label link-u mt-3 inline-block text-line/65">
              {SITE.instagramHandle} ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
