"use client";

import gsap from "gsap";
import { useLayoutEffect, useMemo, useRef } from "react";

import { buildBouquet, VIEW, type Piece } from "@/lib/botanic/bouquet";
import { mixHex } from "@/lib/botanic/color";

const GROUND = "#13241a";
const INK = "#efe6d2";

/**
 * The engraved bouquet. On arrival it is drawn the way a florist builds one: airy sprays first,
 * then stems, leaves, each bloom from the back to the front, and the silk tie last. Each petal's
 * hand-colouring floods in just after its outline is inked.
 *
 * Only the drawing itself animates stroke offsets (once, on load); everything after that —
 * the float and the pointer tilt — is transform-only on the wrapper, so it stays on the compositor.
 */
export function BouquetArt({ className, onDrawn }: { className?: string; onDrawn?: () => void }) {
  // phones get the same drawing minus the finest hatching, which is too small to see there anyway
  const pieces = useMemo<Piece[]>(() => {
    const all = buildBouquet(7);
    if (typeof window === "undefined" || window.innerWidth >= 768) return all;
    return all.map((p) => ({ ...p, strokes: p.strokes.filter((s) => s.fill || s.w > 0.8 || s.o > 0.6) }));
  }, []);
  const svg = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const root = svg.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDrawn?.();
      return;
    }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.35, onComplete: onDrawn });
      const groups = Array.from(root.querySelectorAll<SVGGElement>("g[data-piece]"));
      groups.forEach((g, gi) => {
        const paths = Array.from(g.querySelectorAll<SVGPathElement>("path"));
        for (const p of paths) {
          const len = p.getTotalLength() + 1;
          p.style.strokeDasharray = `${len}`;
          p.style.strokeDashoffset = `${len}`;
          if (p.dataset.fill) p.style.fillOpacity = "0";
        }
        const at = gi * 0.16;
        const span = Math.min(1.1, 0.25 + paths.length * 0.008);
        tl.to(paths, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut", stagger: { amount: span } }, at);
        tl.to(g.querySelectorAll("path[data-fill]"), { fillOpacity: 1, duration: 1.1, ease: "power1.out", stagger: { amount: span } }, at + 0.45);
      });
      tl.from(root.querySelectorAll("ellipse"), { opacity: 0, duration: 2.4, ease: "power1.out", stagger: 0.05 }, 0.9);
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <svg ref={svg} viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className={className} role="img" aria-label="An engraved, hand-coloured bouquet of peonies, roses, ranunculus and anemone, tied with silk">
      <defs>
        {pieces.map((p, i) =>
          p.wash ? (
            <radialGradient key={i} id={`wash-${i}`}>
              <stop offset="0" stopColor={p.wash.color} stopOpacity={0.34} />
              <stop offset="1" stopColor={p.wash.color} stopOpacity={0} />
            </radialGradient>
          ) : null,
        )}
      </defs>
      <g>
        {pieces.map((p, i) =>
          p.wash ? (
            <ellipse
              key={i}
              cx={p.wash.cx}
              cy={p.wash.cy}
              rx={p.wash.rx * 1.5}
              ry={p.wash.ry * 1.5}
              transform={`rotate(${p.wash.rot ?? 0} ${p.wash.cx} ${p.wash.cy})`}
              fill={`url(#wash-${i})`}
            />
          ) : null,
        )}
      </g>
      <g fill="none" stroke={INK} strokeLinecap="round" strokeLinejoin="round">
        {pieces.map((p) => (
          <g key={p.id} data-piece={p.id}>
            {p.strokes.map((s, j) => (
              <path
                key={j}
                d={s.d}
                data-fill={s.fill ? "1" : undefined}
                fill={s.fill ? mixHex(GROUND, p.tint, (s.tone ?? 0) * 0.92) : "none"}
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
