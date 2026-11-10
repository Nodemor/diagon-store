# Diagon Store — Build Roadmap

The phases below are in the order they should be built. Each phase depends on the ones before it, and each ends with a **Done when** check so you know when to move on. The task-by-task checklist is in [TODO.md](TODO.md).

```
Phase 0  Foundation & repo hygiene          ✅ done
Phase 1  Backend hardening & structure      ← start here
Phase 2  Catalogue upgrade + admin catalogue CRUD
Phase 3  Wizarding-themed storefront + cart
Phase 4  Cash-on-Delivery checkout + order tracking
Phase 5  WhatsApp integration
Phase 6  Admin operations: inventory, offers, coupons, sales, email
Phase 7  PayHere online payments
Phase 8  Polish, testing & deployment
```

Why this order:

- **The backend comes before the UI.** The storefront and admin pages need a stable API to call.
- **Catalogue → storefront → orders.** You can't check out without a cart, and the cart needs real products.
- **COD before WhatsApp.** WhatsApp messages are triggered by order events, so orders have to exist first.
- **PayHere comes late.** COD is the main payment method. PayHere is added on top of the order model without changing it.
- **Animations (GSAP / Motion) can go in from Phase 3 onwards.** Build the layouts so they can be animated later, and keep motion separate from data logic.

---

## Phase 0 — Foundation & repo hygiene ✅

**Goal:** a clean repo that any developer can clone and run.

- Settings moved out of the code and into environment variables (`DATABASE_URL`, `PORT`, `HOST`, `CLIENT_URL`, `JWT_SECRET`, `VITE_API_URL`)
- `.env.example` files for the backend and frontend
- AI-tool and template leftovers removed, one root `.gitignore`
- README and the `docs/` folder

**Done when:** a new developer can follow the README and reach the admin dashboard.

---

## Phase 1 — Backend hardening & structure

**Goal:** a secure, consistent API that is ready to grow.

1. **Restructure** into `routes/ → controllers/ → services/`, with `validators/`, `utils/` and `config/` folders (see the target layout in [ARCHITECTURE.md](ARCHITECTURE.md#target-folder-structure)).
2. **Central error handler and `asyncHandler`.** Every error comes back as `{ message, errors? }` with the correct status code. Prisma error codes are mapped to statuses: `P2002` → 409 (duplicate), `P2025` → 404 (not found), `P2003` → 400 (bad reference).
3. **Request validation** with Zod on every write endpoint.
4. **Security:** `helmet`, `express-rate-limit` on `/admin/login` (and later on order placement), a request body size limit, and CORS restricted to `CLIENT_URL` (already done).
5. **Missing endpoints:** `GET /products/:id`, `PUT /categories/:id`, `PUT /categories/subcategories/:id`, `DELETE /products/:productId/images/:imageId`.
6. **Products list query params:** `?search=&category=&subcategory=&minPrice=&maxPrice=&sort=&page=&limit=`. The response includes `{ items, total, page, pages }`.
7. **Check that a subcategory belongs to the chosen category** when creating or updating a product.
8. **Return `Decimal` prices as numbers** in API responses.
9. **Seed script** (`prisma/seed.js`) with themed demo categories and products.
10. **Request logging** with `morgan` in development.

**Done when:** every endpoint returns consistent errors, invalid input gets a 400 response, login is rate-limited, and the seed fills the database with themed demo data.

---

## Phase 2 — Catalogue upgrade + admin catalogue CRUD

**Goal:** the owner can fully manage the catalogue from the admin panel.

**Schema changes:**

- `Product`: add `slug`, `sku`, `compareAtPrice` (the "was" price, used for sale offers), `isFeatured`, `isActive`, `lowStockThreshold`
- `Category`: add `slug`, `imageUrl`, `sortOrder`, `isActive`
- `ProductImage`: add `altText`, `sortOrder`

**Backend:**

- Public endpoints only return active products. Add a `?featured=true` filter and a `GET /products/slug/:slug` endpoint.
- **Image uploads** with `multer`. Files are stored either locally (`uploads/`) or on Cloudinary, chosen by `STORAGE_DRIVER`. Reorder and delete images.
- Archive products (`isActive=false`) instead of hard-deleting them once they appear in orders.

**Frontend (admin):**

- An `AdminLayout` with a working sidebar, wrapped in `ProtectedRoute`. On a 401 response it clears the token and redirects to the login page.
- **Products:** table with search and filters, create/edit form with a drag-to-reorder image uploader, and toggles for featured and active.
- **Categories and subcategories:** list, create, edit, delete and reorder.
- Toast notifications and confirmation dialogs.

**Done when:** the owner can create a product with photos, mark it as featured or on sale, edit it, and archive it, all without touching the database.

---

## Phase 3 — Wizarding-themed storefront + cart

**Goal:** the customer-facing shop, fully themed and connected to the API. See [THEME-GUIDE.md](THEME-GUIDE.md).

1. **Design system:** colour and font tokens in Tailwind 4 `@theme`, fonts, and shared components (`Button`, `Card`, `Badge`, `PriceTag`, `Input`, `Modal`, `Skeleton`, `EmptyState`).
2. **Layout:** themed `Header` (logo, navigation, search, cart icon with a count), `Footer`, and an announcement bar.
3. **Home:** hero, featured products (from the API), category "shopfronts", offers banner and a "new arrivals" row.
4. **Shop page** (`/shop`, `/shop/:categorySlug`): filters, sorting, search and pagination, all kept in the URL query string.
5. **Product page** (`/product/:slug`): gallery, price and offer price, stock status, quantity selector, add to cart, related products.
6. **Cart** (`CartContext` saved to `localStorage`): a slide-out drawer and a `/cart` page. Quantities are checked against stock.
7. **Pages:** 404 ("You seem to have Apparated to the wrong place"), About, Contact, Delivery and Returns policy.
8. **SEO basics:** page titles and meta tags for each route, Open Graph image.
9. **Ready for animation:** components accept a `className` and `ref`, and `prefers-reduced-motion` is respected.

**Done when:** a visitor can browse real products, filter and search, open a product and build a cart that survives a page refresh, on both mobile and desktop.

---

## Phase 4 — Cash-on-Delivery checkout + order tracking

**Goal:** customers can place COD orders and track them, and the admin can process them.

**Schema:** `Customer`, `Order`, `OrderItem`, `OrderStatusHistory`, `DeliveryZone`, `StockMovement`. Details are in [ARCHITECTURE.md](ARCHITECTURE.md#data-model).

**Backend:**

- `POST /orders` (public, rate-limited):
  - Validates the cart.
  - **Recalculates all prices on the server** and ignores any prices sent by the client.
  - Adds the delivery fee for the customer's district.
  - In **one transaction**: checks stock, decrements it, creates the order and its items, and writes the status history and stock movements.
  - Returns an order number (e.g. `DS-2026-000123`).
- `GET /orders/track?orderNumber=&phone=`: public tracking. Both values must match, so nobody can look up other people's orders.
- Admin: `GET /admin/orders` (filter by status, date and search), `GET /admin/orders/:id`, `PATCH /admin/orders/:id/status` (checks that the status change is allowed and records who made it), and `PATCH /admin/orders/:id` (courier name, tracking number, notes).
- Cancelling an order **puts the stock back**.
- Sri Lankan phone numbers are normalised to `94XXXXXXXXX`.

**Frontend:**

- `/checkout`: customer details, delivery address, district drop-down (fee updates as you choose), order summary, "Pay on delivery" label.
- `/order/success/:orderNumber`: confirmation page with a "Send to us on WhatsApp" button (wired up in Phase 5).
- `/track`: enter the order number and phone to see a status timeline.
- Admin **Orders** page: list, detail drawer, status buttons, print/packing slip.

**Done when:** a customer can place a COD order, stock goes down, the admin sees the order and moves it through each status, and the customer sees every change on `/track`.

---

## Phase 5 — WhatsApp integration

**Goal:** the shop and the customers are notified on WhatsApp, and customers can order through WhatsApp.

Done in two layers (design in [ARCHITECTURE.md](ARCHITECTURE.md#whatsapp-integration)):

1. **Click-to-chat (free, no Meta approval needed):**
   - A "Confirm / ask about this order on WhatsApp" button on the success page and on `/track`. It opens `wa.me/<shop>` with a pre-filled message containing the order number and items.
   - An "Order this item via WhatsApp" button on product pages.
   - A floating WhatsApp chat button.
2. **WhatsApp Cloud API (automatic messages):**
   - `services/whatsapp.service.js` sends approved template messages.
   - Each new order triggers an alert to the shop number and an "order received" message to the customer.
   - Each status change triggers an `order_status_update` message to the customer.
   - Messages are sent **without blocking**: a WhatsApp failure never fails an order. Every attempt is logged in `NotificationLog`.
   - Webhook `GET/POST /api/whatsapp/webhook` handles verification, delivery status and incoming messages (optional: reply with the order status when a customer sends their order number).
   - Admin: "Resend WhatsApp" button on an order, and an on/off switch in Settings.

**Prerequisites (owner's side):** a Meta Business account, a verified business, a WhatsApp Business phone number and an approved message template. Start this paperwork **during Phase 3**, because approval takes time.

**Done when:** placing an order sends a WhatsApp alert to the shop and a confirmation to the customer, and changing the status in the admin panel sends the customer an update.

---

## Phase 6 — Admin operations, offers & email

**Goal:** the owner can run the business day to day from the admin panel.

- **Dashboard:**
  - Revenue (today, week and month), orders by status, average order value
  - Sales chart, top products, low-stock list, recent orders
- **Inventory:**
  - Stock list with low-stock alerts
  - Manual stock adjustments with a reason (`StockMovement` log)
  - CSV export
- **Featured products:** pick and order the featured products shown on the home page.
- **Offers:**
  - Per-product sale price (`compareAtPrice`)
  - Category-wide % discount campaigns with start and end dates
  - Home page promo banners (`Promotion` model)
- **Coupons:**
  - % or fixed amount, minimum order, usage limit, date range
  - Applied at checkout and validated on the server
- **Customers:** list built from orders (phone is the key), order history and lifetime value for each customer.
- **Settings:**
  - Store info, WhatsApp number, delivery fee per district, free-delivery threshold
  - Turn COD and PayHere on or off
- **Admin users:** add or remove admins, change password, roles (`ADMIN`, `STAFF`).
- **Email (Resend or SMTP):** order confirmation to the customer (if they gave an email), new-order email to the owner, status-change emails.

**Done when:** the owner can answer "what sold, what's running low, what's pending" from the dashboard, and run a coupon or sale without help from a developer.

---

## Phase 7 — PayHere online payments

**Goal:** card and online payment as an alternative to COD.

- `paymentMethod: PAYHERE` on `Order`. The order is created as `PENDING_PAYMENT`.
- `POST /payments/payhere/checkout` builds the payment form fields and the **MD5 hash on the server** (the merchant secret never reaches the browser).
- `POST /payments/payhere/notify`:
  - Checks `md5sig`.
  - Updates `paymentStatus`.
  - Confirms the order and sends notifications.
  - Can safely receive the same notification more than once.
- If payment fails or is cancelled, the stock is released after a timeout.
- Admin: payment status and PayHere payment ID shown on each order.
- Test against the PayHere sandbox. The notify URL must be publicly reachable (ngrok or cloudflared in development).

**Done when:** a sandbox card payment marks the order as paid automatically, and a failed payment doesn't keep the stock reserved.

---

## Phase 8 — Polish, testing & deployment

- **Testing:** API tests (Vitest/Jest + Supertest) for orders, stock and auth. End-to-end checkout test (Playwright).
- **Performance:** image optimisation (Cloudinary transforms or `sharp`), lazy loading, code-splitting for admin routes.
- **Accessibility pass:** keyboard navigation, colour contrast on parchment backgrounds, reduced-motion support.
- **SEO:** sitemap, `robots.txt`, product structured data (JSON-LD).
- **Deployment:**
  - The API runs on a Node host (Render, Railway or a VPS) with managed MySQL; the frontend runs on Netlify, Vercel or Render static hosting.
  - `prisma migrate deploy` runs during deploy.
  - HTTPS and a custom domain.
- **Operations:** daily database backups, uptime monitoring, error tracking (Sentry).
- **Legal pages:** privacy policy, terms, returns policy.

**Done when:** the site runs in production on its domain, with backups and monitoring in place.
