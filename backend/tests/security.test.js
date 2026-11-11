// Security tests: `npm test` (uses the database in backend/.env — run against a development database).
// Each test cleans up the admin, product and files it creates.
process.env.NODE_ENV = "test";
require("dotenv/config");

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");
const bcrypt = require("bcryptjs");
const request = require("supertest");
const sharp = require("sharp");
const app = require("../app");
const prisma = require("../prisma");

const EMAIL = `security-test-${Date.now()}@diagonstore.test`;
const PASSWORD = "Lantern-Window-2048";
const CSRF = { "X-Requested-With": "DiagonStore" };
const created = { productIds: [] };

const login = (email = EMAIL, password = PASSWORD) => request(app).post("/api/admin/login").set(CSRF).send({ email, password });
const cookieOf = (res) => (res.headers["set-cookie"] || []).find((c) => c.startsWith("ds_admin="))?.split(";")[0];

before(async () => {
  const admin = await prisma.admin.create({
    data: { name: "Security Test", email: EMAIL, password: await bcrypt.hash(PASSWORD, 10), role: "SUPER_ADMIN" },
  });
  created.adminId = admin.id;
});

after(async () => {
  if (created.productIds.length) await prisma.product.deleteMany({ where: { id: { in: created.productIds } } });
  await prisma.admin.deleteMany({ where: { email: { endsWith: "@diagonstore.test" } } });
  await prisma.$disconnect();
});

// ---- sign-in ------------------------------------------------------------------------

test("sign-in without the app's request header is refused (CSRF)", async () => {
  const res = await request(app).post("/api/admin/login").send({ email: EMAIL, password: PASSWORD });
  assert.equal(res.status, 403);
});

test("wrong password and unknown email give the same answer", async () => {
  const wrong = await login(EMAIL, "Not-The-Password-1");
  const unknown = await login("nobody@diagonstore.test", "Not-The-Password-1");
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(wrong.body.message, unknown.body.message);
  await prisma.admin.update({ where: { id: created.adminId }, data: { failedLogins: 0 } });
});

test("session is an httpOnly SameSite=Strict cookie and no token is exposed", async () => {
  const res = await login();
  assert.equal(res.status, 200);
  const raw = res.headers["set-cookie"].join(";");
  assert.match(raw, /ds_admin=/);
  assert.match(raw, /HttpOnly/i);
  assert.match(raw, /SameSite=Strict/i);
  assert.match(raw, /Path=\/api\/admin/i);
  assert.equal(res.body.token, undefined);
  assert.equal(JSON.stringify(res.body).includes("password"), false);
});

test("admin routes need the session cookie (a Bearer token is not accepted)", async () => {
  const res = await login();
  const token = cookieOf(res).split("=")[1];
  assert.equal((await request(app).get("/api/admin/dashboard")).status, 401);
  assert.equal((await request(app).get("/api/admin/dashboard").set("Authorization", `Bearer ${token}`)).status, 401);
  assert.equal((await request(app).get("/api/admin/dashboard").set("Cookie", cookieOf(res))).status, 200);
});

test("changes without the app's request header are refused even when signed in", async () => {
  const cookie = cookieOf(await login());
  const res = await request(app).put("/api/admin/settings").set("Cookie", cookie).send({ tagline: "hacked" });
  assert.equal(res.status, 403);
});

test("signing out ends the session on the server (old cookie stops working)", async () => {
  const cookie = cookieOf(await login());
  assert.equal((await request(app).post("/api/admin/logout").set(CSRF).set("Cookie", cookie)).status, 200);
  assert.equal((await request(app).get("/api/admin/profile").set("Cookie", cookie)).status, 401);
});

test("blocking an admin ends their sessions immediately", async () => {
  const victim = await prisma.admin.create({
    data: { name: "Blocked Test", email: `blocked-${Date.now()}@diagonstore.test`, password: await bcrypt.hash(PASSWORD, 10) },
  });
  const victimCookie = cookieOf(await login(victim.email));
  const superCookie = cookieOf(await login());
  const block = await request(app).put(`/api/admin/admins/${victim.id}`).set(CSRF).set("Cookie", superCookie).send({ isActive: false });
  assert.equal(block.status, 200);
  assert.equal((await request(app).get("/api/admin/profile").set("Cookie", victimCookie)).status, 401);
});

test("account locks after 5 wrong passwords, even with the right one", async () => {
  const email = `lock-${Date.now()}@diagonstore.test`;
  await prisma.admin.create({ data: { name: "Lock Test", email, password: await bcrypt.hash(PASSWORD, 10) } });
  for (let i = 0; i < 4; i++) assert.equal((await login(email, `Wrong-Guess-${i}x`)).status, 401);
  assert.equal((await login(email, "Wrong-Guess-4x")).status, 429);
  const right = await login(email, PASSWORD);
  assert.equal(right.status, 429);
  assert.match(right.body.message, /locked/i);
});

test("weak admin passwords are refused", async () => {
  const cookie = cookieOf(await login());
  for (const password of ["short1", "password12345", "aaaaaaaaaaaa", "onlyletterspassword"]) {
    const res = await request(app)
      .post("/api/admin/admins")
      .set(CSRF)
      .set("Cookie", cookie)
      .send({ name: "Weak", email: `weak-${Date.now()}@diagonstore.test`, password });
    assert.equal(res.status, 400, password);
  }
});

// ---- uploads and content -------------------------------------------------------------------

test("a file pretending to be an image is rejected and deleted", async () => {
  const cookie = cookieOf(await login());
  const fake = path.join(os.tmpdir(), "not-an-image.png");
  fs.writeFileSync(fake, "<script>alert(1)</script>");
  const before = fs.readdirSync(path.join(__dirname, "..", "uploads", "banners")).length;
  const res = await request(app).post("/api/admin/uploads/banners").set(CSRF).set("Cookie", cookie).attach("image", fake, { contentType: "image/png" });
  assert.equal(res.status, 400);
  assert.equal(fs.readdirSync(path.join(__dirname, "..", "uploads", "banners")).length, before);
});

test("a real image uploads", async () => {
  const cookie = cookieOf(await login());
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#f2b544" } }).png().toBuffer();
  const res = await request(app).post("/api/admin/uploads/banners").set(CSRF).set("Cookie", cookie).attach("image", png, { filename: "ok.png", contentType: "image/png" });
  assert.equal(res.status, 201);
  fs.unlinkSync(path.join(__dirname, "..", res.body.url));
});

test("scripts are stripped from product descriptions before saving", async () => {
  const cookie = cookieOf(await login());
  const res = await request(app)
    .post("/api/admin/products")
    .set(CSRF)
    .set("Cookie", cookie)
    .send({
      name: "Security Test Product",
      price: 100,
      stock: 1,
      status: "DRAFT",
      description: '<p onclick="steal()">Hi<script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">x</a></p>',
    });
  assert.equal(res.status, 201);
  created.productIds.push(res.body.id);
  const html = res.body.description;
  assert.doesNotMatch(html, /script|onerror|onclick|javascript:/i);
  assert.match(html, /Hi/);
});

// ---- public surface --------------------------------------------------------------------------

test("uploads can't be used to read files outside the upload folder", async () => {
  assert.equal((await request(app).get("/uploads/..%2f.env")).status, 404);
  assert.equal((await request(app).get("/uploads/..%2f..%2fbackend%2f.env?w=400")).status, 404);
  assert.equal((await request(app).get("/uploads/.cache/400/x.webp")).status, 404);
});

test("robots.txt doesn't reveal the back-office address", async () => {
  const res = await request(app).get("/robots.txt");
  assert.equal(res.status, 200);
  assert.doesNotMatch(res.text, /admin/i);
});

test("security headers are set and the server isn't advertised", async () => {
  const res = await request(app).get("/api/health");
  assert.equal(res.headers["x-content-type-options"], "nosniff");
  assert.ok(res.headers["content-security-policy"]);
  assert.equal(res.headers["x-powered-by"], undefined);
});

test("order tracking needs the right phone number", async () => {
  const res = await request(app).get("/api/inquiries/track").query({ number: "DS-2026-000001", phone: "0700000000" });
  assert.equal(res.status, 404);
});
