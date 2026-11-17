"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { Pt } from "@/lib/botanic/geometry";
import { buildVine, type Vine as VineShape, type Way } from "@/lib/botanic/vine";

gsap.registerPlugin(ScrollTrigger);

/** Where the growing tip sits in the viewport while you scroll (0 = top, 1 = bottom). */
const TIP = 0.66;
const STEM = { shade: "#040a06", body: "#4f7d4c", lit: "#b4d79e" };
/** the vine waits for the hero bouquet to finish painting only the first time */
let seen = false;

const PETALS = 6;
/** one petal, pointing up from the centre of the flower, in units of its radius */
const PETAL = "M0 0 C-0.55 -0.25 -0.62 -0.86 -0.2 -1.02 C-0.08 -1.07 0.08 -1.07 0.2 -1.02 C0.62 -0.86 0.55 -0.25 0 0Z";
/** a leaf lying along +x from where it joins the stem, in units of its length */
const LEAF = "M0 0 C0.22 -0.36 0.66 -0.4 1 0 C0.66 0.36 0.22 0.32 0 0Z";

function Art({ v, w, h }: { v: VineShape; w: number; h: number }) {
  const svg = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const el = svg.current;
    if (!el) return;
    const segs = Array.from(el.querySelectorAll<SVGPathElement>("[data-seg]"));
    const curls = Array.from(el.querySelectorAll<SVGPathElement>("[data-curl]"));
    const leaves = Array.from(el.querySelectorAll<SVGGElement>("[data-leaf]"));
    const blooms = Array.from(el.querySelectorAll<SVGGElement>("[data-bloom]"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      [...segs, ...curls].forEach((p) => (p.style.strokeDashoffset = "0"));
      [...leaves, ...blooms].forEach((g) => g.setAttribute("data-on", ""));
      return;
    }
    const cache = new Float32Array(segs.length + curls.length).fill(-1);
    const write = (p: SVGPathElement, i: number, t: number) => {
      const q = Math.round(Math.max(0, Math.min(1, t)) * 300) / 300;
      if (q === cache[i]) return;
      cache[i] = q;
      p.style.strokeDashoffset = `${1 - q}`;
    };
    const toggle = (g: SVGGElement, y: number, tip: number) => {
      g.toggleAttribute("data-on", tip > y);
    };

    // the first screen grows by itself out of the bouquet; after that the tip rides with your scroll
    const start = v.segs[0]?.y0 ?? 0;
    const intro = { y: start };
    const grow = () => {
      const tip = Math.max(intro.y, window.innerHeight * TIP - el.getBoundingClientRect().top);
      segs.forEach((p, i) => {
        const s = v.segs[Math.floor(i / 3)];
        write(p, i, (tip - s.y0) / (s.y1 - s.y0 || 1));
      });
      curls.forEach((p, i) => write(p, segs.length + i, (tip - v.curls[i].y0) / (v.curls[i].y1 - v.curls[i].y0)));
      leaves.forEach((g, i) => toggle(g, v.leaves[i].y, tip));
      blooms.forEach((g, i) => toggle(g, v.blooms[i].y - 10, tip));
    };
    const tween = gsap.to(intro, { y: Math.max(start, window.innerHeight * 0.98), duration: 2.6, delay: seen ? 0 : 2.6, ease: "expo.out", onUpdate: grow });
    seen = true;
    const st = ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top", onUpdate: grow, onRefresh: grow });
    grow();
    return () => {
      tween.kill();
      st.kill();
    };
  }, [v]);

  const dash = { pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 };
  return (
    <svg ref={svg} width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="vine pointer-events-none absolute left-0 top-0 z-[1]" aria-hidden>
      <defs>
        <linearGradient id="vine-leaf" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#2c5232" />
          <stop offset="0.55" stopColor="#5d8c55" />
          <stop offset="1" stopColor="#9cc283" />
        </linearGradient>
        <linearGradient id="vine-leaf-2" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#264a2e" />
          <stop offset="0.6" stopColor="#4d7a4a" />
          <stop offset="1" stopColor="#7fa96d" />
        </linearGradient>
        {v.blooms.map((b, i) => (
          <radialGradient key={i} id={`vine-petal-${i}`} cx="0.5" cy="1" r="1.05">
            <stop offset="0" stopColor="#5a2a2a" />
            <stop offset="0.3" stopColor={b.tint} stopOpacity="0.92" />
            <stop offset="1" stopColor="#fff6ec" />
          </radialGradient>
        ))}
        <radialGradient id="vine-glow">
          <stop offset="0" stopColor="#f0b9ae" stopOpacity="0.32" />
          <stop offset="1" stopColor="#f0b9ae" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {v.curls.map((c, i) => (
          <path key={i} data-curl d={c.d} stroke={STEM.body} strokeWidth={1.3} {...dash} />
        ))}
        {v.segs.map((s, i) => [
          // the shadow the stem casts, then the stem, then the light along its upper edge
          <path key={`s${i}`} data-seg d={s.d} stroke={STEM.shade} strokeOpacity={0.55} strokeWidth={s.w + 2} transform="translate(3 5)" {...dash} />,
          <path key={`b${i}`} data-seg d={s.d} stroke={STEM.body} strokeWidth={s.w} {...dash} />,
          <path key={`l${i}`} data-seg d={s.lit} stroke={STEM.lit} strokeOpacity={0.7} strokeWidth={Math.max(0.7, s.w * 0.28)} {...dash} />,
        ])}
      </g>

      {v.leaves.map((l, i) => (
        <g key={i} transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.angle.toFixed(1)}) scale(${l.size.toFixed(1)})`}>
          <g data-leaf className="vine-leaf">
            <path d={LEAF} fill="#030805" opacity={0.4} transform="translate(0.12 0.2)" />
            <path d={LEAF} fill={`url(#vine-leaf${l.tone > 0.5 ? "" : "-2"})`} />
            <path d="M0.04 0 C0.36 -0.04 0.66 -0.03 0.94 0" fill="none" stroke="#c9e3b4" strokeOpacity={0.45} strokeWidth={0.035} />
          </g>
        </g>
      ))}

      {v.blooms.map((b, i) => (
        <g key={i} transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`}>
          <g data-bloom className="vine-bloom">
            <circle r={b.r * 4.2} fill="url(#vine-glow)" className="vine-bloom-glow" />
            <g transform={`scale(${b.r})`}>
              {Array.from({ length: PETALS }, (_, k) => (
                <g key={k} transform={`rotate(${(360 / PETALS) * k + i * 17})`}>
                  <g className="vine-petal" style={{ transitionDelay: `${0.08 + k * 0.07}s` }}>
                    <path d={PETAL} fill="#030805" opacity={0.35} transform="translate(0.08 0.14)" />
                    <path d={PETAL} fill={`url(#vine-petal-${i})`} />
                  </g>
                </g>
              ))}
              <circle r={0.26} fill="#3a2418" className="vine-heart" />
              <circle r={0.15} cx={-0.05} cy={-0.06} fill="#e9c27a" className="vine-heart" />
            </g>
          </g>
        </g>
      ))}
    </svg>
  );
}

/**
 * Wraps the home page and grows a vine through it. Any `[data-vine]` marker inside is a point the
 * stem passes through (in page order); `data-bloom="#hex"` opens a flower there. The first marker is
 * the hero bouquet's cut stems.
 */
export function Vine({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<{ w: number; h: number; way: Way[]; narrow: boolean } | null>(null);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const way: Way[] = Array.from(el.querySelectorAll<HTMLElement>("[data-vine]"))
        .filter((m) => m.getClientRects().length)
        .map((m) => {
          const q = m.getBoundingClientRect();
          return { at: [q.left - r.left, q.top - r.top] as Pt, bloom: m.dataset.bloom };
        });
      const w = Math.round(r.width);
      const h = Math.round(el.scrollHeight);
      setGeo((g) =>
        g && g.w === w && g.h === h && g.way.length === way.length && g.way.every((p, i) => Math.abs(p.at[1] - way[i].at[1]) < 2 && Math.abs(p.at[0] - way[i].at[0]) < 2)
          ? g
          : { w, h, way, narrow: w < 768 },
      );
    };
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    });
    ro.observe(el);
    measure();
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const v = useMemo(() => (geo && geo.way.length > 1 ? buildVine(geo.way, geo.w, geo.narrow) : null), [geo]);

  useLayoutEffect(() => {
    if (v) ScrollTrigger.refresh();
  }, [v]);

  return (
    <div ref={box} className="relative">
      {children}
      {v && geo && <Art v={v} w={geo.w} h={geo.h} />}
    </div>
  );
}
