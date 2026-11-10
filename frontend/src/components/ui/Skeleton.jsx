/** Loading placeholder that matches the ProductCard footprint. */
export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="aspect-[4/5] rounded-[1.25rem] bg-fog-deep" />
      <div className="mt-4 h-4 w-3/4 rounded bg-fog-deep" />
      <div className="mt-2 h-3 w-1/3 rounded bg-fog-deep" />
      <div className="mt-3 h-4 w-1/4 rounded bg-fog-deep" />
    </div>
  );
}
