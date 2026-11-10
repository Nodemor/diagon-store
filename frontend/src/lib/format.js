import { API_ORIGIN } from "./api";

const lkr = new Intl.NumberFormat("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** 15900 -> "Rs 15,900" (proposal: prices in LKR) */
export function formatPrice(amount) {
  return `Rs ${lkr.format(Number(amount) || 0)}`;
}

/** Uploaded images are stored as "/uploads/..." — prefix the API origin. */
export function assetUrl(url) {
  if (!url) return null;
  return /^https?:\/\//.test(url) ? url : `${API_ORIGIN}${url}`;
}

/** Unsplash images can be resized through the URL; local uploads are returned as-is. */
export function imageAt(url, width) {
  const full = assetUrl(url);
  if (!full || !full.includes("images.unsplash.com")) return full;
  const u = new URL(full);
  u.searchParams.set("w", String(width));
  return u.toString();
}

export const mainImage = (product) => product?.images?.[0]?.url || null;

/** wa.me link with a pre-filled message, or null when no number is set. */
export function whatsappLink(number, message) {
  const digits = String(number || "").replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

/**
 * WhatsApp message for one product, in the format from the proposal (§9):
 * "Hello Diagon Store, I would like to order the following product: ..."
 */
export function productWhatsAppMessage(product, quantity, storeName = "Diagon Store") {
  const lines = [
    `Hello ${storeName},`,
    "I would like to order the following product:",
    "",
    `Product: ${product.name}`,
  ];
  if (product.sku) lines.push(`Product Code: ${product.sku}`);
  lines.push(`Quantity: ${quantity}`);
  lines.push(`Price: LKR ${lkr.format(product.finalPrice)}`);
  if (quantity > 1) lines.push(`Total: LKR ${lkr.format(product.finalPrice * quantity)}`);
  lines.push("", "Please confirm availability and delivery details.");
  return lines.join("\n");
}
