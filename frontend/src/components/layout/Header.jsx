import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "../../context/CartContext";
import { useSettings } from "../../context/SettingsContext";
import { BagIcon, CloseIcon, LampMark, MenuIcon, SearchIcon } from "../ui/icons";

const NAV = [
  { to: "/shop", label: "Shop all" },
  { to: "/shop?onSale=true", label: "Offers" },
  { to: "/shop?newArrival=true", label: "New arrivals" },
  { to: "/track", label: "Track an order" },
];

function SearchForm({ onDone, className = "" }) {
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
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-moon-soft" />
      <input
        id="site-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products, brands, codes"
        className="h-11 w-full rounded-full border border-cobble-line bg-cobble/70 pl-11 pr-4 text-sm text-moon placeholder:text-moon-soft/80 focus:border-lamp focus:outline-none"
      />
    </form>
  );
}

export function Header() {
  const { count } = useCart();
  const { storeName } = useSettings();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-cobble-line/60 bg-night/90 text-moon backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 md:h-[4.5rem] lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label={`${storeName} home`}>
          <LampMark />
          <span className="font-sign text-[1.6rem] leading-none tracking-tight">{storeName}</span>
        </Link>

        <nav aria-label="Main" className="ml-6 hidden items-center gap-6 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="text-sm text-moon-soft transition-colors hover:text-lamp"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <SearchForm className="ml-auto hidden w-full max-w-xs md:block" />

        <Link
          to="/cart"
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

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid h-11 w-11 place-items-center rounded-full lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-cobble-line/60 lg:hidden"
          >
            <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6">
              <SearchForm onDone={() => setOpen(false)} className="md:hidden" />
              <nav aria-label="Mobile" className="grid gap-1">
                {NAV.map((item) => (
                  <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2.5 font-sign text-2xl hover:text-lamp">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
