/**
 * Normalises phone numbers to international digits without "+".
 * Sri Lankan formats: 0771234567, 771234567, +94 77 123 4567 -> 94771234567
 * Other international numbers (8–15 digits) are kept as digits.
 * Returns null when the number is not usable.
 */
function normalizePhone(input) {
  const digits = String(input || "").replace(/\D/g, "");

  if (/^0\d{9}$/.test(digits)) return `94${digits.slice(1)}`;
  if (/^7\d{8}$/.test(digits)) return `94${digits}`;
  if (/^94\d{9}$/.test(digits)) return digits;
  if (/^00\d{8,15}$/.test(digits)) return digits.slice(2);
  if (/^\d{8,15}$/.test(digits)) return digits;

  return null;
}

module.exports = { normalizePhone };
