"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { drawFlower } from "@/lib/bloom/draw";
import { KINDS, blend, css } from "@/lib/bloom/kinds";
import { SITE, waLink } from "@/lib/site";

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** [start, end] of each chapter as a fraction of the pinned scroll. */
const CHAPTERS: [number, number][] = [
  [0, 0.13],
  [0.17, 0.36],
  [0.4, 0.58],
  [0.62, 0.79],
  [0.84, 1.01],
];
/** Where each flower is fully itself: tulip, rose, lily, cosmos, peony — one per chapter. */
const STOPS = [0.08, 0.27, 0.49, 0.71, 0.93];

export function HeroBloom() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const chapters = useRef<(HTMLDivElement | null)[]>([]);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = canvas.current!;
    const ctx = el.getContext("2d")!;
    const start = performance.now();

    let w = 0, h = 0, dpr = 1, mobile = false;
    const resize = () => {
      w = el.clientWidth;
      h = el.clientHeight;
      mobile = w < 768;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let progress = 0;
    // read straight from layout each frame: robust to Lenis, resizes and late font swaps
    const scrollProgress = () => {
      const r = section.current!.getBoundingClientRect();
      return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
    };

    const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);

    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      // real elapsed time, so scroll-follow keeps pace even when a slow device drops frames
      const dt = Math.min((now - last) / 1000, 0.5);
      last = now;
      const time = (now - start) / 1000;
      progress += (scrollProgress() - progress) * (1 - Math.exp(-dt * 6));
      pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 3));
      pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 3));
      const p = progress;

      // which two flowers we are between, and how far
      let k = 0;
      while (k < STOPS.length - 1 && p > STOPS[k + 1]) k++;
      const t = p <= STOPS[0] ? 0 : k >= STOPS.length - 1 ? 1 : smooth(STOPS[k], STOPS[k + 1], p);
      const a = KINDS[k], b = KINDS[Math.min(KINDS.length - 1, k + 1)];
      const flower = blend(a, b, k >= STOPS.length - 1 ? 0 : t);

      // bud → open with the first scroll (it starts unfurling on its own); then each change of kind
      // eases the flower half-closed and lets it reopen as the next one
      const draw = smooth(0, 2.4, time);
      const intro = smooth(1.2, 4.2, time) * 0.35;
      const first = Math.max(intro, smooth(0, STOPS[0], p));
      const dip = p > STOPS[0] && k < STOPS.length - 1 ? Math.sin(Math.PI * t) * 0.32 : 0;
      const open = Math.min(first, 1) * (1 - dip);

      const W = w * dpr, H = h * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = mobile ? Math.min(w * 0.3, h * 0.33) : Math.min(w * 0.17, h * 0.27);
      drawFlower(ctx, {
        f: flower,
        open,
        time,
        cx: mobile ? w / 2 : w * 0.67 + pointer.sx * 10,
        cy: mobile ? h * 0.46 : h * 0.47 + pointer.sy * 8,
        r,
        elev: 0.6 + 0.25 * open - pointer.sy * 0.06 + Math.sin(time * 0.4) * 0.015,
        spin: p * 1.4 + time * 0.03 + pointer.sx * 0.15,
        draw,
        floor: h,
      });

      // the page breathes the same colour: a soft glow behind the flower over a barely tinted cream
      const st = stage.current!.style;
      st.setProperty("--hero-bg", css(flower.bg));
      st.setProperty("--hero-glow", css(flower.glow));

      chapters.current.forEach((node, i) => {
        if (!node) return;
        const [a, b] = CHAPTERS[i];
        const enter = i === 0 ? 1 : smooth(a, a + 0.05, p);
        const exit = i === CHAPTERS.length - 1 ? 0 : smooth(b - 0.05, b, p);
        const o = enter * (1 - exit);
        node.style.opacity = String(o);
        node.style.transform = `translate3d(0, ${(1 - enter) * 28 - exit * 28}px, 0)`;
        node.style.pointerEvents = o > 0.6 ? "auto" : "none";
      });
      const idx = CHAPTERS.findIndex(([, b]) => p < b);
      if (counter.current) counter.current.textContent = String(Math.max(0, idx) + 1).padStart(2, "0");
      if (bar.current) bar.current.style.transform = `scaleY(${p})`;
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  const ref = (i: number) => (n: HTMLDivElement | null) => {
    chapters.current[i] = n;
  };

  return (
    <section ref={section} className="relative h-[560vh]" aria-label="Manolia — The Floral Boutique">
      <div
        ref={stage}
        className="hero-stage sticky top-0 h-svh w-full overflow-hidden"
        style={{ "--hero-bg": "#f4ece6", "--hero-glow": "#f6dcd8" } as React.CSSProperties}
      >
        {/* phone: the drawing gets its own band under the header; desktop: full bleed behind the copy */}
        <canvas ref={canvas} className="absolute inset-x-0 top-16 h-[min(50svh,calc(100svh-24rem))] w-full md:inset-0 md:h-full" />


        {/* phone: copy starts right under the flower band; desktop: vertically centred on the left */}
        <div className="absolute inset-x-0 bottom-0 top-[calc(5rem+min(50svh,100svh-24rem))] z-10 mx-auto max-w-[1400px] px-6 md:inset-0 md:flex md:items-center md:px-12">
          <div className="relative w-full max-w-[34rem]">
            <Chapter refCb={ref(0)}>
              <p className="eyebrow">Floral design · Weddings · Events</p>
              <h1 className="mt-5 font-display text-[clamp(3.4rem,11vw,9.5rem)] leading-[0.82] tracking-[-0.02em] text-forest">Manolia</h1>
              <p className="font-script mt-1 text-[clamp(1.6rem,3.4vw,2.8rem)] text-forest/80">The Floral Boutique</p>
              <p className="mt-4 max-w-sm text-[0.92rem] leading-relaxed text-ink/70 md:mt-6 md:text-[0.95rem]">
                Flowers composed by hand in the old town of Jbeil, Byblos.
              </p>
              <ScrollCue />
            </Chapter>

            <Chapter refCb={ref(1)}>
              <p className="eyebrow">Jbeil · Byblos</p>
              <h2 className="chapter-title">Rooted in one of the oldest cities on earth.</h2>
              <p className="chapter-body">
                A few steps from Nobilis Center, between old stone walls and the sea, we build every arrangement the way Byblos was built: slowly, by hand, one stem at a time.
              </p>
            </Chapter>

            <Chapter refCb={ref(2)}>
              <p className="eyebrow">Weddings &amp; events</p>
              <h2 className="chapter-title">We dress the whole room, not only the table.</h2>
              <p className="chapter-body">
                Long candlelit tables in stone courtyards, clouds of gypsophila, blue evenings by the water. We design, deliver and install, then quietly leave the room to you.
              </p>
            </Chapter>

            <Chapter refCb={ref(3)}>
              <p className="eyebrow">Fresh every morning</p>
              <h2 className="chapter-title">Every season brings its own colours.</h2>
              <p className="chapter-body">
                Garden roses, peonies, hydrangea, lilies: we work with what is at its best this week, and tie every bouquet to order. Tell us who it&apos;s for and we&apos;ll choose the stems that suit them.
              </p>
            </Chapter>

            <Chapter refCb={ref(4)}>
              <p className="eyebrow">Visit the boutique</p>
              <h2 className="chapter-title">Come in and smell them.</h2>
              <p className="chapter-body">{SITE.address}</p>
              <div className="mt-6 flex flex-wrap gap-2.5 md:mt-8 md:gap-3">
                <Link href="/shop" className="btn-primary">
                  Shop bouquets
                </Link>
                <a href={waLink("Hello Manolia! I'd like to ask about flowers.")} target="_blank" rel="noreferrer" className="btn-ghost">
                  WhatsApp us
                </a>
              </div>
            </Chapter>
          </div>
        </div>

        {/* chapter index */}
        <div className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 items-center gap-4 md:flex md:right-10">
          <span className="font-display text-sm tabular-nums text-forest/70">
            <span ref={counter}>01</span> / 05
          </span>
          <div className="h-28 w-px overflow-hidden bg-forest/15">
            <div ref={bar} className="h-full w-full origin-top bg-forest/70" style={{ transform: "scaleY(0)" }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Chapter({ refCb, children }: { refCb: (n: HTMLDivElement | null) => void; children: React.ReactNode }) {
  return (
    <div ref={refCb} className="absolute left-0 top-0 w-full opacity-0 will-change-transform">
      <div className="md:-translate-y-1/2">{children}</div>
    </div>
  );
}

function ScrollCue() {
  return (
    <div className="mt-7 flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.3em] text-forest/60 md:mt-12">
      <span className="relative block h-10 w-px overflow-hidden bg-forest/15">
        <span className="absolute inset-x-0 top-0 block h-1/2 animate-[cue_2.4s_ease-in-out_infinite] bg-forest/70" />
      </span>
      Scroll — watch it bloom
    </div>
  );
}
