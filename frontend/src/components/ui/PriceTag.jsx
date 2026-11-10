import { formatPrice } from "../../lib/format";

/** Sale price with the original struck through (proposal §18: Original → Sale). */
export function PriceTag({ product, size = "md", tone = "fog" }) {
  const large = size === "lg";
  const muted = tone === "night" ? "text-moon-soft" : "text-ink-soft";

  return (
    <p className="flex flex-wrap items-baseline gap-x-2 tabular-nums">
      <span className={`font-semibold ${large ? "text-2xl" : "text-base"}`}>
        <span className="sr-only">{product.onSale ? "Sale price " : "Price "}</span>
        {formatPrice(product.finalPrice)}
      </span>
      {product.onSale && (
        <s className={`${muted} ${large ? "text-base" : "text-sm"}`}>
          <span className="sr-only">Was </span>
          {formatPrice(product.price)}
        </s>
      )}
    </p>
  );
}
