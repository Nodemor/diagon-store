// Admin API — mounted at /api/admin. Everything except /login needs an admin token.
const express = require("express");
const { z } = require("zod");
const auth = require("../controllers/admin/auth.controller");
const catalog = require("../controllers/admin/catalog.controller");
const sales = require("../controllers/admin/sales.controller");
const content = require("../controllers/admin/content.controller");
const contact = require("../controllers/contact.controller");
const contactV = require("../validators/contact");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { loginLimiter } = require("../middleware/rateLimiters");
const { imageUpload } = require("../middleware/upload");
const { idParams, id } = require("../validators/common");
const productV = require("../validators/product");
const categoryV = require("../validators/category");
const inquiryV = require("../validators/inquiry");
const adminV = require("../validators/admin");
const contentV = require("../validators/content");

const router = express.Router();

const imageParams = z.object({ id, imageId: id });
const folderParams = z.object({ folder: z.enum(["banners", "categories", "content"]) });
const productImages = imageUpload("products").array("images", 10);
const uploaders = {
  banners: imageUpload("banners").single("image"),
  categories: imageUpload("categories").single("image"),
  content: imageUpload("content").single("image"),
};

// ---- Auth --------------------------------------------------------------------
router.post("/login", loginLimiter, validate({ body: adminV.login }), auth.login);

router.use(requireAuth);

router.get("/profile", auth.profile);
router.put("/profile/password", validate({ body: adminV.changePassword }), auth.changePassword);

// ---- Dashboard ---------------------------------------------------------------
router.get("/dashboard", sales.dashboard);

// ---- Products -----------------------------------------------------------------
router.get("/products", validate({ query: productV.adminListQuery }), catalog.listProducts);
router.post("/products", validate({ body: productV.createProduct }), catalog.createProduct);
router.get("/products/:id", validate({ params: idParams }), catalog.getProduct);
router.put("/products/:id", validate({ params: idParams, body: productV.updateProduct }), catalog.updateProduct);
router.patch("/products/:id/stock", validate({ params: idParams, body: productV.stockUpdate }), catalog.updateStock);
router.delete("/products/:id", validate({ params: idParams }), catalog.deleteProduct);

router.post("/products/:id/images", validate({ params: idParams }), productImages, catalog.addImages);
router.put("/products/:id/images/order", validate({ params: idParams, body: productV.imageOrder }), catalog.reorderImages);
router.patch("/products/:id/images/:imageId", validate({ params: imageParams, body: productV.imageMeta }), catalog.updateImage);
router.delete("/products/:id/images/:imageId", validate({ params: imageParams }), catalog.deleteImage);

// ---- Categories & subcategories ------------------------------------------------
router.get("/categories", catalog.listCategories);
router.post("/categories", validate({ body: categoryV.createCategory }), catalog.createCategory);
router.put("/categories/:id", validate({ params: idParams, body: categoryV.updateCategory }), catalog.updateCategory);
router.delete("/categories/:id", validate({ params: idParams }), catalog.deleteCategory);
router.post(
  "/categories/:id/subcategories",
  validate({ params: idParams, body: categoryV.createSubcategory }),
  catalog.createSubcategory,
);
router.put("/subcategories/:id", validate({ params: idParams, body: categoryV.updateSubcategory }), catalog.updateSubcategory);
router.delete("/subcategories/:id", validate({ params: idParams }), catalog.deleteSubcategory);

// ---- Orders / inquiries ----------------------------------------------------------
router.get("/inquiries", validate({ query: inquiryV.adminListQuery }), sales.listInquiries);
router.get("/inquiries/:id", validate({ params: idParams }), sales.getInquiry);
router.patch("/inquiries/:id/status", validate({ params: idParams, body: inquiryV.statusUpdate }), sales.updateInquiryStatus);
router.patch("/inquiries/:id/notes", validate({ params: idParams, body: inquiryV.notesUpdate }), sales.updateInquiryNotes);
router.delete("/inquiries/:id", validate({ params: idParams }), sales.deleteInquiry);

// ---- Contact messages ------------------------------------------------------------
router.get("/messages", validate({ query: contactV.listQuery }), contact.list);
router.patch("/messages/:id", validate({ params: idParams, body: contactV.updateMessage }), contact.update);
router.delete("/messages/:id", validate({ params: idParams }), contact.remove);

// ---- Customers -------------------------------------------------------------------
router.get("/customers", sales.listCustomers);
router.get("/customers/:id", validate({ params: idParams }), sales.getCustomer);

// ---- Banners ------------------------------------------------------------------------
router.get("/banners", content.listBanners);
router.post("/banners", validate({ body: contentV.createBanner }), content.createBanner);
router.put("/banners/:id", validate({ params: idParams, body: contentV.updateBanner }), content.updateBanner);
router.delete("/banners/:id", validate({ params: idParams }), content.deleteBanner);

// ---- Uploads (banner / category / content images) --------------------------------------
router.post(
  "/uploads/:folder",
  validate({ params: folderParams }),
  (req, res, next) => uploaders[req.valid.params.folder](req, res, next),
  content.uploadImage,
);

// ---- Settings & pages ------------------------------------------------------------------
router.get("/settings", content.getAllSettings);
router.put("/settings", validate({ body: contentV.settingsUpdate }), content.updateSettings);

router.get("/pages", content.listPages);
router.get("/pages/:slug", validate({ params: contentV.slugParams }), content.getPage);
router.put("/pages/:slug", validate({ params: contentV.slugParams, body: contentV.pageUpdate }), content.savePage);
router.delete("/pages/:slug", validate({ params: contentV.slugParams }), content.deletePage);

// ---- Admin users (SUPER_ADMIN only) -------------------------------------------------------
router.get("/admins", requireRole("SUPER_ADMIN"), content.listAdmins);
router.post("/admins", requireRole("SUPER_ADMIN"), validate({ body: adminV.createAdmin }), content.createAdmin);
router.put("/admins/:id", requireRole("SUPER_ADMIN"), validate({ params: idParams, body: adminV.updateAdmin }), content.updateAdmin);
router.delete("/admins/:id", requireRole("SUPER_ADMIN"), validate({ params: idParams }), content.deleteAdmin);

module.exports = router;
