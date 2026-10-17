import Link from "next/link";

import { SITE, waLink } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="relative z-10 bg-forest text-cream">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-6 py-20 md:grid-cols-[1.4fr_1fr_1fr] md:px-12">
        <div>
          <p className="font-display text-6xl leading-none">Manolia</p>
          <p className="font-script mt-1 text-2xl text-cream/70">The Floral Boutique</p>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-cream/60">Floral design, weddings and events, composed by hand in Jbeil, Byblos.</p>
        </div>
        <div className="text-sm leading-loose text-cream/75">
          <p className="eyebrow !text-cream/50">Find us</p>
          <p className="mt-4">{SITE.address}</p>
          <a className="mt-1 block hover:text-cream" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.mapsQuery)}`} target="_blank" rel="noreferrer">
            Open in Maps ↗
          </a>
        </div>
        <div className="text-sm leading-loose text-cream/75">
          <p className="eyebrow !text-cream/50">Say hello</p>
          <a className="mt-4 block hover:text-cream" href={waLink()} target="_blank" rel="noreferrer">
            WhatsApp {SITE.whatsappDisplay}
          </a>
          <a className="block hover:text-cream" href={SITE.instagram} target="_blank" rel="noreferrer">
            Instagram {SITE.instagramHandle}
          </a>
          <Link className="block hover:text-cream" href="/shop">
            Shop bouquets
          </Link>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-6 py-6 text-[0.7rem] uppercase tracking-[0.2em] text-cream/40 md:flex-row md:justify-between md:px-12">
          <span>© {new Date().getFullYear()} Manolia The Floral Boutique</span>
          <span>Jbeil · Byblos · Lebanon</span>
        </div>
      </div>
    </footer>
  );
}
