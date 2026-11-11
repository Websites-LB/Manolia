"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

/** The code that goes on the card: scanning it opens the page that plays the sender's voice note. */
export function VoiceCode({ id }: { id: string }) {
  const [src, setSrc] = useState("");
  const url = typeof window === "undefined" ? "" : `${window.location.origin}/note/${id}`;
  useEffect(() => {
    if (url) QRCode.toDataURL(url, { margin: 1, width: 320, color: { dark: "#0f1b13", light: "#f1ece2" } }).then(setSrc).catch(() => setSrc(""));
  }, [url]);
  return (
    <span className="flex items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- generated in the browser */}
      {src && <img src={src} alt="QR code for the voice note" className="h-24 w-24 rounded-[4px]" />}
      <span className="flex flex-col items-start gap-1.5">
        <a href={url} target="_blank" rel="noreferrer" className="link-u text-[13px] text-blush">
          Listen to it
        </a>
        {src && (
          <a href={src} download={`manolia-voice-note-${id.slice(0, 6)}.png`} className="link-u text-[13px] text-line/70">
            Download the code
          </a>
        )}
      </span>
    </span>
  );
}
