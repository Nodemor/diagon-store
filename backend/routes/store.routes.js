// Public API used by the storefront — mounted at /api
const express = require("express");
const store = require("../controllers/store.controller");
const inquiry = require("../controllers/inquiry.controller");
const { validate } = require("../middleware/validate");
const { inquiryLimiter, trackLimiter } = require("../middleware/rateLimiters");
const { publicListQuery } = require("../validators/product");
const { createInquiry, trackQuery } = require("../validators/inquiry");
const { bannerQuery, slugParams } = require("../validators/content");

const router = express.Router();

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

module.exports = router;
