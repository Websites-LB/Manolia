import { NextResponse } from "next/server";

import type { PayMethod } from "@/lib/orders";
import { originOf, retryPayment } from "@/lib/server/orders";
import { paymentMode, startPayment } from "@/lib/server/payments";

/** Try paying again for an order that has not been paid, with either method. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = (await req.json().catch(() => null)) as { method?: PayMethod } | null;
  const method = body?.method;
  if ((method !== "whish" && method !== "card") || paymentMode(method) === "off") return NextResponse.json({ error: "That payment method is not available." }, { status: 400 });
  const order = await retryPayment((await params).id, method);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.payment.status === "paid") return NextResponse.json({ error: "This order is already paid." }, { status: 409 });
  try {
    return NextResponse.json({ id: order.id, url: await startPayment(order, originOf(req)) });
  } catch (e) {
    console.error("[manolia] could not restart payment:", e);
    return NextResponse.json({ error: "We could not start the payment. Nothing was charged." }, { status: 502 });
  }
}
