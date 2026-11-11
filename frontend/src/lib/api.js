// Small fetch wrapper used by every service module.
//
// The API is reached on the shop's own address ("/api"): Vite forwards it in development and the
// web server forwards it in production. Same-origin requests let the admin session live in a
// secure httpOnly SameSite=Strict cookie that page scripts can't read.
export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const BASE = new URL(API_BASE_URL, window.location.origin);

/** Origin of the API, used to build URLs for uploaded images (/uploads/...). */
export const API_ORIGIN = BASE.origin;

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

/**
 * request("/products", { query: { page: 2 } })
 * request("/inquiries", { method: "POST", body: {...} })
 */
export async function request(path, { method = "GET", query, body, signal } = {}) {
  const url = new URL(BASE.pathname.replace(/\/$/, "") + path, BASE.origin);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    });
  }

  // Marks requests as coming from this app. The admin API refuses state-changing requests
  // without it, which blocks cross-site request forgery.
  const headers = { "X-Requested-With": "DiagonStore" };
  if (body !== undefined && !(body instanceof FormData)) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      signal,
      credentials: "include",
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError("Can't reach the store right now. Check your connection and try again.", 0);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.message || "Something went wrong", response.status, data.errors);
  return data;
}
