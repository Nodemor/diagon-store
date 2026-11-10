# Diagon Store — TODO

Task checklist, grouped by the phases in [ROADMAP.md](ROADMAP.md). Tick `[x]` items as you finish them and commit the change together with the code.

---

## ⚠️ Known issues in the current code

- [ ] `/admin/dashboard` has no route guard. Anyone can open it, though the data it shows is public. *(Phase 2: `ProtectedRoute`)*
- [ ] An invalid `categoryId` or `subcategoryId` on product create/update gives a 500 error instead of a 400. *(Phase 1)*
- [ ] Nothing checks that a subcategory belongs to the selected category. *(Phase 1)*
- [ ] `PUT /products/:id` with an unknown id gives a 500 error instead of a 404. *(Phase 1)*
- [ ] Prices come back as strings because of Prisma `Decimal`. *(Phase 1)*
- [ ] No rate limit on `/api/admin/login`. *(Phase 1)*
- [ ] Deleting a product deletes it permanently. Once orders exist, use archiving instead. *(Phase 2)*
- [ ] The home page shows 4 hard-coded demo products in `$`. Switch to the API and LKR. *(Phase 3)*
- [ ] The admin token is stored in `localStorage`. Consider an httpOnly cookie before launch. *(Phase 8)*
- [ ] The old demo admin password `Admin@12345` is in the git history. **Never use it in production.** Create admins with `npm run create-admin` and a strong `ADMIN_PASSWORD`.

---

## Phase 0 — Foundation ✅

- [x] Read database settings from `DATABASE_URL`
- [x] `PORT`, `HOST`, `CLIENT_URL` (CORS), `JWT_SECRET` check at startup
- [x] Read the frontend API URL from `VITE_API_URL`
- [x] `create-admin.js` reads `ADMIN_*` from `.env` (no hard-coded password)
- [x] Backend npm scripts (`dev`, `start`, `db:*`, `create-admin`)
- [x] Removed `prisma skills sync` postinstall and the AI-tool folders it created
- [x] Removed Vite template leftovers, stray `.gitignore` files, `test.sql`
- [x] `backend/.env.example`, `frontend/.env.example`
- [x] Root README + `docs/`

## Phase 1 — Backend hardening

- [ ] Create `controllers/`, `services/`, `validators/`, `utils/`, `config/` folders
- [ ] `utils/asyncHandler.js` and `middleware/errorHandler.js` (map Prisma P2002/P2025/P2003)
- [ ] `config/env.js`: load and check every environment variable in one place
- [ ] Install `zod`, write validation schemas for product, category and admin login
- [ ] Install `helmet`, `express-rate-limit`, `morgan`; set `express.json({ limit: "1mb" })`
- [ ] `GET /api/products/:id`
- [ ] `PUT /api/categories/:id`, `PUT /api/categories/subcategories/:id`
- [ ] `DELETE /api/products/:productId/images/:imageId`
- [ ] Products list: search, filters, sorting, pagination
- [ ] Check subcategory ↔ category match
- [ ] Return prices as numbers
- [ ] `prisma/seed.js` with themed demo data + `npm run db:seed`

## Phase 2 — Catalogue + admin CRUD

- [ ] Migration: Product `slug`, `sku`, `compareAtPrice`, `isFeatured`, `isActive`, `lowStockThreshold`
- [ ] Migration: Category `slug`, `imageUrl`, `sortOrder`, `isActive`
- [ ] Migration: ProductImage `altText`, `sortOrder`
- [ ] Slug generation utility (unique, made from the name)
- [ ] `GET /api/products/slug/:slug`, `?featured=true`, hide inactive products from public routes
- [ ] Image upload: `multer` + storage drivers (`local`, `cloudinary`), size/type limits
- [ ] Reorder and delete images
- [ ] Frontend: `AdminLayout`, `ProtectedRoute`, auto-logout on 401
- [ ] Frontend: `services/` split into `http.js` (fetch wrapper + token) and resource files
- [ ] Admin Products: list, create, edit, archive, featured and active toggles, image uploader
- [ ] Admin Categories: list, create, edit, delete, subcategories
- [ ] Toasts + confirmation dialogs

## Phase 3 — Themed storefront + cart

- [ ] Add theme tokens (colours, fonts) to Tailwind `@theme` in `index.css`
- [ ] Load fonts (see THEME-GUIDE)
- [ ] Shared UI components: Button, Card, Badge, PriceTag (LKR), Input, Select, Modal, Drawer, Skeleton, EmptyState
- [ ] `StoreLayout`: Header, Footer, AnnouncementBar, mobile menu
- [ ] Home: hero, featured row, category shopfronts, offers banner, new arrivals
- [ ] Shop page with URL-synced filters, sorting, pagination
- [ ] Product page: gallery, offer price, stock badge, quantity, add to cart, related products
- [ ] `CartContext` + `localStorage`, cart drawer, `/cart` page
- [ ] 404, About, Contact, Delivery & Returns pages
- [ ] Per-route `<title>` and meta tags
- [ ] Mobile responsiveness pass

## Phase 4 — COD checkout + tracking

- [ ] Migrations: `Customer`, `Order`, `OrderItem`, `OrderStatusHistory`, `DeliveryZone`, `StockMovement`
- [ ] Seed the 25 Sri Lankan districts into `DeliveryZone` with a default fee
- [ ] Phone normalisation utility (`07XXXXXXXX` → `947XXXXXXXX`)
- [ ] Order number generator (`DS-YYYY-NNNNNN`)
- [ ] `POST /api/orders`: server-side pricing, stock check and decrement inside a transaction, rate limit
- [ ] `GET /api/orders/track?orderNumber=&phone=`
- [ ] `GET /api/delivery-zones`
- [ ] Admin: list, detail, status change (with allowed-transition check), edit courier and tracking info
- [ ] Cancelling or returning an order restores stock
- [ ] Frontend: `/checkout` form + summary
- [ ] Frontend: `/order/success/:orderNumber`
- [ ] Frontend: `/track` with status timeline
- [ ] Admin Orders page + packing slip print view
- [ ] Dashboard: real order and customer counts

## Phase 5 — WhatsApp

- [ ] (Owner) Meta Business + WhatsApp Business number + submit message templates for approval
- [ ] `utils/whatsappLink.js` (frontend): build a `wa.me` link with a pre-filled order message
- [ ] "Confirm on WhatsApp" on the success page and `/track`
- [ ] "Order via WhatsApp" button on product pages + floating chat button
- [ ] Migration: `NotificationLog`
- [ ] `services/whatsapp.service.js` (Cloud API template sender)
- [ ] Send the new-order alert to the shop + "order received" message to the customer when an order is created (without blocking the order)
- [ ] Send a status update message to the customer when the status changes
- [ ] `GET/POST /api/whatsapp/webhook` (verify token + signature check)
- [ ] Admin: "Resend WhatsApp" + notification log on the order page

## Phase 6 — Admin operations + email

- [ ] `GET /api/admin/reports/summary`, `/sales?from=&to=`, `/top-products`
- [ ] Dashboard charts + low-stock widget + recent orders
- [ ] Inventory page: stock adjustments with a reason, movement history, CSV export
- [ ] Featured products manager (pick and order)
- [ ] `Promotion` model + home banners CRUD
- [ ] Category discount campaigns (start/end dates)
- [ ] `Coupon` model + CRUD + `POST /api/coupons/validate` + apply at checkout
- [ ] Customers page + customer order history
- [ ] `StoreSetting` model + Settings page (store info, WhatsApp, delivery fees, payment toggles)
- [ ] Admin users CRUD, change password, `STAFF` role permissions
- [ ] `services/email.service.js` (Resend/SMTP) + order confirmation, admin alert, status emails

## Phase 7 — PayHere

- [ ] `paymentMethod`, `paymentStatus`, `paymentReference` on `Order`
- [ ] `POST /api/payments/payhere/checkout` (server-side hash)
- [ ] `POST /api/payments/payhere/notify` (check `md5sig`, safe to receive twice)
- [ ] Release stock for unpaid orders after a timeout
- [ ] Payment option on the checkout page
- [ ] Sandbox end-to-end test

## Phase 8 — Launch

- [ ] API tests (orders, stock, auth, coupons)
- [ ] End-to-end checkout test
- [ ] Image optimisation + lazy loading + code-splitting for admin routes
- [ ] Accessibility + reduced-motion pass
- [ ] Sitemap, `robots.txt`, product JSON-LD
- [ ] Deployment config, HTTPS, domain, `prisma migrate deploy` during deploy
- [ ] Backups, uptime monitoring, Sentry
- [ ] Privacy / Terms / Returns pages
