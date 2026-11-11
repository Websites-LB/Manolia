import { NextResponse } from "next/server";

import { toPublicRequest } from "@/lib/requests";
import { tooMany } from "@/lib/server/guard";
import { notifyShopRequest } from "@/lib/server/notify";
import { originOf } from "@/lib/server/orders";
import { addMessage } from "@/lib/server/requests";

/** The customer writes to the florist. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = tooMany(req, "message", 30, 5 * 60_000);
  if (limited) return limited;
  const done = await addMessage((await params).id, "customer", await req.json().catch(() => null));
  if ("error" in done) return NextResponse.json({ error: done.error }, { status: done.status });
  await notifyShopRequest(done.request, "message", originOf(req));
  return NextResponse.json(toPublicRequest(done.request));
}
