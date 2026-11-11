import { NextResponse } from "next/server";

import { originOf, recordPayment } from "@/lib/server/orders";
import { getOrder } from "@/lib/server/orders-store";

/** The built-in test gateway's answer. Only orders created in test mode can be settled this way. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { order?: string; outcome?: string } | null;
  const order = body?.order ? await getOrder(body.order) : null;
  if (!order || order.payment.mode !== "test") return NextResponse.json({ error: "Not a test payment." }, { status: 404 });
  await recordPayment(order.id, body?.outcome === "approve" ? "paid" : "failed", originOf(req));
  return NextResponse.json({ ok: true });
}
