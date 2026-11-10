import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "../../context/CartContext";
import { useLenis } from "../motion/SmoothScroll";
import { formatPrice } from "../../lib/format";
import { ButtonLink } from "../ui/Button";
import { CloseIcon } from "../ui/icons";
import { CartLines } from "./CartLines";

/** Slide-out cart, opened after "Add to cart" on the product page or from the header. */
export function CartDrawer() {
  const { items, count, subtotal, isOpen, closeCart, hasUnavailable } = useCart();
  const lenis = useLenis();
  const panel = useRef(null);
  const { pathname } = useLocation();

  // close when the route changes
  useEffect(() => {
    closeCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return undefined;
    lenis?.stop();
    const previous = document.activeElement;
    const onKey = (e) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() => panel.current?.focus());
    return () => {
      lenis?.start();
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [isOpen, lenis, closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.button
            type="button"
            aria-label="Close cart"
            tabIndex={-1}
            className="absolute inset-0 cursor-default bg-night-deep/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-mist text-ink shadow-2xl outline-none"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            data-lenis-prevent
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <h2 id="cart-title" className="text-3xl">
                Your cart <span className="font-sans text-base text-ink-soft">({count})</span>
              </h2>
              <button type="button" onClick={closeCart} className="grid h-10 w-10 place-items-center rounded-full hover:bg-fog" aria-label="Close cart">
                <CloseIcon />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="grid flex-1 place-items-center px-6 text-center">
                <div>
                  <p className="font-sign text-3xl">Your cart is empty</p>
                  <p className="mt-2 text-ink-soft">Add something from the shops and it will appear here.</p>
                  <ButtonLink to="/shop" className="mt-6" onClick={closeCart}>
                    Shop all products
                  </ButtonLink>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5">
                  <CartLines compact onNavigate={closeCart} />
                </div>
                <div className="border-t border-ink/10 px-5 pb-6 pt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-ink-soft">Estimated total</span>
                    <span className="text-xl font-semibold tabular-nums">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">Delivery is confirmed with you. Pay in cash when it arrives.</p>
                  {hasUnavailable && <p className="mt-2 text-sm font-semibold text-oxblood">Remove unavailable items to continue.</p>}
                  <div className="mt-4 grid gap-2">
                    <ButtonLink
                      to="/checkout"
                      className={hasUnavailable ? "pointer-events-none opacity-50" : ""}
                      aria-disabled={hasUnavailable}
                    >
                      Send my order
                    </ButtonLink>
                    <ButtonLink to="/cart" variant="outline">
                      View cart
                    </ButtonLink>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
