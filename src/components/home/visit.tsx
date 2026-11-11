import { Magnetic } from "@/components/motion/magnetic";
import { SplitWords } from "@/components/motion/split-words";
import { SITE, waLink } from "@/lib/site";

const MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.mapsQuery)}`;

/** Last chapter: an invitation, and the one button that matters. */
export function Visit() {
  return (
    <section className="gutter relative overflow-hidden bg-paper pb-[clamp(96px,12vw,180px)] pt-[clamp(40px,6vw,80px)] text-ink">
      <p className="label text-ink/50">(06) — Visit the boutique</p>
      <SplitWords text={"Come in and\n*smell them.*"} className="display mt-6 text-[clamp(64px,13vw,240px)] leading-[0.84]" stagger={0.08} />

      <div className="mt-16 grid items-end gap-12 md:mt-24 md:grid-cols-[1fr_1fr_auto]">
        <div>
          <p className="label text-ink/45">Address</p>
          <p className="mt-3 text-[17px] leading-snug">{SITE.address}</p>
          <a href={MAPS} target="_blank" rel="noreferrer" className="label link-u mt-4 inline-block text-ink/70">
            Open in Maps ↗
          </a>
        </div>
        <div>
          <p className="label text-ink/45">Write to us</p>
          <p className="mt-3 text-[17px] leading-snug">
            WhatsApp {SITE.whatsappDisplay}
            <br />
            Instagram {SITE.instagramHandle}
          </p>
          <a href={SITE.instagram} target="_blank" rel="noreferrer" className="label link-u mt-4 inline-block text-ink/70">
            See the feed ↗
          </a>
        </div>
        <Magnetic strength={0.4}>
          <a
            href={waLink("Hello Manolia!")}
            target="_blank"
            rel="noreferrer"
            data-cursor="Write"
            className="flex h-44 w-44 flex-col items-center justify-center rounded-full bg-night text-center text-paper transition-colors duration-700 hover:bg-clay md:h-56 md:w-56"
          >
            <span className="display text-[34px] md:text-[40px]">
              Message <em>us</em>
            </span>
            <span className="label mt-2 text-paper/60">on WhatsApp</span>
          </a>
        </Magnetic>
      </div>
    </section>
  );
}
