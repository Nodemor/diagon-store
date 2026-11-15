import { Suspense, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation, useParams } from "react-router-dom";
import { StoreLayout } from "./components/layout/StoreLayout";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import { recogniseAdminSegment } from "./lib/adminPath";
import { lazyPage } from "./lib/lazyPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

// The home page loads with the app; every other page is downloaded when it's first visited.
// lazyPage: if a page's file disappeared because the site was updated meanwhile, reload once.
const Shop = lazyPage(() => import("./pages/Shop"));
const Product = lazyPage(() => import("./pages/Product"));
const Cart = lazyPage(() => import("./pages/Cart"));
const Checkout = lazyPage(() => import("./pages/Checkout"));
const OrderSuccess = lazyPage(() => import("./pages/OrderSuccess"));
const Track = lazyPage(() => import("./pages/Track"));
const Contact = lazyPage(() => import("./pages/Contact"));
const ContentPage = lazyPage(() => import("./pages/ContentPage"));
// the whole back office is loaded on demand, so shoppers never download it
const AdminApp = lazyPage(() => import("./admin/AdminApp"));

/** Quiet placeholder while a page's code downloads (usually a few milliseconds). */
const PageLoading = () => (
  <div className="mx-auto min-h-[70vh] max-w-7xl px-4 py-16" aria-busy="true">
    <div className="h-10 w-1/3 animate-pulse rounded-lg bg-fog-deep" />
  </div>
);

const AdminLoading = () => (
  <div className="grid min-h-svh place-items-center bg-night text-moon-soft">
    <p className="animate-pulse">Opening the back office…</p>
  </div>
);

const page = (element) => <Suspense fallback={<PageLoading />}>{element}</Suspense>;

/**
 * Any address the shop doesn't know ends up here. Only the secret back-office address
 * (see lib/adminPath.js) opens the admin panel; everything else, /admin included, is a
 * normal "page not found", identical to any other wrong link.
 */
function AddressGate() {
  const { segment } = useParams();
  const [result, setResult] = useState({ segment: null, isAdmin: false });

  useEffect(() => {
    let alive = true;
    recogniseAdminSegment(segment).then((isAdmin) => alive && setResult({ segment, isAdmin }));
    return () => {
      alive = false;
    };
  }, [segment]);

  if (result.segment !== segment) return null; // checking (takes a millisecond)
  if (result.isAdmin) {
    return (
      <Suspense fallback={<AdminLoading />}>
        <AdminApp />
      </Suspense>
    );
  }
  return (
    <StoreLayout>
      <NotFound />
    </StoreLayout>
  );
}

/** A crashed page never leaves a blank screen; moving to another address clears the error. */
function SafeRoutes({ children }) {
  const { pathname } = useLocation();
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <BrowserRouter>
      <SafeRoutes>
        <Routes>
          {/* Storefront */}
          <Route element={<StoreLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={page(<Shop />)} />
            <Route path="/category/:slug" element={page(<Shop />)} />
            <Route path="/product/:slug" element={page(<Product />)} />
            <Route path="/cart" element={page(<Cart />)} />
            <Route path="/checkout" element={page(<Checkout />)} />
            <Route path="/order/success/:number" element={page(<OrderSuccess />)} />
            <Route path="/track" element={page(<Track />)} />
            <Route path="/contact" element={page(<Contact />)} />
            <Route path="/pages/:slug" element={page(<ContentPage />)} />
          </Route>

          {/* Unknown addresses: "page not found", or the back office at its secret address */}
          <Route path="/:segment/*" element={<AddressGate />} />
        </Routes>
      </SafeRoutes>
    </BrowserRouter>
  );
}

export default App;
