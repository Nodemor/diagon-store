// Back-office address ("encrypted route").
//
// In production the admin panel lives at a secret path that only the shop team knows, e.g.
// /door-k7m2x9pq4w8r3t. The site's code never contains that path: only its SHA-256 hash
// (VITE_ADMIN_PATH_HASH, made with `npm run admin-path`). When a page is opened, the first part of
// the address is hashed in the browser and compared; any other address — including /admin —
// shows the normal "page not found", so the sign-in page can't be found by guessing or by
// reading the JavaScript.
//
// Without a hash (local development) the back office is at /admin.

const HASH = String(import.meta.env.VITE_ADMIN_PATH_HASH || "").trim().toLowerCase();
export const ADMIN_PATH_IS_SECRET = /^[0-9a-f]{64}$/.test(HASH);

// Base path of the back office once recognised. ES module live binding: importers see updates.
export let ADMIN_BASE = "/admin";

/** adminPath("/orders") → "/door-…/orders" */
export const adminPath = (path = "") => `${ADMIN_BASE}${path}`;

export const isAdminPathname = (pathname) => pathname === ADMIN_BASE || pathname.startsWith(`${ADMIN_BASE}/`);

async function sha256Hex(text) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Is this first address segment the back office? Remembers the base when it is. */
export async function recogniseAdminSegment(segment) {
  if (!segment) return false;
  let ok = false;
  if (!ADMIN_PATH_IS_SECRET) ok = segment === "admin";
  else if (globalThis.crypto?.subtle) {
    // constant-length comparison of the two hex strings
    const digest = await sha256Hex(segment);
    let diff = 0;
    for (let i = 0; i < HASH.length; i++) diff |= digest.charCodeAt(i) ^ HASH.charCodeAt(i);
    ok = diff === 0;
  }
  if (ok) ADMIN_BASE = `/${segment}`;
  return ok;
}
