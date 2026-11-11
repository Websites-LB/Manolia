import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { CartSheet } from "@/components/shop/cart-sheet";
import { Cursor } from "@/components/site/cursor";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

import "./globals.css";

const serif = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const sans = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Manolia · The Floral Boutique · Jbeil, Byblos",
  description: "Floral design, weddings and events. Hand-tied bouquets and arrangements from Manolia, near Nobilis Center in Jbeil, Byblos.",
};

export const viewport: Viewport = {
  themeColor: "#13241a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${serif.variable} ${sans.variable} ${mono.variable} grain`}>
        <SmoothScroll>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
          <CartSheet />
          <Cursor />
        </SmoothScroll>
      </body>
    </html>
  );
}
