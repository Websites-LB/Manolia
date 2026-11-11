"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

import { smooth, type Pt } from "@/lib/botanic/geometry";

/* Wing outlines for the right-hand pair; the body sits at the origin and the left pair is mirrored. */
const FORE: Pt[] = [
  [1, -3],
  [8, -20],
  [25, -33],
  [44, -35],
  [54, -27],
  [50, -15],
  [38, -5],
  [16, 0],
];
const HIND: Pt[] = [
  [1, 1],
  [17, 1],
  [32, 7],
  [39, 18],
  [35, 29],
  [24, 34],
  [12, 28],
  [4, 13],
];
const FORE_D = smooth(FORE, true);
const HIND_D = smooth(HIND, true);
/** veins fan out from the wing root to the margin, as they do in a real wing */
const VEINS = [
  ...[1, 2, 3, 4, 5, 6].map((i) => smooth([[2, -2], [FORE[i][0] * 0.5, FORE[i][1] * 0.52 - 1.5], [FORE[i][0] * 0.97, FORE[i][1] * 0.97]])),
  smooth([[12, -12], [26, -18], [30, -8], [16, -3]], true),
  ...[2, 3, 4, 5, 6].map((i) => smooth([[2, 2], [HIND[i][0] * 0.5, HIND[i][1] * 0.5 + 1], [HIND[i][0] * 0.96, HIND[i][1] * 0.96]])),
];

/**
 * Wing patterns taken from real species: each has a ground colour that pales toward the body, a
 * darker margin, and its own markings. `dots` are the pale spots that sit in the dark margin.
 */
type Species = { id: string; inner: string; outer: string; margin: string; vein: string; veinW: number; dots: string | null; eye?: string; tip?: string };
const SPECIES: Species[] = [
  { id: "monarch", inner: "#f6b25a", outer: "#d9661c", margin: "#17110d", vein: "#17110d", veinW: 1.1, dots: "#fff6e4" },
  { id: "morpho", inner: "#9be2ff", outer: "#1c5fd0", margin: "#0b1026", vein: "#0f2f7a", veinW: 0.45, dots: null },
  { id: "white", inner: "#fffaf0", outer: "#ece4cf", margin: "#8c8676", vein: "#bdb49d", veinW: 0.4, dots: null, eye: "#2a2620", tip: "#4a463d" },
  { id: "swallowtail", inner: "#fbe59a", outer: "#efc94a", margin: "#17130c", vein: "#17130c", veinW: 0.9, dots: "#fbe59a", eye: "#3f7fe0" },
  { id: "blush", inner: "#fbdcd4", outer: "#e7928f", margin: "#7a3c44", vein: "#b8656b", veinW: 0.5, dots: "#fff1ea" },
  { id: "copper", inner: "#f7c98f", outer: "#c8703a", margin: "#3a2418", vein: "#7a4526", veinW: 0.55, dots: null, eye: "#2c1a12" },
];

/** Gradients and clips for every species, defined once and shared by all the wings on the page. */
function WingDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        <clipPath id="bf-fore">
          <path d={FORE_D} />
        </clipPath>
        <clipPath id="bf-hind">
          <path d={HIND_D} />
        </clipPath>
        <radialGradient id="bf-sheen" gradientUnits="userSpaceOnUse" cx="14" cy="-12" r="44">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </radialGradient>
        {SPECIES.map((sp) => (
          <radialGradient key={sp.id} id={`bf-${sp.id}`} gradientUnits="userSpaceOnUse" cx="2" cy="0" r="54">
            <stop offset="0" stopColor={sp.inner} />
            <stop offset="0.55" stopColor={sp.outer} />
            <stop offset="1" stopColor={sp.outer} />
          </radialGradient>
        ))}
      </defs>
    </svg>
  );
}

function Wing({ sp }: { sp: Species }) {
  const part = (d: string, clip: string, hind: boolean) => (
    <g clipPath={`url(#${clip})`}>
      <path d={d} fill={`url(#bf-${sp.id})`} />
      {/* the dark margin: a wide line on the outline, of which only the inside half shows */}
      <path d={d} fill="none" stroke={sp.margin} strokeWidth={hind ? 7 : 8.5} strokeOpacity={sp.dots || sp.id === "morpho" ? 1 : 0.55} />
      {sp.tip && !hind && <circle cx="50" cy="-30" r="13" fill={sp.tip} fillOpacity="0.8" />}
      {sp.dots && <path d={d} fill="none" stroke={sp.dots} strokeWidth={1.7} strokeLinecap="round" strokeDasharray="0.1 4.6" transform="scale(0.93)" />}
      <path d={d} fill="url(#bf-sheen)" style={{ mixBlendMode: "soft-light" }} />
    </g>
  );
  return (
    <svg viewBox="-2 -38 60 76" className="block h-full w-full overflow-visible">
      {part(HIND_D, "bf-hind", true)}
      {part(FORE_D, "bf-fore", false)}
      <g fill="none" stroke={sp.vein} strokeWidth={sp.veinW} strokeOpacity={0.85} strokeLinecap="round">
        {VEINS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {sp.eye && (
        <>
          <circle cx={sp.id === "swallowtail" ? 27 : 31} cy={sp.id === "swallowtail" ? 26 : -17} r={sp.id === "swallowtail" ? 3 : 2.6} fill={sp.eye} />
          {sp.id === "swallowtail" && <circle cx="17" cy="24" r="2.4" fill="#d8502f" />}
        </>
      )}
      <path d={FORE_D} fill="none" stroke={sp.margin} strokeWidth="0.5" strokeOpacity="0.7" />
      <path d={HIND_D} fill="none" stroke={sp.margin} strokeWidth="0.5" strokeOpacity="0.7" />
    </svg>
  );
}

type Fly = { x: number; y: number; h: number; speed: number; tx: number; ty: number; next: number; s: number };

/**
 * Butterflies drifting over the whole page on lazy curves, each patterned after a real species. Each picks a new spot to
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
      <WingDefs />
      {Array.from({ length: n }, (_, i) => {
        const sp = SPECIES[i % SPECIES.length];
        const flap = `${0.16 + (i % 3) * 0.04}s`;
        return (
          // a soft shadow well below the insect, so it reads as flying above the page (a plain blurred
          // shape: a drop-shadow filter would be recomputed on every wingbeat)
          <div key={i} ref={(el) => void (els.current[i] = el)} className="absolute left-0 top-0 -ml-[27px] -mt-[18px] h-[38px] w-[56px] will-change-transform">
            <span className="absolute left-1/2 top-[70%] h-[16px] w-[34px] -translate-x-1/2 rounded-full bg-black/35 blur-[6px]" />
            <div className="absolute right-1/2 top-0 h-full w-1/2 origin-right animate-[flap_var(--f)_ease-in-out_infinite_alternate] will-change-transform" style={{ ["--f" as string]: flap }}>
              <div className="h-full w-full -scale-x-100">
                <Wing sp={sp} />
              </div>
            </div>
            <div className="absolute left-1/2 top-0 h-full w-1/2 origin-left animate-[flap_var(--f)_ease-in-out_infinite_alternate] will-change-transform" style={{ ["--f" as string]: flap }}>
              <Wing sp={sp} />
            </div>
            <svg viewBox="-8 -24 16 44" className="absolute left-1/2 top-1/2 h-[33px] w-[12px] -translate-x-1/2 -translate-y-1/2 overflow-visible">
              <g fill="none" stroke="#1a130f" strokeWidth={0.7} strokeLinecap="round">
                <path d="M-0.8 -13 Q-4 -19 -6.5 -23" />
                <path d="M0.8 -13 Q4 -19 6.5 -23" />
              </g>
              <circle cx="-6.6" cy="-23.2" r="0.9" fill="#1a130f" />
              <circle cx="6.6" cy="-23.2" r="0.9" fill="#1a130f" />
              {/* abdomen, furred thorax, head */}
              <ellipse cx="0" cy="6" rx="1.7" ry="10" fill="#241a14" />
              <ellipse cx="0" cy="-4" rx="2.5" ry="5.2" fill="#3a2a20" />
              <ellipse cx="-0.7" cy="-5" rx="0.9" ry="3.4" fill="#6b5442" fillOpacity="0.7" />
              <circle cx="0" cy="-11" r="2.1" fill="#1e1611" />
              {[2, 5.5, 9, 12].map((y) => (
                <path key={y} d={`M-1.5 ${y}H1.5`} stroke="#57412f" strokeWidth={0.45} />
              ))}
            </svg>
          </div>
        );
      })}
    </div>
  );
}
