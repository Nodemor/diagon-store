const env = require("../config/env");

const numberFormat = new Intl.NumberFormat("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 12500 -> "LKR 12,500.00" */
const formatMoney = (amount, currency = env.store.currency) => `${currency} ${numberFormat.format(Number(amount) || 0)}`;

/** Rounds to 2 decimals (money maths) */
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** DS-2026-000123 */
const formatOrderNumber = (id, date = new Date()) =>
  `${env.store.orderPrefix}-${date.getFullYear()}-${String(id).padStart(6, "0")}`;

module.exports = { formatMoney, round2, escapeHtml, formatOrderNumber };
