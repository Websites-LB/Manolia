"use client";

import { useMemo } from "react";

import { Engraving } from "@/components/art/engraving";
import { Photo } from "@/components/art/photo";
import { buildBouquet, VIEW } from "@/lib/botanic/bouquet";
import { HERO_PHOTO } from "@/lib/photos";

const LABEL = "A hand-tied bouquet of peonies, garden roses, ranunculus and anemone, tied with silk";
const PHOTO_LABEL = "A lush bouquet of pink roses, lisianthus and alliums";

/**
 * The hero bouquet: a photograph that blooms out of the dark when there is one, otherwise the painted
 * bouquet, built up the way a florist builds one (sprays, stems, leaves, each bloom back to front, the tie).
 */
export function BouquetArt({ className }: { className?: string }) {
  const pieces = useMemo(() => (HERO_PHOTO ? [] : buildBouquet(7)), []);
  // a photograph on its own dark backdrop: its edges dissolve into the night so it floats in front of the name
  if (HERO_PHOTO)
    return (
      <div className={className} style={{ WebkitMaskImage: "radial-gradient(closest-side, #000 62%, transparent 100%)", maskImage: "radial-gradient(closest-side, #000 62%, transparent 100%)" }}>
        <Photo src="/art/hero-bouquet.webp" alt={PHOTO_LABEL} width={1100} height={1650} sizes="(min-width: 768px) 70svh, 90vw" priority arrive="bloom" delay={0.3} fit="cover" />
      </div>
    );
  return <Engraving pieces={pieces} view={VIEW} mode="load" delay={0.35} seconds={3} washes className={className} label={LABEL} />;
}
