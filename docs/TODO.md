# Diagon Store — TODO

Task checklist grouped by the phases in [ROADMAP.md](ROADMAP.md). Tick `[x]` items as you finish them, in the same commit as the code.

---

## ⚠️ Known issues

- [x] ~~Linux deployment: lowercase table name in migration `20260928153143_add_categories`~~. Fixed in Phase 7 (the local checksum was updated to match).
- [ ] Sorting by price uses the regular price, not the sale price. *(Small; revisit if the client notices.)*
- [ ] Orders don't change stock automatically. The owner adjusts stock in Admin → Products (inline stock field). Decide with the client whether confirming an order should deduct stock.
- [x] ~~The admin token is stored in `localStorage`~~. Now an httpOnly cookie (Phase 7).
- [ ] The old demo password `Admin@12345` is in the git history. Never use it. Create admins with `npm run create-admin`.

---

## Phase 0 — Foundation ✅

- [x] Settings moved into environment variables; `.env.example` files
- [x] Repo cleanup (AI-tool folders, template leftovers)
- [x] README + docs

## Phase 1 — Backend foundation ✅

- [x] Folder structure: `config/`, `controllers/`, `services/`, `validators/`, `middleware/`, `utils/`, `routes/`
- [x] `app.js` / `server.js` split, graceful shutdown
- [x] Central error handler (HttpError, Zod, Multer, Prisma P2002/P2025/P2003)
- [x] Zod validation on every input
- [x] helmet, CORS allow-list, 1 MB body limit, morgan (dev)
- [x] Rate limits: login, order placement, order tracking
- [x] Roles: `SUPER_ADMIN` / `ADMIN`; admin active check on every request; change password
- [x] Schema: product fields (SKU, brand, short description, sale price, specs, tags, featured, new arrival, status, SEO), images (alt text, order), related products
- [x] Schema: category / subcategory slugs, image, active flag, sort order, SEO
- [x] Schema: Customer, Inquiry, InquiryItem, InquiryStatusHistory
- [x] Schema: Banner, Setting, Page
- [x] Migration that fills in slugs for existing rows and promotes the first admin to SUPER_ADMIN
- [x] Public API: home, products (search, filters, sort, pagination), product detail, related, categories, banners, settings, pages
- [x] Order API: create (server pricing, stock check, WhatsApp message + link, emails), tracking
- [x] Admin API: dashboard, products, images (multi-upload, reorder, alt text), stock, categories, subcategories, orders (status, notes), customers, banners, uploads, settings, pages, admins
- [x] Email service (nodemailer SMTP; logs to the console when disabled)
- [x] Seed: 8 categories, 28 products, 4 banners, 5 pages
- [x] Fixed `test-db.js` false positive
- [x] Tested every endpoint against XAMPP MariaDB 10.4

## Phase 2 — Design system + landing page ✅

- [x] Install `gsap`, `@gsap/react`, `lenis`, `motion`
- [x] Theme tokens in `index.css` (`@theme`) + fonts (IM Fell English, Figtree)
- [x] `lib/api.js` (fetch wrapper), `lib/format.js` (Rs prices, asset URLs, WhatsApp links)
- [x] `SettingsProvider`, `CartProvider` (localStorage)
- [x] Motion: Lenis + ScrollTrigger sync, route transitions, reduced-motion support everywhere
- [x] UI: Button, PriceTag, ProductCard, ProductSection (grid/rail), Skeleton, icons
- [x] `StoreLayout`: announcement, sticky header (search, cart badge, mobile menu), footer, floating WhatsApp button
- [x] Landing page: animated hero (street scene + banner window), shopfront category street (pinned sideways scroll), featured, promo banners, new arrivals, offers, most viewed, how ordering works
- [x] 404 + placeholders for later pages; admin pages lazy-loaded
- [x] Checked at 1440 px, 390 px (mobile emulation) and with reduced motion
- [x] Review fixes: skyline no longer cropped on wide screens, hero joins the next section seamlessly, pixel-snow sky, announcement bar removed, PillNav + staggered mobile menu, "Browse the shops" shows 4 per page aligned to the content width
- [ ] Split the GSAP/Motion code into a separate chunk if the bundle grows (currently ~195 kB gzip) *(Phase 6)*

## Phase 3 — Shop, product page, cart ✅

- [x] `/shop` with URL-synced filters (category, subcategory, price range, availability, on offer / new / featured), sorting, search, active-filter chips, "Show more products"
- [x] `/category/:slug`: image header, description, subcategory chips, same grid and filters
- [x] Mobile filter sheet
- [x] `/product/:slug`: zoom gallery + swipe on mobile, sale price + savings, stock status, SKU, brand, short description, quantity, add to cart, "Order now", WhatsApp order message (proposal §9 format), email inquiry, share, specifications, tags, related products, sticky mobile bar
- [x] Product descriptions sanitised with DOMPurify
- [x] Cart drawer + `/cart` page (quantities, remove, offer savings, estimated total); prices and stock refreshed from the API (`GET /api/products?ids=`)
- [x] Header search with instant suggestions (keyboard accessible)
- [x] Demo products whose photos didn't match were renamed (power bank, canvas tote, watermelon)

## Phase 4 — Order flow ✅

- [x] `/checkout` order form (proposal §11): name, mobile, email, address, city, notes; WhatsApp or email; client + server validation shown next to each field; honeypot
- [x] Cart checkout and single-product "Order now" (`/checkout?buy=<slug>&qty=<n>`, cart untouched)
- [x] WhatsApp opens with the order written out; the success page has a fallback button if the popup is blocked
- [x] "Remember my details on this device" (opt-in, localStorage)
- [x] `/order/success/:number`: order number with copy button, summary, WhatsApp / track / keep shopping
- [x] `/track`: order number + mobile, animated status timeline (New → Contacted → Confirmed → Processing → Completed / Cancelled), items, "Ask about this order"; recent orders on this device as one-tap chips
- [x] Cart cleared after a cart order; unavailable items refresh the cart and block sending
- [x] End-to-end test: cart → checkout → WhatsApp → success → admin status changes → tracking; wrong phone is rejected

## Phase 5 — Admin panel UI ✅

- [x] Back office at `/admin` (lazy-loaded chunk), sign-in page, session check, automatic sign-out on 401
- [x] Layout: sidebar with sliding marker and a live "new orders" badge, mobile drawer, toasts, confirm dialogs
- [x] Dashboard: proposal §13 figures (clickable), recent orders, stock alerts
- [x] Orders: status tabs with counts, search, date range, pagination; detail with items, customer, WhatsApp link, status change + note, history, internal notes, print, delete
- [x] Products: list with search / status / category / stock filters and sorting, inline stock edit, featured / new toggles, delete
- [x] Product form: all proposal §4 fields, rich-text description, sale price or discount %, specifications, tags, related products, SEO, status; "Publish" / "Save as draft" for new products
- [x] Multi-photo upload (drag and drop), drag to reorder, alt text, delete; photos picked before the first save upload automatically
- [x] Categories: create / edit / hide / delete with image upload, display order, SEO; inline subcategory add / rename / delete
- [x] Banners: hero and promo, image upload, button text / link, schedule (start / end), on/off
- [x] Customers list + detail with order history
- [x] Pages: list, add, rich-text editor, publish toggle, SEO
- [x] Settings: store, contact & ordering (WhatsApp number with test link), social links, SEO
- [x] Admin users (super admins only) + change my password
- [x] Image safety: `<Img>` fallback placeholder everywhere; `npm run images:localize` copies external photos into `backend/uploads`
- [x] Fixed: order date filter "to" now includes the whole day
- [x] End-to-end tested in the browser (sign-in, publish product with photos, stock, categories, banners, settings, orders → customer tracking, pages, admins, mobile)
- [ ] Decide with the client whether confirming an order should deduct stock automatically

## Phase 6 — Content, contact, SEO & performance ✅

- [x] `/pages/:slug` content pages (About, Privacy, Terms, Delivery, Returns) from Admin → Pages, sanitised, with "More information" links
- [x] `/contact`: phone, WhatsApp, email, address, opening hours, social links, Google Map (only Google embed links allowed), message form
- [x] `POST /api/contact` (validation, honeypot, 5 per hour per IP): saved as `ContactMessage` and emailed to the business
- [x] Admin → Messages: unread filter, open marks as read, reply by email / WhatsApp, delete; unread badge + dashboard shortcut
- [x] `useSeo`: title, description, canonical, Open Graph / Twitter tags; product JSON-LD (price in LKR, availability); category descriptions; noindex on cart, checkout, order, tracking, 404 and admin
- [x] `/sitemap.xml` (home, shop, contact, categories, products, pages) and `/robots.txt` from the API (`SITE_URL`); Vite proxies both in development
- [x] Image resizing: `/uploads/...?w=400` → cached WebP (e.g. 82 kB → 5 kB); all storefront images request the size they need
- [x] Route-level code splitting: main bundle 230 kB → 139 kB gzip
- [x] Cache-Control on public API GETs (60 s + stale-while-revalidate); tracking is no-store
- [x] Removed the duplicated title heading from seeded pages
- [x] ~~Link previews on WhatsApp / Facebook only see the defaults in `index.html`~~. Fixed in Phase 7 with share links (`/s/o/…`, `/s/p/…`) and the nginx preview-bot rule.

## Phase 7 — QA, security & launch

### Security hardening ✅
- [x] Secret back-office address: only a SHA-256 hash in the code (`VITE_ADMIN_PATH_HASH`, `npm run admin-path`); `/admin` and guesses show "page not found"; robots.txt no longer mentions the back office
- [x] Admin session in an httpOnly, SameSite=Strict, Secure cookie (no token in localStorage or in JavaScript); shop and API share one address (`/api` proxy)
- [x] Session versions: sign-out, password change, role change and blocking end every older session immediately; `POST /api/admin/logout`
- [x] CSRF guard: `X-Requested-With: DiagonStore` required on every state-changing admin request
- [x] Account lockout (5 wrong passwords → 15 min), same response for unknown email and wrong password, `[security]` log line
- [x] Password rules (12+ characters, letters and numbers, not the email or name, not common); bcrypt cost 12
- [x] No credentials in files: `npm run create-admin` asks at the terminal (hidden typing), `--reset` to recover; `ADMIN_*` removed from `.env.example`
- [x] Server refuses a weak or placeholder `JWT_SECRET` in production; sessions shortened to 8 h
- [x] Uploads checked by content (sharp); fake images rejected and deleted; decompression-bomb limit
- [x] Product descriptions and pages cleaned on the server (sanitize-html) as well as in the browser
- [x] General API rate limit (600 / 5 min per IP)
- [x] `npm audit`: 0 vulnerabilities in both apps (fixed mysql2 / mariadb password-leak issues, body-parser, vite)
- [x] Migrations use exact table names (`Product`, `Admin`), so they also work on Linux MySQL
- [x] `backend/tests/security.test.js`: 16 automated security tests (`npm test`)
- [x] `docs/SECURITY.md`: protections, admin address, accounts, go-live checklist, nginx example

### WhatsApp link previews ✅
- [x] Order link in every WhatsApp order message (`/s/o/<random code>`): preview card with order number, item, total and product photo; opens order tracking with the number filled in
- [x] Product links (`/s/p/<slug>`) in product WhatsApp messages and the Share button: photo + price preview card
- [x] 1200×630 JPEG preview cards generated with sharp, cached in `uploads/.cache/og`
- [x] Order links use a random 128-bit code (`Inquiry.shareToken`), never the order number; previews never show customer details
- [x] Back office order page: *Message on WhatsApp* includes the order status + order link; *Copy order link*
- [x] WhatsApp number in Settings accepts `0771234567` and saves `94771234567`; wrong numbers are refused; warning when no number is set; *Send a test message*
- [x] Customer confirmation email links to the order
- [x] nginx: `/s/` proxied; chat-app crawlers on `/product/…` get the preview page
- [x] `backend/tests/share.test.js`: 9 tests

### Still to do
- [x] WhatsApp test environment: `npm run whatsapp:test -- --number <phone>` (public test address, sample order, QR codes, clean-up)
- [ ] Test a real WhatsApp preview on a phone (run the test environment, or after going live)
- [ ] More automated tests: orders, stock, products API; end-to-end checkout (Playwright)
- [ ] Accessibility pass (keyboard, contrast, screen reader) across all pages
### VPS deployment ✅
- [x] `deploy/setup-vps.sh`: one-command Ubuntu 24.04 setup (nginx, MariaDB, Node.js 24, ufw, fail2ban, swap, app user, DB + secrets, secret admin address, first admin)
- [x] systemd API service with sandboxing; uploads outside the code folder
- [x] Auto-deploy: VPS checks `main` every minute and deploys after GitHub Actions passes; install only when lock files change; health check + rollback
- [x] HTTPS with `deploy/enable-https.sh` (Let's Encrypt, auto-renew)
- [x] Nightly backups (database + photos, 14 days)
- [x] CI: API tests on MariaDB, shop lint + build, npm audit, deploy-script checks; VPS setup tested on a fresh Ubuntu 24.04 runner
- [x] `docs/DEPLOYMENT.md`
- [ ] Run the setup on the Hostinger VPS, point the domain, enable HTTPS
- [ ] Off-server backup copies (download or cloud sync); uptime monitoring (e.g. UptimeRobot on /api/health)
- [ ] Final privacy / terms / returns text from the client
