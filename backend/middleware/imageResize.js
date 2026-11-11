// On-the-fly image resizing for uploaded photos (proposal §32 "optimized images").
//   /uploads/products/abc.jpg          → original
//   /uploads/products/abc.jpg?w=400    → 400 px wide WebP, generated once and cached on disk
// Only a fixed set of widths is allowed so nobody can fill the disk with variants.
const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");
const env = require("../config/env");

const WIDTHS = [120, 160, 200, 240, 400, 600, 800, 1000, 1200, 1600];
const CACHE_DIR = path.join(env.upload.dir, ".cache");
const RESIZABLE = /\.(jpe?g|png|webp|avif)$/i;

/** Smallest allowed width that is at least the requested width. */
const pickWidth = (requested) => WIDTHS.find((w) => w >= requested) || WIDTHS[WIDTHS.length - 1];

async function imageResize(req, res, next) {
  const requested = Number.parseInt(req.query.w, 10);
  if (!requested || req.method !== "GET" || !RESIZABLE.test(req.path)) return next();

  const relative = decodeURIComponent(req.path).replace(/^\/+/, "");
  const source = path.resolve(env.upload.dir, relative);
  // path-traversal guard and never resize files from the cache itself
  if (!source.startsWith(env.upload.dir + path.sep) || relative.startsWith(".cache")) return next();

  const width = pickWidth(requested);
  const target = path.join(CACHE_DIR, String(width), relative.replace(RESIZABLE, ".webp"));

  const send = () =>
    res.sendFile(target, {
      dotfiles: "allow", // the cache lives in uploads/.cache
      headers: { "Cache-Control": "public, max-age=2592000, immutable", "Content-Type": "image/webp" },
    });

  try {
    await fs.access(target);
    return send();
  } catch {
    /* not cached yet */
  }

  try {
    await fs.mkdir(path.dirname(target), { recursive: true });
    await sharp(source).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toFile(target);
    return send();
  } catch (error) {
    if (error.code === "ENOENT" || /missing|unsupported/i.test(error.message)) return next(); // fall back to static / 404
    return next(error);
  }
}

module.exports = { imageResize };
