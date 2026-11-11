import { CartSheet } from "@/components/shop/cart-sheet-lazy";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

/** Everything a customer sees: header, the page, the soil footer, and the bag. */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <CartSheet />
    </>
  );
}
