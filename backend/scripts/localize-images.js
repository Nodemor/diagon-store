/* eslint-disable no-await-in-loop */
// Copies every external image (product photos, category images, banners) into
// backend/uploads and points the database at the local copy, so the shop never
// depends on a third-party image host being reachable.
//
//   npm run images:localize            download + update the database
//   npm run images:localize -- --dry   only list what would change
//
// Safe to run more than once: already-local images are skipped and identical
// URLs are downloaded only once.
require("dotenv/config");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const env = require("../config/env");
const prisma = require("../prisma");

const DRY = process.argv.includes("--dry");
const TYPES = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif", "image/gif": ".gif" };
const cache = new Map(); // remote url -> local path

const isRemote = (url) => /^https?:\/\//i.test(url || "");

/** Unsplash images can be fetched at a sensible size instead of the multi-MB original. */
function downloadUrl(url) {
  if (!url.includes("images.unsplash.com")) return url;
  const u = new URL(url);
  u.searchParams.set("w", "1200");
  u.searchParams.set("q", "80");
  u.searchParams.set("auto", "format");
  u.searchParams.set("fm", "jpg");
  return u.toString();
}

async function localize(url, folder) {
  if (cache.has(url)) return cache.get(url);

  const response = await fetch(downloadUrl(url), { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const type = (response.headers.get("content-type") || "").split(";")[0];
  const ext = TYPES[type];
  if (!ext) throw new Error(`not an image (${type || "unknown type"})`);

  const name = crypto.createHash("sha1").update(url).digest("hex").slice(0, 24) + ext;
  const dir = path.join(env.upload.dir, folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), Buffer.from(await response.arrayBuffer()));

  const local = `/uploads/${folder}/${name}`;
  cache.set(url, local);
  return local;
}

async function run(label, rows, folder, update) {
  let done = 0;
  let failed = 0;
  for (const row of rows) {
    if (!isRemote(row.url)) continue;
    if (DRY) {
      console.log(`  would copy ${label} #${row.id}: ${row.url.slice(0, 80)}`);
      continue;
    }
    try {
      const local = await localize(row.url, folder);
      await update(row.id, local);
      done += 1;
    } catch (error) {
      failed += 1;
      console.warn(`  ✗ ${label} #${row.id} kept remote (${error.message}): ${row.url.slice(0, 80)}`);
    }
  }
  console.log(`${label}: ${done} copied${failed ? `, ${failed} failed` : ""}`);
}

async function main() {
  const [images, categories, banners] = await Promise.all([
    prisma.productImage.findMany({ select: { id: true, url: true } }),
    prisma.category.findMany({ select: { id: true, imageUrl: true } }),
    prisma.banner.findMany({ select: { id: true, imageUrl: true } }),
  ]);

  await run("product images", images, "products", (id, url) => prisma.productImage.update({ where: { id }, data: { url } }));
  await run(
    "category images",
    categories.map((c) => ({ id: c.id, url: c.imageUrl })),
    "categories",
    (id, url) => prisma.category.update({ where: { id }, data: { imageUrl: url } }),
  );
  await run(
    "banner images",
    banners.map((b) => ({ id: b.id, url: b.imageUrl })),
    "banners",
    (id, url) => prisma.banner.update({ where: { id }, data: { imageUrl: url } }),
  );
  console.log(DRY ? "Dry run only — nothing changed." : `✅ Images are served from ${env.upload.dir}`);
}

main()
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
