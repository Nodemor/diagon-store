// Builds the Express app (middleware + routes). server.js starts it; tests can import it.
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { apiLimiter } = require("./middleware/rateLimiters");
const env = require("./config/env");
const storeRoutes = require("./routes/store.routes");
const adminRoutes = require("./routes/admin.routes");
const shareRoutes = require("./routes/share.routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { imageResize } = require("./middleware/imageResize");
const seo = require("./controllers/seo.controller");

const app = express();

app.set("trust proxy", 1); // correct client IPs for rate limiting behind a proxy
app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow the frontend to load /uploads images
  }),
);
// credentials: the admin session cookie is only sent to the shop's own origins
app.use(cors({ origin: env.clientUrls, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
if (!env.isProduction && env.nodeEnv !== "test") app.use(morgan("dev"));

// Uploaded images (product photos, banners, category images). ?w=400 serves a resized WebP copy.
app.use("/uploads", imageResize, express.static(env.upload.dir, { maxAge: "30d", immutable: true, index: false, dotfiles: "deny" }));

// Search engines
app.get("/sitemap.xml", seo.sitemap);
app.get("/robots.txt", seo.robots);
// short share links with WhatsApp / Facebook link previews (orders and products)
app.use("/s", shareRoutes);

app.get("/", (req, res) => res.send("Diagon Store API is running ✨"));
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api", apiLimiter);
app.use("/api/admin", adminRoutes);
app.use("/api", storeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
