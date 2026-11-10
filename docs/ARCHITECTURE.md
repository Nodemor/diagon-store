# Diagon Store — Architecture

This doc covers how the system fits together, what is stored in the database, and the full API.

---

## Overview

```
┌────────────────────────────┐   JSON over HTTPS   ┌────────────────────────────────────┐
│ Frontend (React 19 + Vite) │ ──────────────────▶ │ Backend API (Express 5)            │
│ • Storefront               │                     │ routes → controllers → services    │
│ • Admin panel              │ ◀────────────────── │ validators · middleware · utils    │
└─────────────┬──────────────┘                     └───────┬───────────────┬────────────┘
              │ wa.me link with the order message          │ Prisma 7       │ nodemailer
              ▼                                             ▼               ▼
       Customer's WhatsApp → Shop                  MySQL / MariaDB      SMTP (business +
                                                   (XAMPP locally)      customer emails)
```

- **Customers check out as guests.** The phone number identifies a customer (`Customer.phone` is unique and normalised to `94XXXXXXXXX`).
- **Orders are "inquiries" (proposal §9–§12).** An order is saved, then sent to the shop by WhatsApp (a pre-filled `wa.me` link) or email. Payment is cash on delivery, and the admin moves the order through its statuses.
- **Admins** log in with a JWT. Every admin request re-checks in the database that the admin exists and is active.

---

## Backend folder structure

```
backend/
├── server.js            Starts the HTTP server, handles shutdown
├── app.js               Express app: security middleware, /uploads, routes, error handling
├── prisma.js            Shared Prisma client (MariaDB adapter, reads DATABASE_URL)
├── config/env.js        Reads and checks every environment variable (single source)
├── routes/
│   ├── store.routes.js  Public API (/api/...)
│   └── admin.routes.js  Admin API (/api/admin/...)
├── controllers/         Read the validated request, call a service, send the response
│   ├── store.controller.js, inquiry.controller.js
│   └── admin/{auth,catalog,sales,content}.controller.js
├── services/            Business logic + database access
│   ├── product.service.js, category.service.js, inquiry.service.js
│   ├── dashboard.service.js, settings.service.js
│   └── email.service.js, storage.service.js
├── validators/          Zod schemas (common, product, category, inquiry, admin, content)
├── middleware/          auth, validate, errorHandler, rateLimiters, upload
├── utils/               httpError, slugify, phone, serialize, format, whatsapp
├── prisma/              schema.prisma, migrations/, seed.js
└── uploads/             Uploaded images (git-ignored), served at /uploads
```

Express 5 forwards errors from async handlers automatically, so controllers just `throw` (for example `throw notFound("Product")`). `middleware/errorHandler.js` turns every error into `{ message, errors? }`.

---

## Data model

```
Category 1─* Subcategory          Product *─* Product (hand-picked related products)
Category 1─* Product              Product 1─* ProductImage
Subcategory 1─* Product           Customer 1─* Inquiry 1─* InquiryItem *─1 Product (nullable)
                                  Inquiry 1─* InquiryStatusHistory *─1 Admin (nullable)
Banner · Setting (key/value) · Page · Admin
```

| Model | Purpose / key fields |
|---|---|
| `Product` | `name`, `slug` (unique, used in URLs), `sku`, `brand`, `shortDescription`, `description` (HTML), `price` (regular), `salePrice`, `stock`, `lowStockThreshold`, `status` (ACTIVE · INACTIVE · OUT_OF_STOCK · DRAFT), `specifications` (JSON `[{label,value}]`), `tags` (comma-separated), `isFeatured`, `isNewArrival`, `viewCount` (drives "popular"), `metaTitle`, `metaDescription` |
| `ProductImage` | `url`, `altText`, `sortOrder` (0 = main image) |
| `Category` | `name`, `slug`, `description`, `imageUrl`, `isActive`, `sortOrder`, SEO meta |
| `Subcategory` | `name`, `slug` (unique within its category), `isActive`, `sortOrder` |
| `Customer` | `name`, `phone` (unique), `email`, `address` — created or updated whenever an order is placed |
| `Inquiry` | An order. `inquiryNumber` (`DS-YYYY-NNNNNN`), a snapshot of the customer's details, `channel` (WHATSAPP · EMAIL · WEB), `status`, `itemCount`, `estimatedTotal`, `adminNotes` (internal) |
| `InquiryItem` | A snapshot of `productName`, `sku`, `unitPrice`, `quantity`, `lineTotal`. It survives product edits and deletion. |
| `InquiryStatusHistory` | Each status change, with an optional note and the admin who made it. Used for the tracking timeline. |
| `Banner` | `title`, `subtitle`, `imageUrl`, `buttonText`, `buttonLink`, `placement` (HERO · PROMO), `isActive`, `sortOrder`, `startsAt` / `endsAt` |
| `Setting` | Key/value store settings: business details, WhatsApp, email, social links, hours, map, announcement, SEO defaults. Allowed keys and defaults are in `services/settings.service.js`. **Settings are public — never store secrets here.** |
| `Page` | Editable content pages: `about`, `privacy-policy`, `terms`, `delivery-information`, `return-policy` |
| `Admin` | `role` (`SUPER_ADMIN` · `ADMIN`), `isActive`, `lastLoginAt` |

### What customers can see

The public API only returns products whose `status` is ACTIVE or OUT_OF_STOCK, and only if they have no category or their category is active. DRAFT and INACTIVE products are hidden. OUT_OF_STOCK products are shown but can't be ordered.

### Computed product fields (API only, `utils/serialize.js`)

`finalPrice`, `onSale`, `discountPercent`, `stockStatus` (IN_STOCK · LOW_STOCK · OUT_OF_STOCK), `inStock`, and `tags[]`.

### Order statuses (proposal §12)

```
NEW → CONTACTED → CONFIRMED → PROCESSING → COMPLETED
                          ↘ CANCELLED (from any status)
```

Admins can set any status. Every change is recorded in `InquiryStatusHistory`.

---

## API

Base URL: `http://127.0.0.1:5000/api`. 🔒 = `Authorization: Bearer <admin JWT>`. 👑 = SUPER_ADMIN only.

Errors look like `{ "message": "...", "errors": [{ "path": "price", "message": "..." }] }`.

### Public

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/home` | `{ heroBanners, promoBanners, featured, newArrivals, popular, onSale, categories }` |
| GET | `/products` | Query: `search`, `category` (slug), `subcategory` (slug), `brand`, `minPrice`, `maxPrice`, `availability` (`in_stock`/`out_of_stock`), `featured`, `newArrival`, `onSale`, `sort` (`newest`, `price_asc`, `price_desc`, `name_asc`, `popular`, `featured`), `page`, `limit` (≤ 60). Returns `{ items, total, page, limit, pages }`. |
| GET | `/products/:slug` | Detail (slug or id), all images. Counts a view. |
| GET | `/products/:slug/related` | Up to 8: hand-picked, then same subcategory, then same category, then featured |
| GET | `/categories` | Active categories + active subcategories with `productCount` |
| GET | `/categories/:slug` | One category |
| GET | `/banners?placement=HERO\|PROMO` | Active banners within their date range |
| GET | `/settings` | Store settings (public) |
| GET | `/pages/:slug` | A published content page |
| POST | `/inquiries` | Place an order. Body: `{ name, phone, email?, address, city?, notes?, channel: "WHATSAPP"\|"EMAIL", items: [{ productId, quantity }] }`. Returns `{ inquiryNumber, estimatedTotal, items, whatsappMessage, whatsappUrl, ... }`. Rate-limited. |
| GET | `/inquiries/track?number=&phone=` | Order status + timeline. The phone must match the order. Rate-limited. |

### Admin (`/api/admin`)

| Method | Endpoint | |
|---|---|---|
| POST | `/login` | `{ email, password }` → `{ token, admin }` (rate-limited) |
| GET | `/profile` · PUT `/profile/password` | 🔒 |
| GET | `/dashboard` | 🔒 product counts (total, active, out-of-stock, low-stock, draft), categories, customers, orders by status, recent orders, stock alerts |
| GET · POST | `/products` | 🔒 list (`search`, `status`, `categoryId`, `stock=low\|out`, `featured`, `newArrival`, `sort`, `page`) · create |
| GET · PUT · DELETE | `/products/:id` | 🔒 PUT accepts partial updates. `relatedProductIds` replaces the hand-picked list. |
| PATCH | `/products/:id/stock` | 🔒 `{ stock }` or `{ adjust: -2 }`, optional `status` |
| POST | `/products/:id/images` | 🔒 multipart `images` (≤ 10 files, ≤ `MAX_UPLOAD_SIZE_MB`) or JSON `{ url, altText }` |
| PUT | `/products/:id/images/order` | 🔒 `{ order: [imageId, ...] }` (the first becomes the main image) |
| PATCH · DELETE | `/products/:id/images/:imageId` | 🔒 alt text / delete (the file is removed from disk) |
| GET · POST | `/categories` | 🔒 all categories, including inactive |
| PUT · DELETE | `/categories/:id` | 🔒 delete removes its subcategories; its products become uncategorised |
| POST | `/categories/:id/subcategories` | 🔒 |
| PUT · DELETE | `/subcategories/:id` | 🔒 |
| GET | `/inquiries` | 🔒 `status`, `search` (number / name / phone / email), `from`, `to`, `page` |
| GET · DELETE | `/inquiries/:id` | 🔒 includes items, history, customer, `customerWhatsappUrl` |
| PATCH | `/inquiries/:id/status` | 🔒 `{ status, note? }` |
| PATCH | `/inquiries/:id/notes` | 🔒 `{ adminNotes }` |
| GET | `/customers` · `/customers/:id` | 🔒 |
| GET · POST | `/banners` · PUT · DELETE `/banners/:id` | 🔒 |
| POST | `/uploads/:folder` | 🔒 folder = `banners` / `categories` / `content`, multipart `image` → `{ url }` |
| GET · PUT | `/settings` | 🔒 PUT accepts any subset of the known keys; unknown keys are ignored |
| GET | `/pages` · GET · PUT · DELETE `/pages/:slug` | 🔒 PUT creates or updates |
| GET · POST | `/admins` · PUT · DELETE `/admins/:id` | 🔒👑 you can't delete, deactivate or demote yourself |

### Image URLs

Uploaded images are stored as paths such as `/uploads/products/<random>.jpg`. The frontend adds the API origin in front. External URLs (`https://...`) are stored and returned as-is.

---

## Order flow

```
Customer: cart → /checkout form → POST /api/inquiries
  server: validate → normalise phone → load products (visible only)
          → reject out-of-stock / qty > stock → price from DB (sale price if on sale)
          → transaction: upsert Customer, create Inquiry + items + history(NEW), set DS-YYYY-NNNNNN
          → build WhatsApp message + wa.me link (number from Settings)
          → send emails in the background (business + customer)
  ← 201 { inquiryNumber, whatsappUrl, ... }
Frontend: channel WHATSAPP → open whatsappUrl · EMAIL → show confirmation
Admin: sees the order (NEW) → contacts the customer → updates the status → customer sees it on /track
```

Order rules:

- **The server decides all prices.** Prices sent by the browser are ignored.
- **Email is sent in the background.** A failed email never fails an order.
- **Tracking needs the order number and the phone number together.** Both mismatch cases return the same 404, so order numbers can't be guessed.

---

## Security

| Area | Measure |
|---|---|
| Transport / headers | `helmet`; CORS limited to `CLIENT_URL`; JSON body ≤ 1 MB |
| Auth | bcrypt passwords; JWT (`JWT_EXPIRES_IN`); admin re-checked on every request; roles |
| Abuse | Rate limits on login (failures only), order placement, tracking; honeypot field on orders |
| Input | Zod on params, query and body; Prisma (parameterised queries) |
| Uploads | Allow-listed image types, size limit, random file names, path-traversal guard on delete |
| Data exposure | Tracking returns only the first name and order details; admin notes are never public |
