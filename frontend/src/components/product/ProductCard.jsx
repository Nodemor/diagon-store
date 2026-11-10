import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "../../context/CartContext";
import { imageAt } from "../../lib/format";
import { PriceTag } from "../ui/PriceTag";
import { CheckIcon, PlusIcon } from "../ui/icons";
import { Img } from "../ui/Img";

/**
 * Product tile used on the home page and (Phase 3) the shop grid.
 * The add button confirms with a tick so the shopper sees the cart changed.
 */
export function ProductCard({ product, priority = false }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef();
  const [main, hover] = product.images || [];

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleAdd = () => {
    add(product, 1);
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className="group relative">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-fog-deep">
        <Link to={`/product/${product.slug}`} className="absolute inset-0" tabIndex={-1} aria-hidden="true">
          {main && (
            <Img
              src={imageAt(main.url, 600)}
              srcSet={`${imageAt(main.url, 400)} 400w, ${imageAt(main.url, 800)} 800w`}
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
              alt=""
              loading={priority ? "eager" : "lazy"}
              className="h-full w-full object-cover transition-transform duration-700 ease-alley group-hover:scale-[1.04]"
            />
          )}
          {hover && (
            <Img
              src={imageAt(hover.url, 600)}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.onSale && (
            <span className="rounded-full bg-oxblood px-2.5 py-1 text-xs font-semibold text-white">
              {product.discountPercent}% off
            </span>
          )}
          {product.isNewArrival && !product.onSale && (
            <span className="rounded-full bg-verdigris-deep px-2.5 py-1 text-xs font-semibold text-white">New</span>
          )}
          {!product.inStock && (
            <span className="rounded-full bg-night px-2.5 py-1 text-xs font-semibold text-moon">Out of stock</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!product.inStock}
          aria-label={added ? `${product.name} added to cart` : `Add ${product.name} to cart`}
          className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-mist text-ink shadow-[0_6px_20px_-6px_rgb(28_34_48/0.45)] transition-colors duration-300 hover:bg-lamp disabled:hidden"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={added ? "added" : "add"}
              initial={{ scale: 0.4, opacity: 0, rotate: added ? -30 : 30 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className={added ? "text-verdigris-deep" : ""}
            >
              {added ? <CheckIcon /> : <PlusIcon />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      <div className="mt-3.5 px-0.5">
        {product.category && <p className="text-[0.8rem] text-ink-soft">{product.category.name}</p>}
        <h3 className="mt-0.5 line-clamp-2 font-sans text-[0.98rem] font-semibold leading-snug tracking-normal">
          <Link to={`/product/${product.slug}`} className="hover:underline hover:decoration-ink/30 hover:underline-offset-4">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1.5">
          <PriceTag product={product} />
        </div>
      </div>
    </article>
  );
}
