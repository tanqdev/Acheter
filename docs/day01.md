# Day 1 — Project Setup, PostgreSQL & Seed Data

## What we were trying to do

Get the basic ecommerce project running end to end:

**React/Vite frontend → Express API → PostgreSQL (Neon)**

We also wanted the database schema and seed data ready so Day 2 could start directly with real products.

---

## 1. Created the project structure

Started with a root project and separated the frontend and backend:

```text
ecomm-app/
├── client/        # React + Vite + TypeScript
├── server/        # Express + TypeScript
├── db/            # SQL schema
└── scripts/       # seed script
```

### Why?

Keeping `client` and `server` separate makes the backend API boundary clear. It also fits the plan for eventually having a proper frontend talking to an Express API.

### Another way

We could have used Next.js for a full-stack app, but I haven't worked with Next.js yet. Since this sprint is mainly about rebuilding backend/full-stack fundamentals, Express was a better fit for now. Next.js can be learned separately later.

---

## 2. Set up the frontend and backend

The frontend was created with Vite using the React + TypeScript template.

The backend was initialized with Express and TypeScript, with these main packages:

```text
express
pg
dotenv
cors
typescript
tsx
```

We also added Tailwind to the frontend.

### Why TypeScript?

The original plan used JavaScript, but we decided to use TypeScript throughout the project so the project also gives practice with the stack we want to use for the later collaborative editor.

---

## 3. Made a basic Express server

Created a health endpoint:

```text
GET /api/health
```

which returns a small JSON response confirming that the API is running.

### Why?

Before connecting a database or building features, we wanted to know the server itself was working. It gives us a simple checkpoint for the backend.

---

## 4. Created the Neon PostgreSQL database

Instead of installing PostgreSQL locally, we used **Neon** from the beginning.

The connection string was stored in:

```text
server/.env
```

with values like:

```env
DATABASE_URL="..."
JWT_SECRET="..."
PORT=5000
```

and `.env` was added to `.gitignore`.

### Why Neon?

The database is hosted from day 1, so there is no local database → production database migration later.

### Another way

We could have installed PostgreSQL locally and switched to Neon later, but that would add an unnecessary migration/setup step.

---

## 5. Set up the PostgreSQL connection pool

Created a shared `pg` Pool in:

```text
server/src/db/pool.ts
```

The pool reads `DATABASE_URL` and is shared by the application.

We also tested it with:

```sql
SELECT NOW();
```

through the health route.

### Why a Pool?

We don't want to create a brand-new database connection for every request. A shared pool lets the app reuse database connections.

### Another way

We could manually create and manage individual PostgreSQL clients, but for a web API that would add connection-management code we don't need.

---

## 6. Hit a TypeScript issue and fixed it

VS Code complained that TypeScript didn't have declarations for `pg`.

Fixed it with:

```bash
npm install -D @types/pg
```

### Why?

`pg` is a JavaScript package, while TypeScript needs type declarations to understand its API properly.

---

## 7. Wrote the database schema by hand

Created:

```text
db/schema.sql
```

with these tables:

```text
users
products
cart_items
orders
order_items
```

We added things like:

- primary keys
- foreign keys
- `NOT NULL`
- unique constraints
- `CHECK` constraints

For products, stock was protected with:

```sql
CHECK (stock >= 0)
```

### Why raw SQL?

Raw PostgreSQL is one of the main learning goals of this sprint. We deliberately did **not** use Prisma, Drizzle, Sequelize, or another ORM.

### Why not a migration tool?

At this project size, a single handwritten `schema.sql` is enough. A migration system would be useful for a larger/longer-lived project, but it would add setup without helping the main goal of this sprint.

---

## 8. Applied the schema to Neon

Ran the SQL in Neon's SQL editor and confirmed the five tables existed.

So the app now had a real hosted database with the basic ecommerce structure.

---

## 9. Created the seed script

Created:

```text
scripts/seed.ts
```

It inserts **15 products** with different stock levels.

One special product has:

```text
stock = 1
```

We will use that later for the checkout concurrency test.

Ran it from the `server` directory with:

```bash
npx tsx ../scripts/seed.ts
```

and got:

```text
Seeded 15 products
```

### Why seed data?

It gives us realistic data to build Day 2's product browsing feature against instead of hardcoding products in React.

---

## Day 1 result

By the end of the day we had:

```text
React + Vite + TypeScript
        ↓
Express + TypeScript
        ↓
pg Pool
        ↓
Neon PostgreSQL
        ↓
5 tables + 15 products
```

The database connection works, the schema is applied, and the seed data is ready.

### Things to remember

- Keep secrets in `.env`, never in GitHub.
- Use a shared PostgreSQL pool instead of opening a connection per request.
- Keep SQL parameterized when we start writing queries.
- `price_cents` avoids dealing with floating-point money values.
- The `stock = 1` product is there specifically for the Day 6 race-condition test.

**Day 1 complete.**
