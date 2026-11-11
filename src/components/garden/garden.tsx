"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Engraving } from "@/components/art/engraving";
import { Magnetic } from "@/components/motion/magnetic";
import { SplitWords } from "@/components/motion/split-words";
import { usd } from "@/lib/cart-store";
import { buildRoots, type RootSystem } from "@/lib/botanic/roots";
import { buildSpecimen, SPECIMEN_VIEW, type Kind } from "@/lib/botanic/specimen";
import type { Pt } from "@/lib/botanic/geometry";
import { BLOOMS, type Bloom } from "@/lib/garden";
import { PRODUCTS } from "@/lib/products";
import { SITE, waLink } from "@/lib/site";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.mapsQuery)}`;

/* ───────────────────────── the roots ───────────────────────── */

/** Where the growing tip sits in the viewport while you scroll (0 = top, 1 = bottom). */
const TIP = 0.62;

function Roots({ sys, w, h }: { sys: RootSystem; w: number; h: number }) {
  const svg = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const root = svg.current;
    if (!root) return;
    const segs = Array.from(root.querySelectorAll<SVGPathElement>(".rt-seg"));
    const lat = Array.from(root.querySelectorAll<SVGPathElement>(".rt-lat"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      [...segs, ...lat].forEach((p) => (p.style.strokeDashoffset = "0"));
      return;
    }
    // only write a path when its value actually changes: grown and ungrown pieces stay untouched
    const lastSeg = new Float32Array(segs.length).fill(-1);
    const lastLat = new Float32Array(lat.length).fill(-1);
    const write = (p: SVGPathElement, cache: Float32Array, i: number, v: number) => {
      const q = Math.round(Math.max(0, Math.min(1, v)) * 200) / 200;
      if (q === cache[i]) return;
      cache[i] = q;
      p.style.strokeDashoffset = `${1 - q}`;
    };

    // the tip sits at a fixed height in the viewport, so the root grows exactly as fast as you scroll
    const grow = () => {
      const y = window.innerHeight * TIP - root.getBoundingClientRect().top;
      segs.forEach((p, i) => {
        const m = sys.main[i >> 1];
        write(p, lastSeg, i, (y - m.y0) / (m.y1 - m.y0 || 1));
      });
      lat.forEach((p, i) => {
        const r = sys.lateral[i];
        write(p, lastLat, i, (y - r.y0) / (r.y1 - r.y0 + 120));
      });
    };
    const st = ScrollTrigger.create({ trigger: root, start: "top bottom", end: "bottom top", onUpdate: grow, onRefresh: grow });
    grow();
    return () => st.kill();
  }, [sys]);

  return (
    <svg ref={svg} width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="pointer-events-none absolute left-0 top-0" aria-hidden>
      <g fill="none" stroke="#efe6d2" strokeLinecap="round" strokeLinejoin="round">
        {sys.lateral.map((r, i) => (
          <path key={i} className="rt-lat" d={r.d} strokeWidth={r.w} strokeOpacity={r.o * 0.8} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} />
        ))}
        {sys.main.map((m, i) => [
          <path key={`e${i}`} className="rt-seg" d={m.echo} strokeWidth={1} strokeOpacity={0.4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} />,
          <path key={`m${i}`} className="rt-seg" d={m.d} strokeWidth={2.2} strokeOpacity={0.9} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} />,
        ])}
      </g>
    </svg>
  );
}

/* ───────────────────────── a plant on the root ───────────────────────── */

function Plant({ kind, tint, seed, label, className }: { kind: Kind; tint: string; seed: number; label: string; className?: string }) {
  return (
    <div className={cn("relative", className)} style={{ aspectRatio: `${SPECIMEN_VIEW.w} / ${SPECIMEN_VIEW.h}` }}>
      <div className="absolute inset-[-30%] -z-10" style={{ background: `radial-gradient(closest-side, ${tint}2a, transparent)` }} />
      <Engraving build={() => buildSpecimen(kind, tint, seed)} view={SPECIMEN_VIEW} mode="view" pace={0.35} label={label} className="h-full w-full" />
      {/* the root meets the stem exactly here */}
      <span data-anchor className="absolute bottom-0 left-1/2 h-px w-px" />
    </div>
  );
}

function Name({ text, className }: { text: string; className?: string }) {
  return <SplitWords text={text} stagger={0.05} className={cn("display text-[clamp(64px,10vw,184px)] text-paper", className)} />;
}

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="mt-8 border-t border-line/12">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-4 border-b border-line/12 py-3">
          <dt className="label text-line/40">{k}</dt>
          <dd className="text-[14px] text-line/80">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Station({ side, plant, children }: { side: "left" | "right"; plant: ReactNode; children: ReactNode }) {
  return (
    <div className="gutter relative grid min-h-[100svh] items-center gap-6 py-[12vh] md:grid-cols-2 md:gap-[6vw]">
      <span data-gap className="absolute left-0 top-[5vh] h-px w-px" />
      <div className={cn("relative z-10 flex justify-center", side === "right" && "md:order-2")}>{plant}</div>
      <div className={cn("relative z-10 max-w-[560px]", side === "right" ? "md:justify-self-end" : "md:justify-self-start")}>{children}</div>
    </div>
  );
}

function BloomStation({ b, i }: { b: Bloom; i: number }) {
  const items = b.in.map((id) => PRODUCTS.find((p) => p.id === id)!).filter(Boolean);
  return (
    <Station side={i % 2 ? "right" : "left"} plant={<Plant kind={b.kind} tint={b.tint} seed={i * 7 + 3} label={`${b.name.replace(/\*/g, "")}, engraved`} className="w-[min(64vw,300px)] md:w-[min(30vw,440px)]" />}>
      <p className="label text-line/45">
        N°{String(i + 1).padStart(2, "0")} — <em className="font-serif text-[15px] normal-case tracking-normal text-blush">{b.latin}</em>
      </p>
      <Name text={b.name} className="mt-4" />
      <p className="mt-6 max-w-[44ch] text-[16px] leading-relaxed text-line/70">{b.line}</p>
      <Facts
        rows={[
          ["Season", b.season],
          ["Meaning", b.meaning],
          ["Colours", b.colours],
        ]}
      />
      <div className="mt-7 flex flex-wrap gap-2">
        {items.length ? (
          items.map((p) => (
            <Link key={p.id} href="/shop" data-cursor="Shop" className="label rounded-full border border-line/20 px-4 py-2.5 text-line/80 transition-colors duration-500 hover:border-blush hover:text-blush">
              {p.name} · {usd(p.price)} →
            </Link>
          ))
        ) : (
          <a
            href={waLink(`Hello Manolia! Do you have ${b.name.replace(/\*/g, "").toLowerCase()} at the moment?`)}
            target="_blank"
            rel="noreferrer"
            data-cursor="Ask"
            className="label rounded-full border border-line/20 px-4 py-2.5 text-line/80 transition-colors duration-500 hover:border-blush hover:text-blush"
          >
            In season? Ask on WhatsApp →
          </a>
        )}
      </div>
    </Station>
  );
}

/* ───────────────────────── the whole garden ───────────────────────── */

const SERVICES = [
  ["Weddings", "Bridal bouquets, ceremony arches, aisles and long tables, from first sketch to last candle."],
  ["Events", "Engagements, christenings, launches and dinners. We design, deliver and install."],
  ["Table design", "Gypsophila clouds, low runners and candlelight, composed for the way people actually sit and talk."],
];
const STEPS = [
  ["Choose", "Pick a bouquet in the shop, or ask for something bespoke in your colours."],
  ["Write the card", "Tell us who it is for, when, and what to say. We write it by hand."],
  ["Send on WhatsApp", "Your order arrives as a message. We confirm stems, delivery and payment with you."],
];

/**
 * Below the hero the page becomes one long illustrated plate. A root grows down with your scroll;
 * every flower we work with sprouts from it with its name and story, and the practical things —
 * weddings, ordering, the boutique — hang off the same root, ending where you can visit.
 */
export function Garden() {
  const box = useRef<HTMLElement>(null);
  const [geo, setGeo] = useState<{ w: number; h: number; anchors: Pt[]; crowns: Pt[]; narrow: boolean } | null>(null);

  // measure where each flower's stem meets the ground, and re-thread the root when the layout changes
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const at = (a: Element): Pt => {
        const q = a.getBoundingClientRect();
        return [q.left - r.left, q.top - r.top];
      };
      // Walk the markers in page order and route the root: it runs down the outer edge beside each
      // flower, turns in under the stem, and crosses to the other side only in the gaps between sections.
      const W = r.width;
      const narrow = W < 768;
      const anchors: Pt[] = [];
      const crowns: Pt[] = [];
      let gapY = -1;
      const marks = Array.from(el.querySelectorAll<HTMLElement>("[data-anchor], [data-gap]"));
      marks.forEach((m, i) => {
        const p = at(m);
        if (m.hasAttribute("data-gap")) return void (gapY = p[1]);
        const prev = anchors[anchors.length - 1];
        if (!prev) return void anchors.push(narrow ? [W - 14, p[1]] : p);
        const last = i === marks.length - 1;
        if (!last) crowns.push(p);
        if (narrow) {
          // one column: the root runs down the right edge and reaches in under each stem
          const edge = W - 14;
          if (last) return void anchors.push([edge, p[1] - 80], p);
          return void anchors.push([edge, p[1] - 40], p, [edge, p[1] + 50]);
        }
        const s = p[0] < W / 2 ? -1 : 1;
        const outer = Math.max(24, Math.min(W - 24, p[0] + s * Math.min(170, W * 0.12)));
        if (gapY > prev[1]) anchors.push([prev[0], gapY - 40], [last ? p[0] : outer, gapY + 60]);
        if (!last) anchors.push([outer, p[1] - 14]);
        anchors.push(p);
        if (!last) anchors.push([p[0] + s * 14, p[1] + 110]);
      });
      const w = Math.round(r.width);
      const h = Math.round(el.scrollHeight);
      setGeo((g) =>
        g && g.w === w && g.h === h && g.anchors.length === anchors.length && g.anchors.every((p, i) => Math.abs(p[1] - anchors[i][1]) < 2) ? g : { w, h, anchors, crowns, narrow },
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

  const sys = useMemo(() => (geo && geo.anchors.length > 1 ? buildRoots(geo.anchors, geo.w, { crowns: geo.crowns, narrow: geo.narrow }) : null), [geo]);

  useLayoutEffect(() => {
    if (sys) ScrollTrigger.refresh();
  }, [sys]);

  return (
    <section ref={box} id="garden" className="relative overflow-hidden text-line" style={{ background: "linear-gradient(#13241a, #101d15 30%, #0d1711 70%, #0b140f)" }}>
      {sys && geo && <Roots sys={sys} w={geo.w} h={geo.h} />}

      {/* where the root breaks ground */}
      <div className="gutter relative z-10 flex flex-col items-center pb-[12vh] pt-[18vh] text-center">
        <p className="label text-line/45">(01) — The garden</p>
        <SplitWords text={"Every bouquet starts\n*underground.*"} className="display mt-6 text-[clamp(52px,7.6vw,140px)] text-paper" />
        <p className="mt-8 max-w-[46ch] text-[15px] leading-relaxed text-line/60">
          Follow the root down. Every flower we tie grows somewhere along it — its name, its season, what it means and the bouquets it ends up in.
        </p>
        <p className="label mt-10 text-line/40">Scroll ↓</p>
        <span data-anchor className="mt-10 h-px w-px" />
      </div>

      {BLOOMS.map((b, i) => (
        <BloomStation key={b.id} b={b} i={i} />
      ))}

      {/* weddings: the gypsophila cloud */}
      <Station
        side="left"
        plant={<Plant kind="gypsophila" tint="#f3eadb" seed={77} label="Baby's breath, engraved" className="w-[min(64vw,300px)] md:w-[min(30vw,440px)]" />}
      >
        <p className="label text-line/45">
          (02) — <em className="font-serif text-[15px] normal-case tracking-normal text-blush">Gypsophila paniculata</em>, the cloud over every long table
        </p>
        <Name text="Weddings & *events*" className="mt-4" />
        <ul className="mt-8 border-t border-line/12">
          {SERVICES.map(([t, d], k) => (
            <li key={t} className="grid grid-cols-[2.2rem_1fr] gap-x-3 border-b border-line/12 py-4">
              <span className="label pt-2 text-line/35">0{k + 1}</span>
              <div>
                <p className="display text-[34px] text-paper">{t}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-line/60">{d}</p>
              </div>
            </li>
          ))}
        </ul>
        <a
          href={waLink("Hello Manolia! We're planning a wedding and would love to talk flowers.")}
          target="_blank"
          rel="noreferrer"
          data-cursor="Write"
          className="pill mt-8 bg-paper text-night hover:bg-blush"
        >
          Plan a wedding <span aria-hidden>→</span>
        </a>
      </Station>

      {/* ordering: the eucalyptus branch */}
      <Station side="right" plant={<Plant kind="eucalyptus" tint="#8fb08a" seed={91} label="Eucalyptus, engraved" className="w-[min(64vw,300px)] md:w-[min(30vw,440px)]" />}>
        <p className="label text-line/45">(03) — How to order</p>
        <Name text="Three steps, *one message.*" className="mt-4 !text-[clamp(56px,7vw,124px)]" />
        <ol className="mt-8 space-y-6">
          {STEPS.map(([t, d], k) => (
            <li key={t} className="grid grid-cols-[3.2rem_1fr] items-baseline gap-3">
              <span className="display text-[56px] leading-none text-blush">{k + 1}</span>
              <div>
                <p className="display text-[30px] text-paper">{t}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-line/60">{d}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link href="/shop" data-cursor="Shop" className="pill mt-9 bg-paper text-night hover:bg-blush">
          Open the shop <span aria-hidden>→</span>
        </Link>
      </Station>

      {/* the root ends at the door */}
      <div className="gutter relative z-10 flex flex-col items-center pb-[16vh] pt-[10vh] text-center">
        <span data-gap className="h-px w-px" />
        <span data-anchor className="mb-14 mt-[8vh] h-px w-px" />
        <p className="label text-line/45">(04) — Visit the boutique</p>
        <SplitWords text={"Come in and\n*smell them.*"} stagger={0.08} className="display mt-6 text-[clamp(64px,12vw,220px)] leading-[0.84] text-paper" />
        <div className="mt-14 grid w-full max-w-4xl items-center gap-10 md:grid-cols-[1fr_auto_1fr]">
          <div className="md:text-right">
            <p className="label text-line/40">Address</p>
            <p className="mt-2 text-[16px] text-line/85">{SITE.address}</p>
            <a href={MAPS} target="_blank" rel="noreferrer" className="label link-u mt-3 inline-block text-line/60">
              Open in Maps ↗
            </a>
          </div>
          <Magnetic strength={0.4} className="justify-self-center">
            <a
              href={waLink("Hello Manolia!")}
              target="_blank"
              rel="noreferrer"
              data-cursor="Write"
              className="flex h-44 w-44 flex-col items-center justify-center rounded-full bg-blush text-night transition-colors duration-700 hover:bg-paper md:h-52 md:w-52"
            >
              <span className="display text-[36px]">
                Message <em>us</em>
              </span>
              <span className="label mt-2 text-night/60">on WhatsApp</span>
            </a>
          </Magnetic>
          <div className="md:text-left">
            <p className="label text-line/40">Write to us</p>
            <p className="mt-2 text-[16px] text-line/85">{SITE.whatsappDisplay}</p>
            <a href={SITE.instagram} target="_blank" rel="noreferrer" className="label link-u mt-3 inline-block text-line/60">
              {SITE.instagramHandle} ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
