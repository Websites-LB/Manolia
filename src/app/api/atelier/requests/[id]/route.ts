import { NextResponse } from "next/server";

import { isAtelier } from "@/lib/server/atelier-auth";
import { notifyCustomerReply } from "@/lib/server/notify";
import { originOf } from "@/lib/server/orders";
import { addMessage, closeRequest, markSeen } from "@/lib/server/requests";

type Ctx = { params: Promise<{ id: string }> };

/** The florist replies, with a photo or a proposal if they like. */
export async function POST(req: Request, { params }: Ctx) {
  if (!(await isAtelier())) return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  const done = await addMessage((await params).id, "florist", await req.json().catch(() => null));
  if ("error" in done) return NextResponse.json({ error: done.error }, { status: done.status });
  await notifyCustomerReply(done.request, originOf(req));
  return NextResponse.json({ request: done.request });
}

/** Mark a conversation as read, or close it. */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAtelier())) return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { action?: string } | null;
  const { id } = await params;
  const request = body?.action === "close" ? await closeRequest(id) : await markSeen(id, "florist");
  return NextResponse.json({ request });
}
