"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useLayoutEffect, useRef, type ReactNode } from "react";

import { FadeUp } from "@/components/motion/fade-up";
import { Magnetic } from "@/components/motion/magnetic";
import { ProductImage } from "@/components/shop/product-image";
import { EMPTY_STEMS, type Recipe } from "@/lib/custom";
import { cn } from "@/lib/utils";

import { ChapterHead, Lane } from "./parts";

gsap.registerPlugin(ScrollTrigger);

const PROPOSAL: Recipe = { stems: { ...EMPTY_STEMS, rose: 6, peony: 2 }, palette: "ivory", greens: ["eucalyptus"], wrap: "ivory" };

function Bubble({ from, children, className }: { from: "you" | "us"; children: ReactNode; className?: string }) {
  return (
    <div className={cn("msg flex", from === "you" ? "justify-end" : "justify-start", className)}>
      <div className={cn("max-w-[86%] rounded-[20px] px-5 py-3.5 text-[16px] leading-snug", from === "you" ? "rounded-br-[6px] bg-night text-paper" : "rounded-bl-[6px] bg-white text-ink shadow-[0_10px_30px_-18px_rgb(0_0_0/0.35)]")}>
        {children}
      </div>
    </div>
  );
}

/**
 * Chapter three: for whoever does not know what to send. The conversation plays out on its own as it
 * scrolls into view — a few words about the person, the florist's answer, a photo and a price — so
 * the idea is understood before a single field is filled in.
 */
export function AskStory() {
  const chat = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = chat.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const msgs = gsap.utils.toArray<HTMLElement>(".msg");
      const dots = el.querySelector(".typing");
      gsap.set(msgs, { opacity: 0, y: 24, scale: 0.96 });
      gsap.set(dots, { opacity: 0 });
      const show = (t: gsap.core.Timeline, m: HTMLElement) => t.to(m, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "expo.out" });
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 72%", once: true } });
      show(tl, msgs[0]);
      tl.to(dots, { opacity: 1, duration: 0.3 }, "+=0.5").to(dots, { opacity: 0, duration: 0.2 }, "+=1.1");
      show(tl, msgs[1]);
      show(tl, msgs[2]);
      tl.to(msgs[3], { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "expo.out" }, "+=1");
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative text-line">
      <ChapterHead id="ask" bloom="#c9b5e6" kicker="No idea what to get?" title={"Tell us about them.\n*We'll choose.*"} />
      <div className="gutter relative z-10 mt-12 grid items-center gap-12 md:mt-16 md:grid-cols-[0.9fr_1.1fr] md:gap-[6vw] md:pl-[8vw]">
        <div>
          <p className="max-w-[40ch] text-[17px] leading-relaxed text-line/70">
            Write a few words about the person and the occasion. Our florist answers with a photo and a price, and you only pay once you love it.
          </p>
          <FadeUp className="mt-10 space-y-6" stagger={0.1}>
            {[
              ["Describe them", "Who they are, what they like, the occasion, your budget."],
              ["We send a proposal", "A photo of what we would make, and the price."],
              ["Say yes and pay", "Or ask for a change. Nothing is paid before you agree."],
            ].map(([t, d], i) => (
              <div key={t} className="flex items-baseline gap-4">
                <span className="display text-[40px] leading-none text-blush">{i + 1}</span>
                <div>
                  <p className="display text-[30px] text-paper">{t}</p>
                  <p className="mt-1 text-[15px] leading-snug text-line/60">{d}</p>
                </div>
              </div>
            ))}
          </FadeUp>
          <div className="mt-10">
            <Magnetic>
              <Link href="/shop#florist" data-cursor="Write" className="pill bg-paper text-night hover:bg-blush">
                Write to the florist <span aria-hidden>→</span>
              </Link>
            </Magnetic>
          </div>
        </div>

        {/* the conversation */}
        <div ref={chat} className="relative mx-auto w-full max-w-[520px] rounded-[26px] bg-paper p-4 shadow-[0_80px_140px_-60px_rgb(0_0_0/0.9)] md:p-6">
          <div className="flex items-center gap-3 border-b border-ink/10 px-2 pb-4">
            <span className="display flex h-11 w-11 items-center justify-center rounded-full bg-night text-[22px] text-paper">M</span>
            <div>
              <p className="display text-[22px] leading-none text-ink">Manolia</p>
              <p className="mt-1 text-[13px] leading-none text-ink/50">Your florist</p>
            </div>
          </div>
          <div className="space-y-3 px-1 pb-2 pt-5">
            <Bubble from="you">It&apos;s my mum&apos;s birthday on Friday. She loves white flowers and anything that smells nice. Around $80.</Bubble>
            <div className="typing flex gap-1.5 px-3 py-1" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2 w-2 animate-pulse rounded-full bg-ink/35" style={{ animationDelay: `${i * 0.18}s` }} />
              ))}
            </div>
            <Bubble from="us">Happy birthday to her! We&apos;d tie six ivory garden roses, two peonies and fresh eucalyptus for the scent. Here it is:</Bubble>
            <div className="msg flex justify-start">
              <div className="w-[70%] overflow-hidden rounded-[18px] rounded-bl-[6px] bg-white shadow-[0_10px_30px_-18px_rgb(0_0_0/0.35)]">
                <div className="aspect-[5/4]">
                  <ProductImage recipe={PROPOSAL} frame={false} />
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <p className="display text-[22px] text-ink">Ivory for Mum</p>
                  <p className="display text-[22px] text-clay">$80</p>
                </div>
                <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                  <span className="label rounded-full bg-night py-2.5 text-center text-paper">Yes, I love it</span>
                  <span className="label rounded-full border border-ink/15 py-2.5 text-center text-ink/70">Change it</span>
                </div>
              </div>
            </div>
            <Bubble from="you">Perfect, thank you!</Bubble>
          </div>
        </div>
      </div>
      <Lane />
    </section>
  );
}
