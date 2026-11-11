/**
 * Telling the boutique. The order always lands on the atelier board (/atelier); on top of that each
 * channel below is switched on by its environment variables, so Manolia can also be pinged where
 * they already look. A channel that fails is logged and never blocks the order.
 */
import { briefSummary } from "../custom";
import { money, PAY_LABEL, prettyDate, type Order } from "../orders";
import type { FlowerRequest } from "../requests";

const env = (k: string) => process.env[k]?.trim() || "";

export function orderText(o: Order) {
  const f = o.fulfilment;
  return [
    `New order ${o.ref}: ${money(o.total)} paid by ${PAY_LABEL[o.payment.method]}${o.payment.mode === "test" ? " (TEST)" : ""}`,
    "",
    ...o.lines.map((l) => `${l.qty} × ${l.name} (${money(l.price)})\n   ${l.detail}`),
    "",
    f.type === "delivery" ? `Delivery: ${f.zone}, ${f.address}` : "Pick-up at the boutique",
    `When: ${prettyDate(f.date)}, ${f.slot.toLowerCase()}`,
    f.recipient ? `For: ${f.recipient}${f.recipientPhone ? ` (${f.recipientPhone})` : ""}` : "",
    o.cardMessage ? `Card: “${o.cardMessage}”` : "",
    o.note ? `Note: ${o.note}` : "",
    o.voiceNote ? "Voice note recorded: print its code on the card (see the board)" : "",
    "",
    `From: ${o.customer.name}, ${o.customer.phone}`,
  ]
    .filter((l, i, a) => l !== "" || a[i - 1] !== "")
    .join("\n");
}

const post = (url: string, headers: Record<string, string>, body: unknown) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body), cache: "no-store" }).then(async (r) => {
    if (!r.ok) throw new Error(`${r.status} ${await r.text().catch(() => "")}`.slice(0, 300));
  });

/** Send a line of news to every channel the boutique has switched on. */
async function ping(headline: string, text: string, origin: string, template: string[]) {
  const board = `${origin}/atelier`;
  const jobs: [string, Promise<void>][] = [];

  // WhatsApp Business (Cloud API): a pre-approved template with three body variables
  if (env("WHATSAPP_TOKEN") && env("WHATSAPP_PHONE_ID") && env("WHATSAPP_TO"))
    jobs.push([
      "whatsapp",
      post(`https://graph.facebook.com/v21.0/${env("WHATSAPP_PHONE_ID")}/messages`, { Authorization: `Bearer ${env("WHATSAPP_TOKEN")}` }, {
        messaging_product: "whatsapp",
        to: env("WHATSAPP_TO"),
        type: "template",
        template: { name: env("WHATSAPP_TEMPLATE") || "new_order", language: { code: "en" }, components: [{ type: "body", parameters: template.map((t) => ({ type: "text", text: t })) }] },
      }),
    ]);
  if (env("TELEGRAM_BOT_TOKEN") && env("TELEGRAM_CHAT_ID")) jobs.push(["telegram", post(`https://api.telegram.org/bot${env("TELEGRAM_BOT_TOKEN")}/sendMessage`, {}, { chat_id: env("TELEGRAM_CHAT_ID"), text: `${text}\n\n${board}` })]);
  if (env("RESEND_API_KEY") && env("ORDER_EMAIL_TO")) jobs.push(["email", mail(env("ORDER_EMAIL_TO"), headline, `${text}\n\nOpen the board: ${board}`)]);

  console.log(`[manolia] ${headline}`);
  await Promise.all(jobs.map(([name, job]) => job.catch((e) => console.error(`[manolia] ${name} notification failed:`, e))));
}

const mail = (to: string, subject: string, text: string) =>
  post("https://api.resend.com/emails", { Authorization: `Bearer ${env("RESEND_API_KEY")}` }, { from: env("ORDER_EMAIL_FROM") || "Manolia <onboarding@resend.dev>", to, subject, text });

export const notifyShop = (o: Order, origin: string) =>
  ping(`New order ${o.ref} · ${money(o.total)}`, orderText(o), origin, [o.ref, o.lines.map((l) => `${l.qty} × ${l.name}`).join(", "), money(o.total)]);

/** A new florist's-choice request, or a new message from a customer in one. */
export const notifyShopRequest = (r: FlowerRequest, what: "new" | "message" | "accepted", origin: string) => {
  const last = r.messages.filter((m) => m.from === "customer").at(-1);
  const head = what === "new" ? `New request ${r.ref} from ${r.customer.name}` : what === "accepted" ? `${r.customer.name} accepted your proposal (${r.ref})` : `${r.customer.name} replied (${r.ref})`;
  const body = what === "new" ? `${briefSummary(r.brief)}\nBudget: ${money(r.brief.budget)}\nPhone: ${r.customer.phone}` : (last?.text ?? (last?.image ? "(a photo)" : ""));
  return ping(head, `${head}\n\n${body}`, origin, [r.ref, head, money(r.brief.budget)]);
};

/** If the customer left an email and email is switched on, tell them the florist has replied. */
export const notifyCustomerReply = (r: FlowerRequest, origin: string) => {
  if (!r.customer.email || !env("RESEND_API_KEY")) return Promise.resolve();
  return mail(r.customer.email, "Manolia has replied about your flowers", `Hello ${r.customer.name.split(/\s+/)[0]},\n\nThe florist has replied to your request. Read it and answer here:\n${origin}/request/${r.id}\n\nManolia`).catch((e) => console.error("[manolia] customer email failed:", e));
};
