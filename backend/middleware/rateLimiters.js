const { rateLimit } = require("express-rate-limit");
const env = require("../config/env");

const json = (message) => ({ message });

// Admin login: LOGIN_RATE_LIMIT attempts per IP per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.loginRateLimit,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: json("Too many login attempts. Please try again in 15 minutes."),
});

// Order/inquiry placement: ORDER_RATE_LIMIT per IP per hour (spam protection)
const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: env.orderRateLimit,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: json("Too many orders from this connection. Please try again later or contact us on WhatsApp."),
});

// Order tracking lookups: 30 per IP per 15 minutes (stops order-number guessing)
const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: json("Too many tracking requests. Please wait a few minutes."),
});

// Contact form: 5 messages per IP per hour
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: json("You've sent several messages already. Please wait a little, or message us on WhatsApp."),
});

// Every API request: API_RATE_LIMIT per IP per 5 minutes (stops scraping and floods)
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: env.apiRateLimit,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: json("Too many requests. Please wait a moment and try again."),
});

// Share links and their preview images (/s/...): 300 per IP per 5 minutes — cards are generated on first view
const shareLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: "Too many requests. Please wait a moment and try again.",
});

module.exports = { apiLimiter, loginLimiter, inquiryLimiter, trackLimiter, contactLimiter, shareLimiter };
