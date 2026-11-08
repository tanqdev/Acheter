# Day 7 — Order History

## 1. Objective

Implement an authenticated order history feature that allows users to view their previous purchases.

The feature retrieves order information from PostgreSQL and ensures users can only access their own orders.

## 2. Backend Implementation

### Order History Service

Extended `server/src/services/order.services.ts` with `getUserOrders()`.

Implemented a PostgreSQL query that:

- Retrieves orders belonging to a specific user.
- Joins orders with order_items.
- Uses JSON aggregation to group purchased items.
- Returns product names, prices, quantities and product IDs.
- Sorts orders by creation date, newest first.
- Uses COALESCE to return an empty items array when necessary.

### Order History Controller

Updated `server/src/controllers/order.controller.ts` with `getOrders()`.

Responsibilities:

- Retrieves the authenticated user's ID.
- Calls the order history service.
- Returns order history with HTTP 200.
- Handles authentication and database errors.

### API Route

Updated `server/src/routes/order.routes.ts`.

| Method | Endpoint    | Middleware  | Purpose                |
| ------ | ----------- | ----------- | ---------------------- |
| POST   | /api/orders | requireAuth | Create an order        |
| GET    | /api/orders | requireAuth | Retrieve order history |

## 3. Frontend Implementation

Created `client/src/pages/Orders.tsx`.

Features:

- Fetches orders from the backend.
- Uses session cookies with credentials: include.
- Displays order IDs and creation dates.
- Displays order status.
- Shows purchased products and quantities.
- Calculates individual item totals.
- Displays order totals and shipping information.
- Handles loading, error and empty states.

### Navbar Integration

Updated `Navbar.tsx` with an Orders navigation link.

The link is displayed only when a user is authenticated.

### Routing

Registered the `/orders` route in `App.tsx`.

## 4. Security and Data Isolation

- Protected the order history endpoint using requireAuth.
- Filtered database results using the authenticated user's ID.
- Verified that a separate account cannot access another user's order history.

## 5. Testing and Verification

| Test                      | Result   |
| ------------------------- | -------- |
| Backend TypeScript check  | Passed   |
| Frontend TypeScript check | Passed   |
| GET /api/orders           | Passed   |
| Order retrieval           | Passed   |
| Newest-first sorting      | Passed   |
| Order item aggregation    | Passed   |
| Empty order history       | Passed   |
| User isolation            | Verified |
| Browser rendering         | Passed   |

## 6. Files Created or Modified

### Created

- client/src/pages/Orders.tsx
- docs/day07.md

### Modified

- server/src/services/order.services.ts
- server/src/controllers/order.controller.ts
- server/src/routes/order.routes.ts
- client/src/App.tsx
- client/src/components/Navbar.tsx

## 7. Outcome

Implemented a complete order history feature with authenticated API access, user-specific database queries and a React interface.

Users can now review their previous purchases, including product details, order totals, timestamps and shipping information.

## 8. Next Steps

- Improve application reliability and error handling.
- Test additional edge cases.
- Review security and API behavior.
- Prepare the application for deployment.
