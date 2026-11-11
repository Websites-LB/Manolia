/**
 * What an order is, shared by the checkout, the tracking page, the boutique's board and the API.
 * Nothing in here touches the server, so client components can import it.
 */
import type { Recipe } from "./custom";

export type PayMethod = "whish" | "card";
/** live: a real gateway is configured · test: the built-in test gateway (never in production unless forced) · off */
export type PayMode = "live" | "test" | "off";

/**
 * awaiting_payment → new (paid, the boutique's board rings) → arranging (accepted, on the bench)
 * → out (on its way, or ready to collect) → done. payment_failed and cancelled are the side exits.
 */
export type OrderStatus = "awaiting_payment" | "payment_failed" | "new" | "arranging" | "out" | "done" | "cancelled";

export type OrderLine = { id: string; name: string; detail: string; qty: number; price: number; recipe?: Recipe; /** the florist's-choice request this line was agreed in */ requestId?: string; image?: string };

export type Fulfilment = {
  type: "pickup" | "delivery";
  /** YYYY-MM-DD */
  date: string;
  slot: string;
  zone?: string;
  address?: string;
  recipient?: string;
  recipientPhone?: string;
};

export type Order = {
  id: string;
  /** short reference people can say out loud */
  ref: string;
  createdAt: string;
  status: OrderStatus;
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  customer: { name: string; phone: string; email?: string };
  fulfilment: Fulfilment;
  cardMessage?: string;
  note?: string;
  /** a recorded message the recipient hears by scanning the code on the card */
  voiceNote?: string;
  payment: { method: PayMethod; mode: PayMode; status: "pending" | "paid" | "failed"; /** the id the gateway knows this attempt by */ ref: string; paidAt?: string };
  history: { status: OrderStatus; at: string }[];
};

/** What the customer's tracking page may see: no phone numbers, no address. */
export type PublicOrder = Pick<Order, "id" | "ref" | "createdAt" | "status" | "lines" | "subtotal" | "deliveryFee" | "total" | "history"> & {
  firstName: string;
  fulfilment: Pick<Fulfilment, "type" | "date" | "slot" | "zone">;
  payment: Pick<Order["payment"], "method" | "mode" | "status">;
};

export const toPublic = (o: Order): PublicOrder => ({
  id: o.id,
  ref: o.ref,
  createdAt: o.createdAt,
  status: o.status,
  lines: o.lines,
  subtotal: o.subtotal,
  deliveryFee: o.deliveryFee,
  total: o.total,
  history: o.history,
  firstName: o.customer.name.split(/\s+/)[0],
  fulfilment: { type: o.fulfilment.type, date: o.fulfilment.date, slot: o.fulfilment.slot, zone: o.fulfilment.zone },
  payment: { method: o.payment.method, mode: o.payment.mode, status: o.payment.status },
});

/** What the checkout sends. The server re-prices every line; it never trusts a total from the browser. */
export type OrderRequest = {
  lines: { id: string; qty: number; recipe?: Recipe; requestId?: string }[];
  customer: { name: string; phone: string; email?: string };
  fulfilment: Fulfilment;
  cardMessage?: string;
  note?: string;
  voiceNote?: string;
  method: PayMethod;
};

export const PAY_LABEL: Record<PayMethod, string> = { whish: "Whish", card: "Card" };

/** The steps a customer follows, in order. */
export const TRACK: { status: OrderStatus; title: string; pickup?: string; line: string }[] = [
  { status: "new", title: "Received", line: "Paid, and on the boutique's screen." },
  { status: "arranging", title: "Being arranged", line: "Accepted. Your flowers are on the bench." },
  { status: "out", title: "On its way", pickup: "Ready to collect", line: "Wrapped, tagged and out of our hands soon." },
  { status: "done", title: "Delivered", pickup: "Collected", line: "Enjoy them." },
];

export const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export const prettyDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
