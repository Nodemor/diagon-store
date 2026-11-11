// Public storefront API (see docs/ARCHITECTURE.md#api)
import { request } from "../lib/api";

export const getHome = (options) => request("/home", options);
export const getSettings = (options) => request("/settings", options);
export const getCategories = (options) => request("/categories", options);
export const getProducts = (query, options) => request("/products", { ...options, query });
export const getProduct = (slug, options) => request(`/products/${encodeURIComponent(slug)}`, options);
export const getRelatedProducts = (slug, options) => request(`/products/${encodeURIComponent(slug)}/related`, options);
export const getPage = (slug, options) => request(`/pages/${encodeURIComponent(slug)}`, options);
export const placeInquiry = (body) => request("/inquiries", { method: "POST", body });
export const trackInquiry = (number, phone) => request("/inquiries/track", { query: { number, phone } });
export const sendContactMessage = (body) => request("/contact", { method: "POST", body });
