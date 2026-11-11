// WhatsApp test environment: try the real WhatsApp ordering flow, including link previews, on a phone.
//
//   npm run whatsapp:test -- --number 0771234567
//
// What it does, until you press Ctrl+C:
//   1. Serves the built shop and the API together on one address (like the VPS will), port 5050.
//   2. Opens a temporary public https address (Cloudflare quick tunnel, no account needed) so a phone
//      — and WhatsApp's link previews — can reach your computer. Use --local to skip it.
//   3. Uses --number as the shop's WhatsApp number for the test and places a sample order.
//   4. Prints QR codes: scan one to open WhatsApp with the order message, or open the shop on the phone.
//   5. On Ctrl+C: removes the orders placed during the test, puts the old WhatsApp number back
//      (unless --save), and closes the public address.
//
// Options: --number <phone>   WhatsApp number to test (default: the one in Settings)
//          --save             keep this number as the shop's WhatsApp number afterwards
//          --keep             keep the test orders
//          --local            no public address (previews won't load on the phone)
//          --build            rebuild the frontend first (done automatically when there is no build)
//          --port <n>         default 5050
//
// The back office is only available on http://localhost:<port> while the public address is open.
// Development only: refuses to run with NODE_ENV=production.
const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};

const ROOT = path.resolve(__dirname, "..");
const DIST = path.resolve(ROOT, "..", "frontend", "dist");
const PORT = Number(option("port", 5050));
const say = (...a) => console.log(...a);
const step = (text) => say(`\n▸ ${text}`);
const fail = (text) => {
  console.error(`\n✖ ${text}\n`);
  process.exit(1);
};

require("dotenv").config({ path: path.join(ROOT, ".env") });
if (process.env.NODE_ENV === "production") fail("This test script is for development only (NODE_ENV=production).");

async function openTunnel() {
  const { Tunnel, bin, install } = require("cloudflared");
  if (!fs.existsSync(bin)) {
    step("Downloading Cloudflare's tunnel program (first run only)…");
    await install(bin);
  }
  step("Opening a temporary public address…");
  const tunnel = Tunnel.quick(`http://127.0.0.1:${PORT}`);
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("No public address after 60 s. Check your internet connection.")), 60_000);
    tunnel.once("url", (u) => (clearTimeout(timer), resolve(u)));
    tunnel.once("exit", (code) => (clearTimeout(timer), reject(new Error(`The tunnel program stopped (code ${code}).`))));
  });
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 20_000);
    tunnel.once("connected", () => (clearTimeout(timer), resolve()));
  });
  return { tunnel, url: url.replace(/\/$/, "") };
}

/** A new public address can take a few seconds to work everywhere: retry until it answers. */
async function fetchWhenReady(url, options = {}, attempts = 20) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status < 500 && res.status !== 404) return res;
    } catch {
      /* DNS not ready yet */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return fetch(url, options);
}

async function qr(text) {
  const QRCode = require("qrcode");
  return QRCode.toString(text, { type: "terminal", small: true, errorCorrectionLevel: "L" });
}

(async () => {
  const { normalizePhone } = require("../utils/phone");
  const wanted = option("number", null);
  if (wanted && !normalizePhone(wanted)) fail(`"${wanted}" isn't a usable phone number. Example: --number 0771234567`);

  // 1. the built shop
  if (flag("build") || !fs.existsSync(path.join(DIST, "index.html"))) {
    step("Building the shop (frontend)…");
    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    const built = spawnSync(npm, ["run", "build"], { cwd: path.dirname(DIST), stdio: "inherit", shell: process.platform === "win32" });
    if (built.status !== 0) fail("The frontend build failed.");
  }

  // 2. public address, before the app reads its settings (links in messages use SITE_URL)
  let tunnel = null;
  let publicUrl = null;
  if (!flag("local")) {
    try {
      ({ tunnel, url: publicUrl } = await openTunnel());
    } catch (error) {
      fail(`${error.message}\n  Run again with --local to test without a public address.`);
    }
  }
  const localUrl = `http://localhost:${PORT}`;
  process.env.SITE_URL = publicUrl || localUrl;
  process.env.CLIENT_URL = [publicUrl, localUrl, `http://127.0.0.1:${PORT}`].filter(Boolean).join(",");

  const express = require("express");
  const app = require("../app");
  const prisma = require("../prisma");
  const settingsService = require("../services/settings.service");

  // 3. shop + API on one address, like nginx on the VPS
  const BACKEND = /^\/(api|uploads|s)(\/|$)|^\/(sitemap\.xml|robots\.txt)$/;
  const PREVIEW_BOT = /whatsapp|facebookexternalhit|facebot|telegrambot|twitterbot|viber|skypeuripreview/i;
  const site = express();
  site.disable("x-powered-by");
  site.use((req, res, next) => {
    const fromInternet = Boolean(req.headers["cf-connecting-ip"]);
    if (fromInternet && req.path.startsWith("/api/admin")) {
      return res.status(403).json({ message: `The back office isn't available on the public test address. Use ${localUrl}${"/admin"} on this computer.` });
    }
    if (req.path.startsWith("/s/") && PREVIEW_BOT.test(req.headers["user-agent"] || "")) {
      const app = (req.headers["user-agent"].match(PREVIEW_BOT) || ["A chat app"])[0];
      say(`  ✓ ${app} fetched ${req.path.endsWith(".jpg") ? "the preview image" : "the link preview"} (${req.path})`);
    }
    next();
  });
  site.use((req, res, next) => (BACKEND.test(req.path) ? app(req, res, next) : next()));
  site.use(express.static(DIST, { index: false, maxAge: "1h" }));
  site.use((req, res) => res.sendFile(path.join(DIST, "index.html")));
  const server = await new Promise((resolve, reject) => {
    const s = site.listen(PORT, "127.0.0.1", () => resolve(s));
    s.on("error", (e) => reject(e));
  }).catch((e) => fail(e.code === "EADDRINUSE" ? `Port ${PORT} is busy. Use --port 5051.` : e.message));

  // 4. the WhatsApp number for the test
  const startedAt = new Date();
  const before = await prisma.setting.findUnique({ where: { key: "whatsappNumber" } });
  if (wanted) await settingsService.updateSettings({ whatsappNumber: wanted });
  const settings = await settingsService.getSettings();
  if (!settings.whatsappNumber) fail("No WhatsApp number. Run with --number 0771234567 or set it in Back office → Settings.");

  // 5. a sample order, placed the same way the checkout does
  step("Placing a sample order…");
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", stock: { gt: 1 }, images: { some: {} } },
    orderBy: [{ isFeatured: "desc" }, { id: "asc" }],
    take: 2,
    select: { id: true, slug: true, name: true },
  });
  if (!products.length) fail("No products in stock. Run npm run db:seed or add products first.");
  const placed = await fetch(`${localUrl}/api/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "DiagonStore" },
    body: JSON.stringify({
      name: "WhatsApp Test",
      phone: settings.whatsappNumber,
      address: "Test order, please ignore",
      city: "Colombo",
      notes: "Placed by npm run whatsapp:test",
      channel: "WHATSAPP",
      items: products.map((p, i) => ({ productId: p.id, quantity: i === 0 ? 2 : 1 })),
    }),
  });
  const order = await placed.json();
  if (placed.status !== 201) fail(`Placing the sample order failed: ${order.message}`);
  const saved = await prisma.inquiry.findUnique({ where: { inquiryNumber: order.inquiryNumber }, select: { id: true } });

  // 6. check the preview the way WhatsApp will see it
  let previewOk = false;
  if (publicUrl) {
    step("Checking the link preview from the internet…");
    const res = await fetchWhenReady(order.shareUrl, { headers: { "User-Agent": "WhatsApp/2.24 (preview check)" } });
    const html = await res.text();
    const image = html.match(/og:image" content="([^"]+)"/)?.[1];
    const img = image ? await fetchWhenReady(image, { headers: { "User-Agent": "WhatsApp/2.24 (preview check)" } }) : null;
    previewOk = res.ok && img?.ok && img.headers.get("content-type") === "image/jpeg";
    say(previewOk ? `  ✓ Preview works: "${html.match(/og:title" content="([^"]+)"/)[1]}" with a photo card` : `  ✖ Preview check failed (page ${res.status}, image ${img?.status}). Try again in a minute.`);
  }

  // 7. what to do on the phone
  const line = "─".repeat(64);
  say(`\n${line}\n  WhatsApp test environment is running\n${line}`);
  say(`  Shop WhatsApp number : +${settings.whatsappNumber}${wanted && !flag("save") ? "  (for this test only)" : ""}`);
  say(`  Shop on this computer: ${localUrl}`);
  if (publicUrl) say(`  Shop on any phone    : ${publicUrl}`);
  say(`  Back office          : ${localUrl}/admin   (this computer only)`);
  say(`  Sample order         : ${order.inquiryNumber}  →  ${localUrl}/admin/orders/${saved.id}`);
  say(`  Order link           : ${order.shareUrl}`);

  say(`\n  A) Scan to open WhatsApp with the sample order message (chat with ${order.whatsappUrl.split("?")[0]}):\n`);
  say(await qr(order.whatsappUrl));
  say("     Send it (or just look at the chat): the order link should turn into a card with the");
  say("     order number, total and product photo after a few seconds.");
  if (publicUrl) {
    say(`\n  B) Scan to order from the shop on your phone, like a customer:\n`);
    say(await qr(publicUrl));
    say("     Add something to the cart → Checkout → Send order on WhatsApp.");
  }
  say(`\n  C) Shop → customer: open the sample order in the back office (link above) and click`);
  say(`     "Message on WhatsApp". It opens a chat with the test number with the status and order link.`);
  if (!publicUrl) say("\n  (--local: links point to localhost, so WhatsApp can't show previews and the phone can't open them.)");
  say(`\n  Press Ctrl+C to stop. Orders placed during the test are ${flag("keep") ? "kept" : "removed"}; the WhatsApp number is ${flag("save") || !wanted ? "kept" : "put back"}.\n${line}\n`);

  // 8. clean up on Ctrl+C
  let stopping = false;
  async function stop() {
    if (stopping) return;
    stopping = true;
    say("\n▸ Stopping the test environment…");
    try {
      if (!flag("keep")) {
        const orders = await prisma.inquiry.findMany({ where: { createdAt: { gte: startedAt } }, select: { inquiryNumber: true, shareToken: true } });
        await prisma.inquiry.deleteMany({ where: { createdAt: { gte: startedAt } } });
        await prisma.customer.deleteMany({ where: { createdAt: { gte: startedAt }, inquiries: { none: {} } } });
        for (const o of orders) if (o.shareToken) fs.rmSync(path.join(require("../config/env").upload.dir, ".cache", "og", `o-${o.shareToken}.jpg`), { force: true });
        if ((await prisma.inquiry.count()) === 0) await prisma.$executeRawUnsafe("ALTER TABLE `Inquiry` AUTO_INCREMENT = 1");
        say(`  removed ${orders.length} test order${orders.length === 1 ? "" : "s"}${orders.length ? `: ${orders.map((o) => o.inquiryNumber).join(", ")}` : ""}`);
      }
      if (wanted && !flag("save")) {
        if (before) await prisma.setting.update({ where: { key: "whatsappNumber" }, data: { value: before.value } });
        else await prisma.setting.deleteMany({ where: { key: "whatsappNumber" } });
        say(`  WhatsApp number put back to ${before?.value ? `+${before.value}` : "(not set)"}`);
      }
    } catch (error) {
      console.error("  cleanup problem:", error.message);
    }
    tunnel?.stop();
    server.close();
    await prisma.$disconnect();
    say("  public address closed. Done.\n");
    process.exit(0);
  }
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  if (flag("once")) setTimeout(stop, Number(option("once-seconds", 5)) * 1000); // used by automated checks
})().catch((error) => fail(error.stack || error.message));
