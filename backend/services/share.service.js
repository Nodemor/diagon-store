// Link previews for WhatsApp, Facebook, Telegram... (proposal §3 "share product", §9 WhatsApp orders).
// Chat apps don't run JavaScript, so the single-page shop can't show a preview by itself.
// Instead, messages contain short share links that the API answers with preview tags + a redirect:
//   /s/o/<shareToken>            order link: order number, items, total, product photo → /track
//   /s/p/<slug>                  product link: name, price, photo → /product/<slug>
//   .../image.jpg                1200×630 preview card, generated once with sharp and cached on disk
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");
const prisma = require("../prisma");
const env = require("../config/env");
const { serializeProduct } = require("../utils/serialize");
const { formatMoney, escapeHtml } = require("../utils/format");
const { VISIBLE } = require("./product.service");

const CARD = { width: 1200, height: 630 };
const PHOTO = 600; // left part of the card
const CACHE_DIR = path.join(env.upload.dir, ".cache", "og");
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{22}$/;

const COLORS = { night: "#1c2230", deep: "#141924", cobble: "#2b3345", lamp: "#f2b544", moon: "#e9edf3", moonSoft: "#a9b3c4", verdigris: "#4fa39a", oxblood: "#d9737f" };
const SANS = "Figtree, 'Segoe UI', Arial, Helvetica, sans-serif";
const SERIF = "'IM Fell English', Georgia, 'Times New Roman', serif";

// ---- links ----------------------------------------------------------------------------------

/** 128-bit random code, URL-safe (22 characters). */
const newShareToken = () => crypto.randomBytes(16).toString("base64url");
const isShareToken = (value) => TOKEN_PATTERN.test(String(value || ""));

const orderShareUrl = (token) => `${env.siteUrl}/s/o/${token}`;
const productShareUrl = (slug) => `${env.siteUrl}/s/p/${encodeURIComponent(slug)}`;

/** Orders placed before share links existed get a code the first time one is needed. */
async function ensureShareToken(inquiry) {
  if (inquiry.shareToken) return inquiry.shareToken;
  const shareToken = newShareToken();
  await prisma.inquiry.update({ where: { id: inquiry.id }, data: { shareToken } });
  return shareToken;
}

// ---- data -----------------------------------------------------------------------------------

const firstImage = { orderBy: { sortOrder: "asc" }, take: 1, select: { id: true, url: true } };

/** Only what the preview shows: never the customer's name, phone or address. */
async function findOrder(token) {
  if (!isShareToken(token)) return null;
  return prisma.inquiry.findUnique({
    where: { shareToken: token },
    select: {
      inquiryNumber: true,
      itemCount: true,
      estimatedTotal: true,
      items: { orderBy: { id: "asc" }, select: { productName: true, quantity: true, product: { select: { images: firstImage } } } },
    },
  });
}

async function findProduct(slug) {
  const product = await prisma.product.findFirst({
    where: { AND: [VISIBLE, { slug: String(slug) }] },
    select: { id: true, name: true, slug: true, sku: true, price: true, salePrice: true, stock: true, status: true, lowStockThreshold: true, shortDescription: true, updatedAt: true, images: firstImage },
  });
  return product ? { ...serializeProduct(product), updatedAt: product.updatedAt } : null;
}

// ---- preview page -----------------------------------------------------------------------------

/** Tiny HTML page: preview tags for chat apps, instant redirect for people. */
function previewPage({ siteName, title, description, url, image, target, noindex }) {
  const e = escapeHtml;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
<meta name="description" content="${e(description)}">
${noindex ? '<meta name="robots" content="noindex, nofollow">\n' : ""}<link rel="canonical" href="${e(target)}">
<meta property="og:site_name" content="${e(siteName)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:url" content="${e(url)}">
<meta property="og:image" content="${e(image)}">
<meta property="og:image:secure_url" content="${e(image)}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="${CARD.width}">
<meta property="og:image:height" content="${CARD.height}">
<meta property="og:image:alt" content="${e(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=${e(target)}">
</head>
<body style="background:${COLORS.night};color:${COLORS.moon};font-family:Arial,sans-serif;padding:2rem">
<p><a style="color:${COLORS.lamp}" href="${e(target)}">Continue to ${e(siteName)}</a></p>
</body>
</html>`;
}

function orderPreview(order, token, settings) {
  const items = `${order.itemCount} item${order.itemCount === 1 ? "" : "s"}`;
  return {
    siteName: settings.storeName,
    title: `Order ${order.inquiryNumber} | ${settings.storeName}`,
    description: `${items}, ${formatMoney(order.estimatedTotal, settings.currency)}. Cash on delivery. Open to check the order status.`,
    url: orderShareUrl(token),
    image: `${orderShareUrl(token)}/image.jpg`,
    target: `${env.siteUrl}/track?number=${encodeURIComponent(order.inquiryNumber)}`,
    noindex: true,
  };
}

function productPreview(product, settings) {
  const price = formatMoney(product.finalPrice, settings.currency);
  const was = product.onSale ? `, was ${formatMoney(product.price, settings.currency)}` : "";
  const blurb = product.shortDescription ? ` ${product.shortDescription}` : "";
  const version = `${product.updatedAt.getTime().toString(36)}${product.images[0]?.id ?? ""}`;
  return {
    siteName: settings.storeName,
    title: product.name,
    description: `${price}${was}.${blurb}`.slice(0, 200),
    url: productShareUrl(product.slug),
    // the version makes chat apps fetch a new card after the product changes
    image: `${productShareUrl(product.slug)}/image.jpg?v=${version}`,
    target: `${env.siteUrl}/product/${encodeURIComponent(product.slug)}`,
    noindex: false,
  };
}

// ---- preview card (1200×630 JPEG) ----------------------------------------------------------------

/** Word-wraps text into at most `maxLines` lines of roughly `maxChars` characters. */
function wrap(text, maxChars, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) line = next;
    else {
      if (line) lines.push(line);
      line = word.length > maxChars ? `${word.slice(0, maxChars - 1)}…` : word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[\s,.;:–-]+$/, "").slice(0, maxChars - 1)}…`;
  }
  return lines;
}

const text = (x, y, size, color, content, { font = SANS, weight = 400, extra = "" } = {}) =>
  `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${color}" ${extra}>${escapeHtml(content)}</text>`;

/** The product photo for the left side, or a lamp-lit placeholder. Only files in uploads/ are read. */
async function photo(url) {
  if (typeof url === "string" && url.startsWith("/uploads/")) {
    const file = path.resolve(env.upload.dir, decodeURIComponent(url.slice("/uploads/".length)));
    if (file.startsWith(env.upload.dir + path.sep)) {
      try {
        return await sharp(file, { limitInputPixels: 50_000_000 }).rotate().resize(PHOTO, CARD.height, { fit: "cover" }).toBuffer();
      } catch {
        /* missing or unreadable: use the placeholder */
      }
    }
  }
  const placeholder = `<svg xmlns="http://www.w3.org/2000/svg" width="${PHOTO}" height="${CARD.height}">
    <defs><radialGradient id="g" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="${COLORS.lamp}" stop-opacity=".55"/><stop offset=".45" stop-color="${COLORS.lamp}" stop-opacity=".08"/><stop offset="1" stop-color="${COLORS.deep}" stop-opacity="0"/></radialGradient></defs>
    <rect width="100%" height="100%" fill="${COLORS.deep}"/><rect width="100%" height="100%" fill="url(#g)"/>
    <circle cx="${PHOTO / 2}" cy="265" r="34" fill="${COLORS.lamp}"/>
  </svg>`;
  return sharp(Buffer.from(placeholder)).png().toBuffer();
}

function orderPanel(order, settings) {
  const x = PHOTO + 64;
  const first = order.items[0];
  const more = order.items.length - 1;
  const name = wrap(first?.productName || "Your order", 26, 2);
  let y = 300;
  const nameSvg = name.map((line, i) => text(x, y + i * 42, 34, COLORS.moon, line)).join("");
  y += name.length * 42 + 2;
  const moreSvg = more > 0 ? text(x, y, 28, COLORS.moonSoft, `and ${more} more item${more === 1 ? "" : "s"}`) : text(x, y, 28, COLORS.moonSoft, `Quantity ${first?.quantity ?? order.itemCount}`);
  return [
    text(x, 112, 40, COLORS.lamp, settings.storeName, { font: SERIF }),
    text(x, 186, 26, COLORS.moonSoft, "Order"),
    text(x, 238, 50, COLORS.moon, order.inquiryNumber, { weight: 700, extra: 'letter-spacing="1"' }),
    nameSvg,
    moreSvg,
    text(x, 520, 54, COLORS.lamp, formatMoney(order.estimatedTotal, settings.currency), { weight: 700 }),
    text(x, 568, 26, COLORS.moonSoft, "Cash on delivery"),
  ].join("");
}

function productPanel(product, settings) {
  const x = PHOTO + 64;
  const name = wrap(product.name, 21, 3);
  const nameSvg = name.map((line, i) => text(x, 210 + i * 56, 46, COLORS.moon, line, { weight: 600 })).join("");
  const priceY = 210 + name.length * 56 + 56;
  const was = product.onSale
    ? text(x, priceY + 46, 28, COLORS.moonSoft, `was ${formatMoney(product.price, settings.currency)}`, { extra: 'text-decoration="line-through"' })
    : "";
  return [
    text(x, 112, 40, COLORS.lamp, settings.storeName, { font: SERIF }),
    nameSvg,
    text(x, priceY, 54, COLORS.lamp, formatMoney(product.finalPrice, settings.currency), { weight: 700 }),
    was,
    text(x, 568, 26, product.inStock ? COLORS.verdigris : COLORS.oxblood, product.inStock ? "In stock, cash on delivery" : "Out of stock, ask on WhatsApp"),
  ].join("");
}

async function renderCard(file, photoUrl, panelSvg) {
  try {
    await fs.access(file);
    return file;
  } catch {
    /* not generated yet */
  }
  const panel = `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD.width}" height="${CARD.height}">
    <rect x="${PHOTO}" width="${CARD.width - PHOTO}" height="${CARD.height}" fill="${COLORS.night}"/>
    <rect x="${PHOTO}" width="6" height="${CARD.height}" fill="${COLORS.lamp}"/>
    ${panelSvg}
  </svg>`;
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await sharp({ create: { width: CARD.width, height: CARD.height, channels: 3, background: COLORS.night } })
    .composite([
      { input: await photo(photoUrl), left: 0, top: 0 },
      { input: Buffer.from(panel), left: 0, top: 0 },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(temp);
  await fs.rename(temp, file).catch(async (error) => {
    await fs.rm(temp, { force: true });
    if (error.code !== "EEXIST" && error.code !== "EPERM") throw error;
  });
  return file;
}

const orderCard = (order, token, settings) =>
  renderCard(path.join(CACHE_DIR, `o-${token}.jpg`), order.items.find((i) => i.product?.images[0])?.product.images[0].url, orderPanel(order, settings));

const productCard = (product, settings) =>
  renderCard(
    path.join(CACHE_DIR, `p-${product.id}-${product.updatedAt.getTime()}-${product.images[0]?.id ?? 0}.jpg`),
    product.images[0]?.url,
    productPanel(product, settings),
  );

module.exports = {
  newShareToken,
  isShareToken,
  orderShareUrl,
  productShareUrl,
  ensureShareToken,
  findOrder,
  findProduct,
  previewPage,
  orderPreview,
  productPreview,
  orderCard,
  productCard,
};
