import { NextResponse } from "next/server";

import { originOf, settle } from "@/lib/server/orders";

/** Where the payment page sends the customer back to. We check the payment, then show their order. */
export async function GET(req: Request) {
  const origin = originOf(req);
  const id = new URL(req.url).searchParams.get("order") || "";
  const order = await settle(id, origin);
  return NextResponse.redirect(order ? `${origin}/order/${order.id}` : `${origin}/shop`, 303);
}
