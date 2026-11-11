import { NextResponse } from "next/server";

import { tooMany } from "@/lib/server/guard";
import { saveUpload } from "@/lib/server/uploads";

/** A photo for a conversation, or a voice note for a card. Returns the id to attach. */
export async function POST(req: Request) {
  const limited = tooMany(req, "upload", 20, 10 * 60_000);
  if (limited) return limited;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const kind = form?.get("kind") === "audio" ? "audio" : "image";
  if (!(file instanceof File)) return NextResponse.json({ error: "No file was sent." }, { status: 400 });
  const saved = await saveUpload(file, kind);
  if ("error" in saved) return NextResponse.json({ error: saved.error }, { status: 400 });
  return NextResponse.json(saved);
}
