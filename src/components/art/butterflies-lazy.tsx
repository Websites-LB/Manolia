"use client";

import dynamic from "next/dynamic";

/** The butterflies are decoration: their code loads after the page is interactive, never before. */
export const Butterflies = dynamic(() => import("./butterflies").then((m) => m.Butterflies), { ssr: false });
