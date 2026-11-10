const fs = require("fs/promises");
const path = require("path");
const env = require("../config/env");

/**
 * Deletes a locally uploaded file given its stored URL ("/uploads/products/abc.jpg").
 * External URLs (https://...) are ignored. Never throws — a missing file is not an error.
 */
async function removeUploadedFile(url) {
  if (!url || !url.startsWith("/uploads/")) return;

  const relative = url.replace(/^\/uploads\//, "");
  const absolute = path.resolve(env.upload.dir, relative);

  // Path traversal guard: only delete inside the upload directory
  if (!absolute.startsWith(env.upload.dir + path.sep)) return;

  try {
    await fs.unlink(absolute);
  } catch (error) {
    if (error.code !== "ENOENT") console.warn("Could not delete file", absolute, error.message);
  }
}

module.exports = { removeUploadedFile };
