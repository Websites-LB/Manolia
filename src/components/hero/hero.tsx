"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";

import { Magnetic } from "@/components/motion/magnetic";
import { SplitWords } from "@/components/motion/split-words";
import { waLink } from "@/lib/site";

gsap.registerPlugin(ScrollTrigger);

// generated in the browser: keeps ~1,500 engraved paths out of the HTML and the RSC payload
const BouquetArt = dynamic(() => import("./bouquet-art").then((m) => m.BouquetArt), { ssr: false });

const WORD = "Manolia";
/** where the stems are cut, as a transform origin: everything that moves the bouquet pivots here */
const BASE = "50% 94.5%";

/**
 * Opening shot. Night-forest ground, one painted bouquet drawing itself in the middle, the name
 * set enormous behind it so the flowers stand in front of the letters. Copy arrives in sequence.
 * The bouquet leans toward the pointer, and the root that runs down the whole page grows out of its stems.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      // the name rises letter by letter out of the floor
      gsap.from(".hero-letter", { yPercent: 105, duration: 1.8, ease: "expo.out", stagger: 0.07, delay: 0.15 });
      gsap.from(".hero-fade", { y: 18, opacity: 0, duration: 1.4, ease: "expo.out", stagger: 0.08, delay: 1.1 });

      // layers part as you leave: depth by speed
      const st = { trigger: el, start: "top top", end: "bottom top", scrub: true };
      // the bouquet swells from the cut end of its stems, so the root below never loses it
      gsap.to(art.current, { scale: 1.07, ease: "none", scrollTrigger: st });
      gsap.to(word.current, { yPercent: 38, ease: "none", scrollTrigger: st });
      gsap.to(copy.current, { y: -80, opacity: 0, ease: "none", scrollTrigger: { ...st, end: "60% top" } });
    }, el);

    // pointer tilt — fake depth without WebGL; transform only, mouse only
    let off = () => {};
    if (window.matchMedia("(pointer: fine)").matches && tilt.current) {
      const rx = gsap.quickTo(tilt.current, "rotationX", { duration: 1.4, ease: "expo.out" });
      const ry = gsap.quickTo(tilt.current, "rotationY", { duration: 1.4, ease: "expo.out" });
      const move = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        ry(nx * 9);
        rx(-ny * 6);
      };
      const leave = () => {
        rx(0);
        ry(0);
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      off = () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      };
    }
    return () => {
      off();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={root} className="night-glow relative h-[100svh] min-h-[620px] overflow-hidden text-line">
      {/* the name, behind everything */}
      <div ref={word} className="pointer-events-none absolute inset-x-0 bottom-[-6vw] flex justify-center md:bottom-[-8.5vw]" aria-hidden>
        <div className="display flex overflow-hidden pb-[2vw] text-[37.5vw] leading-[0.8] tracking-[-0.045em] text-paper md:text-[38.5vw]">
          {WORD.split("").map((c, i) => (
            <span key={i} className="hero-letter inline-block will-change-transform">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* the bouquet */}
      <div
        ref={art}
        className="pointer-events-none absolute left-1/2 top-[8svh] h-[52svh] -translate-x-1/2 will-change-transform md:top-[5svh] md:h-[86svh]"
        style={{ aspectRatio: "1000 / 1100", perspective: 1100, transformOrigin: BASE }}
      >
        <div ref={tilt} className="h-full w-full will-change-transform" style={{ transformStyle: "preserve-3d", transformOrigin: BASE }}>
          <div className="h-full w-full animate-[sway_9s_ease-in-out_infinite] motion-reduce:animate-none" style={{ transformOrigin: BASE }}>
            <BouquetArt className="h-full w-full" />
          </div>
        </div>
        {/* the root that runs down the page starts here, at the cut stems */}
        <span data-anchor data-spread="0.06" className="absolute left-1/2 top-[94.5%] h-px w-px" />
      </div>
      <span data-via className="absolute bottom-0 left-1/2 hidden h-px w-px md:block" />
      <span data-via className="absolute right-[14px] top-[74svh] h-px w-px md:hidden" />

      {/* copy */}
      <div ref={copy} className="gutter relative z-10 flex h-full flex-col pb-[33vw] pt-24 md:pb-[24vw] md:pt-32">
        <div className="mt-auto max-w-[380px]">
          <div>
            <SplitWords
              as="h1"
              immediate
              delay={0.9}
              stagger={0.045}
              text="Flowers composed by hand, in one of the *oldest towns on earth.*"
              className="display text-[34px] leading-[1] text-paper md:text-[44px]"
            />
            <div className="hero-fade mt-7 flex flex-wrap items-center gap-5">
              <Magnetic>
                <Link href="/shop" className="pill bg-paper text-night hover:bg-blush" data-cursor="Shop">
                  Shop bouquets <span aria-hidden>→</span>
                </Link>
              </Magnetic>
              <a href={waLink("Hello Manolia! We're planning a wedding and would love to talk flowers.")} target="_blank" rel="noreferrer" className="label link-u text-line/80">
                Plan a wedding
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="label hero-fade pointer-events-none absolute bottom-6 right-[clamp(16px,3.4vw,56px)] z-10 hidden items-center gap-3 text-line/50 md:flex">
        Scroll
        <span className="relative block h-10 w-px overflow-hidden bg-line/15">
          <span className="absolute inset-0 animate-[cue_2.4s_cubic-bezier(.16,1,.3,1)_infinite] bg-line/70" />
        </span>
      </div>
    </section>
  );
}
