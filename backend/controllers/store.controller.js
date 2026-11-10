// Public storefront endpoints: home, products, categories, banners, settings, pages.
const prisma = require("../prisma");
const productService = require("../services/product.service");
const categoryService = require("../services/category.service");
const { getSettings } = require("../services/settings.service");
const { notFound } = require("../utils/httpError");

/** Active banners within their optional start/end dates. */
function activeBanners(placement) {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      isActive: true,
      ...(placement ? { placement } : {}),
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}

// GET /api/home — everything the landing page needs in one request
async function home(req, res) {
  const [heroBanners, promoBanners, featured, newArrivals, popular, onSale, categories] = await Promise.all([
    activeBanners("HERO"),
    activeBanners("PROMO"),
    productService.listSection({ isFeatured: true }, [{ updatedAt: "desc" }]),
    productService.listSection({ isNewArrival: true }, [{ createdAt: "desc" }]),
    productService.listSection({}, [{ viewCount: "desc" }, { createdAt: "desc" }]),
    productService.listSection({ salePrice: { not: null } }, [{ updatedAt: "desc" }]),
    categoryService.listPublic(),
  ]);

  res.json({ heroBanners, promoBanners, featured, newArrivals, popular, onSale, categories });
}

// GET /api/products
async function listProducts(req, res) {
  res.json(await productService.listPublic(req.valid.query));
}

// GET /api/products/:slug
async function getProduct(req, res) {
  res.json(await productService.getPublic(req.params.slug));
}

// GET /api/products/:slug/related
async function relatedProducts(req, res) {
  res.json(await productService.getRelated(req.params.slug));
}

// GET /api/categories
async function listCategories(req, res) {
  res.json(await categoryService.listPublic());
}

// GET /api/categories/:slug
async function getCategory(req, res) {
  res.json(await categoryService.getPublic(req.params.slug));
}

// GET /api/banners?placement=HERO|PROMO
async function listBanners(req, res) {
  res.json(await activeBanners(req.valid.query.placement));
}

// GET /api/settings
async function settings(req, res) {
  res.json(await getSettings());
}

// GET /api/pages/:slug
async function getPage(req, res) {
  const page = await prisma.page.findFirst({ where: { slug: req.valid.params.slug, isPublished: true } });
  if (!page) throw notFound("Page");
  res.json(page);
}

module.exports = {
  activeBanners,
  home,
  listProducts,
  getProduct,
  relatedProducts,
  listCategories,
  getCategory,
  listBanners,
  settings,
  getPage,
};
