"use client";

import dynamic from "next/dynamic";

/** The bag's panel (and the dialog code under it) loads after the page is interactive. */
export const CartSheet = dynamic(() => import("./cart-sheet").then((m) => m.CartSheet), { ssr: false });
