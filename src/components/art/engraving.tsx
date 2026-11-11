"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

import type { Piece } from "@/lib/botanic/bouquet";
import { mixHex } from "@/lib/botanic/color";

gsap.registerPlugin(ScrollTrigger);

export const GROUND = "#13241a";
export const INK = "#efe6d2";

type Props = {
  pieces: Piece[];
  view: { w: number; h: number };
  label: string;
  className?: string;
  /** "load": ink in on mount · "view": ink in when scrolled into view · "static": already drawn */
  mode?: "load" | "view" | "static";
  delay?: number;
  /** seconds between one piece starting and the next */
  pace?: number;
  /** ground colour the fills are mixed from, so petals hide what is behind them */
  ground?: string;
  /** draw soft colour washes behind the pieces that have one */
  washes?: boolean;
  /** drop the finest hatching on small screens, where it is invisible but costly */
  thinOnPhones?: boolean;
};

/**
 * Renders engraved pieces as SVG and inks them in the order they are listed:
 * each outline is drawn, then its hand-colouring floods in just behind it.
 */
export function Engraving({ pieces, view, label, className, mode = "view", delay = 0, pace = 0.16, ground = GROUND, washes = false, thinOnPhones = true }: Props) {
  const svg = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const root = svg.current;
    if (!root) return;
    if (mode === "static" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.style.visibility = "visible";
      return;
    }
    let tl: gsap.core.Timeline | null = null;
    // measuring ~hundreds of paths is real work, so a plate only prepares itself when it is about to be seen
    const ink = () => {
      tl = gsap.timeline({ delay });
      // fine hatching is hidden on phones (see globals.css), so it is not animated there either
      const phone = window.innerWidth < 768;
      root.querySelectorAll<SVGGElement>("g[data-piece]").forEach((g, gi) => {
        const paths = Array.from(g.querySelectorAll<SVGPathElement>(phone ? "path:not([data-fine])" : "path"));
        for (const p of paths) {
          const len = p.getTotalLength() + 1;
          p.style.strokeDasharray = `${len}`;
          p.style.strokeDashoffset = `${len}`;
          if (p.dataset.fill) p.style.fillOpacity = "0";
        }
        const at = gi * pace;
        const span = Math.min(1.1, 0.25 + paths.length * 0.008);
        tl!.to(paths, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut", stagger: { amount: span } }, at);
        tl!.to(g.querySelectorAll("path[data-fill]"), { fillOpacity: 1, duration: 1.1, ease: "power1.out", stagger: { amount: span } }, at + 0.45);
      });
      const w = root.querySelectorAll("ellipse");
      if (w.length) tl.from(w, { opacity: 0, duration: 2.4, ease: "power1.out", stagger: 0.05 }, 0.9);
      root.style.visibility = "visible";
    };
    let st: ScrollTrigger | null = null;
    if (mode === "load") ink();
    else st = ScrollTrigger.create({ trigger: root, start: "top 85%", once: true, onEnter: ink });
    return () => {
      st?.kill();
      tl?.kill();
    };
  }, [mode, delay, pace, pieces]);

  return (
    <svg ref={svg} viewBox={`0 0 ${view.w} ${view.h}`} className={className} role="img" aria-label={label} style={{ visibility: mode === "static" ? "visible" : "hidden" }}>
      {washes && (
        <>
          <defs>
            {pieces.map((p, i) =>
              p.wash ? (
                <radialGradient key={i} id={`w-${label.length}-${i}`}>
                  <stop offset="0" stopColor={p.wash.color} stopOpacity={0.34} />
                  <stop offset="1" stopColor={p.wash.color} stopOpacity={0} />
                </radialGradient>
              ) : null,
            )}
          </defs>
          {pieces.map((p, i) =>
            p.wash ? (
              <ellipse
                key={i}
                cx={p.wash.cx}
                cy={p.wash.cy}
                rx={p.wash.rx * 1.5}
                ry={p.wash.ry * 1.5}
                transform={`rotate(${p.wash.rot ?? 0} ${p.wash.cx} ${p.wash.cy})`}
                fill={`url(#w-${label.length}-${i})`}
              />
            ) : null,
          )}
        </>
      )}
      <g fill="none" stroke={INK} strokeLinecap="round" strokeLinejoin="round">
        {pieces.map((p) => (
          <g key={p.id} data-piece={p.id}>
            {p.strokes.map((s, j) => (
              <path
                key={j}
                d={s.d}
                data-fill={s.fill ? "1" : undefined}
                data-fine={thinOnPhones && !s.fill && s.w <= 0.8 && s.o <= 0.6 ? "" : undefined}
                fill={s.fill ? mixHex(ground, p.tint, (s.tone ?? 0) * 0.92) : "none"}
                strokeOpacity={s.o}
                strokeWidth={s.w}
              />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
