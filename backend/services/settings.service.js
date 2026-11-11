const prisma = require("../prisma");
const env = require("../config/env");
const { normalizePhone } = require("../utils/phone");
const { badRequest } = require("../utils/httpError");

// Every editable store setting and its default. Only these keys can be saved.
// All settings are public (shown on the website) — never store secrets here.
const DEFAULTS = {
  storeName: env.store.name,
  tagline: "Every curious find, in one enchanted alley.",
  currency: env.store.currency,
  announcement: "Island-wide delivery, cash on delivery available",
  phone: "",
  whatsappNumber: env.store.whatsappNumber,
  email: "",
  address: "",
  mapEmbedUrl: "",
  businessHours: "Monday to Saturday, 9 am to 7 pm",
  facebookUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  youtubeUrl: "",
  footerText: "A curious little alley of everyday magic — electronics, fashion, home and more.",
  metaTitle: "Diagon Store — Every curious find, in one enchanted alley",
  metaDescription:
    "Shop electronics, fashion, home & living, beauty and accessories at Diagon Store. Order on WhatsApp or email, pay on delivery.",
};

let cache = null;

async function getSettings() {
  if (cache) return cache;
  const rows = await prisma.setting.findMany();
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  cache = { ...DEFAULTS, ...stored };
  return cache;
}

/**
 * Orders go to this number, so a mistake means lost orders: accept the usual ways people write it
 * (0771234567, +94 77 123 4567, 94771234567) and store international digits; refuse anything else.
 */
function cleanWhatsappNumber(value) {
  const raw = value === null ? "" : String(value).trim();
  if (!raw) return "";
  const digits = normalizePhone(raw);
  if (!digits) {
    throw badRequest("That WhatsApp number doesn't look right. Use the full number, e.g. 0771234567 or 94771234567.", [
      { path: "whatsappNumber", message: "Invalid WhatsApp number" },
    ]);
  }
  return digits;
}

async function updateSettings(input) {
  const entries = Object.entries(input)
    .filter(([key]) => key in DEFAULTS)
    .map(([key, value]) => [key, key === "whatsappNumber" ? cleanWhatsappNumber(value) : value]);

  if (entries.length) {
    await prisma.$transaction(
      entries.map(([key, value]) => {
        const clean = value === null ? "" : String(value).trim();
        return prisma.setting.upsert({ where: { key }, create: { key, value: clean }, update: { value: clean } });
      }),
    );
  }

  cache = null;
  return getSettings();
}

module.exports = { DEFAULTS, getSettings, updateSettings };
