# Diagon Store — Build Roadmap

This roadmap follows the client proposal, *Diagon Store — E-Commerce Website & Admin Panel Development Proposal*.

**How customers order:** customers browse, fill a cart, and send an **order/inquiry** through WhatsApp or email. Each order is saved with an order number such as `DS-2026-000123`. Payment is **cash on delivery**, and customers can **track** their order status on the website. Online payment is a future upgrade.

Phases are listed in build order, and each ends with a **Done when** check. The task checklist is in [TODO.md](TODO.md).

```
Phase 0  Foundation & repo hygiene                               ✅ done
Phase 1  Backend foundation & full data model                    ✅ done
Phase 2  Design system + animated landing page                   ✅ done
Phase 3  Shop, categories, product page, search, filters, cart   ✅ done
Phase 4  Order / inquiry flow: WhatsApp, email, tracking          ✅ done
Phase 5  Admin panel UI                                           ✅ done
Phase 6  Content pages, contact, SEO & performance               ✅ done
Phase 7  QA, security review & launch                             ◐ security, link previews, VPS deploy kit done
Future   Proposal §30 upgrades (payments, accounts, reviews, ...)
```

**Why this order**

- **Phase 1 builds the whole API and database first.** Every later phase is front-end work against a stable API.
- **Phase 2 (landing page) comes first on the front end.** It sets the look and the motion system that every other page reuses.
- **Phases 3 → 4 follow the customer journey:** browse, then cart, then send the order, then track it.
- **Phase 5 (admin UI) can run in parallel with Phases 3–4.** It only depends on Phase 1. Seed data stands in for real products until it's done.

---

## Proposal coverage

| Proposal section | Phase | Status |
|---|---|---|
| §3 Home page (hero, featured, new, popular, categories, banners, offers, WhatsApp button, footer) | API 1 · UI 2 | API ✅ |
| §3 Shop page (filters, sort, search, pagination) | API 1 · UI 3 | API ✅ |
| §3 Category pages | API 1 · UI 3 | API ✅ |
| §3 Product details (gallery, price/discount, specs, SKU, stock, related, qty, cart, WhatsApp, email, share) | API 1 · UI 3 | API ✅ |
| §4 Product fields: SKU, brand, short description, regular/sale price, discount, stock, specs, tags, featured, new arrival, status | 1 | ✅ |
| §4 Product status Active / Inactive / Out of Stock / Draft | 1 | ✅ |
| §5 Multiple product images + ordering | API 1 · UI 5 | ✅ |
| §6 Category & subcategory CRUD, image, description, active flag | API 1 · UI 5 | ✅ |
| §7 Search: name, code, brand, category, tags | 1 | ✅ |
| §8 Shopping cart | 3 | ✅ |
| §9 WhatsApp order message (single product and whole cart) | API 1 · UI 4 | ✅ |
| §10 Email inquiry to the business email | API 1 · UI 4 | ✅ |
| §11 Customer order form | API 1 · UI 4 | ✅ |
| §12 Admin order/inquiry management + statuses + internal notes | API 1 · UI 5 | ✅ |
| §13 Dashboard statistics | API 1 · UI 5 | ✅ |
| §14 Admin users, Super Admin / Admin roles | API 1 · UI 5 | ✅ |
| §15 Banner management | API 1 · UI 5 | ✅ |
| §16–18 Featured, new arrivals, sale price / discount % | 1 | ✅ |
| §19 Stock management | API 1 · UI 5 | ✅ |
| §20 Related products (same category / subcategory / hand-picked) | 1 | ✅ |
| §21–22 Responsive, mobile-friendly | 2–6 | ✅ |
| §23 SEO (URLs, titles, meta, alt text, sitemap) | slugs + meta fields 1 · rest 6 | ✅ |
| §24–25 Contact info, Google Map, social links, hours | settings 1 · UI 6 | ✅ |
| §26 Website content management (pages, banners, settings) | API 1 · UI 5 | ✅ |
| §27 Pages: About, Contact, Privacy, Terms, Delivery, Returns | API 1 · UI 6 | ✅ |
| §31 Security | 1 + 7 | ✅ (see SECURITY.md) |
| §32 Performance (optimised images, pagination, caching) | 1 + 6 | ✅ |
| Extra (not in proposal): COD order tracking page | API 1 · UI 4 | ✅ |
| §30 Future upgrades | Future | — |

---

## Phase 0 — Foundation ✅

Settings moved into environment variables, `.env.example` files, repo cleanup, README and docs.

## Phase 1 — Backend foundation & full data model ✅

- **Structure:** `routes → controllers → services`, plus `validators`, `middleware`, `utils` and `config`.
- **Request handling:** every request is validated with Zod, and errors come back in one format.
- **Security:**
  - `helmet` headers, CORS allow-list, 1 MB body limit
  - Rate limits on admin login, order placement and order tracking
  - Admin accounts are re-checked on every request (deactivating one takes effect immediately)
  - Super Admin / Admin roles
- **Data model:**
  - Full product fields, product status, product images, related products
  - Categories and subcategories with slugs, images and an active flag
  - Customers, orders (inquiries), order items and status history
  - Banners, settings and content pages
- **APIs:** the full public API and admin API. See [ARCHITECTURE.md](ARCHITECTURE.md#api).
- **Orders:**
  - Prices are recalculated on the server, and stock and availability are checked
  - A WhatsApp message and link are generated for each order
  - Emails go to the business and the customer (SMTP)
  - Order tracking needs the order number plus the phone number
- **Image uploads:** local disk, type and size checks, random file names.
- **Seed data:** 8 categories, 28 products, banners and policy pages.

**Done when:** ✅ all endpoints were tested against XAMPP MariaDB 10.4.

## Phase 2 — Design system + animated landing page ✅

**Goal:** a wizarding-themed design system and a landing page that sets the visual standard. See [THEME-GUIDE.md](THEME-GUIDE.md).

1. **Design tokens:** colours, fonts and spacing in Tailwind 4 `@theme`, with fonts loaded.
2. **Motion system:**
   - GSAP + ScrollTrigger for scroll-driven animation
   - Lenis for smooth scrolling
   - Motion for React for page transitions and small interactions
   - Everything respects `prefers-reduced-motion`
3. **Store layout:** announcement bar, sticky header with search, cart count and mobile menu; footer with contact details and social links from the settings API; floating WhatsApp button.
4. **Landing page** (`/`), driven by `GET /api/home`:
   - An animated hero
   - Category "shopfronts", featured products, new arrivals, offers and promo banners, popular products
   - Call-to-action sections

   Each section has a scroll-reveal animation, and products have hover effects.
5. **Animated route transitions**, plus loading skeletons and error states.

**Done when:** the home page shows live API data, scrolls smoothly at 60 fps on mid-range phones, works from 360 px to 1920 px, and turns its animations off when reduced motion is requested.

## Phase 3 — Shop, categories, product page, cart ✅

- `/shop`:
  - Filters for category, subcategory, price range, availability, featured / new / on sale
  - Sorting, search, "Load more" or pagination
  - All filters kept in the URL
- `/category/:slug`: category header (image and description) plus the same product grid.
- `/product/:slug`:
  - Image gallery with zoom and swipe
  - Regular and sale price with discount %, SKU, brand, stock status, specifications table
  - Quantity selector, Add to Cart, Order via WhatsApp (single product), Email inquiry
  - Share (Web Share API, with copy-link as a fallback), related products
- **Cart** (`CartContext` + `localStorage`):
  - Drawer and `/cart` page with increase / decrease / remove
  - Subtotal and estimated total
  - "Continue shopping" and "Proceed to order"
- **Search** in the header with instant suggestions.

**Done when:** a visitor can find any product by search or filters, view it, and build a cart that survives a page refresh.

## Phase 4 — Order / inquiry flow ✅

- `/checkout` (order form, proposal §11):
  - Full name, mobile, email, delivery address, city, notes
  - Choose how to send the order: **WhatsApp** or **Email**
- On submit, `POST /api/inquiries` saves the order, then:
  - **WhatsApp:** open the returned `whatsappUrl`, which already contains the message.
  - **Email:** the server emails the business and the customer.
- `/order/success/:number`: order number, summary, "Send on WhatsApp again" and "Track order" buttons.
- `/track`: order number + mobile → status timeline (New → Contacted → Confirmed → Processing → Completed, or Cancelled).
- Quick "Order via WhatsApp" from the product page, a single-product version of the same flow.

**Done when:** an order placed on the site appears in the admin API, opens in WhatsApp with the correct message (or arrives by email), and shows on `/track`.

## Phase 5 — Admin panel UI ✅

`AdminLayout` with a protected route (redirects to login on a 401). The panel is calm and functional, in the same palette as the shop.

- **Dashboard:** stat cards (proposal §13), recent orders, stock alerts.
- **Products:**
  - List with search and filters (status, stock, category)
  - Add / edit form with every proposal §4 field, a specifications editor and tag input
  - Drag-and-drop multi-image uploader with reordering and alt text
  - Related-products picker; featured, new-arrival and status toggles; publish
- **Stock:** quick stock edit and ± adjustment, low-stock and out-of-stock filters.
- **Categories and subcategories:** CRUD, image upload, active toggle, sort order.
- **Orders / inquiries:**
  - Tabs by status, detail drawer, status change with a note, internal notes
  - "Message customer on WhatsApp" button, delete
- **Customers:** list and order history.
- **Banners:** CRUD with image upload, placement, schedule (start and end dates), active toggle.
- **Settings:** business details, WhatsApp, email, address, map embed, hours, social links, announcement, SEO defaults.
- **Pages:** rich-text editor for About and the policy pages.
- **Admin users** (Super Admin only), and change my password.

**Done when:** the owner can complete the proposal §29 workflow (log in → add product → upload images → mark featured / new / sale → publish → it appears on the site) without a developer.

## Phase 6 — Content, contact, SEO & performance ✅

- Pages: About, Contact (form, map, hours, social links), Privacy, Terms, Delivery Information, Return / Refund (`/pages/:slug`).
- SEO:
  - Page titles and meta per route (product and category meta fields), Open Graph tags
  - `sitemap.xml` generated from the API, `robots.txt`
  - Product JSON-LD structured data
- Performance:
  - Responsive image sizes, lazy loading
  - Admin route code-splitting
  - API cache headers for public GETs

## Phase 7 — QA, security & launch

- API tests (Vitest + Supertest) for orders, auth and products. End-to-end test of the order flow (Playwright).
- Security review: run `npm audit`; check uploads, rate limits and admin-only routes.
- Accessibility pass (WCAG AA contrast, keyboard navigation, reduced motion).
- Deployment:
  - API on a Node host or VPS with MySQL, plus a persistent `uploads/` volume
  - Static frontend; HTTPS and a domain
  - `prisma migrate deploy` during deploy
- Daily database and uploads backups, uptime monitoring.
- ⚠️ Fix the lowercase `product` table name in migration `20260928153143` before deploying to Linux (see TODO known issues).

## Future (proposal §30)

Ordered roughly by value:

- WhatsApp Cloud API automation (automatic order and status messages)
- PayHere online payments
- Discount coupons
- Sales reports
- SMS notifications
- Customer accounts and order history
- Wishlist
- Reviews and ratings
- Automated invoices (PDF)
- Courier integration and delivery management
- Loyalty points
- Abandoned-cart reminders
- Advanced analytics
- Cloudinary image hosting
