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

module.exports = { loginLimiter, inquiryLimiter, trackLimiter };
