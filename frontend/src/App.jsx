import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { StoreLayout } from "./components/layout/StoreLayout";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// The home page loads with the app; every other page is downloaded when it's first visited.
const Shop = lazy(() => import("./pages/Shop"));
const Product = lazy(() => import("./pages/Product"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const Track = lazy(() => import("./pages/Track"));
const Contact = lazy(() => import("./pages/Contact"));
const ContentPage = lazy(() => import("./pages/ContentPage"));
// the whole back office is loaded on demand, so shoppers never download it
const AdminApp = lazy(() => import("./admin/AdminApp"));

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

function App() {
  return (
    <BrowserRouter>
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
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Back office */}
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<AdminLoading />}>
              <AdminApp />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
