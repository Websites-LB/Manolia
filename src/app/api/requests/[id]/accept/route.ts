import { NextResponse } from "next/server";

import { toPublicRequest } from "@/lib/requests";
import { notifyShopRequest } from "@/lib/server/notify";
import { originOf } from "@/lib/server/orders";
import { acceptProposal } from "@/lib/server/requests";

/** The customer says yes to a proposal. Payment follows at the checkout. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = (await req.json().catch(() => null)) as { message?: string } | null;
  const request = await acceptProposal((await params).id, String(body?.message ?? ""));
  if (!request) return NextResponse.json({ error: "That proposal is no longer open." }, { status: 409 });
  await notifyShopRequest(request, "accepted", originOf(req));
  return NextResponse.json(toPublicRequest(request));
}
