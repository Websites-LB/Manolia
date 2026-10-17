"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { PRODUCTS, type Product } from "./products";

type Line = { id: string; qty: number };

type CartState = {
  lines: Line[];
  open: boolean;
  add: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      add: (id) =>
        set((s) => {
          const hit = s.lines.find((l) => l.id === id);
          return {
            open: true,
            lines: hit ? s.lines.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l)) : [...s.lines, { id, qty: 1 }],
          };
        }),
      setQty: (id, qty) =>
        set((s) => ({ lines: qty <= 0 ? s.lines.filter((l) => l.id !== id) : s.lines.map((l) => (l.id === id ? { ...l, qty } : l)) })),
      clear: () => set({ lines: [] }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "manolia-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
    },
  ),
);

export function cartItems(lines: Line[]) {
  return lines
    .map((l) => ({ ...l, product: PRODUCTS.find((p) => p.id === l.id) }))
    .filter((l): l is Line & { product: Product } => !!l.product);
}

export const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
