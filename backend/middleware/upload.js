const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const env = require("../config/env");
const { badRequest } = require("../utils/httpError");

// Allow-listed image types -> file extension
const IMAGE_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

/**
 * Multer instance that stores images in uploads/<folder>/ with random file names.
 * Usage: imageUpload("products").array("images", 10) / .single("image")
 */
function imageUpload(folder) {
  const destination = path.join(env.upload.dir, folder);
  fs.mkdirSync(destination, { recursive: true });

  return multer({
    storage: multer.diskStorage({
      destination,
      filename: (req, file, cb) => cb(null, `${crypto.randomBytes(16).toString("hex")}${IMAGE_TYPES[file.mimetype]}`),
    }),
    limits: { fileSize: env.upload.maxSizeMb * 1024 * 1024, files: 10 },
    fileFilter: (req, file, cb) => {
      if (IMAGE_TYPES[file.mimetype]) return cb(null, true);
      return cb(badRequest("Only JPG, PNG, WEBP, GIF or AVIF images are allowed"));
    },
  });
}

/** Public URL path stored in the database for an uploaded file. */
const publicPath = (folder, file) => `/uploads/${folder}/${file.filename}`;

module.exports = { imageUpload, publicPath };
