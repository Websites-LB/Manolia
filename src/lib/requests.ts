/**
 * A florist's-choice request: the customer's brief, and the conversation it opens with the boutique.
 * The florist replies, can attach photos, and sends a proposal (what they would make, and the price);
 * the customer reacts, asks for changes or accepts, and only then pays. Client-safe: no server code.
 */
import type { Brief } from "./custom";

export type Proposal = { title: string; price: number; note?: string; image?: string };

export type Msg = {
  id: string;
  from: "customer" | "florist";
  at: string;
  text?: string;
  /** an uploaded photo (see /api/uploads) */
  image?: string;
  /** a florist's message can carry a proposal the customer can accept */
  proposal?: Proposal;
};

/** open: waiting on the florist · proposed: a proposal is on the table · accepted: said yes, not paid yet · ordered: paid · closed */
export type RequestStatus = "open" | "proposed" | "accepted" | "ordered" | "closed";

export type FlowerRequest = {
  id: string;
  ref: string;
  createdAt: string;
  status: RequestStatus;
  brief: Brief;
  customer: { name: string; phone: string; email?: string };
  /** YYYY-MM-DD, if they told us */
  neededBy?: string;
  messages: Msg[];
  /** the proposal the customer accepted */
  accepted?: Proposal & { msgId: string; at: string };
  orderId?: string;
  /** when each side last looked, for the unread marks */
  seen: { customer: string; florist: string };
};

/** What the customer's page gets: their own thread, without the phone number echoed back. */
export type PublicRequest = Omit<FlowerRequest, "customer" | "seen"> & { firstName: string };

export const toPublicRequest = (r: FlowerRequest): PublicRequest => {
  const { customer, seen: _seen, ...rest } = r;
  void _seen;
  return { ...rest, firstName: customer.name.split(/\s+/)[0] };
};

/** The bag line an accepted proposal becomes. The server looks the price up again by id. */
export type RequestLine = { id: string; title: string; price: number; brief: Brief; image?: string };

export const unreadFor = (r: FlowerRequest, who: "customer" | "florist") => r.messages.filter((m) => m.from !== who && m.at > r.seen[who]).length;

export const uploadUrl = (id: string) => `/api/uploads/${id}`;

export const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
export const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
