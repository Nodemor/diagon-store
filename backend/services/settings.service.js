const prisma = require("../prisma");
const env = require("../config/env");

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

async function updateSettings(input) {
  const entries = Object.entries(input).filter(([key]) => key in DEFAULTS);

  if (entries.length) {
    await prisma.$transaction(
      entries.map(([key, value]) => {
        let clean = value === null ? "" : String(value).trim();
        if (key === "whatsappNumber") clean = clean.replace(/\D/g, "");
        return prisma.setting.upsert({ where: { key }, create: { key, value: clean }, update: { value: clean } });
      }),
    );
  }

  cache = null;
  return getSettings();
}

module.exports = { DEFAULTS, getSettings, updateSettings };
