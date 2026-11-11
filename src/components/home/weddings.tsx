"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { SplitWords } from "@/components/motion/split-words";
import { photoUrl } from "@/lib/products";
import { waLink } from "@/lib/site";

gsap.registerPlugin(ScrollTrigger);

const SERVICES = [
  { name: "Weddings", note: "Bridal bouquets, ceremony arches, aisles and long tables dressed in white. One team from first sketch to last candle.", photo: "1578534102052-70f4c14ee0e7" },
  { name: "Events", note: "Engagements, christenings, launches and private dinners: blue evenings, golden hours, whatever the room asks for.", photo: "1613916107413-4991c04f0837" },
  { name: "Table design", note: "Gypsophila clouds, low runners, candlelight. Centrepieces composed for the way people actually sit and talk.", photo: "1616148037989-4c3a9946a514" },
  { name: "Gifts & boxes", note: "Hand-tied every morning, wrapped in kraft and silk, or set in our keepsake hat boxes.", photo: "1548094967-e25a127d1f6d" },
];

/**
 * Chapter three. A small framed photograph grows until it fills the screen as you scroll —
 * the room opening up — then the services list, where each row shows its picture beside the pointer.
 */
export function Weddings() {
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const float = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ".wd-stage", start: "top top", end: "+=120%", scrub: 0.6, pin: true, anticipatePin: 1 },
      });
      tl.fromTo(frame.current, { scale: 0.34 }, { scale: 1, ease: "power2.inOut" }, 0)
        .fromTo(".wd-img", { scale: 1.5 }, { scale: 1.02, ease: "power2.inOut" }, 0)
        .fromTo(".wd-shade", { opacity: 0 }, { opacity: 1, ease: "none" }, 0.45)
        .fromTo(".wd-over", { opacity: 0, y: 40 }, { opacity: 1, y: 0, ease: "power2.out" }, 0.55);
    }, el);
    return () => ctx.revert();
  }, []);

  // the floating preview follows the pointer with a lag
  useEffect(() => {
    const f = float.current;
    if (!f || !window.matchMedia("(pointer: fine)").matches) return;
    const x = gsap.quickTo(f, "x", { duration: 0.9, ease: "expo.out" });
    const y = gsap.quickTo(f, "y", { duration: 0.9, ease: "expo.out" });
    const move = (e: PointerEvent) => {
      x(e.clientX);
      y(e.clientY);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <section ref={root} id="weddings" className="night-glow relative text-paper">
      <div className="wd-stage relative flex h-[100svh] items-center justify-center overflow-hidden">
        <div className="gutter absolute inset-x-0 top-24 z-10 flex justify-between md:top-28">
          <p className="label text-paper/50">(03) — Weddings &amp; events</p>
          <p className="label hidden text-paper/50 md:block">Byblos · Batroun · Beirut · the mountains</p>
        </div>
        <div ref={frame} className="absolute inset-0 overflow-hidden will-change-transform">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl("1578534102052-70f4c14ee0e7", 1600)} alt="Ivory garden roses in a bridal bouquet" className="wd-img h-full w-full object-cover will-change-transform" />
          <div className="wd-shade absolute inset-0 bg-gradient-to-t from-night/85 via-night/30 to-night/40" />
        </div>
        <div className="wd-over gutter absolute inset-x-0 bottom-[10svh] z-10">
          <p className="display max-w-[14ch] text-[clamp(48px,8.4vw,150px)] text-paper">
            We dress the <em>whole room,</em> not only the table.
          </p>
        </div>
      </div>

      <div className="gutter py-[clamp(80px,12vw,180px)]">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <p className="label text-paper/45">What we make</p>
          <SplitWords text="One atelier, for *every kind* of day." className="display text-[clamp(40px,5vw,84px)]" />
        </div>

        <ul className="mt-16 border-t border-paper/12" onPointerLeave={() => setHover(null)}>
          {SERVICES.map((s, i) => (
            <li key={s.name} onPointerEnter={() => setHover(i)} className="group border-b border-paper/12">
              <a
                href={waLink(`Hello Manolia! I'd like to ask about ${s.name.toLowerCase()}.`)}
                target="_blank"
                rel="noreferrer"
                data-cursor="Ask"
                className="grid grid-cols-[2.2rem_1fr] items-baseline gap-x-4 gap-y-3 py-7 md:grid-cols-[4rem_minmax(0,1.3fr)_minmax(0,1fr)_2rem] md:py-9"
              >
                <span className="label text-paper/40">0{i + 1}</span>
                <span className="display text-[44px] transition-[transform,font-style] duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-4 group-hover:italic md:text-[clamp(56px,6.4vw,112px)]">
                  {s.name}
                </span>
                <span className="col-start-2 max-w-[44ch] text-[14px] leading-relaxed text-paper/60 md:col-start-auto">{s.note}</span>
                <span className="label hidden text-right text-paper/40 transition-transform duration-700 group-hover:-rotate-45 md:block" aria-hidden>
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div ref={float} className="pointer-events-none fixed left-0 top-0 z-30 hidden md:block" aria-hidden>
        <div
          className="-translate-x-1/2 -translate-y-1/2 transition-[opacity,scale] duration-700 ease-[cubic-bezier(.16,1,.3,1)]"
          style={{ opacity: hover === null ? 0 : 1, scale: hover === null ? "0.6" : "1" }}
        >
          <div className="relative h-[300px] w-[240px] overflow-hidden rounded-[4px]">
            {SERVICES.map((s, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={s.name}
                src={photoUrl(s.photo, 480)}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
                style={{ opacity: hover === i ? 1 : 0 }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
