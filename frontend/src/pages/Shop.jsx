import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { getCategories, getProducts } from "../services/store";
import { useAsync } from "../hooks/useAsync";
import { usePageTitle } from "../hooks/usePageTitle";
import { ScrollTrigger } from "../lib/motion";
import { imageAt } from "../lib/format";
import { useLenis } from "../components/motion/SmoothScroll";
import { ProductCard } from "../components/product/ProductCard";
import { ProductCardSkeleton } from "../components/ui/Skeleton";
import { FilterPanel } from "../components/shop/FilterPanel";
import { Button, ButtonLink } from "../components/ui/Button";
import { CloseIcon, FilterIcon } from "../components/ui/icons";
import { Img } from "../components/ui/Img";

// /shop and /category/:slug (proposal §3 Shop page + Category pages)

const PAGE_SIZE = 12;
const QUERY_KEYS = ["search", "subcategory", "minPrice", "maxPrice", "availability", "featured", "newArrival", "onSale", "sort"];

const SORTS = [
  ["newest", "Newest first"],
  ["popular", "Most viewed"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
  ["name_asc", "Name: A to Z"],
];

const FLAG_LABELS = { onSale: "On offer", newArrival: "New arrivals", featured: "Featured" };

function pageTitle(params, category) {
  if (params.get("search")) return `Results for “${params.get("search")}”`;
  if (category) return category.name;
  if (params.get("onSale") === "true") return "Offers";
  if (params.get("newArrival") === "true") return "New arrivals";
  if (params.get("featured") === "true") return "Featured products";
  return "Shop all products";
}

export default function Shop() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const lenis = useLenis();
  const [drawer, setDrawer] = useState(false);
  const [state, setState] = useState({ items: [], total: 0, page: 1, pages: 1, loading: true, more: false, error: null });

  const { data: categories } = useAsync((signal) => getCategories({ signal }), []);
  const category = slug ? categories?.find((c) => c.slug === slug) : null;
  const categoryMissing = Boolean(slug && categories && !category);

  const query = useMemo(() => {
    const q = { limit: PAGE_SIZE };
    for (const key of QUERY_KEYS) if (params.get(key)) q[key] = params.get(key);
    if (slug) q.category = slug;
    return q;
  }, [params, slug]);
  const queryKey = JSON.stringify(query);

  const title = pageTitle(params, category);
  usePageTitle(category?.metaTitle || title);

  // first page whenever the filters change
  useEffect(() => {
    if (categoryMissing) return undefined;
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    getProducts({ ...query, page: 1 }, { signal: controller.signal })
      .then((res) => {
        setState({ items: res.items, total: res.total, page: 1, pages: res.pages, loading: false, more: false, error: null });
        requestAnimationFrame(() => ScrollTrigger.refresh());
      })
      .catch((error) => error.name !== "AbortError" && setState((s) => ({ ...s, loading: false, error })));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, categoryMissing]);

  const loadMore = async () => {
    setState((s) => ({ ...s, more: true }));
    try {
      const res = await getProducts({ ...query, page: state.page + 1 });
      setState((s) => ({ ...s, items: [...s.items, ...res.items], page: res.page, pages: res.pages, more: false }));
    } catch (error) {
      setState((s) => ({ ...s, more: false, error }));
    }
  };

  /** setParam("onSale", "true") or setParam({ minPrice, maxPrice }) — null removes. */
  const setParam = useCallback(
    (key, value) => {
      const next = new URLSearchParams(params);
      const updates = typeof key === "object" ? key : { [key]: value };
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      }
      setParams(next, { preventScrollReset: true });
    },
    [params, setParams],
  );

  const clearAll = () => {
    const next = new URLSearchParams();
    if (params.get("search")) next.set("search", params.get("search"));
    setParams(next, { preventScrollReset: true });
  };

  const chips = [
    params.get("subcategory") && {
      key: "subcategory",
      label: category?.subcategories?.find((s) => s.slug === params.get("subcategory"))?.name || params.get("subcategory"),
    },
    (params.get("minPrice") || params.get("maxPrice")) && {
      key: ["minPrice", "maxPrice"],
      label: `Rs ${params.get("minPrice") || 0} – ${params.get("maxPrice") ? `Rs ${params.get("maxPrice")}` : "any"}`,
    },
    params.get("availability") && { key: "availability", label: params.get("availability") === "in_stock" ? "In stock" : "Out of stock" },
    ...Object.entries(FLAG_LABELS).map(([k, label]) => params.get(k) === "true" && { key: k, label }),
  ].filter(Boolean);

  const removeChip = (key) => (Array.isArray(key) ? setParam(Object.fromEntries(key.map((k) => [k, null]))) : setParam(key, null));

  // lock page scroll while the mobile filter drawer is open
  useEffect(() => {
    if (!drawer) return undefined;
    lenis?.stop();
    const onKey = (e) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      document.removeEventListener("keydown", onKey);
    };
  }, [drawer, lenis]);

  if (categoryMissing) {
    return (
      <section className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 py-24 text-center">
        <div>
          <h1 className="text-5xl">This shop isn't on the street</h1>
          <p className="mt-4 text-ink-soft">The category may have been renamed or closed.</p>
          <ButtonLink to="/shop" className="mt-8">
            Shop all products
          </ButtonLink>
        </div>
      </section>
    );
  }

  const filterPanel = <FilterPanel params={params} setParam={setParam} categories={categories} currentCategory={category} />;

  return (
    <>
      {/* page header */}
      <section className="relative isolate overflow-hidden bg-night text-moon">
        {category?.imageUrl && (
          <>
            <Img src={imageAt(category.imageUrl, 1600)} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30" />
            <div className="absolute inset-0 -z-10 bg-linear-to-r from-night via-night/85 to-night/40" />
          </>
        )}
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 md:pb-14 md:pt-16 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-sm text-moon-soft">
            <Link to="/" className="hover:text-lamp">
              Home
            </Link>
            <span className="mx-2" aria-hidden="true">/</span>
            {category ? (
              <>
                <Link to="/shop" className="hover:text-lamp">
                  Shop
                </Link>
                <span className="mx-2" aria-hidden="true">/</span>
                <span aria-current="page" className="text-moon">{category.name}</span>
              </>
            ) : (
              <span aria-current="page" className="text-moon">Shop</span>
            )}
          </nav>
          <h1 className="mt-4 text-[clamp(2.6rem,6vw,4.5rem)]">{title}</h1>
          {category?.description && <p className="mt-3 max-w-xl text-moon-soft">{category.description}</p>}

          {category && category.subcategories?.some((s) => s.productCount > 0) && (
            <div className="no-scrollbar -mx-4 mt-7 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              {[{ id: "all", name: "Everything", slug: null }, ...category.subcategories.filter((s) => s.productCount > 0)].map((s) => {
                const active = (params.get("subcategory") || null) === s.slug;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setParam("subcategory", s.slug)}
                    aria-pressed={active}
                    className={`h-10 shrink-0 rounded-full border px-4 text-sm transition-colors ${active ? "border-lamp bg-lamp font-semibold text-night" : "border-moon/25 text-moon hover:border-lamp hover:text-lamp"}`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="bg-fog">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[15.5rem_1fr] lg:px-8 lg:py-14">
          <aside className="hidden lg:block" aria-label="Filters">
            <div className="sticky top-28">{filterPanel}</div>
          </aside>

          <div>
            {/* toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <p className="mr-auto text-sm text-ink-soft" aria-live="polite">
                {state.loading ? "Finding products…" : `${state.total} product${state.total === 1 ? "" : "s"}`}
              </p>
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setDrawer(true)}>
                <FilterIcon width={18} height={18} /> Filters{chips.length ? ` (${chips.length})` : ""}
              </Button>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-ink-soft">Sort by</span>
                <select
                  value={params.get("sort") || "newest"}
                  onChange={(e) => setParam("sort", e.target.value === "newest" ? null : e.target.value)}
                  className="h-10 rounded-full border border-ink/20 bg-mist px-4 pr-8 text-sm font-semibold focus:border-ink focus:outline-none"
                >
                  {SORTS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {chips.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {chips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => removeChip(chip.key)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3 text-xs font-semibold text-fog hover:bg-night-deep"
                    aria-label={`Remove filter: ${chip.label}`}
                  >
                    {chip.label}
                    <CloseIcon width={14} height={14} />
                  </button>
                ))}
                <button type="button" onClick={clearAll} className="ml-1 text-xs font-semibold text-ink-soft underline underline-offset-4 hover:text-ink">
                  Clear all
                </button>
              </div>
            )}

            {/* results */}
            <div className="mt-8">
              {state.error && !state.loading ? (
                <div className="rounded-2xl bg-mist p-10 text-center">
                  <p className="font-sign text-3xl">Couldn't load products</p>
                  <p className="mt-2 text-ink-soft">{state.error.message}</p>
                  <Button className="mt-6" onClick={() => setParams(new URLSearchParams(params))}>
                    Try again
                  </Button>
                </div>
              ) : state.loading ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6">
                  {Array.from({ length: 6 }, (_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : state.items.length === 0 ? (
                <div className="rounded-2xl bg-mist p-10 text-center">
                  <p className="font-sign text-3xl">Nothing matches yet</p>
                  <p className="mx-auto mt-2 max-w-sm text-ink-soft">
                    Try fewer filters or a different search. New things arrive every week.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {chips.length > 0 && <Button onClick={clearAll}>Clear filters</Button>}
                    <ButtonLink to="/shop" variant="outline">
                      Shop all products
                    </ButtonLink>
                  </div>
                </div>
              ) : (
                <>
                  <motion.ul layout className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6">
                    <AnimatePresence initial={false}>
                      {state.items.map((product, index) => (
                        <motion.li
                          key={product.id}
                          layout
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4, delay: (index % PAGE_SIZE) * 0.03, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <ProductCard product={product} priority={index < 3} />
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </motion.ul>

                  <div className="mt-12 flex flex-col items-center gap-3">
                    <p className="text-sm text-ink-soft">
                      Showing {state.items.length} of {state.total}
                    </p>
                    <div className="h-1 w-48 overflow-hidden rounded-full bg-fog-deep" aria-hidden="true">
                      <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${(state.items.length / state.total) * 100}%` }} />
                    </div>
                    {state.page < state.pages && (
                      <Button variant="outline" className="mt-3" onClick={loadMore} disabled={state.more}>
                        {state.more ? "Loading…" : "Show more products"}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* mobile filter drawer */}
      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              type="button"
              tabIndex={-1}
              aria-label="Close filters"
              className="absolute inset-0 bg-night-deep/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              className="absolute inset-x-0 bottom-0 flex max-h-[85svh] flex-col rounded-t-3xl bg-mist"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              data-lenis-prevent
            >
              <div className="flex items-center justify-between px-5 pb-2 pt-4">
                <p className="font-sign text-3xl">Filters</p>
                <button type="button" className="grid h-10 w-10 place-items-center rounded-full hover:bg-fog" onClick={() => setDrawer(false)} aria-label="Close filters">
                  <CloseIcon />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-4">{filterPanel}</div>
              <div className="flex gap-3 border-t border-ink/10 px-5 py-4">
                <Button variant="outline" className="flex-1" onClick={clearAll}>
                  Clear all
                </Button>
                <Button className="flex-1" onClick={() => setDrawer(false)}>
                  Show {state.total} product{state.total === 1 ? "" : "s"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
