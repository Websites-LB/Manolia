"use client";

import { useState } from "react";

export function TestGateway({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  async function end(outcome: "approve" | "decline") {
    setBusy(true);
    await fetch("/api/pay/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: id, outcome }) }).catch(() => null);
    window.location.href = `/api/pay/return?order=${id}`;
  }
  return (
    <div className="mt-6 grid gap-2.5">
      <button onClick={() => end("approve")} disabled={busy} className="pill w-full justify-center bg-night text-paper hover:bg-moss disabled:opacity-60">
        Approve the payment
      </button>
      <button onClick={() => end("decline")} disabled={busy} className="pill w-full justify-center border border-ink/20 text-ink/75 hover:border-ink/50 disabled:opacity-60">
        Decline it
      </button>
    </div>
  );
}
