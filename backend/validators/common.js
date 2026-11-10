const { z } = require("zod");

/** "" -> null so form fields can be cleared */
const emptyToNull = (schema) => z.preprocess((v) => (v === "" ? null : v), schema);

/** Optional text: undefined = "not sent" (keep), "" / null = clear */
const optionalText = (max) =>
  z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(max).nullish());

const id = z.coerce.number().int().positive();
const idParams = z.object({ id });

const boolQuery = z
  .enum(["true", "false", "1", "0"])
  .transform((v) => v === "true" || v === "1")
  .optional();

const pageQuery = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
};

const money = z.coerce.number().min(0).max(99_999_999);

module.exports = { z, emptyToNull, optionalText, id, idParams, boolQuery, pageQuery, money };
