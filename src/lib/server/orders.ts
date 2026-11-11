/** The rules of an order: building one from a checkout request, settling its payment, moving it along. */
import { randomBytes } from "crypto";

import { briefSummary, cleanRecipe, recipeKey, recipePrice, recipeSummary } from "../custom";
import type { Order, OrderLine, OrderRequest, OrderStatus, PayMethod } from "../orders";
import { PRODUCTS } from "../products";
import { DELIVERY_ZONES, SLOTS } from "../site";
import { notifyShop } from "./notify";
import { getOrder, updateOrder } from "./orders-store";
import { checkPayment, newPaymentRef, paymentMode } from "./payments";
import { getRequest, markOrdered } from "./requests";
import { isUpload } from "./uploads";

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const stamp = (o: Order, status: OrderStatus): Order => ({ ...o, status, history: [...o.history, { status, at: new Date().toISOString() }] });

/** Turn what the browser sent into an order, or say what is wrong with it. Every price is looked up here. */
export async function buildOrder(input: unknown): Promise<{ order: Order } | { error: string }> {
  const req = (input ?? {}) as Partial<OrderRequest>;
  if (!Array.isArray(req.lines) || !req.lines.length || req.lines.length > 20) return { error: "Your bag is empty." };

  const lines: OrderLine[] = [];
  for (const l of req.lines) {
    const qty = Number(l?.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) return { error: "One of the quantities is not valid." };
    if (l.requestId) {
      // a florist's proposal the customer accepted: the price is whatever was agreed in the conversation
      const r = await getRequest(String(l.requestId));
      if (!r || r.status !== "accepted" || !r.accepted) return { error: "That proposal is no longer open. Please go back to your conversation with the florist." };
      lines.push({ id: `request:${r.id}`, name: r.accepted.title, detail: [briefSummary(r.brief), r.accepted.note].filter(Boolean).join(" — "), qty: 1, price: r.accepted.price, requestId: r.id, image: r.accepted.image });
    } else if (l.recipe) {
      const recipe = cleanRecipe(l.recipe);
      if (!recipe) return { error: "One of your composed bouquets could not be read. Please compose it again." };
      lines.push({ id: recipeKey(recipe), name: "Composed bouquet", detail: recipeSummary(recipe), qty, price: recipePrice(recipe), recipe });
    } else {
      const p = PRODUCTS.find((x) => x.id === l?.id);
      if (!p) return { error: "One of the pieces in your bag is no longer in the shop." };
      lines.push({ id: p.id, name: p.name, detail: p.stems, qty, price: p.price });
    }
  }

  const name = text(req.customer?.name, 80);
  const phone = text(req.customer?.phone, 24);
  const email = text(req.customer?.email, 120);
  if (name.length < 2) return { error: "Please tell us your name." };
  if (phone.replace(/\D/g, "").length < 7) return { error: "Please give a phone number we can reach you on." };
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return { error: "That email address does not look right." };

  const f = req.fulfilment;
  const date = text(f?.date, 10);
  const day = new Date(`${date}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(day.getTime()) || day.getTime() < today.getTime() - 864e5 || day.getTime() > today.getTime() + 120 * 864e5) return { error: "Please choose a day for your flowers." };
  if (!f || !SLOTS.includes(f.slot)) return { error: "Please choose a time of day." };
  if (f.type !== "pickup" && f.type !== "delivery") return { error: "Please choose pick-up or delivery." };
  const zone = DELIVERY_ZONES.find((z) => z.id === f.zone);
  const address = text(f.address, 240);
  if (f.type === "delivery" && (!zone || address.length < 6)) return { error: "Please tell us where to deliver." };

  const method = req.method as PayMethod;
  if (method !== "whish" && method !== "card") return { error: "Please choose how to pay." };
  const mode = paymentMode(method);
  if (mode === "off") return { error: `${method === "card" ? "Card" : "Whish"} payments are not available yet. Please choose the other method.` };

  const subtotal = lines.reduce((n, l) => n + l.qty * l.price, 0);
  const deliveryFee = f.type === "delivery" ? zone!.fee : 0;
  const now = new Date().toISOString();
  return {
    order: {
      id: randomBytes(12).toString("base64url"),
      ref: `M-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: now,
      status: "awaiting_payment",
      lines,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      customer: { name, phone, ...(email && { email }) },
      fulfilment: {
        type: f.type,
        date,
        slot: f.slot,
        ...(f.type === "delivery" && { zone: zone!.name, address, recipient: text(f.recipient, 80) || undefined, recipientPhone: text(f.recipientPhone, 24) || undefined }),
      },
      cardMessage: text(req.cardMessage, 400) || undefined,
      note: text(req.note, 400) || undefined,
      voiceNote: isUpload(req.voiceNote, "audio") ? req.voiceNote : undefined,
      payment: { method, mode, status: "pending", ref: newPaymentRef() },
      history: [{ status: "awaiting_payment", at: now }],
    },
  };
}

/** Record a payment result. The first time an order becomes paid, the boutique is told. */
export async function recordPayment(id: string, result: "paid" | "failed", origin: string) {
  let becamePaid = false;
  const order = await updateOrder(id, (o) => {
    if (o.payment.status === "paid") return null; // already settled; a late "failed" changes nothing
    if (result === "paid") {
      becamePaid = true;
      return { ...stamp(o, "new"), payment: { ...o.payment, status: "paid", paidAt: new Date().toISOString() } };
    }
    return o.status === "payment_failed" ? null : { ...stamp(o, "payment_failed"), payment: { ...o.payment, status: "failed" } };
  });
  if (order && becamePaid) {
    for (const l of order.lines) if (l.requestId) await markOrdered(l.requestId, order.id);
    await notifyShop(order, origin);
  }
  return order;
}

/** If the order is still waiting on a live payment, ask the provider and record the answer. */
export async function settle(id: string, origin: string) {
  const order = await getOrder(id);
  if (!order || order.payment.status === "paid" || order.payment.mode !== "live") return order;
  const result = await checkPayment(order).catch((e) => (console.error("[manolia] payment check failed:", e), "pending" as const));
  return result === "pending" ? order : recordPayment(id, result, origin);
}

/** Start over with a new attempt (and perhaps the other method) after a failed or abandoned payment. */
export const retryPayment = (id: string, method: PayMethod) =>
  updateOrder(id, (o) => {
    if (o.payment.status === "paid") return null;
    return { ...stamp(o, "awaiting_payment"), payment: { method, mode: paymentMode(method), status: "pending", ref: newPaymentRef() } };
  });

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = { new: "arranging", arranging: "out", out: "done" };

/** The boutique moves a paid order one step forward, or cancels it. */
export const advance = (id: string, to: OrderStatus) =>
  updateOrder(id, (o) => {
    if (to === "cancelled") return o.status === "done" || o.status === "cancelled" ? null : stamp(o, "cancelled");
    return NEXT[o.status] === to ? stamp(o, to) : null;
  });

/** Where this request came from, so links we hand to a payment provider point back at this site. */
export function originOf(req: Request) {
  const fixed = process.env.SITE_URL?.trim();
  if (fixed) return fixed.replace(/\/$/, "");
  const h = req.headers;
  const host = h.get("x-forwarded-host") || h.get("host");
  return host ? `${h.get("x-forwarded-proto") || (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https")}://${host}` : new URL(req.url).origin;
}
