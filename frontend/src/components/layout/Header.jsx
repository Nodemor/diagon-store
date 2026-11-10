import { forwardRef, useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import PillNav from "../reactbits/PillNav";
import { useCart } from "../../context/CartContext";
import { useSettings } from "../../context/SettingsContext";
import { BagIcon, LampMark, SearchIcon } from "../ui/icons";
import { MobileMenu } from "./MobileMenu";

export const NAV_ITEMS = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?onSale=true", label: "Offers" },
  { href: "/shop?newArrival=true", label: "New arrivals" },
  { href: "/track", label: "Track an order" },
];

// PillNav renders links as <LinkComponent href>; map that onto React Router.
const RouterLink = forwardRef(function RouterLink({ href, ...props }, ref) {
  return <Link ref={ref} to={href} {...props} />;
});

export function SearchForm({ onDone, className = "", id = "site-search" }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const term = query.trim();
    navigate(term ? `/shop?search=${encodeURIComponent(term)}` : "/shop");
    onDone?.();
  };

  return (
    <form role="search" onSubmit={submit} className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-moon-soft" />
      <input
        id={id}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products, brands, codes"
        className="h-11 w-full rounded-full border border-cobble-line bg-cobble/60 pl-11 pr-4 text-sm text-moon placeholder:text-moon-soft/80 transition-colors focus:border-lamp focus:bg-cobble focus:outline-none"
      />
    </form>
  );
}

/** Animated two-line menu toggle: the label rolls and the bars cross into an X. */
function MenuToggle({ open, onClick }) {
  const bar = "absolute left-0 block h-[1.5px] w-full rounded bg-current transition-transform duration-500 ease-alley";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 items-center gap-2.5 rounded-full px-3 text-sm font-semibold text-moon lg:hidden"
      aria-expanded={open}
      aria-controls="mobile-menu"
    >
      <span className="relative block h-5 overflow-hidden" aria-hidden="true">
        <span className={`block transition-transform duration-500 ease-alley ${open ? "-translate-y-5" : ""}`}>
          <span className="block h-5 leading-5">Menu</span>
          <span className="block h-5 leading-5">Close</span>
        </span>
      </span>
      <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      <span className="relative block h-3 w-5" aria-hidden="true">
        <span className={`${bar} top-0 ${open ? "translate-y-[5px] rotate-45" : ""}`} />
        <span className={`${bar} bottom-0 ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
      </span>
    </button>
  );
}

export function Header() {
  const { count } = useCart();
  const { storeName } = useSettings();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const current = location.pathname + location.search;
  const activeHref = NAV_ITEMS.find((item) => item.href === current)?.href ?? "";

  return (
    <>
      <header
        data-scrolled={scrolled || undefined}
        className="sticky top-0 z-40 border-b border-transparent bg-night text-moon transition-[background-color,border-color,box-shadow] duration-500 data-[scrolled]:border-lamp/15 data-[scrolled]:bg-night/75 data-[scrolled]:shadow-[0_12px_30px_-18px_rgb(0_0_0/0.8)] data-[scrolled]:backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 md:h-[4.5rem] lg:px-8">
          <Link to="/" className="group flex shrink-0 items-center gap-2" aria-label={`${storeName} home`} onClick={close}>
            <LampMark className="transition-transform duration-700 ease-alley group-hover:-rotate-6" />
            <span className="font-sign text-[1.6rem] leading-none tracking-tight">{storeName}</span>
          </Link>

          {/* wrapper hides the nav below lg (PillNav sets its own display) */}
          <div className="ml-6 hidden lg:block">
          <PillNav
            items={NAV_ITEMS}
            activeHref={activeHref}
            linkComponent={RouterLink}
            layout="joined"
            itemStyle="plain"
            hoverEffect="fill"
            indicator="dot"
            surface="glass"
            barColor="rgb(43 51 69 / 0.55)"
            textColor="#e9edf3"
            highlightColor="#f2b544"
            highlightTextColor="#1c2230"
            collapse="never"
            size="md"
            ariaLabel="Main"
          />
          </div>

          <SearchForm className="ml-auto hidden w-full max-w-xs md:block" />

          <Link
            to="/cart"
            onClick={close}
            className="relative ml-auto grid h-11 w-11 place-items-center rounded-full text-moon transition-colors hover:text-lamp md:ml-0"
            aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
          >
            <BagIcon width={22} height={22} />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4, y: 4 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 600, damping: 18 }}
                  className="absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-lamp px-1 text-[0.7rem] font-bold text-night"
                >
                  {count > 99 ? "99+" : count}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <MenuToggle open={open} onClick={() => setOpen((v) => !v)} />
        </div>
      </header>

      <MobileMenu open={open} onClose={close} items={NAV_ITEMS}>
        <SearchForm id="mobile-search" onDone={close} />
      </MobileMenu>
    </>
  );
}
