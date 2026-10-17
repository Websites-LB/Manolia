"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { WaterLily } from "@/lib/flora/lily";
import { createMotes, createRenderer, createStage, loadEnvironment } from "@/lib/flora/stage";
import { SITE, waLink } from "@/lib/site";

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = THREE.MathUtils.lerp;

/** [start, end] of each chapter as a fraction of the pinned scroll. */
const CHAPTERS: [number, number][] = [
  [0, 0.13],
  [0.17, 0.36],
  [0.4, 0.58],
  [0.62, 0.79],
  [0.84, 1.01],
];
/** The flower changes colour in the quiet gap between two chapters. */
const TURNS = CHAPTERS.slice(1).map(([a], i) => (CHAPTERS[i][1] + a) / 2);

/**
 * One palette per chapter. The petal colours are true to real water lilies; the page only borrows a
 * whisper of each (glow/bg stay within a few percent of the house cream) so it reads as light, not paint.
 */
const PALETTES = [
  { tip: "#e27a98", base: "#fff3f2", glow: "#f6dde2", bg: "#f4ece8" }, // blush
  { tip: "#ef9467", base: "#fff2e4", glow: "#f8e2d0", bg: "#f5ede3" }, // peach
  { tip: "#ecbd3f", base: "#fffae6", glow: "#f5ebc7", bg: "#f4efe0" }, // butter
  { tip: "#b48ad2", base: "#fbf5ff", glow: "#ebe1f2", bg: "#f2ecee" }, // lilac
  { tip: "#d9607d", base: "#fff1f1", glow: "#f4d9df", bg: "#f3ede3" }, // rose, settling back to house cream
].map((p) => ({
  tip: new THREE.Color(p.tip),
  base: new THREE.Color(p.base),
  glow: new THREE.Color(p.glow),
  bg: new THREE.Color(p.bg),
}));

export function HeroBloom() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const chapters = useRef<(HTMLDivElement | null)[]>([]);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = canvas.current!;
    const renderer = createRenderer(el, { alpha: true });
    renderer.setClearColor(0x000000, 0);
    const { scene, key } = createStage(null);
    key.shadow.camera.left = key.shadow.camera.bottom = -0.35;
    key.shadow.camera.right = key.shadow.camera.top = 0.35;
    key.shadow.camera.updateProjectionMatrix();
    const motes = createMotes(90);
    motes.scale.setScalar(0.35);
    motes.position.set(0, -0.05, 0);
    scene.add(motes);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.02, 10);
    const lily = new WaterLily();
    scene.add(lily.root);

    const clock = new THREE.Clock();
    let disposed = false;
    let loadedAt = -1;
    loadEnvironment(renderer)
      .then((env) => {
        if (disposed) return;
        scene.environment = env;
        scene.environmentIntensity = 0.6;
      })
      .catch((e) => console.error("[hero] light map failed to load", e))
      .finally(() => {
        if (disposed) return;
        loadedAt = clock.elapsedTime;
        setLoaded(true);
      });

    let w = 0, h = 0, mobile = false;
    const resize = () => {
      w = el.clientWidth;
      h = el.clientHeight;
      mobile = w < 768;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.75 : 1.75));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = mobile ? 34 : 30;
      // Desktop: the flower sits right of centre so the copy can breathe on the left.
      if (mobile) camera.clearViewOffset();
      else camera.setViewOffset(w, h, -w * 0.17, 0, w, h);
      camera.updateProjectionMatrix();
      (motes.material as THREE.ShaderMaterial).uniforms.uPixel.value = h * renderer.getPixelRatio() * 0.5;
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

    const tip = new THREE.Color(), base = new THREE.Color(), glow = new THREE.Color(), bg = new THREE.Color();
    const lookAt = new THREE.Vector3();
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      // real elapsed time, so scroll-follow keeps pace even when a slow device drops frames
      const dt = Math.min(clock.getDelta(), 0.5);
      const time = clock.elapsedTime;
      progress += (scrollProgress() - progress) * (1 - Math.exp(-dt * 5));
      pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 3));
      pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 3));
      const p = progress;

      // colour: drift to the next palette across each turn
      let k = 0;
      for (const c of TURNS) k += smooth(c - 0.045, c + 0.045, p);
      const i0 = Math.min(PALETTES.length - 1, Math.floor(k));
      const i1 = Math.min(PALETTES.length - 1, i0 + 1);
      const f = k - i0;
      tip.lerpColors(PALETTES[i0].tip, PALETTES[i1].tip, f);
      base.lerpColors(PALETTES[i0].base, PALETTES[i1].base, f);
      glow.lerpColors(PALETTES[i0].glow, PALETTES[i1].glow, f);
      bg.lerpColors(PALETTES[i0].bg, PALETTES[i1].bg, f);
      lily.setPalette(tip, base);

      // opening: a bud that unfurls on arrival, opens fully with the first scroll, then folds a little
      // and reopens at every turn — the moment its colour changes, like the time-lapse it's drawn from
      const intro = loadedAt < 0 ? 0 : smooth(0.2, 3.5, time - loadedAt);
      let fold = 0;
      for (const c of TURNS) fold = Math.max(fold, Math.exp(-Math.pow((p - c) / 0.04, 2)));
      const open = Math.max(0.28 * intro, smooth(0.0, 0.14, p)) * (1 - 0.42 * fold);
      lily.update(time, open);

      // camera: from water level, rising to look into the open flower
      const angle = lerp(-0.35, 0.4, p) + pointer.sx * 0.1 + Math.sin(time * 0.1) * 0.02;
      const elev = lerp(0.32, 0.72, smooth(0, 0.3, p)) - pointer.sy * 0.05;
      let radius: number;
      if (mobile) {
        const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        radius = Math.max(0.3 / (2 * t), 0.46 / (2 * t * camera.aspect));
      } else {
        radius = lerp(0.74, 0.84, p);
      }
      camera.position.set(Math.sin(angle) * Math.cos(elev) * radius, Math.sin(elev) * radius, Math.cos(angle) * Math.cos(elev) * radius);
      lookAt.set(0, 0.035 - 0.015 * smooth(0, 0.3, p), 0);
      camera.lookAt(lookAt);

      const mm = motes.material as THREE.ShaderMaterial;
      mm.uniforms.uTime.value = time;
      mm.uniforms.uOpacity.value = 0.35 + open * 0.4;

      renderer.render(scene, camera);

      // the page breathes the same colour: a soft glow behind the flower over a barely tinted cream
      const st = stage.current!.style;
      st.setProperty("--hero-bg", `#${bg.getHexString()}`);
      st.setProperty("--hero-glow", `#${glow.getHexString()}`);

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
    frame();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      lily.dispose();
      renderer.dispose();
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
        style={{ "--hero-bg": "#f4ece8", "--hero-glow": "#f6dde2" } as React.CSSProperties}
      >
        {/* phone: the flower gets its own band under the header; desktop: full bleed behind the copy */}
        <canvas ref={canvas} className="absolute inset-x-0 top-16 h-[min(50svh,calc(100svh-24rem))] w-full md:inset-0 md:h-full" />

        {/* veil while the studio loads */}
        <div
          className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-cream transition-opacity duration-[1400ms] ease-out ${loaded ? "opacity-0" : "opacity-100"}`}
        >
          <div className="text-center">
            <p className="font-display text-5xl text-forest">Manolia</p>
            <p className="font-script -mt-1 text-2xl text-forest/70">The Floral Boutique</p>
          </div>
        </div>

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
