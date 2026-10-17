"use client";

import { useState } from "react";

import { photoUrl, type Product } from "@/lib/products";
import { cn } from "@/lib/utils";

export function ProductImage({ product, className, sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" }: { product: Product; className?: string; sizes?: string }) {
  const [ready, setReady] = useState(false);

  return (
    <div className={cn("relative h-full w-full bg-stone", className)}>
      <div className={cn("absolute inset-0 animate-pulse bg-gradient-to-b from-stone to-[#ddd2bf] transition-opacity duration-700", ready && "opacity-0")} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl(product.photo, 800)}
        srcSet={[400, 800, 1200].map((w) => `${photoUrl(product.photo, w)} ${w}w`).join(", ")}
        sizes={sizes}
        alt={`${product.name}: ${product.stems}`}
        loading="lazy"
        decoding="async"
        draggable={false}
        onLoad={() => setReady(true)}
        ref={(img) => {
          if (img?.complete && img.naturalWidth) setReady(true);
        }}
        className={cn("relative h-full w-full object-cover transition-opacity duration-700 ease-out", ready ? "opacity-100" : "opacity-0")}
      />
    </div>
  );
}
