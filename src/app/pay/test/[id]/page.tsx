import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TestGateway } from "@/components/order/test-gateway";
import { money, PAY_LABEL } from "@/lib/orders";
import { getOrder } from "@/lib/server/orders-store";

export const metadata: Metadata = { title: "Test payment · Manolia", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Stands in for the payment provider's page while no real gateway is connected. It moves no money
 * and asks for no card or wallet details; it only lets you see both endings of the flow.
 */
export default async function TestPayPage({ params }: { params: Promise<{ id: string }> }) {
  const order = await getOrder((await params).id);
  if (!order || order.payment.mode !== "test") notFound();
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-paper-2 px-4 py-16 text-ink">
      <div className="w-full max-w-md rounded-[10px] bg-paper p-8 shadow-[0_30px_80px_-40px_rgb(18_26_20/0.5)]">
        <p className="label inline-block rounded-full bg-clay/12 px-3 py-1.5 text-clay">Test gateway · no money moves</p>
        <h1 className="display mt-6 text-[52px]">
          {PAY_LABEL[order.payment.method]} <em>payment</em>
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink/60">
          This page stands in for {order.payment.method === "whish" ? "Whish's" : "the bank's"} own payment page until a merchant account is connected. Choose how the payment should end.
        </p>
        <dl className="mt-7 space-y-2 border-y border-ink/10 py-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/55">Merchant</dt>
            <dd>Manolia The Floral Boutique</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/55">Order</dt>
            <dd>{order.ref}</dd>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <dt className="label text-ink/45">Amount</dt>
            <dd className="display text-[44px] tabular-nums">{money(order.total)}</dd>
          </div>
        </dl>
        <TestGateway id={order.id} />
      </div>
    </main>
  );
}
