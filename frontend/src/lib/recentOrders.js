// Orders placed on this device, so customers can find their order number again
// and track it without typing (kept in localStorage; never shared).
const KEY = "diagon-recent-orders-v1";
const DETAILS_KEY = "diagon-customer-v1";

const safeRead = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const safeWrite = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
};

export const getRecentOrders = () => safeRead(KEY, []);

/** order: response from POST /api/inquiries plus the phone used. */
export function saveRecentOrder(order) {
  const list = getRecentOrders().filter((o) => o.inquiryNumber !== order.inquiryNumber);
  safeWrite(KEY, [order, ...list].slice(0, 5));
}

export const findRecentOrder = (number) => getRecentOrders().find((o) => o.inquiryNumber === number) || null;

// customer details for faster checkout next time (only when the customer agrees)
export const getSavedDetails = () => safeRead(DETAILS_KEY, null);
export const saveDetails = (details) => safeWrite(DETAILS_KEY, details);
export const forgetDetails = () => {
  try {
    localStorage.removeItem(DETAILS_KEY);
  } catch {
    /* ignore */
  }
};
