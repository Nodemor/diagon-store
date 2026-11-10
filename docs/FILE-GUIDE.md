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

## docs/

| File | Purpose |
|---|---|
| `README.md` | Reading order + current phase |
| `ROADMAP.md` | Build phases, with a table mapping each proposal section to its phase |
| `TODO.md` | Task checklist per phase + known issues |
| `ARCHITECTURE.md` | Structure, data model, full API, order flow, security |
| `FILE-GUIDE.md` | This file |
| `THEME-GUIDE.md` | Wizarding visual style, wording and motion rules |

---

## backend/

| File | Purpose |
|---|---|
| `package.json` | Dependencies and scripts (`dev`, `start`, `db:*`, `create-admin`) |
| `.env.example` | Every environment variable, explained. Copy it to `.env`. |
| `server.js` | Starts the API on `HOST:PORT`; shuts down cleanly on SIGINT / SIGTERM |
| `app.js` | Builds the Express app: helmet, CORS, JSON limit, request logging, `/uploads` static files, `/api/health`, routes, 404 and error handlers |
| `prisma.js` | Shared Prisma client using the MariaDB adapter. Connection details come from `DATABASE_URL`. |
| `prisma.config.ts` | Prisma CLI config: schema, migrations folder, seed command, `DATABASE_URL` |
| `create-admin.js` | `npm run create-admin`: creates a SUPER_ADMIN from `ADMIN_NAME`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` |
| `test-db.js` | `npm run db:test`: runs a real query to check the database connection |

### backend/config/

| File | Purpose |
|---|---|
| `env.js` | The only file that reads `process.env`. Checks the required variables and exports a typed `env` object (server, JWT, rate limits, uploads, store, email). |

### backend/routes/

| File | Purpose |
|---|---|
| `store.routes.js` | Public routes under `/api`: home, products, categories, banners, settings, pages, place order, track order. Attaches validators and rate limits. |
| `admin.routes.js` | Admin routes under `/api/admin`. `/login` is public; everything else needs `requireAuth`, and `/admins` also needs SUPER_ADMIN. |

### backend/controllers/

| File | Purpose |
|---|---|
| `store.controller.js` | Public handlers: home bundle, product list/detail/related, categories, active banners (date-window aware), settings, pages |
| `inquiry.controller.js` | Public handlers: place an order, track an order |
| `admin/auth.controller.js` | Login (updates `lastLoginAt`), profile, change password |
| `admin/catalog.controller.js` | Products CRUD, stock, product images (upload / URL / reorder / alt text / delete), categories, subcategories |
| `admin/sales.controller.js` | Dashboard, orders (list / detail / status / notes / delete), customers |
| `admin/content.controller.js` | Generic image upload, banners, settings, content pages, admin users |

### backend/services/

| File | Purpose |
|---|---|
| `product.service.js` | Product queries and rules: visibility, search across name/SKU/brand/tags/category, filters, sorting, related products, home sections, create/update (sale < price, subcategory must belong to its category, slugs, related IDs), stock, images |
| `category.service.js` | Category and subcategory queries with product counts; CRUD with unique slugs; deletes old images |
| `inquiry.service.js` | Order placement (phone normalisation, stock check, server pricing, transaction, order number, WhatsApp message, emails), tracking, admin list/detail/status/notes/delete |
| `dashboard.service.js` | Dashboard numbers: product counts, orders by status, recent orders, stock alerts |
| `settings.service.js` | Allowed setting keys + defaults, cached read, save |
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

### backend/middleware/

| File | Purpose |
|---|---|
| `auth.js` | `requireAuth` (JWT + active admin check, sets `req.admin`), `requireRole(...roles)` |
| `validate.js` | `validate({ params, query, body })`: runs Zod schemas and puts the results in `req.valid` |
| `errorHandler.js` | 404 handler and the central error → JSON converter |
| `rateLimiters.js` | `loginLimiter`, `inquiryLimiter`, `trackLimiter` |
| `upload.js` | Multer image upload to `uploads/<folder>/` with type and size checks and random names |

### backend/utils/

| File | Purpose |
|---|---|
| `httpError.js` | `HttpError` + `badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict` |
| `slugify.js` | `slugify(text)` and `uniqueSlug(model, text, { excludeId, scope })` |
| `phone.js` | `normalizePhone()`: Sri Lankan and international numbers → digits like `94771234567` |
| `serialize.js` | Prisma → JSON (Decimal → number, computed price and stock fields, tags array), pagination helpers |
| `format.js` | `formatMoney` (LKR), `round2`, `escapeHtml`, `formatOrderNumber` |
| `whatsapp.js` | Builds the proposal §9 WhatsApp order message and the `wa.me` link |

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

| File | Purpose |
|---|---|
| `package.json` | Dependencies and scripts (`dev`, `build`, `preview`, `lint`) |
| `.env.example` | `VITE_API_URL`. Copy it to `.env`. |
| `index.html` | HTML shell + meta |
| `vite.config.js` | Vite with the React and Tailwind plugins |
| `.oxlintrc.json` | oxlint rules |
| `public/favicon.svg` | Tab icon |
| `src/main.jsx` | React entry |
| `src/App.jsx` | Route table |
| `src/index.css` | Global CSS / Tailwind entry |
| `src/services/api.js` | API client (admin login, products, categories) |
| `src/pages/Home.jsx` / `Home.css` | Current home page (static demo, replaced in Phase 2) |
| `src/pages/AdminLogin.jsx` | Admin login form; stores the JWT |
| `src/pages/AdminDashboard.jsx` | Admin shell with product and category counts (replaced in Phase 5) |
