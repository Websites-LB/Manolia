/**
 * Who may open the boutique's board. Set ATELIER_KEY to a passphrase; whoever enters it gets a cookie.
 * With no key set the board is open in local development and shut in production.
 */
import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ATELIER_COOKIE = "manolia_atelier";
const key = () => process.env.ATELIER_KEY?.trim() || "";
const token = (k: string) => createHash("sha256").update(`manolia-atelier:${k}`).digest("hex");

export const atelierState = (): "open" | "locked" | "unset" => (key() ? "locked" : process.env.NODE_ENV === "production" ? "unset" : "open");

export function keyMatches(given: string) {
  const a = Buffer.from(token(given));
  const b = Buffer.from(token(key()));
  return !!key() && a.length === b.length && timingSafeEqual(a, b);
}

export const sessionValue = () => token(key());

export async function isAtelier() {
  const state = atelierState();
  if (state === "open") return true;
  if (state === "unset") return false;
  const have = (await cookies()).get(ATELIER_COOKIE)?.value || "";
  const want = sessionValue();
  return have.length === want.length && timingSafeEqual(Buffer.from(have), Buffer.from(want));
}
