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

  // also remove resized copies made by middleware/imageResize.js
  const cacheDir = path.join(env.upload.dir, ".cache");
  const variant = relative.replace(/\.[a-z0-9]+$/i, ".webp");
  const widths = await fs.readdir(cacheDir).catch(() => []);
  await Promise.all(widths.map((w) => fs.unlink(path.join(cacheDir, w, variant)).catch(() => {})));
}

module.exports = { removeUploadedFile };
