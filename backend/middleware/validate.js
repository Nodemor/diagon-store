const { badRequest } = require("../utils/httpError");

const formatIssues = (error) =>
  error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));

/**
 * validate({ body, query, params }) — each is an optional Zod schema.
 * Parsed values go to req.valid.body / req.valid.query / req.valid.params
 * (Express 5 makes req.query read-only, so we never overwrite it).
 */
const validate = (schemas) => (req, res, next) => {
  req.valid = req.valid || {};

  for (const part of ["params", "query", "body"]) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part] ?? {});
    if (!result.success) throw badRequest("Please check the highlighted fields.", formatIssues(result.error));
    req.valid[part] = result.data;
  }

  next();
};

module.exports = { validate, formatIssues };
