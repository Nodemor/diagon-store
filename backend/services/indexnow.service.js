// IndexNow (https://www.indexnow.org): tells Bing — and the search engines built on it (DuckDuckGo, Yahoo,
// Ecosia, ChatGPT search) — plus Yandex, Naver and Seznam about new or changed pages within minutes.
// Free and needs no account: the shop proves ownership with a key file at https://<shop>/<key>.txt,
// which deploy/deploy.sh writes into the built site. Google doesn't use IndexNow; it reads the sitemap.
const prisma = require("../prisma");
const env = require("../config/env");
const { VISIBLE } = require("./product.service");

const ENDPOINT = "https://api.indexnow.org/indexnow";
const DELAY_MS = 60_000; // collect a burst of admin edits into one submission

let timer = null;
let lastRun = new Date();

/** Only the live shop on its https:// address submits (never local development or tests). */
const enabled = () => Boolean(env.indexNowKey) && env.isProduction && env.siteUrl.startsWith("https://");

async function submit(urls) {
  if (!enabled()) return { skipped: "IndexNow is off (needs NODE_ENV=production, an https SITE_URL and INDEXNOW_KEY)" };
  const list = [...new Set(urls)].slice(0, 10_000);
  if (!list.length) return { skipped: "nothing to submit" };
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(env.siteUrl).host,
      key: env.indexNowKey,
      keyLocation: `${env.siteUrl}/${env.indexNowKey}.txt`,
      urlList: list,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  // 200 = accepted, 202 = accepted (key check pending); 403 = key file not found; 422 = URLs not on this host
  console.log(`[indexnow] submitted ${list.length} URL(s) → HTTP ${res.status}`);
  return { status: res.status, count: list.length };
}

/** Shop addresses of the products, categories and pages changed since `since`. */
async function changedUrls(since) {
  const site = env.siteUrl;
  const [products, categories, pages] = await Promise.all([
    prisma.product.findMany({ where: { AND: [VISIBLE, { updatedAt: { gte: since } }] }, select: { slug: true } }),
    prisma.category.findMany({ where: { isActive: true, updatedAt: { gte: since } }, select: { slug: true } }),
    prisma.page.findMany({ where: { isPublished: true, updatedAt: { gte: since } }, select: { slug: true } }),
  ]);
  const urls = [
    ...products.map((p) => `${site}/product/${p.slug}`),
    ...categories.map((c) => `${site}/category/${c.slug}`),
    ...pages.map((p) => `${site}/pages/${p.slug}`),
  ];
  if (products.length || categories.length) urls.push(`${site}/`, `${site}/shop`);
  return urls;
}

/** Called after a successful admin change: submits what changed, a minute later. */
function scheduleIndexNow() {
  if (!enabled()) return;
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const since = new Date(lastRun.getTime() - 5_000);
    lastRun = new Date();
    try {
      await submit(await changedUrls(since));
    } catch (error) {
      console.error("[indexnow]", error.message);
    }
  }, DELAY_MS);
  timer.unref?.();
}

/** Express middleware for admin routes: schedules a submission after successful catalogue/page changes. */
const CONTENT = /^\/(products|categories|subcategories|pages)(\/|$)/;
function notifySearchEngines(req, res, next) {
  if (req.method !== "GET" && CONTENT.test(req.path)) {
    res.on("finish", () => res.statusCode < 400 && scheduleIndexNow());
  }
  next();
}

module.exports = { enabled, submit, changedUrls, scheduleIndexNow, notifySearchEngines };
