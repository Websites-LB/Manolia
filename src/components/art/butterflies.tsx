"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

import { smooth, type Pt } from "@/lib/botanic/geometry";

const FORE: Pt[] = [
  [1, -3],
  [9, -19],
  [28, -31],
  [47, -30],
  [53, -20],
  [42, -7],
  [18, 0],
];
const HIND: Pt[] = [
  [1, 1],
  [19, 2],
  [33, 10],
  [36, 24],
  [25, 33],
  [11, 27],
  [3, 12],
];
const FORE_D = smooth(FORE, true);
const HIND_D = smooth(HIND, true);
const VEINS = [
  ...FORE.slice(1, 6).map(([x, y]) => smooth([[2, -2], [x * 0.5, y * 0.55 - 2], [x * 0.88, y * 0.88]])),
  ...HIND.slice(1, 6).map(([x, y]) => smooth([[2, 2], [x * 0.5, y * 0.5 + 1], [x * 0.86, y * 0.86]])),
];
const SPOTS: Pt[] = [
  [44, -24],
  [36, -27],
  [27, 25],
  [31, 17],
];

const TINTS = ["#f0b9ae", "#f5c78f", "#c9b5e6", "#a9c2e8", "#f3e3a6", "#e3909a"];

function Wing({ tint }: { tint: string }) {
  return (
    <svg viewBox="-2 -36 60 72" className="block h-full w-full overflow-visible">
      <g stroke="#efe6d2" strokeLinecap="round" strokeLinejoin="round">
        <path d={HIND_D} fill={tint} fillOpacity={0.82} strokeWidth={1.1} />
        <path d={FORE_D} fill={tint} fillOpacity={0.92} strokeWidth={1.1} />
        {VEINS.map((d, i) => (
          <path key={i} d={d} fill="none" strokeWidth={0.6} strokeOpacity={0.7} />
        ))}
        {SPOTS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 ? 1.6 : 2.6} fill="#13241a" fillOpacity={0.55} strokeWidth={0.6} />
        ))}
      </g>
    </svg>
  );
}

type Fly = { x: number; y: number; h: number; speed: number; tx: number; ty: number; next: number; s: number };

/**
 * Engraved butterflies drifting over the whole page on lazy curves. Each picks a new spot to
 * wander toward every few seconds and veers away from the cursor. Transform only; none on reduced motion.
 */
export function Butterflies({ count = 6 }: { count?: number }) {
  const [n, setN] = useState(0);
  const els = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setN(window.innerWidth < 768 ? Math.min(3, count) : count);
  }, [count]);

  useEffect(() => {
    if (!n) return;
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const flies: Fly[] = Array.from({ length: n }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      h: Math.random() * Math.PI * 2,
      speed: 0.55 + Math.random() * 0.5,
      tx: Math.random() * W(),
      ty: Math.random() * H(),
      next: 0,
      s: 0.7 + Math.random() * 0.55,
    }));
    const pointer = { x: -999, y: -999 };
    const move = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    window.addEventListener("pointermove", move);

    const tick = (time: number, dt: number) => {
      const k = Math.min(dt, 50) / 16.7;
      flies.forEach((f, i) => {
        if (time > f.next) {
          f.tx = W() * (0.05 + Math.random() * 0.9);
          f.ty = H() * (0.05 + Math.random() * 0.9);
          f.next = time + 3 + Math.random() * 4;
        }
        let want = Math.atan2(f.ty - f.y, f.tx - f.x);
        const dx = f.x - pointer.x;
        const dy = f.y - pointer.y;
        const near = Math.hypot(dx, dy);
        let boost = 1;
        if (near < 150) {
          want = Math.atan2(dy, dx);
          boost = 1 + (150 - near) / 50;
        }
        // flutter: a little wobble on the heading, so the line is never straight
        want += Math.sin(time * 2.2 + i * 1.7) * 0.6;
        let d = want - f.h;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        f.h += d * 0.045 * k * boost;
        const v = f.speed * boost * k * 1.6;
        f.x += Math.cos(f.h) * v;
        f.y += Math.sin(f.h) * v + Math.sin(time * 5 + i) * 0.4 * k;
        const el = els.current[i];
        if (el) el.style.transform = `translate3d(${f.x}px, ${f.y}px, 0) rotate(${(f.h * 180) / Math.PI + 90}deg) scale(${f.s})`;
      });
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", move);
    };
  }, [n]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[35] overflow-hidden" aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const tint = TINTS[i % TINTS.length];
        const flap = `${0.16 + (i % 3) * 0.04}s`;
        return (
          <div key={i} ref={(el) => void (els.current[i] = el)} className="absolute left-0 top-0 -ml-[27px] -mt-[18px] h-[36px] w-[54px] will-change-transform">
            <div className="absolute right-1/2 top-0 h-full w-1/2 origin-right animate-[flap_var(--f)_ease-in-out_infinite_alternate] will-change-transform" style={{ ["--f" as string]: flap }}>
              <div className="h-full w-full -scale-x-100">
                <Wing tint={tint} />
              </div>
            </div>
            <div className="absolute left-1/2 top-0 h-full w-1/2 origin-left animate-[flap_var(--f)_ease-in-out_infinite_alternate] will-change-transform" style={{ ["--f" as string]: flap }}>
              <Wing tint={tint} />
            </div>
            <svg viewBox="-6 -20 12 40" className="absolute left-1/2 top-1/2 h-[30px] w-[9px] -translate-x-1/2 -translate-y-1/2 overflow-visible">
              <g stroke="#efe6d2" strokeLinecap="round" fill="#13241a" strokeWidth={1}>
                <ellipse cx="0" cy="2" rx="2.2" ry="12" />
                <circle cx="0" cy="-11" r="2.4" />
                <path d="M-1 -13 Q-5 -20 -7 -24" fill="none" />
                <path d="M1 -13 Q5 -20 7 -24" fill="none" />
              </g>
            </svg>
          </div>
        );
      })}
    </div>
  );
}
