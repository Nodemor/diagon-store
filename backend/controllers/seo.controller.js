// sitemap.xml and robots.txt (proposal §23: sitemap, basic indexing configuration).
// Served by the API; in production the web server forwards /sitemap.xml and /robots.txt
// on the shop's domain to these routes (see docs/DEPLOYMENT notes in README).
const prisma = require("../prisma");
const env = require("../config/env");
const { VISIBLE } = require("../services/product.service");

const xmlEscape = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const day = (d) => new Date(d).toISOString().slice(0, 10);

const absolute = (url) => (/^https?:\/\//.test(url) ? url : `${env.siteUrl}${url.startsWith("/") ? "" : "/"}${url}`);

/** Every public address of the shop, with last change date and product photos. */
async function siteUrls() {
  const [products, categories, pages] = await Promise.all([
    prisma.product.findMany({
      where: VISIBLE,
      select: { slug: true, name: true, updatedAt: true, images: { orderBy: { sortOrder: "asc" }, take: 5, select: { url: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.page.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const site = env.siteUrl;
  const urls = [
    { loc: `${site}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${site}/shop`, priority: "0.9", changefreq: "daily" },
    { loc: `${site}/contact`, priority: "0.5", changefreq: "monthly" },
    ...categories.map((c) => ({ loc: `${site}/category/${c.slug}`, lastmod: day(c.updatedAt), priority: "0.8", changefreq: "weekly" })),
    ...products.map((p) => ({
      loc: `${site}/product/${p.slug}`,
      lastmod: day(p.updatedAt),
      priority: "0.7",
      changefreq: "weekly",
      images: p.images.map((i) => absolute(i.url)),
    })),
    ...pages.map((p) => ({ loc: `${site}/pages/${p.slug}`, lastmod: day(p.updatedAt), priority: "0.3", changefreq: "yearly" })),
  ];
  return urls;
}

// GET /sitemap.xml
async function sitemap(req, res) {
  const urls = await siteUrls();

  const body = urls
    .map(
      (u) =>
        `  <url><loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority>${(u.images || [])
          .map((img) => `<image:image><image:loc>${xmlEscape(img)}</image:loc></image:image>`)
          .join("")}</url>`,
    )
    .join("\n");

  res
    .type("application/xml")
    .set("Cache-Control", "public, max-age=3600")
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`);
}

// GET /robots.txt
function robots(req, res) {
  res
    .type("text/plain")
    .set("Cache-Control", "public, max-age=86400")
    .send(
      [
        "User-agent: *",
        "Disallow: /cart",
        "Disallow: /checkout",
        "Disallow: /order/",
        "Disallow: /track",
        "",
        `Sitemap: ${env.siteUrl}/sitemap.xml`,
        "",
      ].join("\n"),
    );
}

module.exports = { sitemap, robots, siteUrls };
