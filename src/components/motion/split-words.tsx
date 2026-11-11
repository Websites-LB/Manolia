"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef, type ElementType, type ReactNode } from "react";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  /** Plain text; wrap a phrase in *asterisks* to set it in italic. */
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  /** reveal as soon as mounted (hero) instead of when scrolled into view */
  immediate?: boolean;
  stagger?: number;
};

/**
 * Headline that arrives word by word, each word rising out of its own mask — read in sequence,
 * like a film title card, never faded in as one block.
 */
export function SplitWords({ text, as: Tag = "h2", className, delay = 0, immediate = false, stagger = 0.06 }: Props) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLElement>(".word-inner");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.set(words, { yPercent: 115, rotate: 4 });
      gsap.to(words, {
        yPercent: 0,
        rotate: 0,
        duration: 1.4,
        ease: "expo.out",
        stagger,
        delay,
        scrollTrigger: immediate ? undefined : { trigger: el, start: "top 88%", once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [delay, immediate, stagger]);

  const parts: ReactNode[] = [];
  text.split(/(\*[^*]+\*)/).forEach((chunk, ci) => {
    const italic = chunk.startsWith("*") && chunk.endsWith("*");
    const clean = italic ? chunk.slice(1, -1) : chunk;
    clean.split(/(\s+|\n)/).forEach((w, wi) => {
      if (w === "\n") parts.push(<br key={`${ci}-${wi}`} />);
      else if (/^\s+$/.test(w)) parts.push(" ");
      else if (w)
        parts.push(
          <span key={`${ci}-${wi}`} className="word-mask">
            <span className="word-inner">{italic ? <em>{w}</em> : w}</span>
          </span>,
        );
    });
  });

  return (
    <Tag ref={ref} className={className} aria-label={text.replace(/\*/g, "").replace(/\n/g, " ")}>
      <span aria-hidden>{parts}</span>
    </Tag>
  );
}
