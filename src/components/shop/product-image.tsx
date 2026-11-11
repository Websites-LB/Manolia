"use client";

import { useCallback, useMemo } from "react";

import { Engraving } from "@/components/art/engraving";
import { Photo } from "@/components/art/photo";
import { buildCustom } from "@/lib/botanic/custom";
import { buildArrangement, PLATE_VIEW } from "@/lib/botanic/specimen";
import { briefRecipe, PALETTES, recipeSummary, type Brief, type Recipe } from "@/lib/custom";
import { productPhoto } from "@/lib/photos";
import type { Product } from "@/lib/products";
import { uploadUrl } from "@/lib/requests";
import { cn } from "@/lib/utils";

type Props = { product?: Product; recipe?: Recipe; /** florist's choice: drawn as a stand-in bouquet in the chosen colours */ brief?: Brief; /** a real photo, shown instead of a drawing */ image?: string; className?: string; mode?: "view" | "static" | "load"; frame?: boolean };

/**
 * A piece shown as a painted plate instead of a stock photograph: a shop arrangement, or the bouquet
 * a customer composed, on night ground lit in its own colour.
 */
export function ProductImage({ product, recipe: composed, brief, image, className, mode = "view", frame = true }: Props) {
  const recipe = useMemo(() => composed ?? (brief ? briefRecipe(brief) : undefined), [composed, brief]);
  // a function, not a list: the painter only builds the shapes when the plate is about to be seen
  const pieces = useCallback(
    () => (recipe ? buildCustom(recipe) : product && !productPhoto(product.id) ? buildArrangement(product.art.flower, product.art.style, product.art.tint, product.art.seed) : []),
    [product, recipe],
  );
  const tint = recipe ? (PALETTES.find((p) => p.id === recipe.palette)?.tints[0] ?? "#f0b9ae") : (product?.art.tint ?? "#f0b9ae");
  const label = brief ? "A bouquet in your colours; the florist chooses the stems" : recipe ? `Your bouquet, drawn: ${recipeSummary(recipe)}` : `${product?.name}, drawn: ${product?.stems}`;
  if (image)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- uploaded at runtime, served by our own route
      <img src={uploadUrl(image)} alt="The florist's photo of your bouquet" className={cn("h-full w-full object-cover", className)} />
    );
  const photo = !recipe && product ? productPhoto(product.id) : null;
  if (photo)
    return (
      <div className={cn("relative h-full w-full overflow-hidden bg-[#0f1b13]", className)}>
        <Photo src={photo} alt={`${product!.name}: ${product!.stems}`} width={900} height={1200} sizes="(min-width: 1024px) 32vw, (min-width: 640px) 48vw, 100vw" arrive="fade" fit="cover" />
        {/* the piece's own colour, breathed over the photograph */}
        <div className="pointer-events-none absolute inset-0 mix-blend-soft-light" style={{ background: `radial-gradient(80% 60% at 50% 40%, ${tint}55, transparent 75%)` }} />
      </div>
    );
  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)} style={{ background: `radial-gradient(75% 58% at 50% 36%, ${tint}38, transparent 72%), linear-gradient(#1a2e22, #0f1b13)` }}>
      <Engraving pieces={pieces} view={PLATE_VIEW} mode={mode} label={label} className="absolute inset-[5%] h-[90%] w-[90%]" />
      {frame && <div className="pointer-events-none absolute inset-[3%] rounded-[3px] border border-line/12" />}
    </div>
  );
}
