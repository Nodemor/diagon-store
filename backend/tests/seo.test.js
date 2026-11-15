// SEO: sitemap (with product photos), robots.txt, IndexNow switched off outside production.
process.env.NODE_ENV = "test";
require("dotenv/config");

const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../app");
const prisma = require("../prisma");
const indexNow = require("../services/indexnow.service");

after(() => prisma.$disconnect());

test("sitemap lists the shop's pages and product photos for Google Images", async () => {
  const res = await request(app).get("/sitemap.xml");
  assert.equal(res.status, 200);
  assert.match(res.headers["content-type"], /xml/);
  assert.match(res.text, /xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/);
  assert.match(res.text, /<loc>[^<]+\/shop<\/loc>/);
  assert.match(res.text, /<loc>[^<]+\/product\/[^<]+<\/loc>/);
  assert.match(res.text, /<image:image><image:loc>https?:\/\/[^<]+<\/image:loc><\/image:image>/);
  assert.doesNotMatch(res.text, /\/cart|\/checkout|\/track/);
});

test("robots.txt points search engines to the sitemap and keeps private pages out", async () => {
  const res = await request(app).get("/robots.txt");
  assert.match(res.text, /^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m);
  assert.match(res.text, /^Disallow: \/checkout$/m);
});

test("IndexNow never submits outside production", async () => {
  assert.equal(indexNow.enabled(), false);
  const result = await indexNow.submit(["https://example.com/"]);
  assert.ok(result.skipped);
});

test("changed products are found for IndexNow", async () => {
  const urls = await indexNow.changedUrls(new Date(0));
  assert.ok(urls.some((u) => /\/product\//.test(u)));
  assert.ok(urls.some((u) => /\/shop$/.test(u)));
});
