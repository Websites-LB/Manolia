"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

/**
 * A small ink dot that follows the pointer with a little lag. Over anything marked
 * data-cursor="…" it opens into a disc carrying that word ("View", "Drag", "Add").
 * Mouse and trackpad only; touch screens keep their native behaviour.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setOn(true);
    document.documentElement.classList.add("has-cursor");
    const el = dot.current!;
    const x = gsap.quickTo(el, "x", { duration: 0.55, ease: "expo.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.55, ease: "expo.out" });
    const move = (e: PointerEvent) => {
      x(e.clientX);
      y(e.clientY);
      const t = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor], a, button");
      const word = t?.dataset.cursor ?? "";
      setLabel(word);
      el.dataset.state = word ? "label" : t ? "link" : "idle";
    };
    const out = () => (el.style.opacity = "0");
    const over = () => (el.style.opacity = "1");
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", out);
    document.addEventListener("pointerenter", over);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", out);
      document.removeEventListener("pointerenter", over);
    };
  }, []);

  if (!on) return <div ref={dot} hidden />;
  return (
    <div
      ref={dot}
      data-state="idle"
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[90] -translate-x-1/2 -translate-y-1/2 mix-blend-difference [&[data-state=label]>span:first-child]:scale-[9] [&[data-state=link]>span:first-child]:scale-[3.2]"
    >
      <span className="block h-2.5 w-2.5 rounded-full bg-[#f1ece2] transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)]" />
      <span
        className="label absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] text-[#0f1b13] transition-opacity duration-300"
        style={{ opacity: label ? 1 : 0, transform: "translate(-50%,-50%) scale(1)" }}
      >
        {label}
      </span>
    </div>
  );
}
