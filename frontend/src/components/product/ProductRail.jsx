import { Link } from "react-router-dom";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "../ui/Skeleton";

/**
 * A titled product section.
 * layout "grid": 2 / 3 / 4 columns.  layout "rail": horizontal scroll-snap row (any width).
 */
export function ProductSection({ id, title, intro, link, products, loading, layout = "grid", tone = "fog" }) {
  if (!loading && (!products || products.length === 0)) return null;

  const list = loading ? Array.from({ length: 4 }, (_, i) => ({ id: `s${i}` })) : products;

  return (
    <section id={id} aria-labelledby={`${id}-title`} className={tone === "mist" ? "bg-mist" : "bg-fog"}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 md:mb-10">
          <div className="max-w-xl">
            <h2 id={`${id}-title`} className="text-[2.25rem] md:text-5xl">
              {title}
            </h2>
            {intro && <p className="mt-3 text-ink-soft">{intro}</p>}
          </div>
          {link && (
            <Link
              to={link.to}
              className="text-sm font-semibold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
            >
              {link.label}
            </Link>
          )}
        </div>

        {layout === "rail" ? (
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:gap-6 sm:px-6 lg:-mx-8 lg:px-8">
            {list.map((product, index) => (
              <div key={product.id} className="w-[68%] shrink-0 snap-start sm:w-[40%] md:w-[30%] lg:w-[23%]">
                {loading ? <ProductCardSkeleton /> : <ProductCard product={product} priority={index < 2} />}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
            {list.map((product) =>
              loading ? <ProductCardSkeleton key={product.id} /> : <ProductCard key={product.id} product={product} />,
            )}
          </div>
        )}
      </div>
    </section>
  );
}
