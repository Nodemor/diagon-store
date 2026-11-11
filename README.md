# 🪄 Diagon Store

**Diagon Store** is a multi-category e-commerce website styled like a wizarding high street: one enchanted alley of shopfronts, parchment, candlelight and gold, built for a single store.

Customers browse electronics, fashion, beauty, home goods and more, then fill a cart and **send their order through WhatsApp or email**. Payment is **cash on delivery**, and customers **track the order** on the website using its order number. The shop team runs everything from a secure **admin panel**: products, images, prices, stock, categories, banners, featured products, offers, orders, customers, pages and settings.

> **Status:** Phases 1–6 are complete, and Phase 7 security hardening is done: hidden admin address, cookie sessions, account lockout, upload checks and automated security tests. Remaining Phase 7 work covers link previews, deployment and backups. See [docs/ROADMAP.md](docs/ROADMAP.md).

---

## Features

| Feature | API | UI |
|---|---|---|
| Products: SKU, brand, regular / sale price, discount %, stock, specifications, tags, multiple images, status (Active / Inactive / Out of stock / Draft) | ✅ | Phase 3 / 5 |
| Categories & subcategories with images and active flag | ✅ | Phase 3 / 5 |
| Search (name, code, brand, category, tags), filters, sorting, pagination | ✅ | Phase 3 |
| Featured, new arrivals, popular, on-sale sections; related products | ✅ | Phase 2 / 3 |
| Home page banners and promo banners (scheduled) | ✅ | Phase 2 / 5 |
| Cart → order form → WhatsApp message / email inquiry (COD) | ✅ | ✅ |
| Order tracking (order number + mobile) | ✅ | ✅ |
| Admin: dashboard, orders/inquiries with statuses & notes, customers, stock | ✅ | ✅ |
| Admin: banners, settings (contact, WhatsApp, social, hours, map), content pages | ✅ | ✅ |
| Admin users with Super Admin / Admin roles | ✅ | ✅ |
| Wizarding theme, smooth animations, responsive design | — | ✅ |
| Contact page (map, hours, social, message form → Admin → Messages) | ✅ | ✅ |
| SEO: page titles, descriptions, link previews, product structured data, sitemap.xml, robots.txt | ✅ | ✅ |
| Fast images: automatic resized WebP copies of uploaded photos | ✅ | ✅ |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS 4 (GSAP, Lenis and Motion from Phase 2) |
| Backend | Node.js 20+, Express 5, Zod, helmet, express-rate-limit, multer, nodemailer |
| Database | MySQL 8 / MariaDB 10.4+ (XAMPP) via Prisma ORM 7 |
| Auth | JWT + bcrypt, roles `SUPER_ADMIN` / `ADMIN` |

---

## Getting started (Windows + XAMPP)

### Prerequisites

- **Node.js 20.19+** (22 LTS recommended)
- **XAMPP** with MySQL/MariaDB, or MySQL 8
- Git

### 1. Start MySQL and create the database

Open the **XAMPP Control Panel** and start **MySQL**. Then open phpMyAdmin (http://localhost/phpmyadmin) and run:

```sql
CREATE DATABASE diagon_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
```

Edit `backend/.env`:

| Key | Value |
|---|---|
| `DATABASE_URL` | XAMPP default: `mysql://root:@localhost:3306/diagon_store` (root user, no password) |
| `JWT_SECRET` | 32+ random characters. Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |

```bash
npm run db:deploy       # create / update the tables
npm run db:generate     # generate the Prisma client
npm run db:seed         # optional: demo categories, products, banners, pages
npm run create-admin    # first admin (SUPER_ADMIN): asks for email, name and password (typing hidden)
npm run images:localize # optional: store the demo photos locally
npm run dev             # API on http://127.0.0.1:5000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev             # http://localhost:5173
```

| URL | What |
|---|---|
| http://localhost:5173 | Storefront |
| http://localhost:5173/admin | Back office in development (sign in with the admin from `npm run create-admin`). In production it moves to a secret address; see [docs/SECURITY.md](docs/SECURITY.md). |
| http://localhost:5173/api/health | API health check (Vite forwards `/api`, `/uploads`, `/sitemap.xml` and `/robots.txt` to the backend, so the shop and the API share one address) |

---

## Scripts

**Backend** (`backend/`)

| Command | What it does |
|---|---|
| `npm run dev` | API with auto-restart on changes |
| `npm start` | API (production) |
| `npm run db:migrate` | After editing `schema.prisma`: create + apply a migration (dev) |
| `npm run db:deploy` | Apply existing migrations (fresh setup / production) |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:seed` | Load demo data (safe to re-run) |
| `npm run db:studio` | Browse the database in Prisma Studio |
| `npm run db:test` | Check the database connection |
| `npm run create-admin` | Create a SUPER_ADMIN (asks for the details; password typing hidden) |
| `npm run create-admin -- --reset` | New password for an existing admin; also unlocks it and signs it out everywhere |
| `npm test` | Security tests against the database in `.env` (use a development database) |
| `npm run images:localize` | Copy external demo photos into `backend/uploads` so the shop doesn't depend on an image host (`-- --dry` to preview) |

**Frontend** (`frontend/`): `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`, and `npm run admin-path` (creates the secret back-office address and its hash).

---

## Going live

The shop and the API share **one address**. The web server serves the built shop and forwards `/api`, `/uploads`, `/sitemap.xml` and `/robots.txt` to the API, which only listens on `127.0.0.1`. That's required for the secure admin session cookie.

Before launch, work through the checklist and the full nginx example (HTTPS, security headers) in **[docs/SECURITY.md](docs/SECURITY.md)**. In short:

- `NODE_ENV=production`, a new `JWT_SECRET`, and a dedicated database user (not root)
- `CLIENT_URL` and `SITE_URL` set to the `https://` shop address
- `VITE_ADMIN_PATH_HASH` from `npm run admin-path`, then rebuild the frontend
- admins created with `npm run create-admin`, and daily backups of the database and `backend/uploads`

Uploaded photos are resized on request (`/uploads/...?w=400`) and cached in `backend/uploads/.cache`. Keep `backend/uploads` on persistent storage and include it in backups.

## Environment variables

- [backend/.env.example](backend/.env.example): database, session secret, store, SMTP email, uploads, rate limits and lockout, plus placeholders for future WhatsApp Cloud API, PayHere and Cloudinary keys. **No admin credentials:** admins are created at the terminal.
- [frontend/.env.example](frontend/.env.example): `VITE_API_URL` (`/api`), the development proxy target, and `VITE_ADMIN_PATH_HASH`.

Business details (phone, WhatsApp number, email, address, social links, hours) are **not** in `.env`. They are edited in **Admin → Settings** and stored in the database. Never commit a real `.env`.

---

## API

The full reference is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#api). In summary:

- **Public** `/api`: `home`, `products` (search, filters, sort, pages), `products/:slug`, `products/:slug/related`, `categories`, `banners`, `settings`, `pages/:slug`, `POST inquiries` (place an order), `inquiries/track`
- **Admin** `/api/admin` (session cookie + `X-Requested-With: DiagonStore` on changes): `login`, `logout`, `dashboard`, `products` (+ images, stock), `categories`, `subcategories`, `inquiries`, `customers`, `banners`, `uploads`, `settings`, `pages`, `admins`

---

## Documentation

| Doc | Purpose |
|---|---|
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phases in order, mapped to the client proposal |
| [docs/TODO.md](docs/TODO.md) | Checklist per phase + known issues |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Data model, API, order flow, security |
| [docs/FILE-GUIDE.md](docs/FILE-GUIDE.md) | What every file does |
| [docs/THEME-GUIDE.md](docs/THEME-GUIDE.md) | Wizarding theme, colours, fonts, motion |
| [docs/SECURITY.md](docs/SECURITY.md) | Protections, secret admin address, admin accounts, go-live checklist, nginx example |

---

## Contributing

1. Branch from `main` (`feature/<phase>-<name>`), then open a pull request into `main`.
2. Only `.env.example` files are tracked. Never commit secrets or `backend/uploads/`.
3. After changing `schema.prisma`, run `npm run db:migrate` and commit the new migration folder.
4. Update [docs/TODO.md](docs/TODO.md) and [docs/FILE-GUIDE.md](docs/FILE-GUIDE.md) in the same PR.
