import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { Cursor } from "@/components/site/cursor";
import { Toaster } from "@/components/site/toaster-lazy";

import "./globals.css";

// One typeface for the whole site: the one the name is set in. The two files (latin, 400 and italic) are
// served from our own origin, so there is no third-party request and no network needed to build.
const serif = localFont({
  variable: "--font-instrument",
  display: "swap",
  src: [
    { path: "./fonts/InstrumentSerif-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/InstrumentSerif-Italic.woff2", weight: "400", style: "italic" },
  ],
});

export const metadata: Metadata = {
  title: "Manolia · The Floral Boutique · Jbeil, Byblos",
  description: "Floral design, weddings and events. Hand-tied bouquets and arrangements from Manolia, near Nobilis Center in Jbeil, Byblos.",
};

export const viewport: Viewport = {
  themeColor: "#13241a",
};

/** Fonts, grain and smooth scroll for every page. The shop's header, footer and bag live in (site)/layout. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${serif.variable} grain`}>
        <SmoothScroll>
          {children}
          <Cursor />
          <Toaster />
        </SmoothScroll>
      </body>
    </html>
  );
}
