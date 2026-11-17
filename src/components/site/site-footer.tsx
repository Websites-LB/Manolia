"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";

import { Photo } from "@/components/art/photo";
import { SITE, waLink } from "@/lib/site";

gsap.registerPlugin(ScrollTrigger);

const MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.mapsQuery)}`;
const WORD = "Manolia";

const COLUMNS: { title: string; links: [string, string, boolean?][] }[] = [
  {
    title: "Send flowers",
    links: [
      ["/shop#pieces", "Ready bouquets"],
      ["/shop/build", "Make your own"],
      ["/shop#florist", "Let us choose"],
    ],
  },
  {
    title: "Talk to us",
    links: [
      [waLink("Hello Manolia!"), `WhatsApp ${SITE.whatsappDisplay}`, true],
      [SITE.instagram, "Instagram", true],
      [waLink("Hello Manolia! We're planning a wedding and would love to talk flowers."), "Weddings & events", true],
    ],
  },
  {
    title: "Visit",
    links: [[MAPS, SITE.address, true]],
  },
];

/**
 * The end of every page: night ground, one peony leaning in from the edge, the ways to order and to
 * reach us in plain words, and the name set across the whole width, rising letter by letter.
 */
export function SiteFooter() {
  const box = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(".foot-letter", { yPercent: 100, duration: 1.6, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: ".foot-word", start: "top 95%", once: true } });
      gsap.fromTo(".foot-stem", { yPercent: 18, rotate: -4 }, { yPercent: -6, rotate: 2, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom bottom", scrub: true } });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <footer ref={box} className="relative overflow-hidden text-line" style={{ background: "linear-gradient(#0b140f, #0f1b13 40%, #13241a)" }}>
      <div className="pointer-events-none absolute left-1/2 top-[30%] h-[70%] w-[80vw] -translate-x-1/2 blur-3xl" style={{ background: "radial-gradient(closest-side, rgb(240 185 174 / 0.09), transparent)" }} />

      {/* one stem leaning in from the right edge */}
      <div className="foot-stem pointer-events-none absolute -right-[6vw] top-[4%] hidden w-[min(30vw,420px)] md:block" aria-hidden>
        <div className="aspect-[800/1280]">
          <Photo src="/art/stem-peony.webp" alt="" width={800} height={1280} sizes="30vw" arrive="grow" />
        </div>
      </div>

      <div className="gutter relative border-t border-line/10 pt-[clamp(72px,10vw,140px)]">
        <p className="display max-w-[14ch] text-[clamp(44px,6vw,96px)] leading-[0.95] text-paper">
          Flowers, tied by hand <em>in Jbeil.</em>
        </p>

        <div className="mt-14 grid gap-10 sm:grid-cols-3 md:mt-20 md:max-w-[68%]">
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <p className="text-[15px] italic text-line/45">{c.title}</p>
              <ul className="mt-3 space-y-2">
                {c.links.map(([href, label, external]) => (
                  <li key={label}>
                    {external ? (
                      <a href={href} target="_blank" rel="noreferrer" className="link-u text-[18px] text-line/85 [background-size:0%_1px] hover:text-paper hover:[background-size:100%_1px]">
                        {label}
                      </a>
                    ) : (
                      <Link href={href} className="link-u text-[18px] text-line/85 [background-size:0%_1px] hover:text-paper hover:[background-size:100%_1px]">
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap justify-between gap-x-8 gap-y-2 text-[14px] italic text-line/40 md:max-w-[68%]">
          <span>© {new Date().getFullYear()} Manolia, the floral boutique</span>
          <span>Paid securely by Whish or card. We never hold your card.</span>
        </div>
      </div>

      {/* the name, across the whole width */}
      <div className="foot-word pointer-events-none relative mt-6 flex justify-center overflow-hidden" aria-hidden>
        <p className="display flex -mb-[5vw] whitespace-nowrap text-[30vw] leading-[0.8] tracking-[-0.035em]" style={{ backgroundImage: "linear-gradient(#efe6d2 10%, rgb(239 230 210 / 0.15) 85%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          {WORD.split("").map((c, i) => (
            <span key={i} className="foot-letter inline-block will-change-transform" style={{ backgroundImage: "inherit", WebkitBackgroundClip: "text", backgroundClip: "text" }}>
              {c}
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
