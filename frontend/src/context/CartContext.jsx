import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Cart kept in localStorage so it survives refreshes (proposal §8).
// Prices here are for display only — the server recalculates them when an order is placed.
const STORAGE_KEY = "diagon-cart-v1";
const CartContext = createContext(null);

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full or blocked — cart still works for this visit */
    }
  }, [items]);

  const add = useCallback((product, quantity = 1) => {
    setItems((current) => {
      const max = Math.max(1, product.stock ?? 99);
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id ? { ...item, quantity: Math.min(max, item.quantity + quantity) } : item,
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          sku: product.sku,
          price: product.finalPrice,
          image: product.images?.[0]?.url || null,
          stock: product.stock,
          quantity: Math.min(max, quantity),
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((productId, quantity) => {
    setItems((current) =>
      current
        .map((item) =>
          item.productId === productId ? { ...item, quantity: Math.max(0, Math.min(item.stock ?? 99, quantity)) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const remove = useCallback((productId) => setItems((current) => current.filter((i) => i.productId !== productId)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [items, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
