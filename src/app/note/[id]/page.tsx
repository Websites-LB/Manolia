import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { uploadUrl } from "@/lib/requests";
import { isUpload } from "@/lib/server/uploads";

export const metadata: Metadata = { title: "A message for you · Manolia", robots: { index: false } };

/** Where the code on the card leads: the sender's voice, and nothing else. */
export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUpload(id, "audio")) notFound();
  return (
    <main className="night-glow flex min-h-[100svh] flex-col items-center justify-center px-6 py-16 text-center text-line">
      <p className="display text-[32px] text-paper">Manolia</p>
      <h1 className="display mt-10 text-[clamp(56px,11vw,150px)] text-paper">
        Someone has
        <br />
        <em>something to say.</em>
      </h1>
      <p className="mt-6 max-w-[34ch] text-[15px] leading-relaxed text-line/65">These flowers came with a message, recorded for you. Turn the sound on.</p>
      <audio controls src={uploadUrl(id)} className="mt-10 w-full max-w-sm" />
    </main>
  );
}
