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
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-5 text-line" style={{ background: "linear-gradient(#13241a, #0b140f)" }}>
      <div className="pointer-events-none absolute left-1/2 top-[30%] h-[60vh] w-[70vw] -translate-x-1/2 blur-3xl" style={{ background: "radial-gradient(closest-side, rgb(240 185 174 / 0.14), transparent)" }} />
      <form onSubmit={submit} className="relative w-full max-w-[420px] rounded-[28px] border border-line/12 bg-[#0e1a12]/80 p-7 backdrop-blur-md md:p-9">
        <p className="text-[17px] italic text-line/55">Manolia</p>
        <h1 className="display mt-1 text-[60px] text-paper">
          The <em>bench</em>
        </h1>
        <input
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          placeholder="Passphrase"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="input-dark mt-8"
        />
        {error && (
          <p role="alert" className="mt-3 text-[15px] italic text-blush">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="mt-5 w-full rounded-full bg-paper py-4 text-[18px] text-night transition-colors duration-500 hover:bg-blush disabled:opacity-60">
          Open
        </button>
      </form>
    </main>
  );
}
