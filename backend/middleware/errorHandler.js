const multer = require("multer");
const { HttpError } = require("../utils/httpError");
const env = require("../config/env");

// 404 for unknown routes
function notFoundHandler(req, res) {
  res.status(404).json({ message: "Route not found" });
}

// Every error ends up here and is returned as { message, errors? }
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, ...(err.errors ? { errors: err.errors } : {}) });
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? `Image is too large (max ${env.upload.maxSizeMb} MB)`
        : err.code === "LIMIT_UNEXPECTED_FILE"
          ? "Too many files or unexpected file field"
          : err.message;
    return res.status(400).json({ message });
  }

  // body-parser errors
  if (err.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid JSON body" });
  if (err.type === "entity.too.large") return res.status(413).json({ message: "Request body is too large" });

  // Prisma known errors
  switch (err.code) {
    case "P2002":
      return res.status(409).json({ message: "A record with this value already exists (name, slug or SKU must be unique)" });
    case "P2025":
      return res.status(404).json({ message: "Record not found" });
    case "P2003":
      return res.status(400).json({ message: "A related record does not exist (check category / subcategory / product IDs)" });
    default:
      break;
  }

  console.error(err);
  return res.status(500).json({
    message: "Something went wrong. Please try again.",
    ...(env.isProduction ? {} : { detail: err.message }),
  });
}

module.exports = { notFoundHandler, errorHandler };
