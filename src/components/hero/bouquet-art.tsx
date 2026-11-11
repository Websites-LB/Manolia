"use client";

import { useMemo } from "react";

import { Engraving } from "@/components/art/engraving";
import { Photo } from "@/components/art/photo";
import { buildBouquet, VIEW } from "@/lib/botanic/bouquet";
import { HERO_PHOTO } from "@/lib/photos";

const LABEL = "A hand-tied bouquet of peonies, garden roses, ranunculus and anemone, tied with silk";

/**
 * The hero bouquet: a photograph that blooms out of the dark when there is one, otherwise the painted
 * bouquet, built up the way a florist builds one (sprays, stems, leaves, each bloom back to front, the tie).
 */
export function BouquetArt({ className }: { className?: string }) {
  const pieces = useMemo(() => (HERO_PHOTO ? [] : buildBouquet(7)), []);
  if (HERO_PHOTO) return <Photo src="/art/hero.webp" alt={LABEL} width={1000} height={1100} sizes="(min-width: 768px) 80svh, 100vw" priority arrive="bloom" delay={0.3} className={className} />;
  return <Engraving pieces={pieces} view={VIEW} mode="load" delay={0.35} seconds={3} washes className={className} label={LABEL} />;
}
