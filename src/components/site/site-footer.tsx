import Link from "next/link";

import { SITE, waLink } from "@/lib/site";

const MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.mapsQuery)}`;

/** Night footer: the facts in mono, and the name set so large it runs off the page. */
export function SiteFooter() {
  return (
    <footer className="night-glow relative overflow-hidden text-paper">
      <div className="gutter grid gap-10 pb-10 pt-20 sm:grid-cols-2 md:grid-cols-4 md:pt-28">
        <div className="sm:col-span-2">
          <p className="display max-w-[16ch] text-[36px] leading-[1] md:text-[44px]">
            Floral design, weddings and events — <em>composed by hand</em> in Jbeil.
          </p>
        </div>
        <div className="label space-y-2 text-paper/60">
          <p className="text-paper/35">Find us</p>
          <p>{SITE.address}</p>
          <a className="link-u inline-block hover:text-paper" href={MAPS} target="_blank" rel="noreferrer">
            Open in Maps ↗
          </a>
        </div>
        <div className="label flex flex-col items-start gap-2 text-paper/60">
          <p className="text-paper/35">Say hello</p>
          <a className="link-u hover:text-paper" href={waLink()} target="_blank" rel="noreferrer">
            WhatsApp {SITE.whatsappDisplay}
          </a>
          <a className="link-u hover:text-paper" href={SITE.instagram} target="_blank" rel="noreferrer">
            Instagram
          </a>
          <Link className="link-u hover:text-paper" href="/shop">
            Shop bouquets
          </Link>
        </div>
      </div>
      <div className="gutter label flex justify-between border-t border-paper/10 py-5 text-paper/35">
        <span>© {new Date().getFullYear()} Manolia The Floral Boutique</span>
        <span>Jbeil · Byblos · Lebanon</span>
      </div>
      <p className="display pointer-events-none -mb-[4.5vw] select-none whitespace-nowrap text-center text-[28vw] leading-[0.8] text-paper/[0.07]" aria-hidden>
        Manolia
      </p>
    </footer>
  );
}
