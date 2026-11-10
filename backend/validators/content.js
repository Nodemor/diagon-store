const { z, optionalText } = require("./common");

const bannerFields = z.object({
  title: z.string().trim().min(1).max(191),
  subtitle: optionalText(500),
  imageUrl: z.string().trim().min(1).max(1000),
  buttonText: optionalText(60),
  buttonLink: optionalText(500),
  placement: z.enum(["HERO", "PROMO"]).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(100_000).optional(),
  startsAt: z.preprocess((v) => (v === "" ? null : v), z.coerce.date().nullish()),
  endsAt: z.preprocess((v) => (v === "" ? null : v), z.coerce.date().nullish()),
});

const bannerQuery = z.object({ placement: z.enum(["HERO", "PROMO"]).optional() });

const settingsUpdate = z.record(z.string().max(64), z.union([z.string().max(5000), z.null()]));

const pageUpdate = z.object({
  title: z.string().trim().min(1).max(191),
  content: z.string().max(200_000),
  metaTitle: optionalText(191),
  metaDescription: optionalText(300),
  isPublished: z.boolean().optional(),
});

const slugParams = z.object({ slug: z.string().trim().min(1).max(191) });

module.exports = {
  createBanner: bannerFields,
  updateBanner: bannerFields.partial(),
  bannerQuery,
  settingsUpdate,
  pageUpdate,
  slugParams,
};
