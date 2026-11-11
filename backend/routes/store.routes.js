// Public API used by the storefront — mounted at /api
const express = require("express");
const store = require("../controllers/store.controller");
const inquiry = require("../controllers/inquiry.controller");
const contact = require("../controllers/contact.controller");
const { validate } = require("../middleware/validate");
const { inquiryLimiter, trackLimiter, contactLimiter } = require("../middleware/rateLimiters");
const { publicListQuery } = require("../validators/product");
const { createInquiry, trackQuery } = require("../validators/inquiry");
const { bannerQuery, slugParams } = require("../validators/content");
const { createMessage } = require("../validators/contact");

const router = express.Router();

// Public catalogue data can be cached briefly by browsers and CDNs (admin changes show within a minute).
// Order tracking is personal and is never cached.
router.use((req, res, next) => {
  if (req.method === "GET") {
    res.set("Cache-Control", req.path.startsWith("/inquiries") ? "no-store" : "public, max-age=60, stale-while-revalidate=300");
  }
  next();
});

router.get("/home", store.home);

router.get("/products", validate({ query: publicListQuery }), store.listProducts);
router.get("/products/:slug", store.getProduct);
router.get("/products/:slug/related", store.relatedProducts);

router.get("/categories", store.listCategories);
router.get("/categories/:slug", store.getCategory);

router.get("/banners", validate({ query: bannerQuery }), store.listBanners);
router.get("/settings", store.settings);
router.get("/pages/:slug", validate({ params: slugParams }), store.getPage);

router.post("/inquiries", inquiryLimiter, validate({ body: createInquiry }), inquiry.create);
router.get("/inquiries/track", trackLimiter, validate({ query: trackQuery }), inquiry.track);

router.post("/contact", contactLimiter, validate({ body: createMessage }), contact.create);

module.exports = router;
