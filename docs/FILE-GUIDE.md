# Diagon Store — File Guide

What each file in the repository does. Installed packages (`node_modules/`), lock files, build output and `backend/uploads/` are not listed.

When you add a file, add a line here in the same commit.

---

## Root

| File | Purpose |
|---|---|
| `README.md` | Overview, setup (XAMPP), scripts, API summary |
| `.gitignore` | Ignores `.env`, `node_modules`, build output, uploads, editor and AI-assistant folders (`.env.example` is still committed) |
| `docs/` | Project documentation |
| `deploy/` | VPS deployment kit (see below) |
| `.github/workflows/ci.yml` | CI on every PR and push to `main`: API tests (MariaDB), shop lint + build, `npm audit`, deploy-script checks |
| `.github/workflows/vps-setup-test.yml` | PRs that change `deploy/`: runs the full VPS setup on fresh Ubuntu 24.04 and 26.04 runners and checks the result |

## docs/

| File | Purpose |
|---|---|
| `README.md` | Reading order + current phase |
| `ROADMAP.md` | Build phases, with a table mapping each proposal section to its phase |
| `TODO.md` | Task checklist per phase + known issues |
| `ARCHITECTURE.md` | Structure, data model, full API, order flow, security |
| `FILE-GUIDE.md` | This file |
| `THEME-GUIDE.md` | Wizarding visual style, wording and motion rules |
| `SECURITY.md` | Protections, secret admin address, admin accounts, go-live checklist, nginx example |
| `DEPLOYMENT.md` | VPS setup, domain + HTTPS, auto-deploy, backups, restore, CI |

---

## deploy/

| File | Purpose |
|---|---|
| `setup-vps.sh` | One-time setup of a fresh Ubuntu 24.04 / 26.04 VPS: packages, Node.js 24, firewall, fail2ban, app user, database + secrets, secret admin address, first deploy, nginx, timers, first admin. Safe to re-run. |
| `deploy.sh` | Deploys one commit: install (only when lock files change), migrate, build the shop into `dist-next`, restart, health check, switch builds; rolls back on failure |
| `auto-deploy.sh` | Run every minute by the deploy timer: newest commit on `main` → wait for its GitHub Actions checks → `deploy.sh` |
| `enable-https.sh` | Domain + Let's Encrypt certificate + https settings in `backend/.env` |
| `backup.sh` | Nightly database dump + photos archive, kept 14 days |
| `nginx/diagon-store.conf` | nginx site: the built shop, API proxy, share links, chat-app preview rule, caching, hidden files blocked |
| `nginx/diagon-security-headers.conf` | Security headers for shop pages (CSP, HSTS, frame, referrer, permissions) |
| `systemd/*.service`, `*.timer` | API service (with sandboxing), auto-deploy timer (every minute), backup timer (02:30) |

## backend/

| File | Purpose |
|---|---|
| `package.json` | Dependencies and scripts (`dev`, `start`, `db:*`, `create-admin`) |
| `.env.example` | Every environment variable, explained. Copy it to `.env`. |
| `server.js` | Starts the API on `HOST:PORT`; shuts down cleanly on SIGINT / SIGTERM |
| `app.js` | Builds the Express app: helmet, CORS, JSON limit, request logging, `/uploads` static files, `/api/health`, routes, 404 and error handlers |
| `prisma.js` | Shared Prisma client using the MariaDB adapter. Connection details come from `DATABASE_URL`. |
| `prisma.config.ts` | Prisma CLI config: schema, migrations folder, seed command, `DATABASE_URL` |
| `tests/share.test.js` | `npm test`: share links, link previews and the WhatsApp number setting (9 tests) |
| `tests/security.test.js` | `npm test`: 16 security tests (sessions, CSRF, lockout, passwords, uploads, HTML cleaning, public surface) |
| `create-admin.js` | `npm run create-admin`: creates a SUPER_ADMIN, asking for the details at the terminal (password typing hidden). `-- --reset` sets a new password, unlocks the account and ends its sessions |
| `test-db.js` | `npm run db:test`: runs a real query to check the database connection |
| `scripts/whatsapp-test.js` | `npm run whatsapp:test -- --number <phone>`: WhatsApp test environment. Serves the built shop + API on one port, opens a temporary public https address (Cloudflare quick tunnel), places a sample order, prints QR codes, and cleans up on Ctrl+C |
| `scripts/localize-images.js` | `npm run images:localize` (`-- --dry` to preview): copies external product, category and banner images into `uploads/` and points the database at the local copies |

### backend/config/

| File | Purpose |
|---|---|
| `env.js` | The only file that reads `process.env`. Checks the required variables and exports a typed `env` object (server, JWT, rate limits, uploads, store, email). |

### backend/routes/

| File | Purpose |
|---|---|
| `store.routes.js` | Public routes under `/api`: home, products, categories, banners, settings, pages, place order, track order. Attaches validators and rate limits. |
| `share.routes.js` | Share links under `/s`: order and product preview pages and their preview images (rate-limited) |
| `admin.routes.js` | Admin routes under `/api/admin`. `/login` is public; everything else needs `requireAuth`, and `/admins` also needs SUPER_ADMIN. |

### backend/controllers/

| File | Purpose |
|---|---|
| `store.controller.js` | Public handlers: home bundle, product list/detail/related, categories, active banners (date-window aware), settings, pages |
| `inquiry.controller.js` | Public handlers: place an order, track an order |
| `admin/auth.controller.js` | Sign-in (lockout, constant-time answers, session cookie), sign-out, profile, change password (ends other sessions) |
| `admin/catalog.controller.js` | Products CRUD, stock, product images (upload / URL / reorder / alt text / delete), categories, subcategories |
| `admin/sales.controller.js` | Dashboard, orders (list / detail / status / notes / delete), customers |
| `contact.controller.js` | Contact form: save + email (public), list / mark read / delete (admin) |
| `seo.controller.js` | `/sitemap.xml` and `/robots.txt` |
| `share.controller.js` | Share-link pages (preview tags + redirect), preview images, friendly 404 |
| `admin/content.controller.js` | Generic image upload, banners, settings, content pages, admin users |

### backend/services/

| File | Purpose |
|---|---|
| `product.service.js` | Product queries and rules: visibility, search across name/SKU/brand/tags/category, filters, sorting, related products, home sections, create/update (sale < price, subcategory must belong to its category, slugs, related IDs), stock, images |
| `category.service.js` | Category and subcategory queries with product counts; CRUD with unique slugs; deletes old images |
| `inquiry.service.js` | Order placement (phone normalisation, stock check, server pricing, transaction, order number, share code, WhatsApp message with order link, emails), tracking, admin list/detail (customer WhatsApp message with status + order link)/status/notes/delete |
| `dashboard.service.js` | Dashboard numbers: product counts, orders by status, recent orders, stock alerts |
| `settings.service.js` | Allowed setting keys + defaults, cached read, save; checks and normalises the WhatsApp number |
| `share.service.js` | Share links: random order codes, preview data (no customer details), preview page HTML, 1200×630 preview cards with sharp (cached) |
| `email.service.js` | nodemailer SMTP sender (logs to the console when disabled); new-order emails to the business and the customer |
| `storage.service.js` | Safely deletes uploaded files when an image, banner or category is removed |

### backend/validators/

| File | Purpose |
|---|---|
| `common.js` | Shared Zod helpers: `optionalText`, `id`, `idParams`, `boolQuery`, `money`, paging |
| `product.js` | Product create/update, stock update, public and admin list queries, image schemas |
| `category.js` | Category and subcategory create/update |
| `inquiry.js` | Order form (with a honeypot field), tracking query, admin list query, status and notes updates |
| `admin.js` | Login, create/update admin, change password |
| `content.js` | Banners, settings, pages |
| `contact.js` | Contact form, admin message list / update |

### backend/middleware/

| File | Purpose |
|---|---|
| `auth.js` | Session cookie (`startSession` / `endSession`), `requireAuth` (cookie + session version + active check), `requireRole`, `requireCsrfHeader` |
| `verifyImages.js` | Checks uploaded files are real images by reading them with sharp; deletes and refuses anything else |
| `validate.js` | `validate({ params, query, body })`: runs Zod schemas and puts the results in `req.valid` |
| `errorHandler.js` | 404 handler and the central error → JSON converter |
| `rateLimiters.js` | `loginLimiter`, `inquiryLimiter`, `trackLimiter`, `contactLimiter` |
| `upload.js` | Multer image upload to `uploads/<folder>/` with type and size checks and random names |
| `imageResize.js` | `/uploads/...?w=` → resized WebP via sharp, cached in `uploads/.cache` (fixed widths, path-traversal guard) |

### backend/utils/

| File | Purpose |
|---|---|
| `httpError.js` | `HttpError` + `badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict` |
| `slugify.js` | `slugify(text)` and `uniqueSlug(model, text, { excludeId, scope })` |
| `phone.js` | `normalizePhone()`: Sri Lankan and international numbers → digits like `94771234567` |
| `serialize.js` | Prisma → JSON (Decimal → number, computed price and stock fields, tags array), pagination helpers |
| `format.js` | `formatMoney` (LKR), `round2`, `escapeHtml`, `formatOrderNumber` |
| `whatsapp.js` | Builds the proposal §9 WhatsApp order message (with the order link), the shop → customer message (status + order link) and the `wa.me` link |
| `password.js` | Admin password rules (`passwordProblem`) |
| `sanitizeHtml.js` | Server-side cleaning of rich text (product descriptions, pages) |

### backend/prisma/

| File | Purpose |
|---|---|
| `schema.prisma` | The data model (see ARCHITECTURE.md). Edit this, then run `npm run db:migrate`. |
| `seed.js` | `npm run db:seed`: demo categories, products, banners and pages. Safe to re-run. |
| `migrations/20260928151607_init` | Creates `Product` |
| `migrations/20260928153143_add_categories` | `Category`, `Subcategory`, product foreign keys (⚠️ lowercase table name — see TODO) |
| `migrations/20260928171640_add_product_images` | `ProductImage` |
| `migrations/20260929141111_add_admin` | `Admin` |
| `migrations/20261110120000_catalogue_inquiries_content` | Phase 1: product, category and image fields; customers, orders, history; banners, settings, pages; related products; slug backfill; first admin → SUPER_ADMIN |
| `migrations/migration_lock.toml` | Locks the provider to MySQL |

---

## frontend/

React 19 + Vite 8 + Tailwind CSS 4. Motion: GSAP + ScrollTrigger, Lenis, Motion for React.

| File | Purpose |
|---|---|
| `package.json` | Dependencies and scripts (`dev`, `build`, `preview`, `lint`, `admin-path`) |
| `scripts/admin-path.mjs` | `npm run admin-path`: creates a secret back-office address and prints its hash |
| `.env.example` | `VITE_API_URL`. Copy it to `.env`. |
| `index.html` | HTML shell, meta, Google Fonts (IM Fell English + Figtree) |
| `vite.config.js` | Vite with the React and Tailwind plugins; dev proxy for `/sitemap.xml` and `/robots.txt` |
| `.oxlintrc.json` | oxlint rules |
| `public/favicon.svg` | Tab icon |

### frontend/src/

| File | Purpose |
|---|---|
| `main.jsx` | Entry: `MotionConfig` (respects reduced motion) → `SettingsProvider` → `CartProvider` → `SmoothScroll` → `App` |
| `App.jsx` | Routes. Storefront pages sit inside `StoreLayout`; every page except Home and the back office is lazy-loaded. |
| `index.css` | Tailwind import, **design tokens** (`@theme`), base styles, fog and flicker keyframes, reduced-motion rules |

### src/lib/ · src/hooks/ · src/context/ · src/services/

| File | Purpose |
|---|---|
| `lib/adminPath.js` | Secret back-office address: hashes the first part of the address and compares it with `VITE_ADMIN_PATH_HASH`; `adminPath()` builds admin links |
| `lib/api.js` | `request()` fetch wrapper, `ApiError`, `API_BASE_URL`, `API_ORIGIN` |
| `lib/format.js` | `formatPrice` (Rs), `assetUrl` (adds the API origin to `/uploads` paths), `imageAt` (resized Unsplash URLs), `whatsappDigits` (0771234567 → 94771234567), `whatsappLink`, `productShareUrl` (/s/p/ link with preview), `productWhatsAppMessage` (single-product order message with product link) |
| `lib/motion.js` | Registers GSAP plugins (ScrollTrigger, RoughEase, useGSAP); reduced-motion helpers |
| `lib/recentOrders.js` | Orders placed on this device (for one-tap tracking) and opt-in saved customer details |
| `hooks/useAsync.js` | Loads data with abort handling → `{ data, error, loading }` |
| `hooks/useSeo.js` | Per-page title, description, canonical, Open Graph / Twitter tags, JSON-LD, noindex |
| `hooks/usePageTitle.js` | Shortcut for `useSeo({ title })` |
| `context/SettingsContext.jsx` | Store settings from `/api/settings` (name, WhatsApp, contact details, social links) with fallbacks |
| `context/CartContext.jsx` | Cart saved in `localStorage`: `add`, `setQuantity`, `remove`, `clear`, `refresh` (re-reads prices and stock from the API), `count`, `subtotal`, `savings`, drawer `isOpen` / `openCart` / `closeCart` |
| `services/store.js` | Public API calls (home, settings, categories, products, product, related, page, place order, track) |

### src/components/

| File | Purpose |
|---|---|
| `motion/SmoothScroll.jsx` | Lenis smooth scrolling synced with the GSAP ticker and ScrollTrigger; `useLenis`, `scrollToTop` |
| `layout/StoreLayout.jsx` | Skip link, header, animated page area (Motion `AnimatePresence` + `useOutlet`), footer, WhatsApp button |
| `layout/Header.jsx` | Sticky header (translucent once scrolled): logo, React Bits PillNav links, search (goes to `/shop?search=`), cart badge, animated Menu/Close toggle; exports `NAV_ITEMS` and `SearchForm` |
| `layout/SearchForm.jsx` | Search box with instant product suggestions (debounced, arrow keys / Enter / Escape) |
| `cart/CartLines.jsx` | Cart rows (image, name, code, price, quantity stepper, remove) shared by the drawer and the cart page |
| `cart/CartDrawer.jsx` | Slide-out cart with estimated total, "Send my order" and "View cart" |
| `shop/FilterPanel.jsx` | Shop filters: category / subcategory, price range, availability, show only (offer / new / featured) |
| `product/ProductGallery.jsx` | Product images: hover zoom + thumbnails on desktop, swipe strip on mobile |
| `product/ShareButton.jsx` | Share sheet / copy link / WhatsApp / Facebook, using the product share link (photo + price preview) |
| `ui/QuantityStepper.jsx` | − n + quantity control |
| `ui/Img.jsx` | `<img>` that shows a lamp placeholder instead of a broken image when a photo is missing |
| `order/StatusTimeline.jsx` | Customer-facing order status names + animated tracking timeline |
| `layout/MobileMenu.jsx` | Full-height mobile menu: staggered GSAP layers and links, focus handling, Escape to close, scroll lock |
| `layout/Footer.jsx` | Shop and help links, contact details, hours and social links from settings |
| `layout/WhatsAppButton.jsx` | Floating chat button (hidden until a WhatsApp number is set in settings) |
| `home/Hero.jsx` | Landing hero + GSAP load sequence and scroll parallax |
| `home/AlleyScene.jsx` | SVG night street, 3000 × 440 (seeded buildings, windows, signs, 9 lamps, street fog). The ground fades into the next section's colour. |
| `home/HeroWindow.jsx` | Arched shop window rotating the HERO banners from the admin panel |
| `home/CategoryAlley.jsx` | "Browse the shops": categories drawn as shopfronts. On desktop, 4 per page, pinned and snapping page by page, with prev/next buttons and a progress bar. On mobile, a swipe row. |
| `home/PromoBanners.jsx` | PROMO banners from the admin panel |
| `home/HowToOrder.jsx` | Three-step ordering explainer + WhatsApp link |
| `product/ProductCard.jsx` | Product tile with badges and an add-to-cart button that confirms with a tick |
| `product/ProductRail.jsx` | `ProductSection`: titled grid or horizontal rail with skeletons |
| `ui/Button.jsx` | `Button`, `ButtonLink`, `buttonClass` variants |
| `ui/PriceTag.jsx` | Sale and regular price |
| `ui/Skeleton.jsx` | Product card loading placeholder |
| `ui/icons.jsx` | Inline SVG icons + the lamp logo mark |
| `reactbits/PillNav.jsx` | React Bits Pill Nav (desktop navigation) |
| `reactbits/PixelSnow.jsx` | React Bits Pixel Snow (WebGL2 hero snow; lazy-loaded) |

### src/pages/

| File | Purpose |
|---|---|
| `Home.jsx` | Landing page from `GET /api/home` |
| `NotFound.jsx` | Themed 404 |
| `Shop.jsx` | `/shop` and `/category/:slug`: header, filters (sidebar / mobile sheet), sort, chips, animated grid, "Show more products" |
| `Product.jsx` | `/product/:slug`: gallery, price, stock, buttons (cart, order now, WhatsApp, email, share), description, specifications, related |
| `Cart.jsx` | `/cart`: cart lines + order summary |
| `Checkout.jsx` | `/checkout`: order form, WhatsApp / email choice, summary; cart or single product (`?buy=`) |
| `OrderSuccess.jsx` | `/order/success/:number`: confirmation, order number, WhatsApp fallback button, summary |
| `Track.jsx` | `/track`: look up by order number + mobile, status timeline, items |
| `ContentPage.jsx` | `/pages/:slug`: About and policy pages from Admin → Pages |
| `Contact.jsx` | `/contact`: details, map, social links, message form |

### src/admin/ (back office, lazy-loaded at `/admin`)

| File | Purpose |
|---|---|
| `AdminApp.jsx` | Back-office routes, wrapped in the auth, toast and confirm providers |
| `AdminLayout.jsx` | `RequireAdmin` gate + layout: sidebar (sliding marker, new-orders badge, profile, sign out), mobile drawer |
| `api.js` | Admin API client (token from localStorage; a 401 signs the admin out) + `fieldErrors()` |
| `context.jsx` | `AdminAuthProvider` / `useAdminAuth`, `ToastProvider` / `useToast`, `ConfirmProvider` / `useConfirm` |
| `ui.jsx` | Admin UI kit: `useAdminData`, `PageHeader`, `Panel`, `Input`, `Textarea`, `Select`, `Toggle`, `Badge`, `StatusBadge`, `Pagination`, `Modal`, `EmptyState`, `ErrorBox`, date formatting |
| `icons.jsx` | Sidebar and action icons |
| `util.js` | `slugifyText` |
| `components/ImageManager.jsx` | Product photos: drag-and-drop upload, drag to reorder, alt text, delete (or queue files for a new product) |
| `components/FormParts.jsx` | `SpecsEditor`, `TagInput`, `RelatedPicker`, `SingleImageField` (category / banner image upload) |
| `components/RichTextEditor.jsx` | Small rich-text editor (bold, italic, headings, lists, links) for descriptions and pages |
| `pages/Login.jsx` | Sign-in |
| `pages/Dashboard.jsx` | Proposal §13 figures, recent orders, stock alerts |
| `pages/Orders.jsx` | Orders with status tabs, search, dates, pagination |
| `pages/OrderDetail.jsx` | One order: items, customer, status + note, history, internal notes, print, delete |
| `pages/Products.jsx` | Product list, filters, inline stock, featured / new toggles |
| `pages/ProductForm.jsx` | Add / edit product (publish or draft), photos, pricing, stock, specs, tags, related, SEO |
| `pages/Categories.jsx` | Categories (modal form, image, visibility) + inline subcategories |
| `pages/Banners.jsx` | Hero and promo banners with schedules |
| `pages/Customers.jsx` / `CustomerDetail.jsx` | Customer list and order history |
| `pages/Messages.jsx` | Contact form messages: unread filter, read / unread, reply, delete |
| `pages/Pages.jsx` / `PageEditor.jsx` | Content pages list and editor |
| `pages/Settings.jsx` | Store, contact & ordering, social, SEO settings |
| `pages/Admins.jsx` | Admin users and roles (super admins only) |
| `pages/Profile.jsx` | Change my password |
