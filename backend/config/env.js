require("dotenv/config");
const path = require("path");

// Central place that reads process.env. Everything else imports `env`.

const toBool = (value, fallback = false) =>
  value === undefined || value === "" ? fallback : ["true", "1", "yes", "on"].includes(String(value).toLowerCase());

const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

const missing = ["DATABASE_URL", "JWT_SECRET"].filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  console.error("Copy backend/.env.example to backend/.env and fill them in.");
  process.exit(1);
}

const nodeEnv = process.env.NODE_ENV || "development";

const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: toInt(process.env.PORT, 5000),
  host: process.env.HOST || "127.0.0.1",
  clientUrls: (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),
  apiPublicUrl: process.env.API_PUBLIC_URL || `http://127.0.0.1:${toInt(process.env.PORT, 5000)}`,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",

  loginRateLimit: toInt(process.env.LOGIN_RATE_LIMIT, 10),
  orderRateLimit: toInt(process.env.ORDER_RATE_LIMIT, 10),

  upload: {
    dir: path.resolve(__dirname, "..", process.env.UPLOAD_DIR || "uploads"),
    maxSizeMb: toInt(process.env.MAX_UPLOAD_SIZE_MB, 5),
  },

  store: {
    name: process.env.STORE_NAME || "Diagon Store",
    currency: process.env.STORE_CURRENCY || "LKR",
    orderPrefix: process.env.ORDER_NUMBER_PREFIX || "DS",
    whatsappNumber: process.env.SHOP_WHATSAPP_NUMBER || "",
  },

  email: {
    enabled: toBool(process.env.EMAIL_ENABLED),
    from: process.env.EMAIL_FROM || "Diagon Store <no-reply@diagonstore.lk>",
    adminNotify: process.env.EMAIL_ADMIN_NOTIFY || "",
    smtp: {
      host: process.env.SMTP_HOST,
      port: toInt(process.env.SMTP_PORT, 587),
      secure: toBool(process.env.SMTP_SECURE),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
};

module.exports = env;
