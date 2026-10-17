"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useCart } from "@/lib/cart-store";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const path = usePathname();
  const lines = useCart((s) => s.lines);
  const setOpen = useCart((s) => s.setOpen);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const count = lines.reduce((n, l) => n + l.qty, 0);

  useEffect(() => {
    setMounted(true);
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-[background-color,backdrop-filter,border-color] duration-500",
        scrolled ? "border-b hairline bg-cream/75 backdrop-blur-md" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 md:h-20 md:px-12">
        <Link href="/" className="group flex items-baseline gap-2 text-forest" aria-label="Manolia home">
          <span className="font-display text-2xl tracking-tight md:text-[1.7rem]">Manolia</span>
          <span className="font-script hidden text-lg text-forest/60 sm:inline">The Floral Boutique</span>
        </Link>

        <nav className="flex items-center gap-1 text-[0.72rem] uppercase tracking-[0.22em] text-forest md:gap-2">
          {[
            ["/", "Atelier"],
            ["/shop", "Shop"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={cn("relative rounded-full px-3 py-2 transition-colors hover:text-forest-deep", path === href && "text-forest-deep")}
            >
              {label}
              <span className={cn("absolute inset-x-3 bottom-1 h-px origin-left bg-forest transition-transform duration-500", path === href ? "scale-x-100" : "scale-x-0")} />
            </Link>
          ))}
          <a href={SITE.instagram} target="_blank" rel="noreferrer" className="hidden rounded-full px-3 py-2 hover:text-forest-deep md:inline">
            Instagram
          </a>
          <button
            onClick={() => setOpen(true)}
            className="relative ml-1 flex h-10 w-10 items-center justify-center rounded-full border hairline transition-colors hover:bg-forest/5"
            aria-label={`Open bag (${count} items)`}
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={1.4} />
            {mounted && count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-forest px-1 text-[0.62rem] tracking-normal text-cream">
                {count}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
