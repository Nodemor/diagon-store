import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useAdminAuth } from "./context";
import { adminApi } from "./api";
import { LampMark, MenuIcon, CloseIcon } from "../components/ui/icons";
import {
  BoxIcon,
  DashboardIcon,
  ExternalIcon,
  GearIcon,
  ImageIcon,
  InboxIcon,
  LogoutIcon,
  OrdersIcon,
  PageIcon,
  ShieldIcon,
  TagIcon,
  UsersIcon,
} from "./icons";
import { adminPath } from "../lib/adminPath";

// built at render time: the back-office base path is only known once the address is recognised
const navItems = () => [
  { to: adminPath(""), label: "Dashboard", Icon: DashboardIcon, end: true },
  { to: adminPath("/orders"), label: "Orders", Icon: OrdersIcon, badge: "orders" },
  { to: adminPath("/products"), label: "Products", Icon: BoxIcon },
  { to: adminPath("/categories"), label: "Categories", Icon: TagIcon },
  { to: adminPath("/banners"), label: "Banners", Icon: ImageIcon },
  { to: adminPath("/messages"), label: "Messages", Icon: InboxIcon, badge: "messages" },
  { to: adminPath("/customers"), label: "Customers", Icon: UsersIcon },
  { to: adminPath("/pages"), label: "Pages", Icon: PageIcon },
  { to: adminPath("/settings"), label: "Settings", Icon: GearIcon },
  { to: adminPath("/admins"), label: "Admin users", Icon: ShieldIcon, superOnly: true },
];

/** Redirects to the login page when nobody is signed in. */
export function RequireAdmin({ children }) {
  const { admin, checking } = useAdminAuth();
  const location = useLocation();
  if (checking) {
    return (
      <div className="grid min-h-svh place-items-center bg-night text-moon-soft">
        <p className="animate-pulse">Opening the back office…</p>
      </div>
    );
  }
  if (!admin) return <Navigate to={adminPath("/login")} replace state={{ from: location.pathname + location.search }} />;
  return children;
}

function SideNav({ counts, onNavigate }) {
  const { admin, isSuper, logout } = useAdminAuth();

  return (
    <div className="flex h-full flex-col bg-night-deep text-moon">
      <Link to={adminPath("")} onClick={onNavigate} className="flex items-center gap-2 px-6 pb-6 pt-7">
        <LampMark />
        <span>
          <span className="block font-sign text-2xl leading-none">Diagon Store</span>
          <span className="text-xs text-moon-soft">Back office</span>
        </span>
      </Link>

      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-0.5">
          {navItems().filter((item) => !item.superOnly || isSuper).map(({ to, label, Icon, end, badge }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${isActive ? "bg-cobble text-moon" : "text-moon-soft hover:bg-cobble/50 hover:text-moon"}`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="admin-nav-marker"
                        className="absolute inset-y-2 left-0 w-1 rounded-full bg-lamp"
                        transition={{ type: "spring", stiffness: 500, damping: 36 }}
                      />
                    )}
                    <Icon className={isActive ? "text-lamp" : ""} />
                    <span className="flex-1">{label}</span>
                    {badge && counts[badge] > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-lamp px-1.5 text-[0.7rem] font-bold text-night" aria-label={`${counts[badge]} new`}>
                        {counts[badge]}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-cobble-line/60 p-3">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-moon-soft hover:bg-cobble/50 hover:text-moon">
          <ExternalIcon /> View the shop
        </a>
        <Link to={adminPath("/profile")} onClick={onNavigate} className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-cobble/50">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-lamp font-semibold text-night">{admin?.name?.[0] || "A"}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{admin?.name}</span>
            <span className="block text-xs text-moon-soft">{admin?.role === "SUPER_ADMIN" ? "Super admin" : "Admin"}</span>
          </span>
        </Link>
        <button type="button" onClick={() => logout()} className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-moon-soft hover:bg-cobble/50 hover:text-moon">
          <LogoutIcon /> Sign out
        </button>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState({ orders: 0, messages: 0 });
  const location = useLocation();

  // keep the "new orders" / "unread messages" badges fresh
  useEffect(() => {
    let alive = true;
    const load = () =>
      adminApi
        .dashboard()
        .then((d) => alive && setCounts({ orders: d.inquiries.new, messages: d.unreadMessages }))
        .catch(() => {});
    load();
    const id = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.classList.add("admin-mode");
    return () => document.documentElement.classList.remove("admin-mode");
  }, []);

  return (
    <div className="min-h-svh bg-fog text-ink lg:grid lg:grid-cols-[16rem_1fr]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-lamp focus:px-4 focus:py-2 focus:text-night">
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-svh lg:block">
        <SideNav counts={counts} />
      </aside>

      {/* mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between bg-night-deep px-4 text-moon lg:hidden">
        <Link to={adminPath("")} className="flex items-center gap-2">
          <LampMark width={24} height={24} />
          <span className="font-sign text-xl">Back office</span>
        </Link>
        <button type="button" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center" aria-label="Open menu" aria-expanded={open}>
          <MenuIcon />
          {counts.orders + counts.messages > 0 && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-lamp" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button type="button" tabIndex={-1} aria-label="Close menu" className="absolute inset-0 bg-night-deep/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div
              className="absolute inset-y-0 left-0 w-72"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
            >
              <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-5 z-10 grid h-10 w-10 place-items-center text-moon" aria-label="Close menu">
                <CloseIcon />
              </button>
              <SideNav counts={counts} onNavigate={() => setOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main id="admin-main" className="min-w-0 px-4 pb-24 pt-8 sm:px-6 lg:px-10 lg:pt-10">
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
