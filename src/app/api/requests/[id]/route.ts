import { NextResponse } from "next/server";

import { toPublicRequest } from "@/lib/requests";
import { getRequest, markSeen } from "@/lib/server/requests";

/** The customer's page polls this; reading it marks the florist's messages as seen. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = (await markSeen(id, "customer")) ?? (await getRequest(id));
  if (!request) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  return NextResponse.json(toPublicRequest(request), { headers: { "Cache-Control": "no-store" } });
}
