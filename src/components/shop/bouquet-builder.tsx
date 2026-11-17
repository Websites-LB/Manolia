"use client";

import NumberFlow from "@number-flow/react";
import { Check, Link2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
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

function Step({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="py-9">
      <h2 className="display text-[44px] text-paper md:text-[56px]">
        {title} {hint && <span className="text-[18px] italic tracking-normal text-line/45">{hint}</span>}
      </h2>
      <div className="mt-6">{children}</div>
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
    <div className="relative overflow-x-clip text-line" style={{ background: "linear-gradient(#13241a, #0f1b13 30%, #0b140f)" }}>
      <div className="gutter grid grid-cols-[minmax(0,1fr)] gap-x-[5vw] pb-40 pt-28 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:pb-32 md:pt-36">
        {/* the bouquet, redrawn on every choice. On a phone it floats at the top while the choices
            scroll underneath, so every tap shows its effect without scrolling back up. */}
        <div className="sticky top-0 z-20 -mx-4 bg-[#101d15]/95 px-4 pb-3 pt-3 backdrop-blur-md md:top-24 md:z-auto md:mx-0 md:h-[calc(100svh-17rem)] md:bg-transparent md:p-0 md:backdrop-blur-none">
          <div className="relative mx-auto h-[36svh] max-w-[580px] md:h-full">
            <div className="pointer-events-none absolute inset-[-14%] hidden blur-3xl md:block transition-[background] duration-1000" style={{ background: `radial-gradient(closest-side, ${tints[0]}38, transparent)` }} />
            <div key={recipeKey(recipe)} className="relative h-full w-full animate-[settle_0.9s_cubic-bezier(.16,1,.3,1)_both] overflow-hidden rounded-[24px] shadow-[0_70px_120px_-60px_rgb(0_0_0/0.9)]">
              {ok ? (
                <ProductImage recipe={recipe} mode="static" frame={false} />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-[24px] border border-dashed border-line/20 text-center">
                  <p className="display text-[40px] text-line/50">
                    <em>Add {MIN_STEMS - total} more</em>
                  </p>
                </div>
              )}
              {ok && <p className="absolute bottom-4 left-4 rounded-full bg-night/60 px-4 py-1.5 text-[15px] italic text-line/80 backdrop-blur-md">{total} stems</p>}
            </div>
          </div>
        </div>

        <div>
          <SplitWords as="h1" immediate delay={0.1} text={"Make it\n*yours.*"} className="display mt-10 text-[clamp(64px,8vw,150px)] text-paper md:mt-0" />
          <p className="mb-4 mt-5 max-w-[34ch] text-[19px] italic leading-snug text-line/60">Every tap redraws the bouquet. We tie exactly this, the morning you need it.</p>

          <Step title="Flowers" hint={`${total} of ${MAX_STEMS}`}>
            <ul className="grid gap-2.5 2xl:grid-cols-2">
              {FLOWERS.map((f, i) => {
                const n = recipe.stems[f.id];
                return (
                  <li key={f.id} className={cn("flex items-center gap-3 rounded-[18px] border p-3 pr-4 transition-colors duration-500", n ? "border-blush/50 bg-blush/[0.07]" : "border-line/12 bg-[#0e1a12]/60")}>
                    <Sprig kind={f.id} tint={tints[i % tints.length]} />
                    <div className="min-w-0 flex-1">
                      <p className={cn("display text-[26px] leading-none transition-colors duration-500", n ? "text-paper" : "text-line/70")}>{f.name}</p>
                      <p className="mt-1.5 text-[14px] italic text-line/45">{usd(f.price)} a stem</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="qty-dark" onClick={() => setStem(f.id, n - 1)} disabled={!n} aria-label={`One ${f.name} less`}>
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-[17px] tabular-nums text-paper">{n}</span>
                      <button className="qty-dark" onClick={() => setStem(f.id, n + 1)} disabled={n >= MAX_PER_FLOWER || total >= MAX_STEMS} aria-label={`One ${f.name} more`}>
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Step>

          <Step title="Colours">
            <div className="flex flex-wrap gap-x-4 gap-y-5">
              {PALETTES.map((p) => {
                const on = recipe.palette === p.id;
                return (
                  <button key={p.id} onClick={() => setRecipe((r) => ({ ...r, palette: p.id }))} aria-pressed={on} className="group flex w-[68px] flex-col items-center gap-2">
                    <span
                      className={cn("h-14 w-14 rounded-full ring-offset-[3px] ring-offset-night transition-[box-shadow,transform] duration-500 group-hover:scale-105", on ? "ring-2 ring-paper" : "ring-1 ring-line/15")}
                      style={{ background: `conic-gradient(${p.tints.map((t, k) => `${t} ${(k / p.tints.length) * 100}% ${((k + 1) / p.tints.length) * 100}%`).join(", ")})` }}
                    />
                    <span className={cn("text-[15px] transition-colors duration-500", on ? "text-paper" : "text-line/50")}>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </Step>

          <Step title="Greenery" hint="optional">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {GREENS.map((g) => {
                const on = recipe.greens.includes(g.id);
                return (
                  <button key={g.id} onClick={() => toggleGreen(g.id)} aria-pressed={on} className={cn("flex items-center justify-between rounded-[18px] border px-5 py-4 text-left transition-colors duration-500", on ? "border-blush/60 bg-blush/[0.08]" : "border-line/12 bg-[#0e1a12]/60 hover:border-line/40")}>
                    <span>
                      <span className="display block text-[28px] text-paper">{g.name}</span>
                      <span className="mt-1 block text-[14px] italic text-line/50">+{usd(g.price)}</span>
                    </span>
                    <span className={cn("flex h-7 w-7 items-center justify-center rounded-full border transition-colors duration-500", on ? "border-blush bg-blush text-night" : "border-line/25 text-transparent")}>
                      <Check className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                  </button>
                );
              })}
            </div>
          </Step>

          <Step title="Wrap">
            <div className="grid grid-cols-2 gap-2.5">
              {WRAPS.map((w) => {
                const on = recipe.wrap === w.id;
                return (
                  <button key={w.id} onClick={() => setRecipe((r) => ({ ...r, wrap: w.id }))} aria-pressed={on} className={cn("rounded-[18px] border px-5 py-4 text-left transition-colors duration-500", on ? "border-blush/60 bg-blush/[0.08]" : "border-line/12 bg-[#0e1a12]/60 hover:border-line/40")}>
                    <span className="display block text-[28px] text-paper">{w.name}</span>
                    <span className="mt-1 block text-[14px] italic text-line/50">{w.price ? `+${usd(w.price)}` : "Included"}</span>
                  </button>
                );
              })}
            </div>
          </Step>
        </div>
      </div>

      {/* the running total, always in reach: a floating bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 px-2 pb-2 md:px-6 md:pb-5">
        <div className="mx-auto flex max-w-[980px] items-center justify-between gap-4 rounded-full border border-line/12 bg-night/85 py-2.5 pl-6 pr-2.5 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl">
          <div className="min-w-0">
            <p className="display text-[34px] leading-none tabular-nums text-paper">
              <NumberFlow value={price} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} />
            </p>
            <p className="mt-1 truncate text-[14px] italic text-line/50">{ok ? `${total} stems, tied by hand` : `Pick at least ${MIN_STEMS} stems`}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* the whole bouquet travels in the link, so someone else can open it, change it or order it */}
            <button
              onClick={() => ok && navigator.clipboard?.writeText(`${window.location.origin}/shop/build?b=${recipeCode(recipe)}`).then(() => toast("Link copied", { description: "Send it to someone to show them this bouquet." }))}
              disabled={!ok}
              className="hidden items-center gap-2 text-[16px] text-line/60 transition-colors duration-500 hover:text-paper disabled:opacity-40 sm:flex"
            >
              <Link2 className="h-4 w-4" /> Share
            </button>
            <button onClick={() => ok && addCustom(recipe)} disabled={!ok} className="flex items-center gap-2 rounded-full bg-blush px-6 py-3.5 text-[17px] text-night transition-colors duration-500 hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40">
              Add to bag <span className="text-[20px] leading-none">+</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
