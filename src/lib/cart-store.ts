"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { briefSummary, cleanBrief, cleanRecipe, recipeKey, recipePrice, recipeSummary, type Brief, type Recipe } from "./custom";
import type { RequestLine } from "./requests";
import { PRODUCTS, type Product } from "./products";

/** A shop piece by id, a bouquet the customer composed (recipe), or a florist's proposal they accepted (request). */
export type Line = { id: string; qty: number; recipe?: Recipe; request?: RequestLine };

type CartState = {
  lines: Line[];
  open: boolean;
  add: (id: string) => void;
  addCustom: (recipe: Recipe) => void;
  /** an accepted proposal: one per request, replacing any earlier version of it */
  addRequest: (request: RequestLine) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

const bump = (lines: Line[], line: Line) => (lines.some((l) => l.id === line.id) ? lines.map((l) => (l.id === line.id ? { ...l, qty: l.qty + 1 } : l)) : [...lines, line]);

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      add: (id) => set((s) => ({ open: true, lines: bump(s.lines, { id, qty: 1 }) })),
      addCustom: (recipe) => set((s) => ({ open: true, lines: bump(s.lines, { id: recipeKey(recipe), qty: 1, recipe }) })),
      addRequest: (request) => set((s) => ({ lines: [...s.lines.filter((l) => l.id !== `request:${request.id}`), { id: `request:${request.id}`, qty: 1, request }] })),
      setQty: (id, qty) =>
        set((s) => ({ lines: qty <= 0 ? s.lines.filter((l) => l.id !== id) : s.lines.map((l) => (l.id === id ? { ...l, qty: Math.min(20, qty) } : l)) })),
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

export type CartItem = { id: string; qty: number; name: string; detail: string; price: number; product?: Product; recipe?: Recipe; brief?: Brief; /** a photo the florist sent of it */ image?: string; request?: RequestLine };

/** Resolve stored lines into things that can be shown and priced; anything unknown is dropped. */
export function cartItems(lines: Line[]): CartItem[] {
  const out: CartItem[] = [];
  for (const l of lines) {
    if (l.request) {
      const brief = cleanBrief(l.request.brief);
      if (brief && typeof l.request.price === "number") out.push({ id: l.id, qty: 1, name: l.request.title || "Florist's choice", detail: briefSummary(brief), price: l.request.price, brief, image: l.request.image, request: l.request });
      continue;
    }
    if (l.recipe) {
      const recipe = cleanRecipe(l.recipe);
      if (recipe) out.push({ id: l.id, qty: l.qty, name: "Your bouquet", detail: recipeSummary(recipe), price: recipePrice(recipe), recipe });
      continue;
    }
    const product = PRODUCTS.find((p) => p.id === l.id);
    if (product) out.push({ id: l.id, qty: l.qty, name: product.name, detail: product.stems, price: product.price, product });
  }
  return out;
}

export const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
