import type { Metadata } from "next";

import { AtelierBoard } from "@/components/order/atelier-board";
import { AtelierLogin } from "@/components/order/atelier-login";
import { atelierState, isAtelier } from "@/lib/server/atelier-auth";

export const metadata: Metadata = { title: "Atelier · Manolia orders", robots: { index: false } };
export const dynamic = "force-dynamic";

/** The boutique's side of the shop: incoming orders, the way a restaurant's tablet shows them. */
export default async function AtelierPage() {
  const state = atelierState();
  if (state === "unset")
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-night px-6 text-center text-line">
        <p className="max-w-[40ch] text-[15px] leading-relaxed text-line/70">The order board is switched off: set an ATELIER_KEY passphrase in the site&apos;s environment to open it.</p>
      </main>
    );
  return (await isAtelier()) ? <AtelierBoard open={state === "open"} /> : <AtelierLogin />;
}
