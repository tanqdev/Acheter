# Day 5 --- Checkout UI and Order Creation

## Part 1: Brief Summary

### Objective

Implement the first checkout flow for Acheter using the existing React +
TypeScript frontend, Express + TypeScript backend, and PostgreSQL
database. Authenticated users should be able to review their cart, enter
shipping details, submit an order, and see an order confirmation.

This is a simulated checkout. No real payment processing is implemented.

### What Was Built

- Updated `client/src/pages/Cart.tsx` with a **Proceed to Checkout**
  button.
- Created `client/src/pages/Checkout.tsx`.
- Added checkout and order-confirmation routes in
  `client/src/App.tsx`.
- Added checkout form state for shipping name and address.
- Added a `POST /api/orders` request from the frontend.
- Created `server/src/routes/order.route.ts` and mounted it under
  `/api/orders`.
- Created `server/src/controllers/order.controller.ts`.
- Created `server/src/services/order.services.ts`.
- Added order creation, order-item insertion, and cart clearing.
- Created `client/src/pages/OrderConfirmation.tsx`.
- Displayed the order ID, total, and status after successful checkout.

### API Endpoint

---

Method Endpoint Purpose

---

`POST` `/api/orders` Create an order from
the authenticated
user's cart and
supplied shipping
details

---

The endpoint uses the existing `requireAuth` middleware.

### Verification Results

- An unauthenticated checkout request returned `401`, as expected.
- An authenticated checkout request successfully created an order.
- The frontend navigated to the Order Confirmation page.
- The confirmation page displayed order ID `#1`, total `₹364.95`, and
  status `completed`.
- The user confirmed that the cart was empty after successful
  checkout.
- The `orders` query in Neon returned the created order.
- The `order_items` query in Neon returned the associated order items.

These checks verify the successful checkout path. They do not prove
transactional safety or concurrent inventory correctness.

### Outcome

The basic checkout UI and order-creation flow are implemented and
manually verified. Checkout currently creates the order and its items,
then clears the cart. The service is still a temporary,
non-transactional implementation: it does not safely decrement inventory
and cannot guarantee all database changes succeed or fail together. Day
6 will replace this with transactional inventory protection.

---

## Part 2: Detailed Report

## 1. Starting Point and Existing Project Structure

Day 5 began after the persistent cart flow from Day 4. The application
already had product browsing, session-based authentication, and a
PostgreSQL-backed cart.

Relevant frontend files included:

```text
client/src/
├── App.tsx
├── components/
│   └── Navbar.tsx
└── pages/
    ├── Cart.tsx
    ├── Login.tsx
    ├── Products.tsx
    ├── ProductsDetail.tsx
    └── SignUp.tsx
```

The backend already used a services/controllers/routes structure, a
shared PostgreSQL pool, and the `requireAuth` middleware. The existing
tables included `cart_items`, `products`, `orders`, and `order_items`.

The Day 5 implementation added the checkout interface and the first
version of the order endpoint without introducing a payment provider.

## 2. Cart Page Integration

### 2.1 Checkout navigation

The cart page's previous placeholder checkout control was replaced with
a button that navigates to `/checkout`:

```tsx
<button
  type="button"
  onClick={() => navigate("/checkout")}
  className="mt-6 w-full rounded-lg bg-black px-4 py-3 text-white hover:bg-gray-800"
>
  Proceed to Checkout
</button>
```

The button is a navigation control. It does not create an order by
itself; order submission occurs on the Checkout page.

### 2.2 Responsibility separation

The cart page remains responsible for reviewing and editing cart
contents. The Checkout page collects shipping details and submits the
order. This keeps the cart-management UI separate from the
order-submission flow.

## 3. Frontend --- Checkout Page

Created `client/src/pages/Checkout.tsx`.

### 3.1 Cart item and response types

The page uses a `CartItem` interface containing the fields required to
render the checkout summary:

```tsx
interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  name: string;
  price_cents: number;
  stock: number;
}
```

A `CartResponse` interface describes the cart API response with
`success`, `cartItems`, and an optional `message`.

These interfaces help TypeScript check how the response data is used.
They do not perform runtime validation of JSON received from the server.

### 3.2 Component state

The page tracks the following state:

- `items`: cart items loaded from the API.
- `loading`: whether the initial cart request is in progress.
- `error`: an error loading the cart.
- `shippingName`: the value entered in the shipping-name field.
- `shippingAddress`: the value entered in the shipping-address field.
- `submitting`: whether an order submission is in progress.
- `submitError`: an error from checkout submission.

The `useNavigate` hook is used to redirect the user to login when the
cart request returns `401` and to navigate to order confirmation after a
successful order response.

### 3.3 Loading the cart

The page requests `GET /api/cart`:

```tsx
const response = await fetch(`${API_URL}/cart`, {
  credentials: "include",
  cache: "no-store",
});
```

`credentials: "include"` allows the browser to include the session
cookie with the cross-origin API request. `cache: "no-store"` asks the
browser not to use a cached response for this request.

The page handles the main outcomes:

- `401`: navigate to `/login`.
- Non-success response: show a cart-loading error.
- Successful response: store `data.cartItems` in React state.
- Request failure: log the failure and show a user-facing error.
- Completion: reset the loading state in `finally`.

### 3.4 Order total

The checkout total is calculated in integer cents:

```tsx
const totalCents = items.reduce(
  (total, item) => total + item.price_cents * item.quantity,
  0,
);
```

Each line contributes `price_cents * quantity`. The final amount is
converted to rupees for display by dividing by `100`.

Keeping the calculation in cents avoids using floating-point rupee
values for the intermediate arithmetic. The backend must still calculate
the authoritative order total from database values rather than trusting
a total supplied by the browser.

### 3.5 Shipping form

The form collects:

- Shipping name
- Shipping address

Both fields are controlled inputs connected to React state and marked as
required. The form submits through `handleCheckout`, which calls
`event.preventDefault()` so that the browser does not perform a
full-page form submission.

### 3.6 Stock warning and button state

The page displays the cart's current product stock and checks whether a
requested quantity exceeds the stock value returned by the cart API.

The Continue button is disabled when:

```tsx
submitting || items.some((item) => item.quantity > item.stock);
```

This prevents a second click while the current request is processing and
disables the button when the displayed cart quantity exceeds the
displayed stock.

This is only a frontend guard. The stock value can become stale between
cart retrieval and checkout, so the backend must enforce inventory rules
at the time of purchase.

### 3.7 Submitting checkout

The handler sends a `POST /api/orders` request with the shipping
details:

```tsx
const response = await fetch(`${API_URL}/orders`, {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ shippingName, shippingAddress }),
});
```

The browser includes the session cookie and sends the shipping fields as
JSON. The frontend does not send a trusted order total; the backend
reads cart items and product prices from PostgreSQL.

The handler parses the JSON response and handles these outcomes:

- `401`: navigate to login.
- Other non-success status: throw an error using the response message
  when available.
- Success: navigate to `/order-confirmation` and pass `data.order`
  through React Router navigation state.
- Request or response error: log the failure and show a submission
  error.
- Completion: reset `submitting` in `finally`.

The frontend's successful response means the backend reported that an
order was created. It does not, by itself, prove that stock was safely
reserved or decremented.

## 4. Frontend --- Order Confirmation

Created `client/src/pages/OrderConfirmation.tsx`.

### 4.1 Displayed order details

The page reads the order from React Router location state and displays:

- Order ID
- Total
- Status
- A confirmation message
- A Continue Shopping link

The order type used by the page includes the fields returned by the
current order-creation service:

```tsx
interface Order {
  id: number;
  total_cents: number;
  status: string;
  created_at: string;
}
```

The total is formatted from cents into a rupee amount for display.

### 4.2 Navigation state limitation

The confirmation page currently receives the order through navigation
state. This is sufficient for the immediate post-checkout flow, but
navigation state is not durable storage. Opening the confirmation URL
directly or refreshing the page may leave the page without the order
object.

The page therefore includes a fallback message when order details are
missing. A more durable order-history or order-detail route can be added
later.

### 4.3 Payment scope

The page confirms order creation only. The project does not integrate a
real payment gateway, capture card details, or process real payments.
The current order status is produced by the existing order
schema/service behavior and should not be interpreted as proof of an
actual payment.

## 5. Frontend Routing

Updated `client/src/App.tsx` to register the checkout and confirmation
pages:

```tsx
<Route path="/checkout" element={<Checkout />} />
<Route
  path="/order-confirmation"
  element={<OrderConfirmation />}
/>
```

The corresponding page imports must also be present:

```tsx
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
```

The existing product, cart, login, and signup routes remain in place.

## 6. Backend --- Order Route

Created `server/src/routes/order.route.ts`.

The route imports `requireAuth` and the checkout controller, then
registers the POST endpoint:

```ts
router.post("/", requireAuth, checkout);
```

The router is mounted in `server/src/server.ts`:

```ts
app.use("/api/orders", orderRoutes);
```

Combining the mount path with the router-relative path produces
`POST /api/orders`.

### 6.1 Authentication check

The route runs `requireAuth` before the checkout controller. An
unauthenticated request was tested and returned `401`, confirming that
the endpoint is protected by the existing session-based authentication
middleware.

## 7. Backend --- Order Controller

Created `server/src/controllers/order.controller.ts`.

### 7.1 User identity

The controller obtains the authenticated user ID from the request:

```ts
const userId = req.user?.id;
```

If no authenticated user ID is available, it returns `401`. The user ID
is not accepted from the request body; the server determines the order
owner from the authenticated session.

### 7.2 Shipping validation

The controller checks that both `shippingName` and `shippingAddress` are
strings and are not empty after trimming whitespace. Invalid or missing
values return `400`.

This is manual validation. The current implementation does not use a Zod
schema for this particular request body.

### 7.3 Calling the service

The controller calls `createOrder` with the authenticated user ID and
trimmed shipping details.

The current response behavior is:

---

Condition HTTP status Purpose

---

User is not `401` Authentication
authenticated required

Shipping details are `400` Invalid request
missing/invalid

Cart is empty `400` No items to purchase

Requested quantity `409` Stock conflict
exceeds the stock  
 read by the service

Order created `201` Order creation
reported successful

Unexpected error `500` Generic server
failure

---

The controller logs unexpected errors on the server and returns a
generic error message rather than exposing raw database errors to the
browser.

## 8. Backend --- Order Service

Created `server/src/services/order.services.ts`.

The service is the database-facing part of checkout.

### 8.1 Retrieve the cart

The service joins `cart_items` with `products` to read each product's
ID, name, price, quantity, and current stock for the authenticated user.

The service uses parameterized SQL and filters rows by the authenticated
user's ID.

### 8.2 Empty-cart validation

If the query returns no items, the service throws `CART_EMPTY`. The
controller maps this condition to a `400` response.

### 8.3 Initial stock check

The service compares each requested cart quantity with the stock value
returned by the query. If any requested quantity exceeds that value, it
throws `INSUFFICIENT_STOCK`.

**Important limitation:** this check is not concurrency-safe. Another
checkout could change inventory after the query has read stock. The
service also does not decrement `products.stock` in this version.

### 8.4 Calculate the total

The total is calculated using the product prices read from PostgreSQL:

```ts
const totalCents = items.reduce(
  (total, item) => total + item.price_cents * item.quantity,
  0,
);
```

The browser does not supply the order total. Prices and quantities used
for the current calculation come from the database query.

### 8.5 Insert the order

The service inserts a row into `orders` with the authenticated user ID,
calculated total, shipping name, and shipping address. It retrieves the
created order's ID, total, status, and creation timestamp using
`RETURNING`.

### 8.6 Insert order items

For each cart item, the service inserts an `order_items` row with:

- The new order ID
- Product ID
- Product name
- Unit price in cents
- Purchased quantity

The product name and price are copied into the order item so the order
retains a record of the product details used at checkout.

### 8.7 Clear the cart

After inserting the order items, the service deletes the authenticated
user's rows from `cart_items`.

The successful manual test confirmed that the cart was empty after the
checkout request.

### 8.8 Current transaction limitation

The current service performs the order insert, item inserts, and cart
deletion as separate pool queries. They are **not** wrapped in one
PostgreSQL transaction.

Consequently, a failure partway through the sequence could leave partial
database changes. For example, an order could be inserted before a later
order-item insert fails. Clearing the cart is also not atomic with order
creation.

Day 6 must replace this implementation with a transaction using a single
checked-out PostgreSQL client and `BEGIN`, `COMMIT`, and `ROLLBACK`.

## 9. Database Tables Used

### 9.1 `cart_items`

The service reads the authenticated user's cart and deletes the rows
after successful order creation.

### 9.2 `products`

The service reads product names, prices, and stock. In the current Day 5
implementation, it does not decrement product stock.

### 9.3 `orders`

The service stores the user, total in cents, shipping name, shipping
address, status, and creation timestamp.

### 9.4 `order_items`

The service stores the products and quantities associated with the new
order, including a snapshot of the product name and unit price.

The existing schema's foreign-key and check constraints continue to
provide database-level integrity checks, but those constraints do not
replace a transaction or a concurrency-safe stock update.

## 10. Manual Verification

### 10.1 Unauthenticated request

An unauthenticated `POST /api/orders` request returned `401`. This
verified that the route requires authentication.

### 10.2 Authenticated request

After logging in through the browser, an authenticated checkout request
was made. The earlier placeholder response was replaced by the order
controller/service implementation.

The user completed checkout through the UI and reached the confirmation
page.

### 10.3 Order confirmation

The confirmation screenshot showed:

- Order ID: `#1`
- Total: `₹364.95`
- Status: `completed`
- Confirmation text: "Thank you! Your order has been created
  successfully."

This verified the successful frontend navigation and display of the
returned order data.

### 10.4 Cart clearing

The user confirmed that the cart was empty after the successful order.

### 10.5 PostgreSQL persistence

The following queries were run in the Neon SQL Editor:

```sql
SELECT * FROM orders ORDER BY id DESC LIMIT 5;
```

```sql
SELECT * FROM order_items ORDER BY id DESC LIMIT 10;
```

The user confirmed that both queries returned the expected records. This
verifies that the order and associated order items were persisted for
the tested checkout.

### 10.6 Scope of verification

These checks cover the happy path and one authentication failure. They
do not establish:

- Transactional rollback behavior
- Correct behavior under concurrent checkouts
- Safe inventory decrement
- Duplicate-submission/idempotency protection
- Automated test coverage
- Payment processing

## 11. Design Decisions and Rationale

### Backend calculates the total

The backend reads product prices and quantities from PostgreSQL and
calculates the total. This avoids trusting a client-supplied total.

### Authentication determines order ownership

The order is associated with the user ID established by the session
middleware, not a user ID supplied by the browser.

### Order items preserve purchase details

The order-item rows store the product name and unit price used when the
order was created. This helps preserve a record of the purchase even if
the current product listing changes later.

### Payment is simulated

The current flow demonstrates order creation and confirmation without
integrating a real payment provider.

### Inventory is not yet safe

The initial stock check reads stock and compares it with cart
quantities, but it does not atomically decrement stock. A cart does not
reserve inventory, and the current service must not be treated as
concurrency-safe.

## 12. Known Limitations and Follow-Up Work

The following work remains:

1.  **Transactional checkout:** use one PostgreSQL client and wrap all
    checkout database changes in a transaction.
2.  **Inventory decrement:** perform a conditional update that only
    succeeds when enough stock remains.
3.  **Rollback:** roll back the order, order items, inventory changes,
    and cart clearing if any operation fails.
4.  **Concurrency test:** demonstrate that two buyers cannot both
    purchase the final unit.
5.  **Duplicate submissions:** consider idempotency or other safeguards
    against repeated checkout requests.
6.  **Confirmation durability:** add an order-detail/history API if
    confirmation details must survive refresh or direct navigation.
7.  **Automated tests:** add service/controller tests and checkout
    integration tests.
8.  **Input validation:** consider a shared Zod schema for shipping
    details.
9.  **Price and stock revalidation:** make the transaction the
    authoritative point for validating stock and calculating the final
    order.
10. **Git confirmation:** review the actual changed files and confirm
    the commit and push succeed before recording them as complete.

## 13. Day 5 Completion Checklist

- [x] Add navigation from the cart to checkout.
- [x] Load the authenticated user's cart on the checkout page.
- [x] Display cart items and calculate the subtotal.
- [x] Collect shipping name and address.
- [x] Submit checkout to `POST /api/orders`.
- [x] Protect the order route with `requireAuth`.
- [x] Create an order and its order items.
- [x] Clear the cart after successful checkout.
- [x] Display the order confirmation page.
- [x] Verify the order and order items in PostgreSQL.
- [x] Confirm the cart is empty after checkout.
- [ ] Replace the temporary service with a transaction-safe
      implementation on Day 6.
- [ ] Verify inventory decrement and concurrent last-unit checkout
      behavior on Day 6.
- [ ] Review `git status`, commit the intended Day 5 changes, and push
      to GitHub.

## Day 5 Outcome

The basic checkout interface and order-creation flow are implemented and
manually verified. An authenticated user can submit shipping details,
create an order, see its confirmation details, and have the cart
cleared. The corresponding order and order-item records were verified in
PostgreSQL.

This is the first working checkout implementation, not the final
inventory-safe implementation. Day 6 will make the database changes
atomic and protect against overselling when multiple buyers attempt to
purchase the same limited stock.
