/**
 * A small brake on the public endpoints: so many calls per address per window, counted in memory.
 * It stops a script hammering one server; behind several instances it needs a shared store.
 */
import { NextResponse } from "next/server";

const hits = new Map<string, number[]>();

export function tooMany(req: Request, bucket: string, max: number, windowMs: number) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return NextResponse.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return null;
}
