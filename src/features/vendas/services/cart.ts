import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  code: string;
  name: string;
  image?: string;
  color?: string;
  size?: string;
  qty: number;
  retailPrice: number;
  wholesalePrice: number;
}

interface CartState {
  items: CartItem[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: CartItem) => void;
  remove: (idx: number) => void;
  setQty: (idx: number, qty: number) => void;
  clear: () => void;
  totalQty: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      open: false,
      setOpen: (v) => set({ open: v }),
      add: (item) =>
        set((s) => {
          const idx = s.items.findIndex(
            (i) => i.productId === item.productId && i.color === item.color && i.size === item.size,
          );
          if (idx >= 0) {
            const items = [...s.items];
            items[idx] = { ...items[idx], qty: items[idx].qty + item.qty };
            return { items, open: true };
          }
          return { items: [...s.items, item], open: true };
        }),
      remove: (idx) => set((s) => ({ items: s.items.filter((_, i) => i !== idx) })),
      setQty: (idx, qty) =>
        set((s) => {
          const items = [...s.items];
          items[idx] = { ...items[idx], qty: Math.max(1, qty) };
          return { items };
        }),
      clear: () => set({ items: [] }),
      totalQty: () => get().items.reduce((a, b) => a + b.qty, 0),
    }),
    { name: "comamor-cart" },
  ),
);
