"use client";

import NumberFlow from "@number-flow/react";
import { Check, Link2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { Engraving } from "@/components/art/engraving";
import { SplitWords } from "@/components/motion/split-words";
import { rng } from "@/lib/botanic/geometry";
import { bloom } from "@/lib/botanic/specimen";
import { usd, useCart } from "@/lib/cart-store";
import { FLOWERS, GREENS, MAX_PER_FLOWER, MAX_STEMS, MIN_STEMS, PALETTES, recipeCode, recipeKey, recipePrice, STARTER, stemCount, WRAPS, type Flower, type Recipe } from "@/lib/custom";
import { cn } from "@/lib/utils";

import { ProductImage } from "./product-image";

/** one head of each flower, drawn small beside its name */
function Sprig({ kind, tint }: { kind: Flower; tint: string }) {
  const pieces = useMemo(() => {
    const at: [number, number] = [60, kind === "tulip" ? 44 : 60];
    const radius = kind === "tulip" ? 40 : 50;
    return [{ id: "h", tint, sway: 0, strokes: bloom(kind, at, radius, 0, rng(9)), sprite: { kind, at: kind === "tulip" ? ([60, 60] as [number, number]) : at, radius: kind === "tulip" ? 34 : radius, tilt: 0 } }];
  }, [kind, tint]);
  return <Engraving pieces={pieces} view={{ w: 120, h: 120 }} mode="static" label="" thinOnPhones={false} className="h-14 w-14 shrink-0" />;
}

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border-t border-line/12 py-10">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="display text-[40px] text-paper md:text-[52px]">
          <span className="mr-3 text-blush">{n}</span>
          {title}
        </h2>
        {hint && <p className="label shrink-0 text-line/45">{hint}</p>}
      </div>
      <div className="mt-7">{children}</div>
    </section>
  );
}

/**
 * Compose your own: every choice redraws the bouquet on the left and moves the price.
 * The recipe goes into the bag exactly as composed, and the boutique receives it stem by stem.
 */
export function BouquetBuilder({ first, shared }: { first?: Flower; shared?: Recipe }) {
  const addCustom = useCart((s) => s.addCustom);
  const [recipe, setRecipe] = useState<Recipe>(() => shared ?? (first ? { ...STARTER, stems: { ...STARTER.stems, [first]: Math.max(3, STARTER.stems[first]) } } : STARTER));
  const total = stemCount(recipe);
  const price = recipePrice(recipe);
  const ok = total >= MIN_STEMS;
  const tints = PALETTES.find((p) => p.id === recipe.palette)!.tints;

  const setStem = (id: Flower, n: number) => setRecipe((r) => ({ ...r, stems: { ...r.stems, [id]: Math.max(0, Math.min(MAX_PER_FLOWER, n)) } }));
  const toggleGreen = (id: Recipe["greens"][number]) => setRecipe((r) => ({ ...r, greens: r.greens.includes(id) ? r.greens.filter((g) => g !== id) : [...r.greens, id] }));

  return (
    <div className="relative text-line" style={{ background: "linear-gradient(#13241a, #0f1b13 30%, #0b140f)" }}>
      <div className="gutter grid grid-cols-[minmax(0,1fr)] gap-x-[5vw] pb-40 pt-28 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:pb-32 md:pt-36">
        {/* the bouquet, redrawn on every choice */}
        <div className="md:sticky md:top-24 md:h-[calc(100svh-12.5rem)]">
          <div className="relative mx-auto h-[52svh] max-w-[560px] md:h-full">
            <div className="pointer-events-none absolute inset-[-12%] blur-3xl transition-[background] duration-1000" style={{ background: `radial-gradient(closest-side, ${tints[0]}30, transparent)` }} />
            <div key={recipeKey(recipe)} className="relative h-full w-full animate-[settle_0.9s_cubic-bezier(.16,1,.3,1)_both] overflow-hidden rounded-[8px]">
              {ok ? (
                <ProductImage recipe={recipe} mode="static" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-[8px] border border-dashed border-line/20 text-center">
                  <p className="display text-[40px] text-line/50">
                    <em>Add {MIN_STEMS - total} more</em>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <p className="label mt-10 text-blush md:mt-0">Compose your own</p>
          <SplitWords as="h1" immediate delay={0.1} text={"Stem by stem,\n*exactly yours.*"} className="display mt-5 text-[clamp(52px,6.6vw,120px)] text-paper" />
          <p className="mb-12 mt-7 max-w-[44ch] text-[15px] leading-relaxed text-line/60">We tie what you compose here the morning you need it. If a flower is out of season that day, we call you before changing a thing.</p>

          <Step n={1} title="The stems" hint={`${total} of ${MAX_STEMS}`}>
            <ul>
              {FLOWERS.map((f, i) => {
                const n = recipe.stems[f.id];
                return (
                  <li key={f.id} className="flex items-center gap-4 border-b border-line/8 py-3.5 last:border-0">
                    <Sprig kind={f.id} tint={tints[i % tints.length]} />
                    <div className="min-w-0 flex-1">
                      <p className={cn("display text-[30px] transition-colors duration-500", n ? "text-paper" : "text-line/55")}>{f.name}</p>
                      <p className="mt-1 truncate text-[13px] text-line/45">{f.note}</p>
                    </div>
                    <span className="label hidden text-line/45 sm:block">{usd(f.price)} a stem</span>
                    <div className="flex items-center gap-2.5">
                      <button className="qty-dark" onClick={() => setStem(f.id, n - 1)} disabled={!n} aria-label={`One ${f.name} less`}>
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-[15px] tabular-nums text-paper">{n}</span>
                      <button className="qty-dark" onClick={() => setStem(f.id, n + 1)} disabled={n >= MAX_PER_FLOWER || total >= MAX_STEMS} aria-label={`One ${f.name} more`}>
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Step>

          <Step n={2} title="The colours">
            <div className="flex flex-wrap gap-2.5">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setRecipe((r) => ({ ...r, palette: p.id }))}
                  aria-pressed={recipe.palette === p.id}
                  className={cn("flex items-center gap-3 rounded-full border py-2 pl-2.5 pr-4 transition-colors duration-500", recipe.palette === p.id ? "border-paper bg-paper text-night" : "border-line/20 text-line/80 hover:border-line/50")}
                >
                  <span className="flex">
                    {p.tints.slice(0, 3).map((t, k) => (
                      <span key={t} className={cn("h-5 w-5 rounded-full border border-night/20", k && "-ml-2")} style={{ background: t }} />
                    ))}
                  </span>
                  <span className="label">{p.name}</span>
                </button>
              ))}
            </div>
          </Step>

          <Step n={3} title="The greenery" hint="Optional">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {GREENS.map((g) => {
                const on = recipe.greens.includes(g.id);
                return (
                  <button key={g.id} onClick={() => toggleGreen(g.id)} aria-pressed={on} className={cn("flex items-center justify-between rounded-[6px] border px-5 py-4 text-left transition-colors duration-500", on ? "border-blush bg-blush/10" : "border-line/15 hover:border-line/40")}>
                    <span>
                      <span className="display block text-[28px] text-paper">{g.name}</span>
                      <span className="mt-1 block text-[13px] text-line/50">
                        {g.note} · +{usd(g.price)}
                      </span>
                    </span>
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded-full border transition-colors duration-500", on ? "border-blush bg-blush text-night" : "border-line/25 text-transparent")}>
                      <Check className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                  </button>
                );
              })}
            </div>
          </Step>

          <Step n={4} title="The wrap">
            <div className="grid grid-cols-2 gap-2.5">
              {WRAPS.map((w) => {
                const on = recipe.wrap === w.id;
                return (
                  <button key={w.id} onClick={() => setRecipe((r) => ({ ...r, wrap: w.id }))} aria-pressed={on} className={cn("rounded-[6px] border px-5 py-4 text-left transition-colors duration-500", on ? "border-blush bg-blush/10" : "border-line/15 hover:border-line/40")}>
                    <span className="display block text-[28px] text-paper">{w.name}</span>
                    <span className="mt-1 block text-[13px] text-line/50">
                      {w.note}
                      {w.price ? ` · +${usd(w.price)}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </Step>
        </div>
      </div>

      {/* the running total, always in reach */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line/12 bg-night/85 backdrop-blur-xl">
        <div className="gutter flex items-center justify-between gap-4 py-3.5">
          <div className="min-w-0">
            <p className="label truncate text-line/50">{ok ? `Your bouquet · ${total} stems` : `Pick at least ${MIN_STEMS} stems`}</p>
            <p className="display mt-1 text-[36px] tabular-nums text-paper">
              <NumberFlow value={price} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} />
            </p>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/shop" className="label link-u hidden text-line/60 md:block">
              Back to the shop
            </Link>
            {/* the whole bouquet travels in the link, so someone else can open it, change it or order it */}
            <button
              onClick={() => ok && navigator.clipboard?.writeText(`${window.location.origin}/shop/build?b=${recipeCode(recipe)}`).then(() => toast("Link copied", { description: "Send it to someone to show them this bouquet." }))}
              disabled={!ok}
              className="label hidden items-center gap-2 text-line/60 transition-colors duration-500 hover:text-paper disabled:opacity-40 sm:flex"
            >
              <Link2 className="h-3.5 w-3.5" /> Share it
            </button>
            <button onClick={() => ok && addCustom(recipe)} disabled={!ok} className="pill bg-blush text-night hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40">
              Add to bag <span aria-hidden>+</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
