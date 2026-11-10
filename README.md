# 🪄 Diagon Store

**Diagon Store** is a single-shop e-commerce website styled like a wizarding high street — think a magical alley of shopfronts, parchment, candlelight and gold, built for one store.

Customers browse the catalogue, add items to their trunk (cart), place **Cash-on-Delivery** orders, get updates on **WhatsApp**, and **track their order** on the website. The shop owner runs everything from an **admin panel**: catalogue, inventory, featured products, offers, orders and sales.

> **Status:** early development. The catalogue API and admin login work today; ordering, WhatsApp, tracking and the themed storefront are being built. See [docs/ROADMAP.md](docs/ROADMAP.md) for the full plan.

---

## Features

| Feature | Status |
|---|---|
| Product / category / subcategory API with admin-only write access | ✅ Done |
| Admin login (JWT) | ✅ Done |
| Admin dashboard (counts only) | 🟡 Started |
| Storefront home page (static demo products) | 🟡 Started |
| Wizarding-themed storefront, shop, product page, cart | ⏳ Planned — Phase 3 |
| Cash-on-Delivery checkout + order tracking page | ⏳ Planned — Phase 4 |
| WhatsApp order alerts, status updates, "order via WhatsApp" | ⏳ Planned — Phase 5 |
| Admin: orders, inventory, featured products, offers, coupons, sales reports | ⏳ Planned — Phases 2 & 6 |
| Email notifications | ⏳ Planned — Phase 6 |
| PayHere online card payments | ⏳ Planned — Phase 7 |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS 4 |
| Backend | Node.js, Express 5 |
| Database | MySQL 8 / MariaDB 10.6+ via Prisma ORM 7 (MariaDB driver adapter) |
| Auth | JSON Web Tokens + bcrypt |
| Planned integrations | WhatsApp Cloud API, PayHere, Resend / SMTP, Cloudinary |
| Planned UI/animation | GSAP, Motion and component libraries (added later) |

---

## Project structure

```
diagon-store/
├── backend/            Express REST API
│   ├── middleware/     Auth guard
│   ├── routes/         API route handlers (admin, products, categories)
│   ├── prisma/         Database schema + migrations
│   ├── server.js       App entry point
│   └── .env.example    Backend environment template
├── frontend/           React storefront + admin panel (Vite)
│   ├── src/pages/      Page components
│   ├── src/services/   API client
│   └── .env.example    Frontend environment template
└── docs/               Roadmap, TODO, architecture, file guide, theme guide
```

A description of every file is in [docs/FILE-GUIDE.md](docs/FILE-GUIDE.md).

---

## Getting started

### Prerequisites

- **Node.js 20.19+** (22 LTS recommended) and npm
- **MySQL 8** or **MariaDB 10.6+** running locally
- Git

### 1. Clone

```bash
git clone https://github.com/Yasintha787/diagon-store.git
cd diagon-store
```

### 2. Create the database

```sql
CREATE DATABASE diagon_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Set up the backend

```bash
cd backend
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

Edit `backend/.env` and set at least:

- `DATABASE_URL` — e.g. `mysql://root:yourpassword@localhost:3306/diagon_store`
- `JWT_SECRET` — generate one with
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — your first admin login (password ≥ 10 characters)

Then create the tables, generate the Prisma client and add the admin:

```bash
npm run db:deploy        # apply migrations to the database
npm run db:generate      # generate the Prisma client
npm run db:test          # optional: check the database connection
npm run create-admin     # create the first admin from ADMIN_* in .env
npm run dev              # start the API on http://127.0.0.1:5000 (auto-restarts on changes)
```

### 4. Set up the frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npm run dev                 # http://localhost:5173
```

### 5. Open it

| URL | What |
|---|---|
| http://localhost:5173 | Storefront |
| http://localhost:5173/admin/login | Admin login (use `ADMIN_EMAIL` / `ADMIN_PASSWORD`) |
| http://127.0.0.1:5000 | API health check |

---

## Scripts

### Backend (`backend/`)

| Command | What it does |
|---|---|
| `npm run dev` | Start the API with auto-restart on file changes |
| `npm start` | Start the API (production) |
| `npm run db:migrate` | Create + apply a new migration after editing `schema.prisma` (development) |
| `npm run db:deploy` | Apply existing migrations (fresh setup / production) |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:studio` | Open Prisma Studio to browse the database |
| `npm run db:test` | Test the database connection |
| `npm run create-admin` | Create the first admin account |

### Frontend (`frontend/`)

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build into `frontend/dist` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint with oxlint |

---

## Environment variables

Templates with every key (database, JWT, WhatsApp Cloud API, PayHere, email, image storage) are committed:

- [backend/.env.example](backend/.env.example)
- [frontend/.env.example](frontend/.env.example)

Each key is tagged with the roadmap phase that needs it. **Never commit a real `.env` file.** Frontend variables (`VITE_*`) are visible in the browser, so secrets only ever go in the backend `.env`.

---

## API (current)

Base URL: `http://127.0.0.1:5000/api` — 🔒 = needs `Authorization: Bearer <admin token>`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/admin/login` | Admin login → returns JWT |
| GET | `/admin/profile` 🔒 | Current admin |
| GET | `/products` | List products (with category, subcategory, images) |
| POST | `/products` 🔒 | Create product |
| PUT | `/products/:id` 🔒 | Update product |
| DELETE | `/products/:id` 🔒 | Delete product |
| POST | `/products/:productId/images` 🔒 | Add image (by URL) |
| GET | `/categories` | List categories with subcategories |
| POST | `/categories` 🔒 | Create category |
| DELETE | `/categories/:id` 🔒 | Delete category |
| POST | `/categories/subcategories` 🔒 | Create subcategory |
| DELETE | `/categories/subcategories/:id` 🔒 | Delete subcategory |

Planned endpoints (orders, tracking, WhatsApp, coupons, reports…) are listed in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Documentation

| Doc | Purpose |
|---|---|
| [docs/ROADMAP.md](docs/ROADMAP.md) | Build phases in order, with "done when" criteria |
| [docs/TODO.md](docs/TODO.md) | Task checklist per phase + known issues |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Data model, API design, order flow, WhatsApp & payment design |
| [docs/FILE-GUIDE.md](docs/FILE-GUIDE.md) | What every file in the project does |
| [docs/THEME-GUIDE.md](docs/THEME-GUIDE.md) | Wizarding visual theme: colours, fonts, wording, motion |

---

## Contributing

1. Create a branch from `main` (`feature/<short-name>`).
2. Keep secrets out of commits — only `.env.example` files are tracked.
3. After changing `backend/prisma/schema.prisma`, run `npm run db:migrate` and commit the generated migration folder.
4. Tick off items in [docs/TODO.md](docs/TODO.md) as you finish them.
