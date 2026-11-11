// Share links with link previews (see services/share.service.js). Mounted at /s.
const share = require("../services/share.service");
const { getSettings } = require("../services/settings.service");
const env = require("../config/env");

// A wrong or expired link sends people to the shop instead of showing an error.
function notFoundPage(res) {
  res
    .status(404)
    .set({ "Cache-Control": "no-store", "X-Robots-Tag": "noindex" })
    .type("html")
    .send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Link not found</title><meta name="robots" content="noindex"><meta http-equiv="refresh" content="3; url=${env.siteUrl}/"></head><body><p>This link doesn't lead anywhere. <a href="${env.siteUrl}/">Go to the shop</a></p></body></html>`);
}

const sendPage = (res, preview, cache) =>
  res
    .set({ "Cache-Control": cache, ...(preview.noindex ? { "X-Robots-Tag": "noindex" } : {}) })
    .type("html")
    .send(share.previewPage(preview));

const sendCard = (res, file, cache) => res.sendFile(file, { dotfiles: "allow", headers: { "Cache-Control": cache, "Content-Type": "image/jpeg" } });

// Order links are private to the chat they were sent in: never stored by shared caches.
const ORDER_CACHE = "private, max-age=300";
const PRODUCT_CACHE = "public, max-age=600";

async function orderPage(req, res) {
  const order = await share.findOrder(req.params.token);
  if (!order) return notFoundPage(res);
  sendPage(res, share.orderPreview(order, req.params.token, await getSettings()), ORDER_CACHE);
}

async function orderImage(req, res) {
  const order = await share.findOrder(req.params.token);
  if (!order) return notFoundPage(res);
  sendCard(res, await share.orderCard(order, req.params.token, await getSettings()), ORDER_CACHE);
}

async function productPage(req, res) {
  const product = await share.findProduct(req.params.slug);
  if (!product) return notFoundPage(res);
  sendPage(res, share.productPreview(product, await getSettings()), PRODUCT_CACHE);
}

async function productImage(req, res) {
  const product = await share.findProduct(req.params.slug);
  if (!product) return notFoundPage(res);
  sendCard(res, await share.productCard(product, await getSettings()), "public, max-age=86400");
}

module.exports = { orderPage, orderImage, productPage, productImage };
