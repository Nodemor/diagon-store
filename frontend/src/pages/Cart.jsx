import { useEffect } from "react";
import { useCart } from "../context/CartContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { formatPrice } from "../lib/format";
import { CartLines } from "../components/cart/CartLines";
import { ButtonLink } from "../components/ui/Button";

// /cart (proposal §8): change quantities, remove items, see the estimated total.
export default function Cart() {
  const { items, count, subtotal, savings, refresh, hasUnavailable, clear } = useCart();
  usePageTitle("Your cart");

  // pick up price / stock changes since the items were added
  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  return (
    <section className="bg-fog">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:px-8">
        <h1 className="text-[clamp(2.6rem,6vw,4.5rem)]">Your cart</h1>

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-mist p-10 text-center">
            <p className="font-sign text-3xl">Nothing here yet</p>
            <p className="mx-auto mt-2 max-w-sm text-ink-soft">Browse the shops and add what you like. Your cart is saved on this device.</p>
            <ButtonLink to="/shop" className="mt-6">Shop all products</ButtonLink>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
            <div>
              <div className="flex items-baseline justify-between border-b border-ink/10 pb-3 text-sm text-ink-soft">
                <span>{count} item{count === 1 ? "" : "s"}</span>
                <button type="button" onClick={clear} className="underline underline-offset-4 hover:text-oxblood">Empty cart</button>
              </div>
              <CartLines />
              <ButtonLink to="/shop" variant="quiet" className="mt-6">Continue shopping</ButtonLink>
            </div>

            <aside className="h-fit rounded-2xl bg-mist p-6 lg:sticky lg:top-28" aria-label="Order summary">
              <h2 className="text-3xl">Summary</h2>
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Subtotal</dt>
                  <dd className="tabular-nums">{formatPrice(subtotal + savings)}</dd>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-oxblood">
                    <dt>Offer savings</dt>
                    <dd className="tabular-nums">− {formatPrice(savings)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Delivery</dt>
                  <dd>Confirmed with you</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-ink/10 pt-3">
                  <dt className="font-semibold">Estimated total</dt>
                  <dd className="text-2xl font-semibold tabular-nums">{formatPrice(subtotal)}</dd>
                </div>
              </dl>
              {hasUnavailable && <p className="mt-4 text-sm font-semibold text-oxblood">Remove unavailable items to continue.</p>}
              <ButtonLink
                to="/checkout"
                className={`mt-6 w-full ${hasUnavailable ? "pointer-events-none opacity-50" : ""}`}
                aria-disabled={hasUnavailable}
              >
                Send my order
              </ButtonLink>
              <p className="mt-3 text-center text-xs text-ink-soft">Send it on WhatsApp or by email. Pay in cash on delivery.</p>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
