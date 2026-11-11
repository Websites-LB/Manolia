import { NextResponse } from "next/server";

import { tooMany } from "@/lib/server/guard";
import { notifyShopRequest } from "@/lib/server/notify";
import { originOf } from "@/lib/server/orders";
import { openRequest } from "@/lib/server/requests";

/** "Not sure what to send?": open a conversation with the florist. Nothing is paid here. */
export async function POST(req: Request) {
  const limited = tooMany(req, "request", 6, 30 * 60_000);
  if (limited) return limited;
  const made = await openRequest(await req.json().catch(() => null));
  if ("error" in made) return NextResponse.json({ error: made.error }, { status: 400 });
  await notifyShopRequest(made.request, "new", originOf(req));
  return NextResponse.json({ id: made.request.id });
}
