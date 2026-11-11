import { NextResponse } from "next/server";

import { toPublic } from "@/lib/orders";
import { originOf, settle } from "@/lib/server/orders";

/** The tracking page polls this. While a live payment is pending, each poll asks the provider again. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const order = await settle((await params).id, originOf(req));
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json(toPublic(order), { headers: { "Cache-Control": "no-store" } });
}
