"use client";

import dynamic from "next/dynamic";

const Sonner = dynamic(() => import("sonner").then((m) => m.Toaster), { ssr: false });

/** Toasts, styled as a slip of paper. Loaded after the page: nothing can toast before then. */
export function Toaster() {
  return <Sonner position="bottom-center" toastOptions={{ unstyled: true, classNames: { toast: "flex flex-col gap-0.5 rounded-[10px] bg-paper px-5 py-3.5 text-ink shadow-[0_24px_60px_-20px_rgb(0_0_0/0.7)]", title: "label", description: "text-[13px] text-ink/60" } }} />;
}
