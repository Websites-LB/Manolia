"use client";

import { Engraving } from "@/components/art/engraving";
import { buildBouquet, VIEW } from "@/lib/botanic/bouquet";

/**
 * The hero bouquet. On arrival it is inked the way a florist builds one: airy sprays first,
 * then stems, leaves, each bloom from the back to the front, and the silk tie last.
 */
export function BouquetArt({ className }: { className?: string }) {
  return (
    <Engraving
      build={() => buildBouquet(7)}
      view={VIEW}
      mode="load"
      delay={0.35}
      washes
      className={className}
      label="An engraved, hand-coloured bouquet of peonies, roses, ranunculus and anemone, tied with silk"
    />
  );
}
