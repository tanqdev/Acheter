# Acheter Hub

A full-stack e-commerce application built with **React, TypeScript, Express, and PostgreSQL**. Acheter Hub supports product browsing, session-based authentication, persistent shopping carts, transactional checkout, inventory protection, and order history.

**Live application:** https://acheterhub.vercel.app/  
**Backend API:** https://acheter-server.onrender.com  
**Health check:** https://acheter-server.onrender.com/api/health

---

## Features

- **Product browsing** — Browse products and view individual product details backed by PostgreSQL.
- **Session-based authentication** — Email/password authentication with Argon2id password hashing and PostgreSQL-backed sessions.
- **Secure session handling** — Cryptographically random 32-byte session tokens; SHA-256 token hashes are stored in the database, while the raw token is sent in an HttpOnly cookie.
- **Persistent shopping cart** — Add products, update quantities, remove items, and retrieve cart contents across sessions.
- **Checkout and order creation** — Submit shipping details and create orders from the authenticated user's cart. Checkout is simulated; no real payment provider is integrated.
- **Transactional inventory management** — Use PostgreSQL transactions and conditional stock updates to prevent overselling.
- **Concurrent checkout protection** — Lock the user's row during checkout to prevent simultaneous requests from creating duplicate orders for the same cart.
- **Order history** — View previous orders, purchased items, quantities, prices, totals, and shipping information.
- **Data validation and reliability** — Validate requests, handle missing products, enforce quantity boundaries, and safely handle large monetary values.
- **Production deployment** — Frontend on Vercel, backend on Render, and hosted PostgreSQL on Neon.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Routing | React Router |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Neon |
| Database access | `pg` connection pool, parameterized SQL |
| Authentication | Argon2id, PostgreSQL sessions, SHA-256, HttpOnly cookies |
| Validation | Zod and server-side validation |
| Deployment | Vercel, Render, Neon |

---

## Architecture

The application is organized into a separate frontend and backend. The backend follows a layered **Route → Controller → Service → PostgreSQL** structure.

```text
                  Acheter Hub
                       |
          +------------+------------+
          |                         |
     React Client              Express API
     React + Vite              Node + TypeScript
          |                         |
     React Router          Routes → Controllers
          |                         |
     API requests                 Services
          |                         |
          +------ HTTP/API ---------+
                                    |
                              PostgreSQL
                                  Neon
```

### Backend request flow

```text
Route
  ↓
Controller
  ↓
Service
  ↓
PostgreSQL
```

- **Routes** define API endpoints and middleware.
- **Controllers** handle HTTP requests, validation, and responses.
- **Services** contain application and database operations.
- **PostgreSQL** stores users, sessions, products, carts, and orders.

SQL is written directly with parameterized queries rather than using an ORM.

---

## Database

The application uses PostgreSQL with the following core tables:

| Table | Purpose |
|---|---|
| `users` | User accounts and password hashes |
| `sessions` | Hashed session tokens and expiration |
| `products` | Product details, prices, and available stock |
| `cart_items` | User-specific cart products and quantities |
| `orders` | Order totals, status, and shipping details |
| `order_items` | Products and purchase details belonging to an order |

Database integrity is supported through primary keys, foreign keys, unique constraints, `NOT NULL` constraints, and `CHECK` constraints.

The initial seed script inserts **15 products**.

### Monetary precision

Product prices, order totals, and order-item prices are stored in PostgreSQL `BIGINT` columns in cents. API responses serialize these values as strings, and the client uses `BigInt` for exact monetary calculations where needed.

---

## Inventory Concurrency

A key part of the checkout implementation is protecting inventory when multiple users attempt to purchase the same product.

Checkout uses a single checked-out PostgreSQL client and a transaction:

1. Start a transaction with `BEGIN`.
2. Lock the authenticated user's row using `SELECT ... FOR UPDATE` to serialize simultaneous checkout requests from that user.
3. Read the user's cart.
4. Deduct inventory using a conditional update:

```sql
UPDATE products
SET stock = stock - $1
WHERE id = $2
  AND stock >= $1
RETURNING id;
```

5. Create the order and its order items.
6. Clear the user's cart.
7. Commit all changes together with `COMMIT`.

If an operation fails, the service executes `ROLLBACK`. The database client is released in a `finally` block.

### Concurrency verification

The checkout service was tested with two controlled concurrent scenarios:

| Scenario | Expected and verified result |
|---|---|
| Two buyers compete for the final unit | One checkout succeeds, one is rejected with `INSUFFICIENT_STOCK`, final stock is `0`, and one order is created. |
| One user submits checkout twice simultaneously | One checkout succeeds, the other encounters `CART_EMPTY`, and only one order is created. |

Both concurrency tests passed.

---

## API Endpoints

All endpoints are prefixed with `/api`.

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Checks API and PostgreSQL connectivity |

### Products

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/products` | Retrieve the product catalogue |
| `GET` | `/products/:id` | Retrieve a product by ID |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/signup` | Create an account |
| `POST` | `/auth/login` | Authenticate and create a session |
| `POST` | `/auth/logout` | Delete the current session |
| `GET` | `/auth/me` | Retrieve the authenticated user |

### Cart

All cart endpoints require authentication.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/cart` | Add a product to the cart |
| `GET` | `/cart` | Retrieve the authenticated user's cart |
| `PATCH` | `/cart/:productId` | Update a cart item's quantity |
| `DELETE` | `/cart/:productId` | Remove a product from the cart |

### Orders

Order endpoints require authentication.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/orders` | Create an order from the current cart |
| `GET` | `/orders` | Retrieve the authenticated user's order history |

---

## Authentication Design

Acheter Hub uses server-side sessions rather than JWT-based authentication.

### Password handling

Passwords are hashed using **Argon2id**. Plain-text passwords are never stored in the database.

### Session handling

- A session token is generated using Node.js `crypto` with 32 random bytes.
- The raw token is sent to the browser in an HttpOnly cookie.
- The database stores the token's SHA-256 hash rather than the raw token.
- Sessions expire after seven days.
- Production cookies use `Secure` and `SameSite=None` to support the separately hosted frontend and backend over HTTPS.

The authenticated user ID is obtained from the server-side session, not accepted from the client as the owner of a cart or order.

---

## Getting Started

### Prerequisites

- Node.js and npm
- A Neon PostgreSQL database (or another PostgreSQL instance)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/tanqdev/Acheter.git
cd Acheter
```

### 2. Configure the database

Create a PostgreSQL database and apply the schema in:

```text
db/schema.sql
```

The project uses PostgreSQL directly through the `pg` package.

### 3. Configure the backend

Create `server/.env`:

```env
DATABASE_URL=your_postgresql_connection_string
CLIENT_URL=http://localhost:5173
PORT=5000
```

Install dependencies and start the backend:

```bash
cd server
npm install
npm run dev
```

The API runs locally at:

```text
http://localhost:5000
```

### 4. Seed the database

From the `server` directory, run:

```bash
npx tsx ../scripts/seed.ts
```

The seed script inserts the initial product catalogue.

### 5. Configure the frontend

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Install dependencies and start the frontend:

```bash
cd ../client
npm install
npm run dev
```

Vite will print the local frontend URL, normally:

```text
http://localhost:5173
```

> Keep real environment files and credentials out of version control. Use the `.env.example` files as configuration references.

---

## Deployment

| Component | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://acheterhub.vercel.app/ |
| Backend | Render | https://acheter-server.onrender.com |
| Database | Neon | Hosted PostgreSQL |

The deployed frontend uses `VITE_API_URL` to communicate with the Render API. The backend uses `CLIENT_URL` for CORS and `DATABASE_URL` for its Neon connection.

The Render service builds the TypeScript backend and starts the compiled server:

```bash
npm install --include=dev && npm run build
npm start
```

Production environment variables are configured in the hosting platforms rather than committed to the repository.

---

## Project Structure

```text
Acheter/
├── client/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── lib/
│       ├── pages/
│       └── types/
├── server/
│   └── src/
│       ├── auth/
│       ├── controllers/
│       ├── db/
│       ├── middleware/
│       ├── routes/
│       └── services/
├── db/
│   └── schema.sql
├── scripts/
│   └── seed.ts
└── docs/
    ├── day01.md
    ├── day02.md
    ├── day03.md
    ├── day04.md
    ├── day05.md
    ├── day06.md
    ├── day07.md
    ├── day08.md
    └── day09.md
```

---

## Screenshots

Add screenshots of the deployed application here.

| Product catalogue | Product details |
|---|---|
| `<!-- Add product catalogue screenshot -->` | `<!-- Add product details screenshot -->` |

| Shopping cart | Checkout |
|---|---|
| `<!-- Add cart screenshot -->` | `<!-- Add checkout screenshot -->` |

| Order confirmation | Order history |
|---|---|
| `<!-- Add order confirmation screenshot -->` | `<!-- Add order history screenshot -->` |

---

## Development Notes

The project was built incrementally, with implementation notes and verification details recorded in the daily reports:

- Day 1 — Project setup, PostgreSQL schema, and seed data
- Day 2 — Product browsing and product APIs
- Day 3 — Authentication and session management
- Day 4 — Persistent shopping cart
- Day 5 — Checkout UI and initial order creation
- Day 6 — Transactional checkout and inventory concurrency
- Day 7 — Order history and user data isolation
- Day 8 — Reliability, BIGINT money, and end-to-end verification
- Day 9 — Production deployment and authentication fixes

---

## Scope and Limitations

- Checkout creates orders but does **not** process real payments.
- No payment gateway is integrated.
- The project was manually and programmatically verified for the documented flows; this README does not claim a comprehensive automated test suite.
- The daily reports describe the implementation and verification performed during development.

---

## Author

**Tanishq Srivastava**

- GitHub: [@tanqdev](https://github.com/tanqdev)
- Project: [Acheter Hub](https://acheterhub.vercel.app/)
