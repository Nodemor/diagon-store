# Diagon Store — Getting found on Google (SEO)

What the shop already does for search engines, and the free, official tools to connect once.

---

## Built into the shop

| What | Why it helps |
|---|---|
| `https://diagonstore.com/sitemap.xml` | Every product, category and page, with last-change dates and product photos (Google Images). Updates itself. |
| `robots.txt` | Points search engines to the sitemap; keeps cart, checkout and order pages out of results. |
| Page titles, descriptions, canonical links | Each product, category and page has its own; edit them per product (SEO fields) and for the home page in Back office → Settings. |
| Structured data (schema.org) | The shop (name, logo, Sri Lanka), the site search box, and every product (price in LKR, stock, photos), so Google can show rich results. |
| Link previews | Logo card and product cards when links are shared on WhatsApp, Facebook, Messenger and Discord. |
| **IndexNow** | New or changed products, categories and pages are announced within minutes to Bing, and through it DuckDuckGo, Yahoo, Ecosia and ChatGPT search, plus Yandex, Naver and Seznam. Automatic after the one-time step below. |
| Fast, mobile-friendly pages | Speed and phone usability are ranking factors. |

---

## One-time setup (about 20 minutes, all free)

### 1. Google Search Console (the important one)

1. Go to **search.google.com/search-console** → **Add property** → choose **Domain** → type `diagonstore.com` → Continue.
2. Google shows a **TXT record** (starts with `google-site-verification=`). Copy it.
3. In **Spaceship** → Domain Manager → diagonstore.com → **DNS Records** → **Add record**:
   - Type **TXT**, Host **@**, Value: paste the whole `google-site-verification=…` text, TTL 30 min → Save.
4. Back in Search Console, click **Verify**. It can take a few minutes; if it fails, wait 15 minutes and try again.
5. In Search Console → **Sitemaps** → enter `sitemap.xml` → **Submit**.
6. **URL inspection** (search bar at the top) → `https://diagonstore.com/` → **Request indexing**. Do the same for 2–3 important category pages.

Google usually starts showing the shop within a few days to two weeks. Search Console then tells you which searches show your shop, which pages are indexed, and any problems.

### 2. Bing Webmaster Tools (covers Bing, DuckDuckGo, Yahoo, Ecosia, ChatGPT search)

1. Go to **bing.com/webmasters** → sign in → **Import from Google Search Console** (easiest: it copies the verified site and sitemap).
2. That's it. IndexNow (below) keeps Bing up to date.

### 3. Turn on IndexNow announcements (once, on the server)

The deploy creates the IndexNow key automatically. After the first update with this feature is live, announce all pages once in the server's web console:

```bash
sudo -u diagon -H bash -c 'cd /var/www/diagon-store/backend && npm run seo:indexnow'
```

It should print `✔ … pages announced to search engines.` From then on every product, category or page you add or change in the back office is announced automatically about a minute later.

### 4. Google Business Profile (best for local searches in Sri Lanka)

1. Go to **business.google.com** → **Add business** → "Diagon Store" → category "Online store" (or "Department store").
2. Choose **"I deliver goods and services to my customers"**, add the delivery areas (island-wide / your districts), and hide the address if you don't have a shop customers visit.
3. Add the website `https://diagonstore.com`, the WhatsApp number, opening hours, the logo and real product photos.
4. Verify (Google offers phone, email or video verification).

This puts the shop on Google Maps and in the business panel on the right side of search results.

---

## What makes the biggest difference after that

- **Real product details.** For each product: a clear name people would search for (e.g. "Wireless Earbuds with Charging Case" rather than a code), a useful description, real photos with alt text, the brand, and the right category. Fill the **SEO title / description** fields for your best sellers.
- **The home page title and description:** Back office → Settings → *Meta title* / *Meta description*. Mention what you sell and "Sri Lanka".
- **Social profiles:** add the Facebook, Instagram and TikTok links in Settings, and link to `diagonstore.com` from those profiles. Every genuine link to the shop helps.
- **Share real links:** product links shared on WhatsApp, Facebook groups and Instagram bring real visitors, and search engines notice real interest.
- **Keep it fresh:** new products and updated stock are announced automatically; a steady flow of real updates helps.
- **Be patient:** new domains normally need a few weeks to a few months to rank for competitive searches. Check Search Console → *Performance* monthly.

## What not to do

- **No fake traffic, bots or bought clicks.** Search engines detect automated visits; Google's spam policies treat them as manipulation, which can get a site demoted or removed. Fake visits also hide your real customer numbers.
- No keyword stuffing, copied product descriptions from other shops, or paid link schemes.
- Don't change product web addresses (slugs) once they're indexed unless you have to.
