import { Route, Routes } from "react-router-dom";
import { AdminAuthProvider, ConfirmProvider, ToastProvider } from "./context";
import { AdminLayout, RequireAdmin } from "./AdminLayout";
import { usePageTitle } from "../hooks/usePageTitle";
import { ButtonLink, EmptyState } from "./ui";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Products from "./pages/Products";
import ProductForm from "./pages/ProductForm";
import Categories from "./pages/Categories";
import Banners from "./pages/Banners";
import Customers from "./pages/Customers";
import Messages from "./pages/Messages";
import CustomerDetail from "./pages/CustomerDetail";
import Pages from "./pages/Pages";
import PageEditor from "./pages/PageEditor";
import Settings from "./pages/Settings";
import Admins from "./pages/Admins";
import Profile from "./pages/Profile";

function AdminNotFound() {
  usePageTitle("Admin");
  return <EmptyState title="Nothing here" text="That admin page doesn't exist." action={<ButtonLink to="/admin">Go to the dashboard</ButtonLink>} />;
}

/** The whole back office (lazy-loaded from App.jsx, so shoppers never download it). */
export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Routes>
            <Route path="login" element={<Login />} />
            <Route
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="products" element={<Products />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id" element={<ProductForm />} />
              <Route path="categories" element={<Categories />} />
              <Route path="banners" element={<Banners />} />
              <Route path="messages" element={<Messages />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="pages" element={<Pages />} />
              <Route path="pages/:slug" element={<PageEditor />} />
              <Route path="settings" element={<Settings />} />
              <Route path="admins" element={<Admins />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<AdminNotFound />} />
            </Route>
          </Routes>
        </ConfirmProvider>
      </ToastProvider>
    </AdminAuthProvider>
  );
}
