import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { StoreLayout } from "./components/layout/StoreLayout";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ComingSoon from "./pages/ComingSoon";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Track from "./pages/Track";

// admin pages are loaded on demand so shoppers never download them
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Storefront */}
        <Route element={<StoreLayout />}>
          <Route path="/" element={<Home />} />
          {/* Phase 3 */}
          <Route path="/shop" element={<Shop />} />
          <Route path="/category/:slug" element={<Shop />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          {/* Phase 4: ordering */}
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/success/:number" element={<OrderSuccess />} />
          <Route path="/track" element={<Track />} />
          {/* Phase 6 */}
          <Route path="/contact" element={<ComingSoon title="Contact us" phase={6} />} />
          <Route path="/pages/:slug" element={<ComingSoon title="Information" phase={6} />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin (rebuilt in Phase 5) */}
        <Route path="/admin/login" element={<Suspense fallback={null}><AdminLogin /></Suspense>} />
        <Route path="/admin/dashboard" element={<Suspense fallback={null}><AdminDashboard /></Suspense>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
