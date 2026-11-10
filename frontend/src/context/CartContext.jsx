import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getProducts } from "../services/store";

// Cart kept in localStorage so it survives refreshes (proposal §8).
// Prices here are for display only — the server recalculates them when an order is placed.
const STORAGE_KEY = "diagon-cart-v1";
const CartContext = createContext(null);

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.productId && item.quantity > 0) : [];
  } catch {
    return [];
  }
}

const toItem = (product, quantity) => ({
  productId: product.id,
  slug: product.slug,
  name: product.name,
  sku: product.sku,
  price: product.finalPrice,
  regularPrice: product.price,
  image: product.images?.[0]?.url || null,
  stock: product.stock,
  available: product.inStock,
  quantity,
});

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full or blocked — the cart still works for this visit */
    }
  }, [items]);

  const add = useCallback((product, quantity = 1) => {
    setItems((current) => {
      const max = Math.max(1, product.stock ?? 99);
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...toItem(product, Math.min(max, item.quantity + quantity)) }
            : item,
        );
      }
      return [...current, toItem(product, Math.min(max, quantity))];
    });
  }, []);

  const setQuantity = useCallback((productId, quantity) => {
    setItems((current) =>
      current
        .map((item) =>
          item.productId === productId ? { ...item, quantity: Math.max(0, Math.min(Math.max(1, item.stock ?? 99), quantity)) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const remove = useCallback((productId) => setItems((current) => current.filter((i) => i.productId !== productId)), []);
  const clear = useCallback(() => setItems([]), []);

  /**
   * Re-reads every cart product from the API: updates names, prices and stock,
   * and marks products that were removed or hidden as unavailable.
   */
  const refresh = useCallback(async () => {
    const ids = load().map((item) => item.productId);
    if (!ids.length) return;
    const { items: fresh } = await getProducts({ ids: ids.join(","), limit: 60 });
    setItems((current) =>
      current.map((item) => {
        const product = fresh.find((p) => p.id === item.productId);
        if (!product) return { ...item, available: false };
        const max = Math.max(1, product.stock);
        return toItem(product, Math.min(max, item.quantity));
      }),
    );
  }, []);

  const value = useMemo(() => {
    const orderable = items.filter((item) => item.available !== false);
    return {
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: orderable.reduce((sum, item) => sum + item.price * item.quantity, 0),
      savings: orderable.reduce((sum, item) => sum + Math.max(0, (item.regularPrice ?? item.price) - item.price) * item.quantity, 0),
      hasUnavailable: items.some((item) => item.available === false),
      add,
      setQuantity,
      remove,
      clear,
      refresh,
      isOpen,
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
    };
  }, [items, add, setQuantity, remove, clear, refresh, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
