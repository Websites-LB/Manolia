"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Engraving } from "@/components/art/engraving";
import { Photo } from "@/components/art/photo";
import { Magnetic } from "@/components/motion/magnetic";
import { SplitWords } from "@/components/motion/split-words";
import { usd } from "@/lib/cart-store";
import { buildRoots, type Crown, type RootSystem } from "@/lib/botanic/roots";
import { buildSpecimen, SPECIMEN_VIEW, type Kind } from "@/lib/botanic/specimen";
import type { Pt } from "@/lib/botanic/geometry";
import { BLOOMS, type Bloom } from "@/lib/garden";
import { stemPhoto } from "@/lib/photos";
import { PRODUCTS } from "@/lib/products";
import { SITE, waLink } from "@/lib/site";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.mapsQuery)}`;

/* ───────────────────────── the roots ───────────────────────── */

/** Where the growing tip sits in the viewport while you scroll (0 = top, 1 = bottom). */
const TIP = 0.62;
/** Root colours: bark in shadow, the body, the lit side, and the pale young threads. */
const ROOT = { shade: "#050a07", body: "#a5805c", body2: "#9a7654", lit: "#e3cfa9", fine: "#c4a985" };
/** the root only waits for the bouquet to finish drawing the first time it is threaded */
let seen = false;

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

    // On arrival the root pushes out of the bouquet's stems to the foot of the first screen by itself;
    // after that its tip sits at a fixed height in the viewport, so it grows exactly as fast as you scroll.
    const start = sys.main[0].y0;
    const intro = { y: start };
    const grow = () => {
      const y = Math.max(intro.y, window.innerHeight * TIP - root.getBoundingClientRect().top);
      segs.forEach((p, i) => {
        const m = sys.main[Math.floor(i / 3)];
        write(p, lastSeg, i, (y - m.y0) / (m.y1 - m.y0 || 1));
      });
      lat.forEach((p, i) => {
        const r = sys.lateral[i];
        write(p, lastLat, i, (y - r.y0) / (r.y1 - r.y0 + 60));
      });
    };
    const tween = gsap.to(intro, { y: Math.max(start, window.innerHeight + 40), duration: 3.2, delay: seen ? 0 : 3.1, ease: "expo.out", onUpdate: grow });
    seen = true;
    const st = ScrollTrigger.create({ trigger: root, start: "top bottom", end: "bottom top", onUpdate: grow, onRefresh: grow });
    grow();
    return () => {
      tween.kill();
      st.kill();
    };
  }, [sys]);

  const dash = { pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 };
  return (
    <svg ref={svg} width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="pointer-events-none absolute left-0 top-0 z-[1]" aria-hidden>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {sys.lateral.map((r, i) => (
          <path key={i} className="rt-lat" d={r.d} stroke={r.w > 1.6 ? ROOT.body : ROOT.fine} strokeWidth={r.w} strokeOpacity={r.o} {...dash} />
        ))}
        {sys.main.map((m, i) => [
          // the shadow the root casts on the ground behind it, then its body, then its lit side
          <path key={`s${i}`} className="rt-seg" d={m.d} stroke={ROOT.shade} strokeWidth={m.w + 3} strokeOpacity={0.5} transform="translate(2.5 4)" {...dash} />,
          <path key={`m${i}`} className="rt-seg" d={m.d} stroke={i % 3 === 1 ? ROOT.body2 : ROOT.body} strokeWidth={m.w} {...dash} />,
          <path key={`l${i}`} className="rt-seg" d={m.lit} stroke={ROOT.lit} strokeWidth={Math.max(0.8, m.w * 0.28)} strokeOpacity={0.75} {...dash} />,
        ])}
      </g>
    </svg>
  );
}

/* ───────────────────────── a plant on the root ───────────────────────── */

function Plant({ kind, tint, seed, label, className }: { kind: Kind; tint: string; seed: number; label: string; className?: string }) {
  const photo = stemPhoto(kind);
  // a plant with a photograph is shown as one; the painted specimen is only built when there is none
  const pieces = useCallback(() => (photo ? [] : buildSpecimen(kind, tint, seed)), [kind, tint, seed, photo]);
  return (
    <div className={cn("relative", className)} style={{ aspectRatio: `${SPECIMEN_VIEW.w} / ${SPECIMEN_VIEW.h}` }}>
      <div className="absolute inset-[-30%] -z-10" style={{ background: `radial-gradient(closest-side, ${tint}2a, transparent)` }} />
      {photo ? (
        <Photo src={photo} alt={label} width={800} height={1280} sizes="(min-width: 768px) 30vw, 64vw" arrive="grow" />
      ) : (
        <Engraving pieces={pieces} view={SPECIMEN_VIEW} mode="view" label={label} className="h-full w-full" />
      )}
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
    <Station side={i % 2 ? "right" : "left"} plant={<Plant kind={b.kind} tint={b.tint} seed={i * 7 + 3} label={b.name.replace(/\*/g, "")} className="w-[min(64vw,300px)] md:w-[min(30vw,440px)]" />}>
      <p className="font-serif text-[19px] italic text-blush">{b.latin}</p>
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
          <Link href={`/shop/build?flower=${b.kind}`} data-cursor="Compose" className="label rounded-full border border-line/20 px-4 py-2.5 text-line/80 transition-colors duration-500 hover:border-blush hover:text-blush">
            Compose a bouquet with it →
          </Link>
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
  ["Choose", "Pick a bouquet in the shop, compose your own stem by stem, or tell us the occasion and let us choose."],
  ["Write the card", "Tell us who it is for, when, and what to say. We write it by hand."],
  ["Pay and follow it", "Pay by Whish or card. The boutique gets your order at once, and you watch it go from accepted to delivered."],
];

/**
 * The hero (passed in as children) and everything below it are one long illustrated plate. A root
 * leaves the bouquet's stems and grows down with your scroll;
 * every flower we work with sprouts from it with its name and story, and the practical things —
 * weddings, ordering, the boutique — hang off the same root, ending where you can visit.
 */
export function Garden({ children }: { children?: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<{ w: number; h: number; anchors: Pt[]; crowns: Crown[]; narrow: boolean } | null>(null);

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
      // Walk the markers in page order and route the root: it leaves the bouquet's stems in the hero,
      // runs down the outer edge beside each flower, turns in under the stem, and crosses to the other
      // side only in the gaps between sections. `data-via` markers are plain waypoints.
      const W = r.width;
      const narrow = W < 768;
      const edge = W - 14;
      const anchors: Pt[] = [];
      const crowns: Crown[] = [];
      let gapY = -1;
      const marks = Array.from(el.querySelectorAll<HTMLElement>("[data-anchor], [data-gap], [data-via]")).filter((m) => m.getClientRects().length);
      const plants = marks.filter((m) => m.hasAttribute("data-anchor"));
      marks.forEach((m) => {
        const p = at(m);
        if (m.hasAttribute("data-gap")) return void (gapY = p[1]);
        if (m.hasAttribute("data-via")) return void anchors.push(p);
        const k = plants.indexOf(m);
        const last = k === plants.length - 1;
        if (k === 0) {
          const spread = Number(m.dataset.spread ?? 0) * (m.parentElement?.getBoundingClientRect().width ?? 0);
          crowns.push({ at: p, spread });
          return void anchors.push(p);
        }
        if (!last) crowns.push({ at: p });
        if (narrow) {
          // one column: the root runs down the right edge and reaches in under each stem
          if (last) return void anchors.push([edge, p[1] - 80], p);
          return void anchors.push([edge, p[1] - 40], p, [edge, p[1] + 50]);
        }
        const prev = anchors[anchors.length - 1];
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
    <div ref={box} className="relative">
      {children}
      <section id="garden" className="relative overflow-hidden text-line" style={{ background: "linear-gradient(#13241a, #101d15 30%, #0d1711 70%, #0b140f)" }}>
      {/* the root leaves the hero and swings out to the side, clear of the words */}
      <div className="gutter relative z-10 flex flex-col items-center pb-[12vh] pt-[22vh] text-center">
        <span data-via className="absolute left-[12%] top-[19vh] hidden h-px w-px md:block" />
        <p className="label text-line/45">The garden</p>
        <SplitWords text={"Every bouquet starts\n*underground.*"} className="display mt-6 text-[clamp(52px,7.6vw,140px)] text-paper" />
        <p className="mt-8 max-w-[46ch] text-[15px] leading-relaxed text-line/60">
          Follow the root down. Every flower we tie grows somewhere along it — its name, its season, what it means and the bouquets it ends up in.
        </p>
      </div>

      {BLOOMS.map((b, i) => (
        <BloomStation key={b.id} b={b} i={i} />
      ))}

      {/* weddings: the gypsophila cloud */}
      <Station
        side="left"
        plant={<Plant kind="gypsophila" tint="#f3eadb" seed={77} label="Baby's breath" className="w-[min(64vw,300px)] md:w-[min(30vw,440px)]" />}
      >
        <p className="font-serif text-[19px] italic text-blush">Gypsophila paniculata</p>
        <Name text="Weddings & *events*" className="mt-4" />
        <ul className="mt-8 border-t border-line/12">
          {SERVICES.map(([t, d]) => (
            <li key={t} className="border-b border-line/12 py-4">
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
      <Station side="right" plant={<Plant kind="eucalyptus" tint="#8fb08a" seed={91} label="Eucalyptus" className="w-[min(64vw,300px)] md:w-[min(30vw,440px)]" />}>
        <p className="label text-line/45">How to order</p>
        <Name text="Three steps, *no phone call.*" className="mt-4 !text-[clamp(56px,7vw,124px)]" />
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
        <p className="label text-line/45">Visit the boutique</p>
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
      {sys && geo && <Roots sys={sys} w={geo.w} h={geo.h} />}
    </div>
  );
}
