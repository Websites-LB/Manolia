import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost, Pinyon_Script } from "next/font/google";

import { CartSheet } from "@/components/shop/cart-sheet";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

import "./globals.css";

const display = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const script = Pinyon_Script({ variable: "--font-pinyon", subsets: ["latin"], weight: "400" });
const sans = Jost({ variable: "--font-jost", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Manolia · The Floral Boutique · Jbeil, Byblos",
  description: "Floral design, weddings and events. Hand-tied bouquets and arrangements from Manolia, near Nobilis Center in Jbeil, Byblos.",
};

export const viewport: Viewport = {
  themeColor: "#f3ede3",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${script.variable} ${sans.variable} grain`}>
        <SmoothScroll>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
          <CartSheet />
        </SmoothScroll>
      </body>
    </html>
  );
}
