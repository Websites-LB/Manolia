/** Florist's-choice requests: opening one, the conversation, proposals, and accepting. */
import { randomBytes } from "crypto";
import { z } from "zod";

import { BUDGET_MAX, cleanBrief } from "../custom";
import type { FlowerRequest, Msg, Proposal } from "../requests";
import { collection } from "./store";

const requests = collection<FlowerRequest>("requests");
export const listRequests = requests.list;
export const getRequest = requests.get;

const id = (n = 12) => randomBytes(n).toString("base64url");
const UPLOAD = /^[A-Za-z0-9_-]{16}\.(jpg|png|webp)$/;

const Open = z.object({
  brief: z.unknown(),
  customer: z.object({
    name: z.string().trim().min(2, "Please tell us your name.").max(80),
    phone: z.string().trim().max(24).refine((p) => p.replace(/\D/g, "").length >= 7, "Please give a phone number we can reach you on."),
    email: z.union([z.literal(""), z.string().trim().email("That email address does not look right.").max(120)]).optional(),
  }),
  neededBy: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
});

export async function openRequest(input: unknown): Promise<{ request: FlowerRequest } | { error: string }> {
  const parsed = Open.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Please check the form." };
  const brief = cleanBrief(parsed.data.brief);
  if (!brief) return { error: "Please choose an occasion, colours and a budget." };
  const now = new Date().toISOString();
  const { name, phone, email } = parsed.data.customer;
  const request = await requests.create({
    id: id(),
    ref: `R-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: now,
    status: "open",
    brief,
    customer: { name, phone, ...(email && { email }) },
    ...(parsed.data.neededBy && { neededBy: parsed.data.neededBy }),
    messages: [],
    seen: { customer: now, florist: "" },
  });
  return { request };
}

const Message = z.object({
  text: z.string().trim().max(1200).optional(),
  image: z.string().regex(UPLOAD).optional(),
  proposal: z
    .object({
      title: z.string().trim().min(2, "Give the proposal a name.").max(80),
      price: z.number().int().min(5, "The price is too low.").max(BUDGET_MAX * 2),
      note: z.string().trim().max(600).optional(),
      image: z.string().regex(UPLOAD).optional(),
    })
    .optional(),
});

/** Add a message from either side. Only the florist may attach a proposal. */
export async function addMessage(rid: string, from: Msg["from"], input: unknown): Promise<{ request: FlowerRequest } | { error: string; status: number }> {
  const parsed = Message.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "That message could not be read.", status: 400 };
  const { text, image } = parsed.data;
  const proposal: Proposal | undefined = from === "florist" ? parsed.data.proposal : undefined;
  if (!text && !image && !proposal) return { error: "Write something first.", status: 400 };
  const now = new Date().toISOString();
  let refused = "";
  const request = await requests.update(rid, (r) => {
    if (r.status === "ordered" || r.status === "closed") return (refused = "This conversation is closed."), null;
    if (r.messages.length >= 400) return (refused = "This conversation is full. Please call the boutique."), null;
    const msg: Msg = { id: id(6), from, at: now, ...(text && { text }), ...(image && { image }), ...(proposal && { proposal }) };
    // a new proposal, or a customer asking for a change, puts an earlier yes back on the table
    const status = proposal ? "proposed" : from === "customer" && r.status === "accepted" ? "proposed" : r.status;
    return { ...r, status, ...(status !== "accepted" && { accepted: undefined }), messages: [...r.messages, msg], seen: { ...r.seen, [from]: now } };
  });
  if (!request) return { error: "Request not found.", status: 404 };
  if (refused) return { error: refused, status: 409 };
  return { request };
}

/** The customer says yes to one proposal. */
export async function acceptProposal(rid: string, msgId: string) {
  const now = new Date().toISOString();
  let ok = false;
  const request = await requests.update(rid, (r) => {
    const m = r.messages.find((x) => x.id === msgId && x.proposal);
    if (!m?.proposal || r.status === "ordered" || r.status === "closed") return null;
    ok = true;
    return { ...r, status: "accepted", accepted: { ...m.proposal, msgId, at: now }, seen: { ...r.seen, customer: now } };
  });
  return ok ? request : null;
}

export const markSeen = (rid: string, who: "customer" | "florist") =>
  requests.update(rid, (r) => {
    const last = r.messages.at(-1)?.at ?? r.createdAt;
    return r.seen[who] >= last ? null : { ...r, seen: { ...r.seen, [who]: new Date().toISOString() } };
  });

export const closeRequest = (rid: string) => requests.update(rid, (r) => (r.status === "ordered" || r.status === "closed" ? null : { ...r, status: "closed" }));

/** Once the order made from a request is paid, the request is done. */
export const markOrdered = (rid: string, orderId: string) => requests.update(rid, (r) => ({ ...r, status: "ordered", orderId }));
