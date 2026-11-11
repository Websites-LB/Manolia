import { NextResponse } from "next/server";

import { ATELIER_COOKIE, keyMatches, sessionValue } from "@/lib/server/atelier-auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { key?: string } | null;
  if (!body?.key || !keyMatches(body.key)) return NextResponse.json({ error: "That is not the key." }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ATELIER_COOKIE, sessionValue(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
