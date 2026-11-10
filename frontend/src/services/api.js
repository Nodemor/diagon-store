// Admin API helpers (the admin panel UI is rebuilt in Phase 5)
import { request, API_BASE_URL } from "../lib/api";

const token = () => localStorage.getItem("adminToken");

export const adminLogin = (email, password) => request("/admin/login", { method: "POST", body: { email, password } });
export const getAdminDashboard = () => request("/admin/dashboard", { token: token() });

// kept for older pages
export const getProducts = () => request("/products", { query: { limit: 1 } });
export const getCategories = () => request("/categories");

export { API_BASE_URL };
