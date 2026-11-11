"use client";

import { Mic, Square, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { upload } from "@/components/request/thread";
import { uploadUrl } from "@/lib/requests";

const MAX = 30;

/**
 * Say it out loud: the sender records up to thirty seconds, and the boutique prints a small code on
 * the card. Whoever receives the flowers scans it and hears the message in the sender's own voice.
 */
export function VoiceNote({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [state, setState] = useState<"idle" | "recording" | "saving">("idle");
  const [left, setLeft] = useState(MAX);
  const [error, setError] = useState("");
  const [can, setCan] = useState(true);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef(0);

  useEffect(() => {
    setCan(typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia);
    return () => {
      clearInterval(timer.current);
      rec.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = async () => {
        clearInterval(timer.current);
        stream.getTracks().forEach((t) => t.stop());
        setState("saving");
        try {
          const type = r.mimeType.split(";")[0] || "audio/webm";
          onChange(await upload(new File(chunks, "note", { type }), "audio"));
        } catch (e) {
          setError(e instanceof Error ? e.message : "The recording could not be saved.");
        }
        setState("idle");
      };
      rec.current = r;
      r.start();
      setLeft(MAX);
      setState("recording");
      timer.current = window.setInterval(() => setLeft((s) => (s <= 1 ? (r.state === "recording" && r.stop(), 0) : s - 1)), 1000);
    } catch {
      setError("We could not use the microphone. Allow it in your browser and try again.");
    }
  }

  if (!can) return null;
  return (
    <div className="mt-5 rounded-[8px] border border-ink/12 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-[38ch]">
          <p className="display text-[28px]">
            Or say it <em>out loud</em>
          </p>
          <p className="mt-1.5 text-[13px] leading-snug text-ink/55">Record up to {MAX} seconds. We print a small code on the card; they scan it and hear your voice.</p>
        </div>
        {value ? (
          <button type="button" onClick={() => onChange("")} className="label flex items-center gap-2 text-ink/55 hover:text-clay">
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        ) : state === "recording" ? (
          <button type="button" onClick={() => rec.current?.stop()} className="pill bg-clay text-paper">
            <Square className="h-3 w-3 fill-current" /> Stop · <span className="tabular-nums">{left}s</span>
          </button>
        ) : (
          <button type="button" onClick={start} disabled={state === "saving"} className="pill border border-ink/20 text-ink hover:border-night hover:bg-night hover:text-paper disabled:opacity-50">
            <Mic className="h-3.5 w-3.5" /> {state === "saving" ? "Saving…" : "Record a message"}
          </button>
        )}
      </div>
      {state === "recording" && (
        <div className="mt-4 h-px w-full overflow-hidden bg-ink/10">
          <div className="h-full bg-clay transition-[width] duration-1000 ease-linear" style={{ width: `${((MAX - left) / MAX) * 100}%` }} />
        </div>
      )}
      {value && <audio controls src={uploadUrl(value)} className="mt-4 h-10 w-full" />}
      {error && (
        <p role="alert" className="mt-3 text-[13px] text-clay">
          {error}
        </p>
      )}
    </div>
  );
}
