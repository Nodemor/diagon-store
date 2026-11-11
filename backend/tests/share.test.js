// Share links, link previews and the WhatsApp number setting: `npm test` (uses the database in backend/.env).
// Cleans up the orders, customer, admin, product, cards and settings it touches.
process.env.NODE_ENV = "test";
require("dotenv/config");

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const request = require("supertest");
const sharp = require("sharp");
const app = require("../app");
const prisma = require("../prisma");
const env = require("../config/env");

const CSRF = { "X-Requested-With": "DiagonStore" };
const PHONE = "0770001234";
const EMAIL = `share-test-${Date.now()}@diagonstore.test`;
const PASSWORD = "Lantern-Window-2048";
const state = { tokens: [], draftId: null };

const cookieOf = (res) => (res.headers["set-cookie"] || []).find((c) => c.startsWith("ds_admin="))?.split(";")[0];
const metaOf = (html, name) => html.match(new RegExp(`<meta (?:property|name|http-equiv)="${name}" content="([^"]*)"`))?.[1];
const tokenOf = (url) => new URL(url).pathname.split("/")[3];

async function placeOrder() {
  const res = await request(app)
    .post("/api/inquiries")
    .set(CSRF)
    .send({ name: "Share Tester", phone: PHONE, address: "1 Preview Road", city: "Kandy", channel: "WHATSAPP", items: state.items });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  state.tokens.push(tokenOf(res.body.shareUrl));
  return res.body;
}

before(async () => {
  const products = await prisma.product.findMany({ where: { status: "ACTIVE", stock: { gt: 2 } }, take: 2, orderBy: { id: "asc" }, select: { id: true, slug: true } });
  assert.ok(products.length, "needs seeded products (npm run db:seed)");
  state.product = products[0];
  state.items = products.map((p) => ({ productId: p.id, quantity: 1 }));
  state.oldWhatsapp = await prisma.setting.findUnique({ where: { key: "whatsappNumber" } });
  await prisma.admin.create({ data: { name: "Share Test", email: EMAIL, password: await bcrypt.hash(PASSWORD, 10), role: "SUPER_ADMIN" } });
  state.cookie = cookieOf(await request(app).post("/api/admin/login").set(CSRF).send({ email: EMAIL, password: PASSWORD }));
  const draft = await prisma.product.create({ data: { name: "Hidden Draft", slug: `hidden-draft-${Date.now()}`, price: 100, stock: 1, status: "DRAFT" } });
  state.draftId = draft.id;
  state.draftSlug = draft.slug;
});

after(async () => {
  const phone = "94770001234";
  await prisma.inquiry.deleteMany({ where: { phone } });
  await prisma.customer.deleteMany({ where: { phone } });
  await prisma.admin.deleteMany({ where: { email: { endsWith: "@diagonstore.test" } } });
  if (state.draftId) await prisma.product.delete({ where: { id: state.draftId } }).catch(() => {});
  if (state.oldWhatsapp) await prisma.setting.update({ where: { key: "whatsappNumber" }, data: { value: state.oldWhatsapp.value } });
  else await prisma.setting.deleteMany({ where: { key: "whatsappNumber" } });
  for (const token of state.tokens) fs.rmSync(path.join(env.upload.dir, ".cache", "og", `o-${token}.jpg`), { force: true });
  await prisma.$disconnect();
});

// ---- WhatsApp number setting -----------------------------------------------------------------

test("a wrong WhatsApp number is refused", async () => {
  const res = await request(app).put("/api/admin/settings").set(CSRF).set("Cookie", state.cookie).send({ whatsappNumber: "12345" });
  assert.equal(res.status, 400);
  assert.match(res.body.message, /WhatsApp number/);
});

test("the WhatsApp number can be typed the local way and is saved with the country code", async () => {
  const res = await request(app).put("/api/admin/settings").set(CSRF).set("Cookie", state.cookie).send({ whatsappNumber: "077 123 4567" });
  assert.equal(res.status, 200);
  assert.equal((await prisma.setting.findUnique({ where: { key: "whatsappNumber" } })).value, "94771234567");
});

// ---- order link ------------------------------------------------------------------------------

test("the WhatsApp order message goes to the saved number and contains the order link", async () => {
  const order = await placeOrder();
  assert.ok(order.whatsappUrl.startsWith("https://wa.me/94771234567?text="));
  assert.match(order.shareUrl, /\/s\/o\/[A-Za-z0-9_-]{22}$/);
  assert.ok(order.whatsappMessage.includes(`Order link: ${order.shareUrl}`));
  assert.ok(decodeURIComponent(order.whatsappUrl.split("text=")[1]).includes(order.shareUrl));
});

test("the order link shows a preview (number, total, photo) but no customer details", async () => {
  const order = await placeOrder();
  const res = await request(app).get(new URL(order.shareUrl).pathname).set("User-Agent", "WhatsApp/2.24.10.85 A");
  assert.equal(res.status, 200);
  assert.match(res.headers["content-type"], /html/);
  assert.equal(res.headers["x-robots-tag"], "noindex");
  assert.match(res.headers["cache-control"], /private/);
  assert.equal(metaOf(res.text, "og:title"), `Order ${order.inquiryNumber} | Diagon Store`.replace("Diagon Store", (await require("../services/settings.service").getSettings()).storeName));
  assert.match(metaOf(res.text, "og:image"), /\/s\/o\/[A-Za-z0-9_-]{22}\/image\.jpg$/);
  assert.match(metaOf(res.text, "refresh"), new RegExp(`/track\\?number=${order.inquiryNumber}$`));
  assert.doesNotMatch(res.text, /Share Tester|0770001234|94770001234|Preview Road|Kandy/);
});

test("the order preview image is a 1200×630 JPEG", async () => {
  const token = state.tokens[0];
  const res = await request(app).get(`/s/o/${token}/image.jpg`).buffer(true).parse((r, cb) => {
    const chunks = [];
    r.on("data", (c) => chunks.push(c));
    r.on("end", () => cb(null, Buffer.concat(chunks)));
  });
  assert.equal(res.status, 200);
  assert.equal(res.headers["content-type"], "image/jpeg");
  const meta = await sharp(res.body).metadata();
  assert.equal(meta.format, "jpeg");
  assert.equal(meta.width, 1200);
  assert.equal(meta.height, 630);
});

test("order links can't be guessed from the order number", async () => {
  const order = await prisma.inquiry.findFirst({ where: { phone: "94770001234" }, select: { inquiryNumber: true } });
  assert.equal((await request(app).get(`/s/o/${order.inquiryNumber}`)).status, 404);
  assert.equal((await request(app).get("/s/o/AAAAAAAAAAAAAAAAAAAAAA")).status, 404);
  assert.equal((await request(app).get("/s/o/AAAAAAAAAAAAAAAAAAAAAA/image.jpg")).status, 404);
  assert.equal((await request(app).get("/s/o/..%2F..%2F.env")).status, 404);
});

test("the shop's message to the customer includes the order link and the order status", async () => {
  const inquiry = await prisma.inquiry.findFirst({ where: { phone: "94770001234" }, select: { id: true } });
  await prisma.inquiry.update({ where: { id: inquiry.id }, data: { shareToken: null, status: "CONFIRMED" } }); // an order from before share links
  const res = await request(app).get(`/api/admin/inquiries/${inquiry.id}`).set("Cookie", state.cookie);
  assert.equal(res.status, 200);
  assert.match(res.body.shareUrl, /\/s\/o\/[A-Za-z0-9_-]{22}$/);
  state.tokens.push(tokenOf(res.body.shareUrl));
  assert.ok(res.body.customerMessage.includes(res.body.shareUrl));
  assert.match(res.body.customerMessage, /Your order is confirmed/);
  assert.ok(res.body.customerWhatsappUrl.startsWith("https://wa.me/94770001234?text="));
});

// ---- product link ------------------------------------------------------------------------------

test("a product link shows the product preview and opens the product page", async () => {
  const res = await request(app).get(`/s/p/${state.product.slug}`);
  assert.equal(res.status, 200);
  assert.match(metaOf(res.text, "og:image"), new RegExp(`/s/p/${state.product.slug}/image\\.jpg\\?v=`));
  assert.match(metaOf(res.text, "refresh"), new RegExp(`/product/${state.product.slug}$`));
  const img = await request(app).get(`/s/p/${state.product.slug}/image.jpg`);
  assert.equal(img.status, 200);
  assert.equal(img.headers["content-type"], "image/jpeg");
});

test("hidden (draft) products have no preview", async () => {
  assert.equal((await request(app).get(`/s/p/${state.draftSlug}`)).status, 404);
  assert.equal((await request(app).get(`/s/p/${state.draftSlug}/image.jpg`)).status, 404);
});
