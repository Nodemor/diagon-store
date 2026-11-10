const { z, emptyToNull, optionalText, id, boolQuery, pageQuery, money } = require("./common");

const PRODUCT_STATUSES = ["ACTIVE", "INACTIVE", "OUT_OF_STOCK", "DRAFT"];
const PUBLIC_SORTS = ["newest", "price_asc", "price_desc", "name_asc", "popular", "featured"];

const specification = z.object({
  label: z.string().trim().min(1).max(100),
  value: z.string().trim().min(1).max(500),
});

const productFields = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(191),
  slug: optionalText(180),
  sku: optionalText(64),
  brand: optionalText(100),
  shortDescription: optionalText(500),
  description: optionalText(20000),
  price: money,
  salePrice: emptyToNull(money.nullish()),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.coerce.number().int().min(0).max(100_000).optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  specifications: z.array(specification).max(50).nullish(),
  tags: z.union([z.array(z.string().trim().max(50)).max(30), z.string().max(500)]).nullish(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  categoryId: emptyToNull(id.nullish()),
  subcategoryId: emptyToNull(id.nullish()),
  relatedProductIds: z.array(id).max(20).optional(),
  metaTitle: optionalText(191),
  metaDescription: optionalText(300),
});

const createProduct = productFields;
const updateProduct = productFields.partial();

const stockUpdate = z
  .object({
    stock: z.coerce.number().int().min(0).max(1_000_000).optional(),
    adjust: z.coerce.number().int().min(-1_000_000).max(1_000_000).optional(),
    status: z.enum(PRODUCT_STATUSES).optional(),
  })
  .refine((v) => v.stock !== undefined || v.adjust !== undefined || v.status !== undefined, {
    message: "Send stock, adjust or status",
  });

const publicListQuery = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(191).optional(),
  subcategory: z.string().trim().max(191).optional(),
  minPrice: money.optional(),
  maxPrice: money.optional(),
  availability: z.enum(["in_stock", "out_of_stock"]).optional(),
  featured: boolQuery,
  newArrival: boolQuery,
  onSale: boolQuery,
  brand: z.string().trim().max(100).optional(),
  sort: z.enum(PUBLIC_SORTS).optional(),
  ...pageQuery,
});

const adminListQuery = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  categoryId: id.optional(),
  stock: z.enum(["low", "out"]).optional(),
  featured: boolQuery,
  newArrival: boolQuery,
  sort: z.enum(["newest", "oldest", "name_asc", "price_asc", "price_desc", "stock_asc"]).optional(),
  ...pageQuery,
});

const imageMeta = z.object({ altText: optionalText(191) });
const imageByUrl = z.object({ url: z.string().trim().url().max(1000), altText: optionalText(191) });
const imageOrder = z.object({ order: z.array(id).min(1).max(50) });

module.exports = {
  PRODUCT_STATUSES,
  createProduct,
  updateProduct,
  stockUpdate,
  publicListQuery,
  adminListQuery,
  imageMeta,
  imageByUrl,
  imageOrder,
};
