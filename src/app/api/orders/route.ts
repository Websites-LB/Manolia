import { NextResponse } from "next/server";

import { tooMany } from "@/lib/server/guard";
import { buildOrder, originOf } from "@/lib/server/orders";
import { createOrder } from "@/lib/server/orders-store";
import { startPayment } from "@/lib/server/payments";

/** Place an order: check it, price it here, save it, and hand back the payment page to go to. */
export async function POST(req: Request) {
  const limited = tooMany(req, "order", 12, 10 * 60_000);
  if (limited) return limited;
  const built = await buildOrder(await req.json().catch(() => null));
  if ("error" in built) return NextResponse.json({ error: built.error }, { status: 400 });
  try {
    const order = await createOrder(built.order);
    const url = await startPayment(order, originOf(req));
    return NextResponse.json({ id: order.id, url });
  } catch (e) {
    console.error("[manolia] could not place order:", e);
    return NextResponse.json({ error: "We could not start the payment. Nothing was charged. Please try again in a moment." }, { status: 502 });
  }
}
