import { NextResponse } from "next/server";

import { isAtelier } from "@/lib/server/atelier-auth";
import { listRequests } from "@/lib/server/requests";

/** Every conversation, the ones that last moved first. */
export async function GET() {
  if (!(await isAtelier())) return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  const last = (r: { createdAt: string; messages: { at: string }[] }) => r.messages.at(-1)?.at ?? r.createdAt;
  const requests = (await listRequests()).sort((a, b) => last(b).localeCompare(last(a)));
  return NextResponse.json({ requests }, { headers: { "Cache-Control": "no-store" } });
}
