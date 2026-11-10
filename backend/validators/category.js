const { z, optionalText } = require("./common");

const categoryFields = z.object({
  name: z.string().trim().min(2).max(191),
  slug: optionalText(180),
  description: optionalText(5000),
  imageUrl: optionalText(1000),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(100_000).optional(),
  metaTitle: optionalText(191),
  metaDescription: optionalText(300),
});

const subcategoryFields = z.object({
  name: z.string().trim().min(2).max(191),
  slug: optionalText(180),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(100_000).optional(),
});

module.exports = {
  createCategory: categoryFields,
  updateCategory: categoryFields.partial(),
  createSubcategory: subcategoryFields,
  updateSubcategory: subcategoryFields.partial(),
};
