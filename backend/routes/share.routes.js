// Share links with link previews for WhatsApp, Facebook, etc. — mounted at /s (outside /api so links stay short)
const express = require("express");
const share = require("../controllers/share.controller");
const { shareLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.use(shareLimiter);
router.get("/o/:token", share.orderPage);
router.get("/o/:token/image.jpg", share.orderImage);
router.get("/p/:slug", share.productPage);
router.get("/p/:slug/image.jpg", share.productImage);

module.exports = router;
