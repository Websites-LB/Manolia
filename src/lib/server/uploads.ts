/**
 * Photos sent in a conversation and voice notes recorded for a card. Files are checked by their
 * first bytes (not by what the browser claims), capped in size, given a random name and kept under
 * .data/uploads. Like the JSON store, this is local disk: production needs object storage instead.
 */
import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import { DATA_DIR } from "./store";

const DIR = path.join(DATA_DIR, "uploads");
const KINDS = {
  jpg: { type: "image/jpeg", max: 6e6 },
  png: { type: "image/png", max: 6e6 },
  webp: { type: "image/webp", max: 6e6 },
  webm: { type: "audio/webm", max: 2.5e6 },
  m4a: { type: "audio/mp4", max: 2.5e6 },
  ogg: { type: "audio/ogg", max: 2.5e6 },
} as const;
type Ext = keyof typeof KINDS;
const NAME = /^[A-Za-z0-9_-]{16}\.(jpg|png|webp|webm|m4a|ogg)$/;

function sniff(b: Buffer): Ext | null {
  const at = (s: string, o = 0) => b.subarray(o, o + s.length).toString("latin1") === s;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (at("\x89PNG\r\n\x1a\n")) return "png";
  if (at("RIFF") && at("WEBP", 8)) return "webp";
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return "webm";
  if (at("ftyp", 4)) return "m4a";
  if (at("OggS")) return "ogg";
  return null;
}

export async function saveUpload(file: File, want: "image" | "audio"): Promise<{ id: string } | { error: string }> {
  if (file.size > 6e6) return { error: "That file is too large." };
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext || !KINDS[ext].type.startsWith(want)) return { error: want === "image" ? "Please choose a JPEG, PNG or WebP photo." : "That recording could not be read." };
  if (buf.length > KINDS[ext].max) return { error: "That file is too large." };
  const id = `${randomBytes(12).toString("base64url")}.${ext}`;
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, id), buf);
  return { id };
}

export async function readUpload(id: string) {
  if (!NAME.test(id)) return null;
  try {
    return { body: await fs.readFile(path.join(DIR, id)), type: KINDS[id.split(".")[1] as Ext].type };
  } catch {
    return null;
  }
}

export const isUpload = (id: unknown, want: "image" | "audio"): id is string => typeof id === "string" && NAME.test(id) && KINDS[id.split(".")[1] as Ext].type.startsWith(want);
