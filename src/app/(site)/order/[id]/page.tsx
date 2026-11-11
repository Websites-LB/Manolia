import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrderTracker } from "@/components/order/order-tracker";
import { toPublic } from "@/lib/orders";
import { getOrder } from "@/lib/server/orders-store";
import { paymentMode } from "@/lib/server/payments";

export const metadata: Metadata = { title: "Your order · Manolia", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const order = await getOrder((await params).id);
  if (!order) notFound();
  return <OrderTracker initial={toPublic(order)} modes={{ whish: paymentMode("whish"), card: paymentMode("card") }} />;
}
