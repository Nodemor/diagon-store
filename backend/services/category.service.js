const prisma = require("../prisma");
const { uniqueSlug } = require("../utils/slugify");
const { notFound } = require("../utils/httpError");
const { VISIBLE } = require("./product.service");
const { removeUploadedFile } = require("./storage.service");

const order = [{ sortOrder: "asc" }, { name: "asc" }];

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

/** Active categories + active subcategories, with visible product counts. */
async function listPublic() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: order,
    include: {
      subcategories: {
        where: { isActive: true },
        orderBy: order,
        include: { _count: { select: { products: { where: VISIBLE } } } },
      },
      _count: { select: { products: { where: VISIBLE } } },
    },
  });

  return categories.map(({ _count, subcategories, ...category }) => ({
    ...category,
    productCount: _count.products,
    subcategories: subcategories.map(({ _count: subCount, ...sub }) => ({ ...sub, productCount: subCount.products })),
  }));
}

async function getPublic(slug) {
  const categories = await listPublic();
  const category = categories.find((c) => c.slug === slug);
  if (!category) throw notFound("Category");
  return category;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

async function listAdmin() {
  const categories = await prisma.category.findMany({
    orderBy: order,
    include: {
      subcategories: { orderBy: order, include: { _count: { select: { products: true } } } },
      _count: { select: { products: true } },
    },
  });
  return categories.map(({ _count, subcategories, ...category }) => ({
    ...category,
    productCount: _count.products,
    subcategories: subcategories.map(({ _count: subCount, ...sub }) => ({ ...sub, productCount: subCount.products })),
  }));
}

async function create(input) {
  const slug = await uniqueSlug("category", input.slug || input.name);
  return prisma.category.create({ data: { ...input, slug } });
}

async function update(id, input) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw notFound("Category");

  const data = { ...input };
  if (input.slug) data.slug = await uniqueSlug("category", input.slug, { excludeId: id });
  else delete data.slug;

  const updated = await prisma.category.update({ where: { id }, data });
  if (input.imageUrl !== undefined && existing.imageUrl && existing.imageUrl !== updated.imageUrl) {
    await removeUploadedFile(existing.imageUrl);
  }
  return updated;
}

/** Deletes the category and its subcategories. Products stay but become uncategorised. */
async function remove(id) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw notFound("Category");
  await prisma.category.delete({ where: { id } });
  await removeUploadedFile(existing.imageUrl);
}

async function createSubcategory(categoryId, input) {
  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!category) throw notFound("Category");
  const slug = await uniqueSlug("subcategory", input.slug || input.name, { scope: { categoryId } });
  return prisma.subcategory.create({ data: { ...input, slug, categoryId } });
}

async function updateSubcategory(id, input) {
  const existing = await prisma.subcategory.findUnique({ where: { id } });
  if (!existing) throw notFound("Subcategory");

  const data = { ...input };
  if (input.slug) data.slug = await uniqueSlug("subcategory", input.slug, { excludeId: id, scope: { categoryId: existing.categoryId } });
  else delete data.slug;

  return prisma.subcategory.update({ where: { id }, data });
}

async function removeSubcategory(id) {
  const existing = await prisma.subcategory.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound("Subcategory");
  await prisma.subcategory.delete({ where: { id } });
}

module.exports = {
  listPublic,
  getPublic,
  listAdmin,
  create,
  update,
  remove,
  createSubcategory,
  updateSubcategory,
  removeSubcategory,
};
