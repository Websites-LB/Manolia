"use client";

import { Magnetic } from "@/components/motion/magnetic";
import { SplitWords } from "@/components/motion/split-words";
import { SITE, waLink } from "@/lib/site";

const MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.mapsQuery)}`;

/** What happens after the tap, said once, the way the florist would say it. */
export function HowItWorks() {
  return (
    <section className="relative text-line">
      <div className="gutter relative z-10 pr-9 md:pl-[8vw]">
        <span data-vine data-bloom="#f3eadb" className="absolute right-[14px] top-[0.35em] h-px w-px md:left-[3.6vw] md:right-auto" />
        <SplitWords text={"You pay online.\nWe tie it this morning.\n*It's at their door tonight.*"} stagger={0.05} className="display text-[clamp(44px,6.6vw,120px)] leading-[0.95] text-paper" />
        <p className="mt-10 text-[17px] italic text-line/55">Jbeil, Batroun, Jounieh, Beirut. Whish or card.</p>
      </div>
    </section>
  );
}

/** The end of the vine: the door of the boutique. */
export function Visit() {
  return (
    <section className="relative text-line">
      <div className="gutter relative z-10 flex flex-col items-center pb-[16vh] text-center">
        <span data-vine data-bloom="#b4584d" className="mb-16 h-px w-px" />
        <SplitWords text={"Come in and\n*smell them.*"} stagger={0.08} className="display text-[clamp(64px,12vw,220px)] leading-[0.84] text-paper" />
        <Magnetic strength={0.4} className="mt-14">
          <a
            href={waLink("Hello Manolia!")}
            target="_blank"
            rel="noreferrer"
            data-cursor="Write"
            className="flex h-40 w-40 flex-col items-center justify-center rounded-full bg-blush text-night transition-colors duration-700 hover:bg-paper md:h-48 md:w-48"
          >
            <span className="display text-[34px]">
              Say <em>hello</em>
            </span>
          </a>
        </Magnetic>
        <a href={MAPS} target="_blank" rel="noreferrer" className="link-u mt-12 text-[17px] text-line/70">
          {SITE.address}
        </a>
      </div>
    </section>
  );
}
