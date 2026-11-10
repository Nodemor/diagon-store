// Small fetch wrapper used by every service module.
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";

/** Origin of the API, used to build URLs for uploaded images (/uploads/...). */
export const API_ORIGIN = new URL(API_BASE_URL).origin;

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
export async function request(path, { method = "GET", query, body, token, signal } = {}) {
  const url = new URL(API_BASE_URL + path);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    });
  }

  const headers = {};
  if (body !== undefined && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      signal,
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
