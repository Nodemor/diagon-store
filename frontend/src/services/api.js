// Set VITE_API_URL in frontend/.env (see frontend/.env.example)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";

// ===============================
// ADMIN LOGIN
// ===============================
export async function adminLogin(email, password) {
  const response = await fetch(`${API_BASE_URL}/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

// ===============================
// GET ALL PRODUCTS
// ===============================
export async function getProducts() {
  const response = await fetch(`${API_BASE_URL}/products`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch products");
  }

  return data;
}

// ===============================
// GET ALL CATEGORIES
// ===============================
export async function getCategories() {
  const response = await fetch(`${API_BASE_URL}/categories`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch categories");
  }

  return data;
}

// ===============================
// API BASE URL
// ===============================
export { API_BASE_URL };