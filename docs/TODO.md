# Diagon Store — TODO

Task checklist grouped by the phases in [ROADMAP.md](ROADMAP.md). Tick `[x]` items as you finish them, in the same commit as the code.

---

## ⚠️ Known issues

- [ ] **Linux deployment:** migration `20260928153143_add_categories` runs `ALTER TABLE \`product\`` (lowercase) while the table was created as `Product`. This works on Windows/XAMPP, where table names are case-insensitive, but **fails on Linux MySQL**. Before the first Linux deploy, either set `lower_case_table_names=1` on the server or squash the migrations into a fresh baseline. *(Phase 7)*
- [ ] Sorting by price uses the regular price, not the sale price. *(Small; revisit if the client notices.)*
- [ ] Orders don't change stock automatically. The owner adjusts stock in the admin panel. Decide with the client whether confirming an order should deduct stock. *(Phase 5)*
- [ ] The admin token is stored in `localStorage`. Consider an httpOnly cookie before launch. *(Phase 7)*
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
- [ ] Split the GSAP/Motion code into a separate chunk if the bundle grows (currently ~195 kB gzip) *(Phase 6)*

## Phase 3 — Shop, product page, cart

- [ ] `/shop` with URL-synced filters, sorting, search, load more
- [ ] `/category/:slug`
- [ ] `/product/:slug`: gallery, price/discount, SKU, stock, specs, quantity, add to cart, WhatsApp, email, share, related
- [ ] `CartContext` + `localStorage`, cart drawer, `/cart`
- [ ] Header search suggestions

## Phase 4 — Order flow

- [ ] `/checkout` order form (WhatsApp or Email)
- [ ] `/order/success/:number`
- [ ] `/track` status timeline
- [ ] Single-product "Order via WhatsApp"
- [ ] Clear the cart after an order succeeds; handle "item unavailable" errors

## Phase 5 — Admin panel UI

- [ ] `AdminLayout`, `ProtectedRoute`, auto-logout on 401
- [ ] Dashboard
- [ ] Products list + form + image manager + related picker
- [ ] Stock quick-edit
- [ ] Categories / subcategories
- [ ] Orders list (status tabs) + detail + status / notes
- [ ] Customers
- [ ] Banners
- [ ] Settings
- [ ] Pages editor
- [ ] Admin users + change password

## Phase 6 — Content & SEO

- [ ] About, Contact (map, hours, social), policy pages
- [ ] Per-route meta + Open Graph
- [ ] `sitemap.xml`, `robots.txt`, product JSON-LD
- [ ] Image sizes / lazy loading, code-splitting, API cache headers

## Phase 7 — Launch

- [ ] API + E2E tests
- [ ] Fix migration table-name case for Linux
- [ ] Security & accessibility review
- [ ] Deploy (API + MySQL + uploads volume + static frontend + HTTPS)
- [ ] Backups + monitoring
