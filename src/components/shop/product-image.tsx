"use client";

import { useEffect, useState } from "react";

import { snapshot } from "@/lib/flora/snapshots";
import type { Product } from "@/lib/products";
import { cn } from "@/lib/utils";

export function ProductImage({ product, className }: { product: Product; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    snapshot(product).then((s) => live && setSrc(s), () => {});
    return () => {
      live = false;
    };
  }, [product]);

  return (
    <div className={cn("relative h-full w-full bg-[#ebe3d5]", className)}>
      {!src && <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-[#ebe3d5] to-[#e2d8c7]" />}
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`${product.name}: ${product.stems}`} className="h-full w-full animate-[rise_0.9s_ease-out] object-cover" draggable={false} />
      )}
    </div>
  );
}
