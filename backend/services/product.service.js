const { Prisma } = require("@prisma/client");
const prisma = require("../prisma");
const { serializeProduct, tagsToString, paginate, pageResult } = require("../utils/serialize");
const { uniqueSlug } = require("../utils/slugify");
const { badRequest, notFound } = require("../utils/httpError");
const { removeUploadedFile } = require("./storage.service");
const { sanitizeHtml } = require("../utils/sanitizeHtml");

// ---------------------------------------------------------------------------
// Shared query pieces
// ---------------------------------------------------------------------------

/** Products customers may see: ACTIVE or OUT_OF_STOCK, and not in a disabled category. */
const VISIBLE = {
  status: { in: ["ACTIVE", "OUT_OF_STOCK"] },
  OR: [{ categoryId: null }, { category: { isActive: true } }],
};

const imageOrder = [{ sortOrder: "asc" }, { id: "asc" }];

const cardInclude = {
  category: { select: { id: true, name: true, slug: true } },
  subcategory: { select: { id: true, name: true, slug: true } },
  images: { orderBy: imageOrder, take: 2 }, // main + hover image
};

const PUBLIC_SORT = {
  newest: [{ createdAt: "desc" }],
  price_asc: [{ price: "asc" }],
  price_desc: [{ price: "desc" }],
  name_asc: [{ name: "asc" }],
  popular: [{ viewCount: "desc" }, { createdAt: "desc" }],
  featured: [{ isFeatured: "desc" }, { createdAt: "desc" }],
};

const ADMIN_SORT = {
  newest: [{ createdAt: "desc" }],
  oldest: [{ createdAt: "asc" }],
  name_asc: [{ name: "asc" }],
  price_asc: [{ price: "asc" }],
  price_desc: [{ price: "desc" }],
  stock_asc: [{ stock: "asc" }],
};

function searchConditions(search, fields) {
  return search
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .map((term) => ({ OR: fields.map((field) => field(term)) }));
}

const PUBLIC_SEARCH_FIELDS = [
  (t) => ({ name: { contains: t } }),
  (t) => ({ sku: { contains: t } }),
  (t) => ({ brand: { contains: t } }),
  (t) => ({ tags: { contains: t } }),
  (t) => ({ shortDescription: { contains: t } }),
  (t) => ({ category: { name: { contains: t } } }),
  (t) => ({ subcategory: { name: { contains: t } } }),
];

function priceRange(min, max) {
  if (min === undefined && max === undefined) return null;
  const range = {};
  if (min !== undefined) range.gte = min;
  if (max !== undefined) range.lte = max;
  // effective price = salePrice when on sale, otherwise price
  return { OR: [{ salePrice: { not: null, ...range } }, { salePrice: null, price: range }] };
}

// ---------------------------------------------------------------------------
// Public (storefront)
// ---------------------------------------------------------------------------

async function listPublic(query) {
  const AND = [VISIBLE];
  if (query.search) AND.push(...searchConditions(query.search, PUBLIC_SEARCH_FIELDS));
  if (query.category) AND.push({ category: { slug: query.category } });
  if (query.subcategory) AND.push({ subcategory: { slug: query.subcategory } });
  if (query.brand) AND.push({ brand: query.brand });
  if (query.ids) AND.push({ id: { in: query.ids } });
  if (query.featured) AND.push({ isFeatured: true });
  if (query.newArrival) AND.push({ isNewArrival: true });
  if (query.onSale) AND.push({ salePrice: { not: null } });
  if (query.availability === "in_stock") AND.push({ status: "ACTIVE", stock: { gt: 0 } });
  if (query.availability === "out_of_stock") AND.push({ OR: [{ status: "OUT_OF_STOCK" }, { stock: { lte: 0 } }] });
  const range = priceRange(query.minPrice, query.maxPrice);
  if (range) AND.push(range);

  const where = { AND };
  const pagination = paginate(query, { defaultLimit: 12, maxLimit: 60 });

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: cardInclude,
      orderBy: PUBLIC_SORT[query.sort || "newest"],
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.product.count({ where }),
  ]);

  return pageResult(items.map(serializeProduct), total, pagination);
}

/** Product detail by slug (or numeric id). Counts a view. */
async function getPublic(slugOrId) {
  const asId = /^\d+$/.test(slugOrId) ? Number(slugOrId) : null;

  const product = await prisma.product.findFirst({
    where: { AND: [VISIBLE, asId ? { OR: [{ slug: slugOrId }, { id: asId }] } : { slug: slugOrId }] },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      subcategory: { select: { id: true, name: true, slug: true } },
      images: { orderBy: imageOrder },
    },
  });

  if (!product) throw notFound("Product");

  // raw update so updatedAt is not touched by a page view
  prisma.$executeRaw`UPDATE \`Product\` SET \`viewCount\` = \`viewCount\` + 1 WHERE \`id\` = ${product.id}`.catch(() => {});

  return serializeProduct(product);
}

/**
 * Related products (proposal §20): hand-picked first, then same subcategory,
 * then same category, then featured products to fill the row.
 */
async function getRelated(slugOrId, limit = 8) {
  const asId = /^\d+$/.test(slugOrId) ? Number(slugOrId) : null;
  const product = await prisma.product.findFirst({
    where: asId ? { OR: [{ slug: slugOrId }, { id: asId }] } : { slug: slugOrId },
    select: {
      id: true,
      categoryId: true,
      subcategoryId: true,
      relatedTo: { where: VISIBLE, include: cardInclude, take: limit },
    },
  });
  if (!product) throw notFound("Product");

  const results = [...product.relatedTo];
  const seen = new Set([product.id, ...results.map((p) => p.id)]);

  const fillers = [
    product.subcategoryId && { subcategoryId: product.subcategoryId },
    product.categoryId && { categoryId: product.categoryId },
    { isFeatured: true },
  ].filter(Boolean);

  for (const condition of fillers) {
    if (results.length >= limit) break;
    // eslint-disable-next-line no-await-in-loop
    const more = await prisma.product.findMany({
      where: { AND: [VISIBLE, condition, { id: { notIn: [...seen] } }] },
      include: cardInclude,
      orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
      take: limit - results.length,
    });
    more.forEach((p) => seen.add(p.id));
    results.push(...more);
  }

  return results.map(serializeProduct);
}

/** Small lists used by the home page. */
async function listSection(where, orderBy, take = 8) {
  const items = await prisma.product.findMany({
    where: { AND: [VISIBLE, where] },
    include: cardInclude,
    orderBy,
    take,
  });
  return items.map(serializeProduct);
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

async function listAdmin(query) {
  const AND = [];
  if (query.search) {
    AND.push(
      ...searchConditions(query.search, [
        (t) => ({ name: { contains: t } }),
        (t) => ({ sku: { contains: t } }),
        (t) => ({ brand: { contains: t } }),
      ]),
    );
  }
  if (query.status) AND.push({ status: query.status });
  if (query.categoryId) AND.push({ categoryId: query.categoryId });
  if (query.featured !== undefined) AND.push({ isFeatured: query.featured });
  if (query.newArrival !== undefined) AND.push({ isNewArrival: query.newArrival });
  if (query.stock === "out") AND.push({ OR: [{ stock: { lte: 0 } }, { status: "OUT_OF_STOCK" }] });
  if (query.stock === "low") AND.push({ stock: { gt: 0, lte: prisma.product.fields.lowStockThreshold } });

  const where = { AND };
  const pagination = paginate(query, { defaultLimit: 20, maxLimit: 100 });

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { ...cardInclude, images: { orderBy: imageOrder, take: 1 }, _count: { select: { inquiryItems: true } } },
      orderBy: ADMIN_SORT[query.sort || "newest"],
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.product.count({ where }),
  ]);

  return pageResult(items.map(serializeProduct), total, pagination);
}

async function getAdmin(id) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      subcategory: { select: { id: true, name: true, slug: true } },
      images: { orderBy: imageOrder },
      relatedTo: { select: { id: true, name: true, slug: true, sku: true } },
    },
  });
  if (!product) throw notFound("Product");

  const { relatedTo, ...rest } = product;
  return { ...serializeProduct(rest), relatedProducts: relatedTo, relatedProductIds: relatedTo.map((p) => p.id) };
}

/** Validates price, category/subcategory and related IDs, and builds Prisma data. */
async function buildProductData(input, existing) {
  const data = {};
  const copy = [
    "name", "sku", "brand", "shortDescription", "description", "price", "salePrice", "stock",
    "lowStockThreshold", "status", "isFeatured", "isNewArrival", "metaTitle", "metaDescription",
  ];
  for (const key of copy) if (input[key] !== undefined) data[key] = input[key];
  if (input.description !== undefined) data.description = sanitizeHtml(input.description);

  if (input.specifications !== undefined) {
    data.specifications = input.specifications === null ? Prisma.DbNull : input.specifications;
  }
  if (input.tags !== undefined) data.tags = tagsToString(input.tags);

  // Sale price must be below regular price
  const price = input.price ?? (existing ? Number(existing.price) : undefined);
  const salePrice = input.salePrice !== undefined ? input.salePrice : existing?.salePrice != null ? Number(existing.salePrice) : null;
  if (salePrice !== null && salePrice !== undefined && price !== undefined && salePrice >= price) {
    throw badRequest("Sale price must be lower than the regular price", [{ path: "salePrice", message: "Must be lower than the regular price" }]);
  }

  // Category / subcategory consistency
  let categoryId = input.categoryId !== undefined ? input.categoryId : existing?.categoryId ?? null;
  const subcategoryId = input.subcategoryId !== undefined ? input.subcategoryId : existing?.subcategoryId ?? null;

  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!category) throw badRequest("Selected category does not exist", [{ path: "categoryId", message: "Category not found" }]);
  }
  if (subcategoryId) {
    const sub = await prisma.subcategory.findUnique({ where: { id: subcategoryId }, select: { categoryId: true } });
    if (!sub) throw badRequest("Selected subcategory does not exist", [{ path: "subcategoryId", message: "Subcategory not found" }]);
    if (!categoryId) categoryId = sub.categoryId;
    if (sub.categoryId !== categoryId) {
      throw badRequest("Subcategory does not belong to the selected category", [
        { path: "subcategoryId", message: "Choose a subcategory of the selected category" },
      ]);
    }
  }
  if (input.categoryId !== undefined || input.subcategoryId !== undefined) {
    data.categoryId = categoryId;
    data.subcategoryId = subcategoryId;
  }

  // Slug: explicit slug, or generated from the name on create. Kept stable on rename.
  if (input.slug) data.slug = await uniqueSlug("product", input.slug, { excludeId: existing?.id });
  else if (!existing) data.slug = await uniqueSlug("product", input.name);

  // Hand-picked related products
  if (input.relatedProductIds !== undefined) {
    const ids = [...new Set(input.relatedProductIds)].filter((rid) => rid !== existing?.id);
    const found = await prisma.product.count({ where: { id: { in: ids } } });
    if (found !== ids.length) throw badRequest("One or more related products do not exist", [{ path: "relatedProductIds", message: "Unknown product" }]);
    data.relatedTo = existing ? { set: ids.map((rid) => ({ id: rid })) } : { connect: ids.map((rid) => ({ id: rid })) };
  }

  return data;
}

async function create(input) {
  const data = await buildProductData(input, null);
  const product = await prisma.product.create({ data });
  return getAdmin(product.id);
}

async function update(id, input) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw notFound("Product");
  const data = await buildProductData(input, existing);
  await prisma.product.update({ where: { id }, data });
  return getAdmin(id);
}

async function updateStock(id, { stock, adjust, status }) {
  const existing = await prisma.product.findUnique({ where: { id }, select: { stock: true } });
  if (!existing) throw notFound("Product");

  const data = {};
  if (stock !== undefined) data.stock = stock;
  else if (adjust !== undefined) data.stock = Math.max(0, existing.stock + adjust);
  if (status !== undefined) data.status = status;

  await prisma.product.update({ where: { id }, data });
  return getAdmin(id);
}

async function remove(id) {
  const product = await prisma.product.findUnique({ where: { id }, include: { images: true } });
  if (!product) throw notFound("Product");
  await prisma.product.delete({ where: { id } }); // order items keep their snapshot (productId -> NULL)
  await Promise.all(product.images.map((image) => removeUploadedFile(image.url)));
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

async function nextImageOrder(productId) {
  const last = await prisma.productImage.findFirst({ where: { productId }, orderBy: { sortOrder: "desc" } });
  return last ? last.sortOrder + 1 : 0;
}

async function ensureProduct(productId) {
  const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, name: true } });
  if (!exists) throw notFound("Product");
  return exists;
}

async function listImages(productId) {
  return prisma.productImage.findMany({ where: { productId }, orderBy: imageOrder });
}

async function addImages(productId, images) {
  const product = await ensureProduct(productId);
  let order = await nextImageOrder(productId);
  await prisma.productImage.createMany({
    data: images.map((image) => ({
      productId,
      url: image.url,
      altText: image.altText || product.name,
      sortOrder: order++,
    })),
  });
  return listImages(productId);
}

async function reorderImages(productId, orderIds) {
  await ensureProduct(productId);
  await prisma.$transaction(
    orderIds.map((imageId, index) =>
      prisma.productImage.updateMany({ where: { id: imageId, productId }, data: { sortOrder: index } }),
    ),
  );
  return listImages(productId);
}

async function updateImage(productId, imageId, { altText }) {
  const result = await prisma.productImage.updateMany({ where: { id: imageId, productId }, data: { altText } });
  if (!result.count) throw notFound("Image");
  return listImages(productId);
}

async function deleteImage(productId, imageId) {
  const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } });
  if (!image) throw notFound("Image");
  await prisma.productImage.delete({ where: { id: imageId } });
  await removeUploadedFile(image.url);
  return listImages(productId);
}

module.exports = {
  VISIBLE,
  cardInclude,
  listPublic,
  getPublic,
  getRelated,
  listSection,
  listAdmin,
  getAdmin,
  create,
  update,
  updateStock,
  remove,
  addImages,
  reorderImages,
  updateImage,
  deleteImage,
};
