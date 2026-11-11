"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

import { SplitWords } from "@/components/motion/split-words";
import { ProductCard } from "@/components/shop/product-card";
import { ProductDialog } from "@/components/shop/product-dialog";
import { PRODUCTS, type Product } from "@/lib/products";
import { waLink } from "@/lib/site";

gsap.registerPlugin(ScrollTrigger);

const PICKS = ["old-souk", "jbeil-morning", "first-dance", "velvet-box", "maison", "lavender-hour"];

/**
 * Chapter two. The bouquets pass by sideways while you keep scrolling down — a pinned
 * horizontal gallery on large screens, a swipeable strip on phones.
 */
export function Signatures() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Product | null>(null);
  const picks = PICKS.map((id) => PRODUCTS.find((p) => p.id === id)!).filter(Boolean);

  useLayoutEffect(() => {
    const el = root.current;
    const tr = track.current;
    if (!el || !tr || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      const distance = () => tr.scrollWidth - window.innerWidth;
      gsap.to(tr, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: () => `+=${distance()}`, scrub: 0.6, pin: true, invalidateOnRefresh: true, anticipatePin: 1 },
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden bg-paper text-ink md:flex md:h-[100svh] md:flex-col md:justify-center">
      <div className="gutter flex flex-wrap items-end justify-between gap-6 pb-10 pt-4 md:pb-12 md:pt-24">
        <div>
          <p className="label text-ink/50">(02) — Signatures</p>
          <SplitWords text="Tied this *morning.*" className="display h-section mt-4" />
        </div>
        <Link href="/shop" className="label link-u text-ink/70" data-cursor="Shop">
          All bouquets →
        </Link>
      </div>

      <div
        ref={track}
        className="gutter flex snap-x snap-mandatory gap-5 overflow-x-auto pb-20 [scrollbar-width:none] md:snap-none md:gap-[2.2vw] md:overflow-visible md:pb-0 md:will-change-transform"
      >
        {picks.map((p, i) => (
          <ProductCard
            key={p.id}
            product={p}
            index={i}
            onOpen={() => setOpen(p)}
            className="w-[78vw] shrink-0 snap-start md:w-[24vw]"
            sizes="(min-width: 768px) 24vw, 78vw"
          />
        ))}
        <a
          href={waLink("Hello Manolia! I'd like something bespoke.")}
          target="_blank"
          rel="noreferrer"
          data-cursor="Write"
          className="night-glow flex w-[78vw] shrink-0 snap-start flex-col justify-between rounded-[4px] p-7 text-paper md:mt-[30px] md:aspect-[4/5] md:w-[24vw] md:self-start"
        >
          <p className="label text-paper/50">Bespoke</p>
          <div>
            <p className="display text-[52px] md:text-[64px]">
              Something only <em>for them?</em>
            </p>
            <p className="mt-5 max-w-[34ch] text-[14px] leading-relaxed text-paper/65">
              Tell us the person, the colours, the occasion. We compose it and send you a photo before it leaves the boutique.
            </p>
            <p className="label link-u mt-8 inline-block text-paper/85">Ask on WhatsApp →</p>
          </div>
        </a>
        <div className="w-px shrink-0 md:w-[4vw]" aria-hidden />
      </div>

      <ProductDialog product={open} onClose={() => setOpen(null)} />
    </section>
  );
}
