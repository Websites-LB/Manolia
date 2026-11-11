"use client";

import { useState } from "react";

export function AtelierLogin() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/atelier/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) }).catch(() => null);
    if (res?.ok) return window.location.reload();
    setError("That is not the key.");
    setBusy(false);
  }

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-night px-6 text-line">
      <form onSubmit={submit} className="w-full max-w-sm">
        <p className="label text-line/45">Manolia · Atelier</p>
        <h1 className="display mt-3 text-[64px] text-paper">
          The <em>order board</em>
        </h1>
        <input
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          placeholder="Passphrase"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="mt-8 w-full border-b border-line/25 bg-transparent py-3 text-[16px] text-paper outline-none placeholder:text-line/35 focus:border-paper"
        />
        {error && (
          <p role="alert" className="mt-3 text-[13px] text-blush">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="pill mt-7 w-full justify-center bg-paper text-night hover:bg-blush disabled:opacity-60">
          Open
        </button>
      </form>
    </main>
  );
}
