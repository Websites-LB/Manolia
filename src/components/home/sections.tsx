import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { ProductCard } from "@/components/shop/product-card";
import { Reveal } from "@/components/site/reveal";
import { PRODUCTS } from "@/lib/products";
import { SITE, waLink } from "@/lib/site";

const SERVICES = [
  {
    title: "Weddings",
    body: "Bridal bouquets, ceremony arches and long tables dressed in white. One team from first sketch to the last candle.",
    ask: "Hello Manolia! We're planning a wedding and would love to talk flowers.",
  },
  {
    title: "Events",
    body: "Engagements, christenings, launches and private dinners: blue evenings, golden hours, whatever the room asks for.",
    ask: "Hello Manolia! I'd like to ask about flowers for an event.",
  },
  {
    title: "Bouquets & boxes",
    body: "Hand-tied every morning and wrapped in kraft and silk, or set in our keepsake hat boxes.",
    href: "/shop",
  },
  {
    title: "Table design",
    body: "Gypsophila clouds, low runners, pleated lamps and candlelight. Centrepieces composed for the way people actually sit and talk.",
    ask: "Hello Manolia! I'd like to ask about table design.",
  },
];

export function Services() {
  return (
    <section className="relative z-10 bg-cream px-6 py-28 md:px-12 md:py-40">
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="grid gap-6 md:grid-cols-[1fr_1.4fr] md:items-end">
          <div>
            <p className="eyebrow">What we make</p>
            <h2 className="chapter-title">A floral atelier, for every kind of day.</h2>
          </div>
          <p className="chapter-body md:justify-self-end">
            Everything is designed and made in our Jbeil studio: the everyday bouquet and the wedding of a lifetime get the same patience.
          </p>
        </Reveal>

        <ul className="mt-20 border-t hairline">
          {SERVICES.map((s, i) => {
            const href = s.href ?? waLink(s.ask);
            const external = !s.href;
            return (
              <li key={s.title} className="border-b hairline">
                <Reveal delay={i * 0.06}>
                  <Link
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                    className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-4 gap-y-3 py-9 transition-colors duration-500 hover:bg-forest/[0.03] md:grid-cols-[5rem_1fr_1.1fr_auto] md:gap-8 md:px-4"
                  >
                    <span className="col-start-1 row-start-1 font-display text-sm tabular-nums text-forest/50">0{i + 1}</span>
                    <span className="col-start-2 row-start-1 font-display text-4xl text-forest transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-2 md:text-6xl">
                      {s.title}
                    </span>
                    <span className="col-span-2 col-start-2 row-start-2 max-w-md text-[0.95rem] leading-relaxed text-ink/65 md:col-span-1 md:col-start-3 md:row-start-1">{s.body}</span>
                    <ArrowUpRight
                      className="col-start-3 row-start-1 h-5 w-5 self-center text-forest/40 transition-all duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-forest md:col-start-4"
                      strokeWidth={1.2}
                    />
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function Signatures() {
  const picks = ["jbeil-morning", "velvet-box", "maison"].map((id) => PRODUCTS.find((p) => p.id === id)!);
  return (
    <section className="relative z-10 bg-paper px-6 py-28 md:px-12 md:py-36">
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Signature pieces</p>
            <h2 className="chapter-title">Tied this morning.</h2>
          </div>
          <Link href="/shop" className="btn-ghost self-start md:self-auto">
            See the whole shop
          </Link>
        </Reveal>
        <div className="mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEMS = ["Garden roses", "Peonies", "Hydrangea", "Gypsophila", "Eucalyptus", "Ranunculus", "Lisianthus", "Tulips"];

export function StemsBand() {
  return (
    <section className="relative z-10 overflow-hidden bg-forest py-20 text-cream md:py-28">
      <Reveal className="mx-auto max-w-[1400px] px-6 text-center md:px-12">
        <p className="font-script text-5xl text-cream/90 md:text-7xl">every stem chosen by hand</p>
      </Reveal>
      <div className="mt-14 flex w-max animate-[drift_60s_linear_infinite] gap-14 whitespace-nowrap font-display text-3xl italic text-cream/35 md:text-5xl" aria-hidden>
        {[...STEMS, ...STEMS, ...STEMS].map((s, i) => (
          <span key={i} className="flex items-center gap-14">
            {s}
            <span className="text-base not-italic text-gold/60">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}

export function Visit() {
  return (
    <section className="relative z-10 bg-cream px-6 py-28 md:px-12 md:py-36">
      <div className="mx-auto grid max-w-[1400px] gap-14 md:grid-cols-[1fr_1.25fr] md:items-center">
        <Reveal>
          <p className="eyebrow">The boutique</p>
          <h2 className="chapter-title">Near Nobilis Center, in the heart of Jbeil.</h2>
          <p className="chapter-body">
            Come in to choose your stems, talk through a wedding over coffee, or simply to smell the roses. If you&apos;re planning a visit, send us a message first and we&apos;ll have the kettle on.
          </p>
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t hairline pt-8 text-sm">
            <div>
              <dt className="eyebrow">Address</dt>
              <dd className="mt-2 leading-relaxed text-ink/75">{SITE.address}</dd>
            </div>
            <div>
              <dt className="eyebrow">WhatsApp</dt>
              <dd className="mt-2">
                <a className="text-ink/75 underline-offset-4 hover:underline" href={waLink()} target="_blank" rel="noreferrer">
                  {SITE.whatsappDisplay}
                </a>
              </dd>
            </div>
          </dl>
          <div className="mt-10 flex flex-wrap gap-3">
            <a className="btn-primary" href={waLink("Hello Manolia! I'd like to visit the boutique.")} target="_blank" rel="noreferrer">
              Message us
            </a>
            <a className="btn-ghost" href={SITE.instagram} target="_blank" rel="noreferrer">
              {SITE.instagramHandle}
            </a>
          </div>
        </Reveal>
        <Reveal delay={0.1} className="relative aspect-[4/3.4] overflow-hidden rounded-[1.75rem] bg-stone">
          <iframe
            title="Manolia on the map"
            src={`https://www.google.com/maps?q=${encodeURIComponent(SITE.mapsQuery)}&z=16&output=embed`}
            className="absolute inset-0 h-full w-full [filter:grayscale(1)_sepia(0.25)_contrast(0.92)_brightness(1.04)]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-forest/10" />
        </Reveal>
      </div>
    </section>
  );
}
