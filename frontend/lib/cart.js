"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { idbGet, idbSet } from "./idb";

const CartContext = createContext(null);
const KEY = "cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    idbGet(KEY).then((saved) => {
      if (Array.isArray(saved)) setItems(saved);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) idbSet(KEY, items);
  }, [items, hydrated]);

  const add = useCallback((product, qty = 1) => {
    if (product.stock <= 0) return { ok: false, message: "This product is out of stock." };
    let result = { ok: true };
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      const current = existing ? existing.quantity : 0;
      const next = Math.min(current + qty, product.stock);
      if (next === current) {
        result = { ok: false, message: `You already have all ${product.stock} available units in your cart.` };
        return prev;
      }
      if (next < current + qty) result = { ok: true, message: `Only ${product.stock} available, quantity adjusted.` };
      const line = {
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        stock: product.stock,
        quantity: next,
      };
      return existing ? prev.map((i) => (i.id === product.id ? line : i)) : [...prev, line];
    });
    return result;
  }, []);

  const setQty = useCallback((id, qty) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, quantity: Math.min(qty, Math.max(i.stock, 1)) } : i))
    );
  }, []);

  const remove = useCallback((id) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  // Bring saved lines in line with the latest catalog: price, stock, deleted products.
  const reconcile = useCallback((products) => {
    setItems((prev) => {
      const byId = new Map(products.map((p) => [p.id, p]));
      let changed = false;
      const next = [];
      for (const line of prev) {
        const p = byId.get(line.id);
        if (!p) {
          changed = true;
          continue;
        }
        const quantity = p.stock > 0 ? Math.min(line.quantity, p.stock) : line.quantity;
        const merged = { ...line, name: p.name, price: p.price, image_url: p.image_url, stock: p.stock, quantity };
        if (JSON.stringify(merged) !== JSON.stringify(line)) changed = true;
        next.push(merged);
      }
      return changed ? next : prev;
    });
  }, []);

  const value = useMemo(
    () => ({
      items,
      hydrated,
      count: items.reduce((n, i) => n + i.quantity, 0),
      total: items.reduce((n, i) => n + i.price * i.quantity, 0),
      add,
      setQty,
      remove,
      clear,
      reconcile,
    }),
    [items, hydrated, add, setQty, remove, clear, reconcile]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
