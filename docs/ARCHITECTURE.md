# Diagon Store — Architecture

How the system fits together today and where it is heading. Phase references point to [ROADMAP.md](ROADMAP.md).

---

## Overview

```
┌──────────────────────────┐        HTTPS / JSON        ┌───────────────────────────┐
│  Frontend (React + Vite) │  ───────────────────────▶  │  Backend API (Express 5)  │
│  • Storefront            │                            │  • routes → controllers   │
│  • Admin panel           │  ◀───────────────────────  │  • services (business)    │
└──────────┬───────────────┘                            │  • Prisma ORM             │
           │ wa.me links                                └──────┬──────────┬─────────┘
           ▼                                                   │          │
     WhatsApp (customer)                                       ▼          ▼
                                                        MySQL/MariaDB   External APIs
                                                                        • WhatsApp Cloud API
                                                                        • PayHere
                                                                        • Resend / SMTP
                                                                        • Cloudinary
```

- **One shop, one database.** Each piece of data has exactly one source.
- **Customers don't need accounts.** They check out as guests and are identified by phone number, which suits COD in Sri Lanka. Customer accounts can be added later without changing the order model.
- **Admins** log in with a JWT. Routes that change data are protected by `authMiddleware`.

---

## Target folder structure

Phase 1 moves the backend to this layout. The frontend gets the same treatment in Phases 2 and 3.

```
backend/
├── server.js                 Starts the HTTP server
├── app.js                    Builds the Express app (middleware + routes) — importable by tests
├── config/
│   └── env.js                Loads + validates environment variables
├── prisma.js                 Prisma client (singleton)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
├── middleware/
│   ├── authMiddleware.js     JWT guard
│   ├── requireRole.js        Role-based access (ADMIN / STAFF)
│   ├── validate.js           Zod request validation
│   ├── rateLimiters.js
│   ├── upload.js             multer config
│   └── errorHandler.js       Central error → JSON response
├── routes/                   URL → controller mapping only
├── controllers/              Read request, call service, send response
├── services/                 Business logic (orders, stock, pricing, whatsapp, email, payhere, storage)
├── validators/               Zod schemas
└── utils/                    asyncHandler, slugify, phone, orderNumber, money

frontend/src/
├── main.jsx / App.jsx        Bootstrap + routes
├── index.css                 Tailwind + theme tokens
├── services/                 http.js (fetch wrapper) + one file per resource
├── context/                  CartContext, AdminAuthContext
├── hooks/                    useProducts, useDebounce, ...
├── components/
│   ├── ui/                   Button, Card, Badge, Modal, ... (themed primitives)
│   ├── store/                Header, Footer, ProductCard, CartDrawer, ...
│   └── admin/                AdminLayout, DataTable, ImageUploader, ...
├── pages/
│   ├── store/                Home, Shop, Product, Cart, Checkout, OrderSuccess, Track, NotFound
│   └── admin/                Login, Dashboard, Products, Categories, Orders, Inventory, Offers, Coupons, Customers, Settings
├── utils/                    formatPrice, whatsappLink, ...
└── assets/
```

---

## Data model

### Current (✅ migrated)

| Model | Key fields |
|---|---|
| `Product` | name, description, price `Decimal(10,2)`, stock, categoryId?, subcategoryId? |
| `Category` | name (unique), description |
| `Subcategory` | name, categoryId (unique per category) |
| `ProductImage` | url, productId |
| `Admin` | name, email (unique), password (bcrypt), role |

### Planned additions

```prisma
// Phase 2 — catalogue
model Product {
  // + existing fields
  slug              String   @unique
  sku               String?  @unique
  compareAtPrice    Decimal? @db.Decimal(10, 2)   // "was" price → shows as an offer
  isFeatured        Boolean  @default(false)
  featuredOrder     Int      @default(0)
  isActive          Boolean  @default(true)       // archive instead of delete
  lowStockThreshold Int      @default(5)
}
// Category: + slug @unique, imageUrl, sortOrder, isActive
// ProductImage: + altText, sortOrder

// Phase 4 — orders
model Customer {
  id        Int      @id @default(autoincrement())
  name      String
  phone     String   @unique          // normalised 94XXXXXXXXX
  email     String?
  orders    Order[]
  createdAt DateTime @default(now())
}

model Order {
  id              Int           @id @default(autoincrement())
  orderNumber     String        @unique            // DS-2026-000123
  customerId      Int
  status          OrderStatus   @default(PENDING)
  paymentMethod   PaymentMethod @default(COD)
  paymentStatus   PaymentStatus @default(UNPAID)
  paymentRef      String?                          // PayHere payment_id (Phase 7)
  source          OrderSource   @default(WEB)
  subtotal        Decimal       @db.Decimal(10, 2)
  discount        Decimal       @db.Decimal(10, 2) @default(0)
  deliveryFee     Decimal       @db.Decimal(10, 2)
  total           Decimal       @db.Decimal(10, 2)
  couponCode      String?
  // delivery snapshot (kept even if the customer later changes details)
  shipName        String
  shipPhone       String
  shipAddress1    String
  shipAddress2    String?
  shipCity        String
  shipDistrict    String
  customerNote    String?       @db.Text
  adminNote       String?       @db.Text
  courierName     String?
  trackingNumber  String?
  items           OrderItem[]
  history         OrderStatusHistory[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model OrderItem {               // snapshot — survives product edits/archiving
  id          Int      @id @default(autoincrement())
  orderId     Int
  productId   Int?               // SetNull on product delete
  productName String
  sku         String?
  unitPrice   Decimal  @db.Decimal(10, 2)
  quantity    Int
  lineTotal   Decimal  @db.Decimal(10, 2)
}

model OrderStatusHistory { id, orderId, status, note?, adminId?, createdAt }
model DeliveryZone       { id, district @unique, fee Decimal, isActive }
model StockMovement      { id, productId, change Int, reason (ORDER|CANCEL|RESTOCK|ADJUSTMENT|RETURN), orderId?, adminId?, note?, createdAt }

enum OrderStatus   { PENDING CONFIRMED PROCESSING SHIPPED OUT_FOR_DELIVERY DELIVERED CANCELLED RETURNED }
enum PaymentMethod { COD PAYHERE }
enum PaymentStatus { UNPAID PENDING PAID FAILED REFUNDED }
enum OrderSource   { WEB WHATSAPP ADMIN }

// Phase 5
model NotificationLog { id, orderId?, channel (WHATSAPP|EMAIL), recipient, template, status (SENT|FAILED|DELIVERED|READ), providerId?, error?, createdAt }

// Phase 6
model Coupon     { id, code @unique, type (PERCENT|FIXED), value, minOrderAmount?, maxUses?, usedCount, startsAt?, endsAt?, isActive }
model Promotion  { id, title, subtitle?, imageUrl, linkUrl?, categoryId?, discountPercent?, startsAt?, endsAt?, sortOrder, isActive }
model StoreSetting { key String @id, value String @db.Text }
```

### Order status flow

```
PENDING ──▶ CONFIRMED ──▶ PROCESSING ──▶ SHIPPED ──▶ OUT_FOR_DELIVERY ──▶ DELIVERED
   │            │              │                                              │
   └────────────┴──────────────┴──▶ CANCELLED  (stock restored)               └──▶ RETURNED (stock restored)
```

The allowed status changes are defined in one map in `services/order.service.js`. Each change writes an `OrderStatusHistory` row and triggers notifications.

---

## API

`🔒` means an admin JWT is required. All responses are JSON, and errors look like `{ "message": "...", "errors": [...] }`.

### Current

| Method | Endpoint | |
|---|---|---|
| POST | `/api/admin/login` | |
| GET | `/api/admin/profile` | 🔒 |
| GET | `/api/products` | |
| POST · PUT · DELETE | `/api/products[/:id]` | 🔒 |
| POST | `/api/products/:productId/images` | 🔒 |
| GET | `/api/categories` | |
| POST · DELETE | `/api/categories[/:id]` | 🔒 |
| POST · DELETE | `/api/categories/subcategories[/:id]` | 🔒 |

### Planned

| Phase | Method | Endpoint | |
|---|---|---|---|
| 1 | GET | `/api/products/:id` | |
| 1 | GET | `/api/products?search&category&subcategory&minPrice&maxPrice&sort&page&limit` | |
| 1 | PUT | `/api/categories/:id`, `/api/categories/subcategories/:id` | 🔒 |
| 2 | GET | `/api/products/slug/:slug`, `/api/products?featured=true` | |
| 2 | POST | `/api/products/:id/images/upload` (multipart) | 🔒 |
| 2 | PATCH · DELETE | `/api/products/:id/images/:imageId` | 🔒 |
| 2 | GET | `/api/admin/products` (includes inactive) | 🔒 |
| 4 | GET | `/api/delivery-zones` | |
| 4 | POST | `/api/orders` (rate-limited) | |
| 4 | GET | `/api/orders/track?orderNumber&phone` | |
| 4 | GET | `/api/admin/orders`, `/api/admin/orders/:id` | 🔒 |
| 4 | PATCH | `/api/admin/orders/:id/status`, `/api/admin/orders/:id` | 🔒 |
| 5 | GET · POST | `/api/whatsapp/webhook` | Meta signature |
| 5 | POST | `/api/admin/orders/:id/notify` (resend) | 🔒 |
| 6 | GET | `/api/admin/reports/summary`, `/sales`, `/top-products` | 🔒 |
| 6 | GET · POST | `/api/admin/inventory`, `/api/admin/inventory/adjust` | 🔒 |
| 6 | CRUD | `/api/admin/coupons`, `/api/admin/promotions`, `/api/admin/users` | 🔒 |
| 6 | POST | `/api/coupons/validate` | |
| 6 | GET | `/api/promotions` (active banners) | |
| 6 | GET · PUT | `/api/admin/settings` | 🔒 |
| 6 | GET | `/api/admin/customers`, `/api/admin/customers/:id` | 🔒 |
| 7 | POST | `/api/payments/payhere/checkout` | |
| 7 | POST | `/api/payments/payhere/notify` | PayHere md5sig |

---

## COD order placement (Phase 4)

```
Customer                 Frontend                    API (order.service)                         DB
   │  fill checkout  ───▶  POST /api/orders  ───────▶  validate body (zod)
   │                       { items:[{productId,qty}],  normalise phone
   │                         customer, address,        load products (active only)
   │                         district, couponCode? }   price = DB price (ignore client price)
   │                                                   fee = DeliveryZone[district]
   │                                                   apply coupon (server-side)
   │                                                   ┌─ $transaction ──────────────────────┐
   │                                                   │ for each item: UPDATE stock          │
   │                                                   │   WHERE id=? AND stock >= qty        │──▶ fails → 409 "out of stock"
   │                                                   │ upsert Customer by phone             │
   │                                                   │ create Order + OrderItems            │
   │                                                   │ create StatusHistory + StockMovement │
   │                                                   └──────────────────────────────────────┘
   │                                                   fire-and-forget: WhatsApp + email
   │  ◀── /order/success/DS-2026-000123  ◀──── 201 { orderNumber, total }
```

Key rules:

- **The server decides all prices.** Prices sent by the client are never trusted.
- **Stock is decremented with a conditional update** (`stock >= qty`) inside the transaction, so two people can't buy the last item at the same time.
- **Notifications run after the transaction commits** and never roll back an order.

---

## WhatsApp integration

### Layer 1: click-to-chat (Phase 5, no approval needed)

The frontend builds `https://wa.me/<VITE_STORE_WHATSAPP_NUMBER>?text=<encoded message>`:

```
🦉 Order DS-2026-000123
Name: Kasun Perera
• Nimbus Broom Polish ×1 — Rs 2,500
• Wand Holster ×2 — Rs 3,000
Delivery: Colombo — Rs 400
Total (COD): Rs 5,900
Please confirm my order.
```

It's used on the order-success page, the tracking page, a product-page "Order via WhatsApp" button and a floating chat button.

### Layer 2: WhatsApp Cloud API (Phase 5, automatic messages)

| Event | Recipient | Template (env) |
|---|---|---|
| Order created | Shop (`SHOP_WHATSAPP_NUMBER`) | `WHATSAPP_TEMPLATE_NEW_ORDER` |
| Order created | Customer | order received / confirmation |
| Status changed | Customer | `WHATSAPP_TEMPLATE_ORDER_STATUS` |

- Endpoint: `POST https://graph.facebook.com/{WHATSAPP_API_VERSION}/{WHATSAPP_PHONE_NUMBER_ID}/messages`, authenticated with `Bearer WHATSAPP_ACCESS_TOKEN`.
- Messages the business starts **must use pre-approved templates**. Free-form text is only allowed within 24 hours of the customer's last message.
- `WHATSAPP_ENABLED=false` turns sending off: messages are logged but not sent, which is useful in development.
- Webhook: `GET` answers the `hub.verify_token` challenge. `POST` checks `X-Hub-Signature-256` against `WHATSAPP_APP_SECRET`, then records delivery and read statuses in `NotificationLog`.
- If the shop prefers it, Twilio's WhatsApp API is an alternative. Keep the provider behind `whatsapp.service.js` so it can be swapped.

---

## PayHere (Phase 7)

1. The checkout page asks the API for PayHere form fields. The API computes
   `hash = UPPER(MD5(merchant_id + order_id + amount(2dp) + currency + UPPER(MD5(merchant_secret))))`.
2. The browser posts the form to PayHere (sandbox or live, set by `PAYHERE_SANDBOX`).
3. PayHere calls `PAYHERE_NOTIFY_URL`. The API checks `md5sig` and, when `status_code = 2`, marks the order `PAID` and confirms it.
4. `return_url` only displays a result. **Only the notify call** changes payment status.

---

## Security checklist

- Secrets are kept only in `backend/.env`. `VITE_*` variables are public.
- CORS is restricted to `CLIENT_URL`; `helmet` sets secure headers; requests have a body size limit.
- Rate limits on admin login and order placement.
- Zod validation on every write endpoint.
- Passwords are hashed with bcrypt and JWTs expire. Optionally move the admin token to an httpOnly cookie.
- Order tracking needs both the order number and the phone number.
- File uploads: allow-listed image types, a size limit and random filenames.
- Webhooks: verify signatures (Meta) and hashes (PayHere).
