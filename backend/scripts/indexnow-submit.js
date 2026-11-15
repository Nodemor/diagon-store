// Announces every public page of the shop to search engines via IndexNow (Bing, DuckDuckGo, Yahoo,
// Ecosia, ChatGPT search, Yandex, Naver, Seznam). Run once after going live; after that, admin
// changes are announced automatically.
//
//   On the server:  sudo -u diagon -H bash -c 'cd /var/www/diagon-store/backend && npm run seo:indexnow'
require("dotenv/config");
const { siteUrls } = require("../controllers/seo.controller");
const indexNow = require("../services/indexnow.service");
const env = require("../config/env");
const prisma = require("../prisma");

(async () => {
  try {
    if (!indexNow.enabled()) {
      console.log("IndexNow is off: it needs NODE_ENV=production, an https:// SITE_URL and INDEXNOW_KEY in backend/.env");
      console.log("(deploy/deploy.sh adds INDEXNOW_KEY automatically on the server).");
      process.exitCode = 1;
      return;
    }
    const keyFile = `${env.siteUrl}/${env.indexNowKey}.txt`;
    const check = await fetch(keyFile).then((r) => r.text()).catch(() => "");
    if (check.trim() !== env.indexNowKey) {
      console.log(`The key file ${keyFile} isn't published yet. Deploy once (it's written into the built site), then run this again.`);
      process.exitCode = 1;
      return;
    }
    const urls = (await siteUrls()).map((u) => u.loc);
    const result = await indexNow.submit(urls);
    console.log(result.status === 200 || result.status === 202 ? `✔ ${result.count} pages announced to search engines.` : `Result: ${JSON.stringify(result)}`);
  } finally {
    await prisma.$disconnect();
  }
})();
