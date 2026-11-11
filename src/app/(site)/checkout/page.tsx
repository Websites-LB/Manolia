import type { Metadata } from "next";

import { CheckoutForm } from "@/components/order/checkout-form";
import { paymentMode } from "@/lib/server/payments";

export const metadata: Metadata = { title: "Checkout · Manolia", robots: { index: false } };
// which payment methods are on depends on the server's environment at request time
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return <CheckoutForm modes={{ whish: paymentMode("whish"), card: paymentMode("card") }} />;
}
