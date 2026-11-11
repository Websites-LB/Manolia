import { NextResponse } from "next/server";

import type { OrderStatus } from "@/lib/orders";
import { isAtelier } from "@/lib/server/atelier-auth";
import { advance } from "@/lib/server/orders";

const ALLOWED: OrderStatus[] = ["arranging", "out", "done", "cancelled"];

/** Move an order one step along, or cancel it. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAtelier())) return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { status?: OrderStatus } | null;
  if (!body?.status || !ALLOWED.includes(body.status)) return NextResponse.json({ error: "Unknown step." }, { status: 400 });
  const order = await advance((await params).id, body.status);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json({ order });
}
