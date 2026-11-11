"use client";

import { useMemo } from "react";

import { Engraving } from "@/components/art/engraving";
import { buildBouquet, VIEW } from "@/lib/botanic/bouquet";

/**
 * The hero bouquet. On arrival it is inked the way a florist builds one: airy sprays first,
 * then stems, leaves, each bloom from the back to the front, and the silk tie last.
 */
export function BouquetArt({ className }: { className?: string }) {
  const pieces = useMemo(() => buildBouquet(7), []);
  return (
    <Engraving
      pieces={pieces}
      view={VIEW}
      mode="load"
      delay={0.35}
      washes
      className={className}
      label="An engraved, hand-coloured bouquet of peonies, roses, ranunculus and anemone, tied with silk"
    />
  );
}
