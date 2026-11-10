# Diagon Store — TODO

Task checklist grouped by the phases in [ROADMAP.md](ROADMAP.md). Tick `[x]` items as you finish them, in the same commit as the code.

---

## ⚠️ Known issues

- [ ] **Linux deployment:** migration `20260928153143_add_categories` runs `ALTER TABLE \`product\`` (lowercase) while the table was created as `Product`. This works on Windows/XAMPP, where table names are case-insensitive, but **fails on Linux MySQL**. Before the first Linux deploy, either set `lower_case_table_names=1` on the server or squash the migrations into a fresh baseline. *(Phase 7)*
- [ ] Sorting by price uses the regular price, not the sale price. *(Small; revisit if the client notices.)*
- [ ] Orders don't change stock automatically. The owner adjusts stock in Admin → Products (inline stock field). Decide with the client whether confirming an order should deduct stock.
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
