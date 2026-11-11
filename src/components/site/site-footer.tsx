"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Engraving } from "@/components/art/engraving";
import { buildMeadow, MEADOW, SOIL } from "@/lib/botanic/meadow";
import { SITE, waLink } from "@/lib/site";

const MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.mapsQuery)}`;
const SKY = "#0b140f";
/** x%, y%, drift x, drift y, seconds */
const FIREFLIES = [
  [8, 30, 40, -26, 9],
  [22, 58, -30, -18, 11],
  [37, 22, 26, 20, 8],
  [52, 48, -44, -14, 12],
  [66, 26, 30, 24, 10],
  [79, 55, -24, -30, 9],
  [91, 34, -36, 16, 13],
];

/**
 * The page ends in the ground. A flower bed grows along the top edge; under it the footer is the
 * soil itself: bulbs, stones, and the facts set into the earth.
 */
export function SiteFooter() {
  const box = useRef<HTMLElement>(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setW(Math.round(el.clientWidth)));
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const pieces = useCallback(() => (w ? buildMeadow(w) : []), [w]);
  const g = MEADOW.ground;

  return (
    <footer
      ref={box}
      className="relative overflow-hidden text-paper"
      style={{ background: `linear-gradient(${SKY} 0, ${SKY} ${g + 20}px, ${SOIL} ${g + 20}px, ${SOIL} ${g + 70}px, #21160e 68%, #140c07 100%)` }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: MEADOW.h }}>
        {w > 0 && (
          <Engraving key={w} pieces={pieces} view={{ w, h: MEADOW.h }} mode="view" label="A flower bed seen from the side: tulips, anemones and grasses above the ground, earth below" className="h-full w-full" />
        )}
      </div>

      {/* dusk over the bed: a glow on the horizon and a few fireflies */}
      <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: g + 20, background: "radial-gradient(60% 90% at 50% 100%, rgb(240 185 174 / 0.13), transparent 70%)" }} aria-hidden>
        {FIREFLIES.map(([x, y, dx, dy, t], i) => (
          <span
            key={i}
            className="absolute h-[5px] w-[5px] rounded-full bg-[#ffe9a8] motion-reduce:hidden"
            style={{ left: `${x}%`, top: `${y}%`, boxShadow: "0 0 10px 3px rgb(255 226 150 / 0.55)", animation: `firefly ${t}s ease-in-out ${-i * 1.7}s infinite`, ["--dx" as string]: `${dx}px`, ["--dy" as string]: `${dy}px` }}
          />
        ))}
      </div>

      <div className="gutter relative grid gap-10 pb-12 sm:grid-cols-2 md:grid-cols-4" style={{ paddingTop: g + 96 }}>
        <div className="sm:col-span-2">
          <p className="display max-w-[16ch] text-[36px] leading-[1] md:text-[48px]">
            Floral design, weddings and events, <em>composed by hand</em> in Jbeil.
          </p>
        </div>
        <div className="label space-y-2 text-paper/65">
          <p className="text-paper/40">Find us</p>
          <p>{SITE.address}</p>
          <a className="link-u inline-block hover:text-paper" href={MAPS} target="_blank" rel="noreferrer">
            Open in Maps ↗
          </a>
        </div>
        <div className="label flex flex-col items-start gap-2 text-paper/65">
          <p className="text-paper/40">Say hello</p>
          <Link className="link-u hover:text-paper" href="/shop">
            Shop bouquets
          </Link>
          <Link className="link-u hover:text-paper" href="/shop/build">
            Compose your own
          </Link>
          <a className="link-u hover:text-paper" href={SITE.instagram} target="_blank" rel="noreferrer">
            Instagram
          </a>
          <Link className="link-u hover:text-paper" href="/shop#florist">
            Not sure? Ask the florist
          </Link>
          <a className="link-u hover:text-paper" href={waLink()} target="_blank" rel="noreferrer">
            {SITE.whatsappDisplay}
          </a>
        </div>
      </div>
      <div className="gutter label relative flex justify-between border-t border-paper/10 py-5 text-paper/40">
        <span>© {new Date().getFullYear()} Manolia The Floral Boutique</span>
        <span className="hidden md:inline">Paid on Whish&apos;s and the bank&apos;s own secure pages · we never hold your card</span>
        <span>Jbeil · Byblos · Lebanon</span>
      </div>
      <p className="display pointer-events-none relative -mb-[4.5vw] select-none whitespace-nowrap text-center text-[28vw] leading-[0.8] text-[#3a2a1d]" aria-hidden>
        Manolia
      </p>
    </footer>
  );
}
