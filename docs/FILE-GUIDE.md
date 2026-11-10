# Diagon Store — File Guide

What each file in the repository does. Installed packages (`node_modules/`), lock files and build output (`dist/`) are not listed.

When you add a file, add a line here in the same commit.

---

## Root

| File | Purpose |
|---|---|
| `README.md` | Project overview, setup and run instructions, scripts, current API |
| `.gitignore` | Keeps `.env`, `node_modules`, build output, uploads, editor and AI-assistant folders out of git. `.env.example` is still committed. |
| `docs/` | Project documentation (this folder) |

## docs/

| File | Purpose |
|---|---|
| `ROADMAP.md` | The build phases in order, with goals and "done when" criteria |
| `TODO.md` | Task checklist per phase + known issues in the current code |
| `ARCHITECTURE.md` | System overview, target folder layout, data model, API list, order flow, WhatsApp and PayHere design, security |
| `FILE-GUIDE.md` | This file |
| `THEME-GUIDE.md` | Wizarding visual and copy guidelines for the UI |

---

## backend/

Express 5 REST API using Prisma ORM on MySQL/MariaDB.

| File | Purpose |
|---|---|
| `package.json` | Dependencies and npm scripts (`dev`, `start`, `db:*`, `create-admin`) |
| `.env.example` | Template for every backend environment variable, tagged by roadmap phase. Copy it to `.env`. |
| `server.js` | App entry point. Loads `.env`, stops if `JWT_SECRET` is missing, sets up CORS (`CLIENT_URL`) and JSON parsing, mounts `/api/admin`, `/api/products` and `/api/categories`, adds a health route at `/` and a 404 handler, and listens on `HOST:PORT`. |
| `prisma.js` | Creates the shared `PrismaClient` using the MariaDB driver adapter. Connection details are parsed from `DATABASE_URL`. Every route imports this one client. |
| `prisma.config.ts` | Prisma CLI config: schema path, migrations folder, and the `DATABASE_URL` used by `migrate`/`studio` |
| `create-admin.js` | One-off script (`npm run create-admin`). Creates the first admin from `ADMIN_NAME`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`, with the password hashed by bcrypt. |
| `test-db.js` | Connection check (`npm run db:test`). Connects to the database and prints success or failure. |

### backend/middleware/

| File | Purpose |
|---|---|
| `authMiddleware.js` | Checks the `Authorization: Bearer <token>` header with `JWT_SECRET`, puts the decoded admin on `req.admin`, and returns 401 if the token is missing or invalid. Used on every admin-only route. |

### backend/routes/

| File | Purpose |
|---|---|
| `adminRoutes.js` | `POST /api/admin/login` checks the email and bcrypt password and returns a 1-day JWT plus admin info. `GET /api/admin/profile` 🔒 returns the logged-in admin. |
| `productRoutes.js` | `GET /api/products` lists products with category, subcategory and images, newest first. `POST` 🔒 creates, `PUT /:id` 🔒 updates and `DELETE /:id` 🔒 deletes a product (name, price ≥ 0 and stock ≥ 0 are checked). `POST /:productId/images` 🔒 attaches an image URL. |
| `categoryRoutes.js` | `GET /api/categories` lists categories with subcategories, A–Z. `POST /` 🔒 and `DELETE /:id` 🔒 for categories; `POST /subcategories` 🔒 and `DELETE /subcategories/:id` 🔒 for subcategories (duplicates return 409). Deleting a category also deletes its subcategories, and its products have their category cleared. |

### backend/prisma/

| File | Purpose |
|---|---|
| `schema.prisma` | Database schema: `Product`, `Category`, `Subcategory`, `ProductImage`, `Admin`, and their relations and delete rules. **Edit this file to change the database**, then run `npm run db:migrate`. |
| `migrations/20260928151607_init/` | Creates the `Product` table |
| `migrations/20260928153143_add_categories/` | Adds `Category`, `Subcategory` and the product → category/subcategory foreign keys |
| `migrations/20260928171640_add_product_images/` | Adds `ProductImage` |
| `migrations/20260929141111_add_admin/` | Adds `Admin` |
| `migrations/migration_lock.toml` | Locks the migration provider to MySQL. Don't edit it. |

---

## frontend/

React 19 single-page app built with Vite 8, Tailwind CSS 4 and React Router 7. It contains both the storefront and the admin panel.

| File | Purpose |
|---|---|
| `package.json` | Dependencies and scripts (`dev`, `build`, `preview`, `lint`) |
| `.env.example` | Template for `VITE_*` variables (API URL, store name, WhatsApp number). Copy it to `.env`. These values are public. |
| `index.html` | HTML shell: page title, meta description and favicon. The app mounts into `#root`. |
| `vite.config.js` | Vite config with the React and Tailwind CSS plugins |
| `.oxlintrc.json` | Lint rules for `npm run lint` (oxlint) |
| `.gitignore` | Frontend-specific ignores (dist, logs, editor files) |
| `public/favicon.svg` | Browser tab icon, served as-is |

### frontend/src/

| File | Purpose |
|---|---|
| `main.jsx` | Starts React: imports the global CSS and renders `<App />` in StrictMode |
| `App.jsx` | Route table: `/` → Home, `/admin/login` → AdminLogin, `/admin/dashboard` → AdminDashboard, `*` → Home |
| `index.css` | Global stylesheet and Tailwind entry point. Theme tokens go here in Phase 3. |
| `services/api.js` | API client. `API_BASE_URL` comes from `VITE_API_URL`. Exports `adminLogin`, `getProducts` and `getCategories`. |

### frontend/src/pages/

| File | Purpose |
|---|---|
| `Home.jsx` | Storefront home: announcement bar, header with search and bag counter, hero, featured product grid, about section, footer. **It still uses 4 hard-coded demo products** and the bag is only a counter. Phase 3 connects it to the API and the cart. |
| `Home.css` | Styles for the home page (the `.store-*` classes) |
| `AdminLogin.jsx` | Admin login form. Calls `adminLogin`, saves the JWT as `adminToken` in `localStorage` and goes to the dashboard. |
| `AdminDashboard.jsx` | Admin shell: sidebar (links don't work yet), header, and stat cards. Product and category counts are real; orders and customers show 0 for now. It has no route guard yet. |

---

## Files to be added (by phase)

The full target layout is in [ARCHITECTURE.md](ARCHITECTURE.md#target-folder-structure). Main additions:

| Phase | Files |
|---|---|
| 1 | `backend/app.js`, `config/env.js`, `middleware/{errorHandler,validate,rateLimiters}.js`, `controllers/*`, `services/*`, `validators/*`, `utils/{asyncHandler,slugify,money}.js`, `prisma/seed.js` |
| 2 | `middleware/upload.js`, `services/storage.service.js`, `frontend/src/services/http.js`, `components/admin/*`, `pages/admin/{Products,Categories}.jsx`, `components/ProtectedRoute.jsx` |
| 3 | `components/ui/*`, `components/store/*`, `context/CartContext.jsx`, `pages/store/{Shop,Product,Cart,NotFound,...}.jsx`, `utils/formatPrice.js` |
| 4 | `services/order.service.js`, `utils/{phone,orderNumber}.js`, `routes/orderRoutes.js`, `pages/store/{Checkout,OrderSuccess,Track}.jsx`, `pages/admin/Orders.jsx` |
| 5 | `services/whatsapp.service.js`, `routes/whatsappRoutes.js`, `frontend/src/utils/whatsappLink.js`, `components/store/WhatsAppButton.jsx` |
| 6 | `services/{report,inventory,coupon,email}.service.js`, `pages/admin/{Inventory,Offers,Coupons,Customers,Settings,Users}.jsx` |
| 7 | `services/payhere.service.js`, `routes/paymentRoutes.js` |
