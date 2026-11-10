import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { getProducts } from "../../services/store";
import { formatPrice, imageAt } from "../../lib/format";
import { SearchIcon } from "../ui/icons";
import { Img } from "../ui/Img";

/**
 * Header search with instant suggestions (proposal §7: name, code, brand, category, tags).
 * Arrow keys move through suggestions, Enter opens one, Escape closes the list.
 */
export function SearchForm({ onDone, className = "", id }) {
  const autoId = useId();
  const inputId = id || `search-${autoId}`;
  const listId = `${inputId}-list`;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef(null);

  // debounced lookup
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      getProducts({ search: term, limit: 5, sort: "popular" }, { signal: controller.signal })
        .then((res) => {
          setResults(res.items);
          setActive(-1);
          setOpen(true);
        })
        .catch(() => {});
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const onDown = (e) => !box.current?.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const go = (path) => {
    setOpen(false);
    setQuery("");
    navigate(path);
    onDone?.();
  };

  const submit = (event) => {
    event.preventDefault();
    if (open && active >= 0 && results[active]) return go(`/product/${results[active].slug}`);
    const term = query.trim();
    go(term ? `/shop?search=${encodeURIComponent(term)}` : "/shop");
  };

  const onKeyDown = (e) => {
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && query.trim().length >= 2;

  return (
    <form ref={box} role="search" onSubmit={submit} className={`relative ${className}`}>
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-moon-soft" />
      <input
        id={inputId}
        type="search"
        value={query}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search products, brands, codes"
        className="h-11 w-full rounded-full border border-cobble-line bg-cobble/60 pl-11 pr-4 text-sm text-moon placeholder:text-moon-soft/80 transition-colors focus:border-lamp focus:bg-cobble focus:outline-none"
      />

      <AnimatePresence>
        {showList && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl bg-mist text-ink shadow-[0_24px_50px_-20px_rgb(0_0_0/0.6)] ring-1 ring-ink/10"
          >
            <ul id={listId} role="listbox" aria-label="Suggestions" className="max-h-[60svh] overflow-y-auto p-1.5">
              {results.length === 0 && <li className="px-3 py-4 text-sm text-ink-soft">No products match “{query.trim()}”.</li>}
              {results.map((product, i) => (
                <li
                  key={product.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(`/product/${product.slug}`)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 ${i === active ? "bg-fog" : ""}`}
                >
                  <span className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-fog-deep">
                    {product.images?.[0] && <Img src={imageAt(product.images[0].url, 120)} alt="" className="h-full w-full object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{product.name}</span>
                    <span className="block truncate text-xs text-ink-soft">
                      {[product.category?.name, product.sku].filter(Boolean).join(", ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{formatPrice(product.finalPrice)}</span>
                </li>
              ))}
            </ul>
            {results.length > 0 && (
              <button
                type="submit"
                className="block w-full border-t border-ink/10 px-4 py-3 text-left text-sm font-semibold hover:bg-fog"
              >
                See all results for “{query.trim()}”
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
