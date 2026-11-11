// Builds the Express app (middleware + routes). server.js starts it; tests can import it.
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("./config/env");
const storeRoutes = require("./routes/store.routes");
const adminRoutes = require("./routes/admin.routes");
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
app.use(cors({ origin: env.clientUrls }));
app.use(express.json({ limit: "1mb" }));
if (!env.isProduction) app.use(morgan("dev"));

// Uploaded images (product photos, banners, category images). ?w=400 serves a resized WebP copy.
app.use("/uploads", imageResize, express.static(env.upload.dir, { maxAge: "30d", immutable: true, index: false, dotfiles: "deny" }));

// Search engines
app.get("/sitemap.xml", seo.sitemap);
app.get("/robots.txt", seo.robots);

app.get("/", (req, res) => res.send("Diagon Store API is running ✨"));
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/admin", adminRoutes);
app.use("/api", storeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
