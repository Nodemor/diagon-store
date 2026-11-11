// Checks that uploaded files really are images by reading their contents with sharp.
// Multer only sees the type the browser *claims*; a renamed script or HTML file would pass that.
// Anything that isn't a real JPEG / PNG / WebP / GIF / AVIF is deleted and the request is refused.
const fs = require("fs/promises");
const sharp = require("sharp");
const { badRequest } = require("../utils/httpError");

const ALLOWED = new Set(["jpeg", "png", "webp", "gif", "avif", "heif"]);
const MAX_PIXELS = 50_000_000; // ~ 7000 × 7000: refuse "decompression bomb" images

async function isRealImage(file) {
  try {
    const meta = await sharp(file.path, { limitInputPixels: MAX_PIXELS }).metadata();
    return ALLOWED.has(meta.format) && meta.width > 0 && meta.height > 0;
  } catch {
    return false;
  }
}

async function verifyImages(req, res, next) {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) return next();

  const checks = await Promise.all(files.map(isRealImage));
  if (checks.every(Boolean)) return next();

  await Promise.all(files.map((f) => fs.unlink(f.path).catch(() => {})));
  throw badRequest("That file isn't a valid image. Upload a JPG, PNG, WEBP, GIF or AVIF photo.");
}

module.exports = { verifyImages };
