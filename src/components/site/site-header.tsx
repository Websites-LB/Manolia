"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

/**
 * Header in difference blend: one set of paper-coloured type that reads on night and on paper alike.
 * It slips away while you read downward and comes back the moment you scroll up.
 */
export function SiteHeader() {
  const path = usePathname();
  const lines = useCart((s) => s.lines);
  const setOpen = useCart((s) => s.setOpen);
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);
  const count = lines.reduce((n, l) => n + l.qty, 0);

  useEffect(() => {
    setMounted(true);
    const on = () => {
      const y = window.scrollY;
      setHidden(y > 160 && y > last.current + 4 ? true : y < last.current - 4 ? false : (h) => h);
      last.current = y;
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const nav = [
    ["/shop", "Shop"],
    ["/#weddings", "Weddings"],
  ];

  return (
    <header
      className={cn(
        "gutter fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between text-[#f1ece2] mix-blend-difference transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] md:h-20",
        hidden && "-translate-y-full",
      )}
    >
      <Link href="/" aria-label="Manolia home" className="display text-[28px] tracking-[-0.03em] md:text-[32px]">
        Manolia
      </Link>
      <p className="label absolute left-1/2 hidden -translate-x-1/2 opacity-70 lg:block">The floral boutique — Jbeil, Byblos</p>
      <nav className="label flex items-center gap-5 md:gap-8">
        {nav.map(([href, label]) => (
          <Link key={href} href={href} className={cn("link-u hidden sm:inline", path !== href && "[background-size:0%_1px] hover:[background-size:100%_1px]")}>
            {label}
          </Link>
        ))}
        <button onClick={() => setOpen(true)} className="label tabular-nums" aria-label={`Open bag (${count} items)`}>
          Bag ({mounted ? count : 0})
        </button>
      </nav>
    </header>
  );
}
