// Admin API client (see docs/ARCHITECTURE.md#admin-apiadmin). Every call sends the admin token;
// a 401 response signs the admin out (expired or revoked session).
import { request } from "../lib/api";

const TOKEN_KEY = "diagon-admin-token";

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

async function call(path, options = {}) {
  try {
    return await request(`/admin${path}`, { ...options, token: tokenStore.get() });
  } catch (error) {
    if (error.status === 401) onUnauthorized();
    throw error;
  }
}

const json = (method) => (path, body) => call(path, { method, body });
const post = json("POST");
const put = json("PUT");
const patch = json("PATCH");
const del = (path) => call(path, { method: "DELETE" });

const form = (field, files) => {
  const data = new FormData();
  [].concat(files).forEach((file) => data.append(field, file));
  return data;
};

export const adminApi = {
  login: (email, password) => request("/admin/login", { method: "POST", body: { email, password } }),
  profile: () => call("/profile"),
  changePassword: (body) => put("/profile/password", body),
  dashboard: () => call("/dashboard"),

  products: {
    list: (query) => call("/products", { query }),
    get: (id) => call(`/products/${id}`),
    create: (body) => post("/products", body),
    update: (id, body) => put(`/products/${id}`, body),
    remove: (id) => del(`/products/${id}`),
    stock: (id, body) => patch(`/products/${id}/stock`, body),
    uploadImages: (id, files) => call(`/products/${id}/images`, { method: "POST", body: form("images", files) }),
    addImageUrl: (id, url, altText) => post(`/products/${id}/images`, { url, altText }),
    reorderImages: (id, order) => put(`/products/${id}/images/order`, { order }),
    updateImage: (id, imageId, body) => patch(`/products/${id}/images/${imageId}`, body),
    deleteImage: (id, imageId) => del(`/products/${id}/images/${imageId}`),
  },

  categories: {
    list: () => call("/categories"),
    create: (body) => post("/categories", body),
    update: (id, body) => put(`/categories/${id}`, body),
    remove: (id) => del(`/categories/${id}`),
    createSub: (categoryId, body) => post(`/categories/${categoryId}/subcategories`, body),
    updateSub: (id, body) => put(`/subcategories/${id}`, body),
    removeSub: (id) => del(`/subcategories/${id}`),
  },

  inquiries: {
    list: (query) => call("/inquiries", { query }),
    get: (id) => call(`/inquiries/${id}`),
    setStatus: (id, body) => patch(`/inquiries/${id}/status`, body),
    setNotes: (id, adminNotes) => patch(`/inquiries/${id}/notes`, { adminNotes }),
    remove: (id) => del(`/inquiries/${id}`),
  },

  customers: {
    list: (query) => call("/customers", { query }),
    get: (id) => call(`/customers/${id}`),
  },

  banners: {
    list: () => call("/banners"),
    create: (body) => post("/banners", body),
    update: (id, body) => put(`/banners/${id}`, body),
    remove: (id) => del(`/banners/${id}`),
  },

  /** folder: "banners" | "categories" | "content" → { url } */
  upload: (folder, file) => call(`/uploads/${folder}`, { method: "POST", body: form("image", file) }),

  settings: {
    get: () => call("/settings"),
    update: (body) => put("/settings", body),
  },

  pages: {
    list: () => call("/pages"),
    get: (slug) => call(`/pages/${encodeURIComponent(slug)}`),
    save: (slug, body) => put(`/pages/${encodeURIComponent(slug)}`, body),
    remove: (slug) => del(`/pages/${encodeURIComponent(slug)}`),
  },

  admins: {
    list: () => call("/admins"),
    create: (body) => post("/admins", body),
    update: (id, body) => put(`/admins/${id}`, body),
    remove: (id) => del(`/admins/${id}`),
  },
};

/** Turns server validation errors [{ path, message }] into { field: message }. */
export const fieldErrors = (error) =>
  Object.fromEntries((error?.errors || []).filter((e) => e.path).map((e) => [e.path, e.message]));
