const prisma = require("../prisma");

/** "Wireless Speaker (Black)!" -> "wireless-speaker-black" */
function slugify(text) {
  const slug = String(text || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
  return slug || "item";
}

/**
 * Returns a slug that is unique for the given Prisma model.
 * `scope` adds extra where conditions (e.g. { categoryId } for subcategories).
 */
async function uniqueSlug(model, source, { excludeId, scope = {} } = {}) {
  const base = slugify(source);
  let candidate = base;
  let counter = 2;

  // eslint-disable-next-line no-await-in-loop
  while (
    await prisma[model].findFirst({
      where: { slug: candidate, ...scope, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${counter++}`;
  }

  return candidate;
}

module.exports = { slugify, uniqueSlug };
