import { readUpload } from "@/lib/server/uploads";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const file = await readUpload((await params).id);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.body), { headers: { "Content-Type": file.type, "Cache-Control": "private, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline" } });
}
