import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RequestRoom } from "@/components/request/request-room";
import { toPublicRequest } from "@/lib/requests";
import { getRequest } from "@/lib/server/requests";

export const metadata: Metadata = { title: "Your florist · Manolia", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const request = await getRequest((await params).id);
  if (!request) notFound();
  return <RequestRoom initial={toPublicRequest(request)} />;
}
