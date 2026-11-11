import { NextResponse } from "next/server";

import { originOf, settle } from "@/lib/server/orders";

/**
 * Whish calls this when a payment succeeds or fails. The call itself proves nothing, so it is only
 * taken as a nudge to ask Whish for the real status.
 */
async function hook(req: Request) {
  await settle(new URL(req.url).searchParams.get("order") || "", originOf(req));
  return NextResponse.json({ ok: true });
}

export { hook as GET, hook as POST };
