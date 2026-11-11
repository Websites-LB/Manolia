"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  /** intrinsic size of the file, so the layout is reserved before it loads */
  width: number;
  height: number;
  sizes: string;
  className?: string;
  priority?: boolean;
  /** "grow": a stem rising from the ground · "bloom": a bouquet arriving out of the dark · "fade" */
  arrive?: "grow" | "bloom" | "fade";
  delay?: number;
  fit?: "contain" | "cover";
};

/**
 * A photograph that arrives: once it has loaded and scrolled into view it grows up from its base,
 * blooms out of the dark, or simply fades in. Nothing shows half-loaded.
 */
export function Photo({ src, alt, width, height, sizes, className, priority, arrive = "fade", delay = 0, fit = "contain" }: Props) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [seen, setSeen] = useState(!!priority);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.complete && el.naturalWidth) setLoaded(true);
    if (priority) return;
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && (setSeen(true), io.disconnect()), { rootMargin: "0px 0px -12% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [priority]);

  const on = loaded && seen;
  return (
    <Image
      ref={ref}
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      onLoad={() => setLoaded(true)}
      style={{ transitionDelay: `${delay}s`, clipPath: arrive === "grow" ? (on ? "inset(0 0 0 0)" : "inset(100% 0 0 0)") : undefined }}
      className={cn(
        "h-full w-full motion-reduce:!transition-none",
        fit === "cover" ? "object-cover" : "object-contain object-bottom",
        arrive === "grow" && "transition-[clip-path,opacity] duration-[2200ms] ease-[cubic-bezier(.16,1,.3,1)]",
        arrive === "bloom" && "origin-[50%_97%] transition-[opacity,transform,filter] duration-[2600ms] ease-[cubic-bezier(.16,1,.3,1)]",
        arrive === "fade" && "transition-opacity duration-[1400ms] ease-[cubic-bezier(.16,1,.3,1)]",
        on ? "opacity-100" : "opacity-0",
        arrive === "bloom" && (on ? "scale-100 blur-0" : "scale-[0.94] blur-[6px]"),
        className,
      )}
    />
  );
}
