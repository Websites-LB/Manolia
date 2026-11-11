/**
 * Taking the money. The customer is always sent to a page hosted by the payment provider, so no card
 * or wallet detail ever touches this site. Two methods, no cash:
 *
 *  - Whish: Whish Pay's collect API. Needs WHISH_CHANNEL, WHISH_SECRET and WHISH_WEBSITE_URL from the
 *    Whish merchant account (WHISH_API_BASE switches sandbox / production).
 *  - Card: needs a merchant account with a card gateway. None is wired yet; see `cardCheckout`.
 *
 * With no credentials, local development falls back to a built-in test gateway (/pay/test/…) that
 * moves no money. In production an unconfigured method is simply off.
 */
import type { Order, PayMethod, PayMode } from "../orders";

const env = (k: string) => process.env[k]?.trim() || "";
const testAllowed = () => process.env.NODE_ENV !== "production" || env("PAYMENTS_TEST_MODE") === "1";

const whishReady = () => !!(env("WHISH_CHANNEL") && env("WHISH_SECRET") && env("WHISH_WEBSITE_URL"));
const WHISH_BASE = () => env("WHISH_API_BASE") || "https://lb.sandbox.whish.money/itel-service/api";

export function paymentMode(method: PayMethod): PayMode {
  if (method === "whish" && whishReady()) return "live";
  return testAllowed() ? "test" : "off";
}

/** A fresh numeric id for each attempt (Whish wants a number, and never the same one twice). */
export const newPaymentRef = () => `${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

async function whish<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${WHISH_BASE()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", channel: env("WHISH_CHANNEL"), secret: env("WHISH_SECRET"), websiteurl: env("WHISH_WEBSITE_URL") },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as { status?: boolean; code?: string; dialog?: { message?: string }; data?: T } | null;
  if (!res.ok || !json?.status || !json.data) throw new Error(`Whish ${path} failed: ${json?.dialog?.message || json?.code || res.status}`);
  return json.data;
}

/** Start a payment and return the page to send the customer to. */
export async function startPayment(order: Order, origin: string): Promise<string> {
  const { method, mode, ref } = order.payment;
  const back = `${origin}/api/pay/return?order=${order.id}`;
  if (mode === "test") return `${origin}/pay/test/${order.id}`;
  if (mode === "live" && method === "whish") {
    const hook = `${origin}/api/pay/whish?order=${order.id}`;
    const data = await whish<{ collectUrl: string }>("/payment/whish", {
      amount: order.total,
      currency: "USD",
      invoice: `Manolia order ${order.ref}`,
      externalId: Number(ref),
      successCallbackUrl: hook,
      failureCallbackUrl: hook,
      successRedirectUrl: back,
      failureRedirectUrl: back,
    });
    return data.collectUrl;
  }
  throw new Error(`${method} payments are not set up`);
}

/**
 * Ask the provider what really happened. Redirects and callbacks are only hints that it is time to
 * ask; the answer always comes from here. Test payments are settled by the test gateway itself.
 */
export async function checkPayment(order: Order): Promise<"paid" | "failed" | "pending"> {
  const { method, mode, ref } = order.payment;
  if (mode === "live" && method === "whish") {
    const data = await whish<{ collectStatus: string }>("/payment/collect/status", { currency: "USD", externalId: Number(ref) });
    return data.collectStatus === "success" ? "paid" : data.collectStatus === "failed" ? "failed" : "pending";
  }
  return "pending";
}
