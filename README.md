# Sales CRM — Project Scaffold

Monorepo with two folders: `backend` (Node/Express + Prisma + PostgreSQL)
and `frontend` (React + Vite + Tailwind).

## 1. Prerequisites

- Node.js 18+ installed
- A PostgreSQL database (local install, or a free one from Railway/Supabase/Neon)

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL` to your real Postgres connection string
- `JWT_SECRET` to any long random string

Then create the database tables from the schema:

```bash
npx prisma migrate dev --name init
```

Start the API:

```bash
npm run dev
```

The API runs on http://localhost:4000. Check it's alive:
`GET http://localhost:4000/api/health` should return `{ "status": "ok" }`.

### Create your first users

Since there's no UI for it yet, use `curl` or Postman/Insomnia:

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@test.com","password":"password123","role":"ADMIN"}'

curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Sami","email":"sami@test.com","password":"password123","role":"COMMERCIAL"}'
```

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app runs on http://localhost:5173 and proxies `/api` calls to the
backend on port 4000 (already configured in `vite.config.js`).

Log in at `/login` with the accounts you created above. Admins land on
`/admin`, commercials land on `/dashboard`.

## 4. What's already built

- Full Prisma schema matching the ERD (Users, Clients, Visits, Orders,
  OrderItems, Objectives) with a single `role` field on `User`
  (`ADMIN` / `COMMERCIAL`) — see earlier discussion on why it's one table.
- JWT authentication (register/login) with `requireAuth` and `requireRole`
  middleware.
- Role-scoped CRUD routes: a commercial only ever sees their own clients,
  visits, orders, and objectives; an admin sees everything.
- Order totals are always calculated server-side from line items — never
  trust a client-sent total.
- React app skeleton with routing, a login page wired to the API, and a
  protected-route wrapper for role-based page access.
- Monochrome Tailwind theme (`ink`, `charcoal`, `grey` shades) matching the
  black/white/grey palette from the design brief.

## 5. What you still need to build

Following the MVP order from the cahier des charges:

1. Client list/detail/create/edit screens (frontend) — the `clients`
   API is ready.
2. Visit logging form + list (frontend) — the `visits` API is ready.
3. Order creation form with line items + auto total (frontend) — the
   `orders` API already calculates totals server-side.
4. Objectives screens: rep's own progress view, and admin's target-setting
   view — the `objectives` API is ready.
5. Admin dashboard: KPI cards, per-rep performance table, filters by rep
   and period, "clients to follow up" list.
6. Excel/CSV export buttons on the key list views (consider the `xlsx` or
   `papaparse` npm packages for this).
7. Polish: loading states, form validation messages, mobile responsiveness.

## 6. Deployment (when ready)

- Frontend → Vercel (connect the `frontend` folder as the project root)
- Backend + Postgres → Railway or Render (set the same env vars as `.env`)
