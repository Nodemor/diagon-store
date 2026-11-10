import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "../../context/CartContext";
import { formatPrice, imageAt } from "../../lib/format";
import { QuantityStepper } from "../ui/QuantityStepper";
import { TrashIcon } from "../ui/icons";
import { Img } from "../ui/Img";

/** Cart rows shared by the drawer and the /cart page. Removed rows collapse smoothly. */
export function CartLines({ compact = false, onNavigate }) {
  const { items, setQuantity, remove } = useCart();

  return (
    <ul className="divide-y divide-ink/10">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.li
            key={item.productId}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className={`grid gap-4 py-4 ${compact ? "grid-cols-[4.5rem_1fr]" : "grid-cols-[5.5rem_1fr] sm:grid-cols-[7rem_1fr]"}`}>
              <Link to={`/product/${item.slug}`} onClick={onNavigate} className="block aspect-[4/5] overflow-hidden rounded-xl bg-fog-deep">
                {item.image && <Img src={imageAt(item.image, 240)} alt="" className="h-full w-full object-cover" loading="lazy" />}
              </Link>

              <div className="flex min-w-0 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/product/${item.slug}`} onClick={onNavigate} className="line-clamp-2 font-semibold leading-snug hover:underline">
                      {item.name}
                    </Link>
                    {item.sku && <p className="mt-0.5 text-xs text-ink-soft">Code {item.sku}</p>}
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                </div>

                {item.available === false ? (
                  <p className="mt-2 text-sm font-semibold text-oxblood">No longer available. Remove it to continue.</p>
                ) : (
                  item.quantity > 1 && <p className="mt-1 text-xs text-ink-soft">{formatPrice(item.price)} each</p>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                  {item.available === false ? (
                    <span />
                  ) : (
                    <QuantityStepper
                      size="sm"
                      value={item.quantity}
                      max={Math.max(1, item.stock ?? 99)}
                      onChange={(q) => setQuantity(item.productId, q)}
                      label={`Quantity of ${item.name}`}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => remove(item.productId)}
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm text-ink-soft transition-colors hover:text-oxblood"
                  >
                    <TrashIcon width={16} height={16} />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
