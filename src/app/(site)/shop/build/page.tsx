import type { Metadata } from "next";

import { BouquetBuilder } from "@/components/shop/bouquet-builder";
import { FLOWERS, recipeFromCode, type Flower } from "@/lib/custom";

export const metadata: Metadata = {
  title: "Compose your own bouquet · Manolia",
  description: "Pick the stems, the colours, the greenery and the wrap. Manolia ties exactly the bouquet you compose, the morning you need it.",
};

export default async function BuildPage({ searchParams }: { searchParams: Promise<{ flower?: string; b?: string }> }) {
  const { flower, b } = await searchParams;
  const first = FLOWERS.find((f) => f.id === flower)?.id as Flower | undefined;
  // ?b=… is a bouquet someone composed and shared
  return <BouquetBuilder first={first} shared={recipeFromCode(b) ?? undefined} />;
}
