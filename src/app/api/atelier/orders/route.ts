import { NextResponse } from "next/server";

import { isAtelier } from "@/lib/server/atelier-auth";
import { listOrders } from "@/lib/server/orders-store";

/** Everything the boutique needs to see: paid orders, newest first. Unpaid attempts stay out of the way. */
export async function GET() {
  if (!(await isAtelier())) return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  const orders = (await listOrders()).filter((o) => o.payment.status === "paid").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ orders }, { headers: { "Cache-Control": "no-store" } });
}
