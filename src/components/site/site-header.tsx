"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useCart } from "@/lib/cart-store";
import { SITE, waLink } from "@/lib/site";
import { cn } from "@/lib/utils";

const NAV = [
  ["/shop", "Shop"],
  ["/shop/build", "Make your own"],
  ["/shop#florist", "Let us choose"],
] as const;

/**
 * The header floats over the page. At the top it is just the name and three words; once you scroll
 * it gathers into a pill of frosted glass. It slips away while you read downward and comes back the
 * moment you scroll up. On a phone the links live behind a menu button, in a full-screen sheet.
 */
export function SiteHeader() {
  const path = usePathname();
  const lines = useCart((s) => s.lines);
  const setOpen = useCart((s) => s.setOpen);
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [menu, setMenu] = useState(false);
  const last = useRef(0);
  const count = mounted ? lines.reduce((n, l) => n + l.qty, 0) : 0;

  useEffect(() => {
    setMounted(true);
    const on = () => {
      const y = window.scrollY;
      setSolid(y > 40);
      setHidden(y > 160 && y > last.current + 4 ? true : y < last.current - 4 ? false : (h) => h);
      last.current = y;
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // a new page closes the menu
  useEffect(() => setMenu(false), [path]);
  useEffect(() => {
    document.documentElement.style.overflow = menu ? "hidden" : "";
    return () => void (document.documentElement.style.overflow = "");
  }, [menu]);

  return (
    <>
      <header className={cn("fixed inset-x-0 top-0 z-40 px-[clamp(10px,2.4vw,40px)] pt-3 transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)]", hidden && !menu && "-translate-y-[120%]")}>
        <div
          className={cn(
            "flex h-14 items-center justify-between rounded-full border transition-[background-color,border-color,box-shadow,padding] duration-700 ease-[cubic-bezier(.16,1,.3,1)] md:h-16",
            solid || menu ? "border-line/10 bg-night/70 pl-5 pr-2 shadow-[0_20px_50px_-25px_rgb(0_0_0/0.8)] backdrop-blur-xl md:pl-7" : "border-transparent bg-transparent pl-2 pr-0",
          )}
        >
          <Link href="/" aria-label="Manolia home" className="display text-[28px] tracking-[-0.02em] text-paper md:text-[32px]">
            Manolia
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={cn("link-u text-[17px] transition-colors duration-500", path === href ? "text-paper" : "text-line/70 [background-size:0%_1px] hover:text-paper hover:[background-size:100%_1px]")}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen(true)}
              className="flex h-11 items-center gap-2.5 rounded-full bg-paper pl-5 pr-2 text-[16px] text-night transition-colors duration-500 hover:bg-blush md:h-12"
              aria-label={`Open bag (${count} items)`}
            >
              Bag
              <span key={count} className={cn("flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-[14px] tabular-nums", count ? "animate-[msg_0.6s_cubic-bezier(.16,1,.3,1)_both] bg-blush text-night" : "bg-night/10 text-night/60")}>
                {count}
              </span>
            </button>
            <button
              onClick={() => setMenu((m) => !m)}
              aria-label={menu ? "Close the menu" : "Open the menu"}
              aria-expanded={menu}
              className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-full border border-line/20 text-paper md:hidden"
            >
              <span className={cn("h-px w-4 bg-current transition-transform duration-500", menu && "translate-y-[3px] rotate-45")} />
              <span className={cn("h-px w-4 bg-current transition-transform duration-500", menu && "-translate-y-[3px] -rotate-45")} />
            </button>
          </div>
        </div>
      </header>

      {/* the phone menu: the whole screen, big words, one tap each */}
      <div
        data-lenis-prevent
        className={cn(
          "fixed inset-0 z-30 flex flex-col justify-between px-6 pb-10 pt-28 text-line transition-[opacity,visibility] duration-700 ease-[cubic-bezier(.16,1,.3,1)] md:hidden",
          menu ? "visible opacity-100" : "invisible opacity-0",
        )}
        style={{ background: "linear-gradient(#13241a, #0b140f)" }}
        aria-hidden={!menu}
      >
        <nav className="flex flex-col gap-2">
          {[["/", "Home"], ...NAV].map(([href, label], i) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenu(false)}
              tabIndex={menu ? 0 : -1}
              className={cn("display text-[52px] leading-[1.1] text-paper transition-[opacity,transform] duration-700 ease-[cubic-bezier(.16,1,.3,1)]", menu ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0")}
              style={{ transitionDelay: menu ? `${0.08 + i * 0.06}s` : "0s" }}
            >
              {i % 2 ? <em>{label}</em> : label}
            </Link>
          ))}
        </nav>
        <div className={cn("space-y-2 text-[18px] transition-opacity delay-300 duration-700", menu ? "opacity-100" : "opacity-0")}>
          <a href={waLink("Hello Manolia!")} target="_blank" rel="noreferrer" tabIndex={menu ? 0 : -1} className="block text-paper">
            WhatsApp {SITE.whatsappDisplay}
          </a>
          <p className="italic text-line/50">{SITE.address}</p>
        </div>
      </div>
    </>
  );
}
