# Day 4 — Persistent Shopping Cart

## Part 1: Brief Summary

### Objective
Build a persistent shopping cart for Acheter using the existing React + TypeScript frontend, Express + TypeScript backend, and PostgreSQL database. Users should be able to add products, view their cart, change quantities, and remove items. PostgreSQL remains the source of truth.

### What Was Built
- Implemented cart database operations in `server/src/services/cart.services.ts`.
- Added controller handlers for retrieving, adding, updating, and deleting cart items.
- Registered authenticated cart routes under `/api/cart`.
- Connected the product-card UI to `POST /api/cart`.
- Created the shared navigation bar in `client/src/components/Navbar.tsx`.
- Registered `/cart` in `client/src/App.tsx`.
- Created `client/src/pages/Cart.tsx` to display items, quantities, line subtotals, and the overall subtotal.
- Added quantity-update and item-removal controls.
- Kept cart contents persistent by fetching them from PostgreSQL rather than relying on temporary frontend state.

### API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/cart` | Add a product; repeated additions increment the existing quantity |
| `GET` | `/api/cart` | Retrieve the authenticated user's cart with product details |
| `PATCH` | `/api/cart/:productId` | Set a cart item's quantity |
| `DELETE` | `/api/cart/:productId` | Remove a product from the authenticated user's cart |

All four routes use the existing `requireAuth` middleware.

### Verification Results
- Adding a product from the frontend returned `200 OK`, `success: true`, and a `cartItem`.
- The successful frontend request created a row for `user_id: 2`, `product_id: 15`, `quantity: 1`.
- Repeating an API add request increased quantity from `2` to `4` rather than creating a duplicate row.
- `GET /api/cart` returned cart items with product details.
- `PATCH` changed quantity from `4` to `3`.
- Deleting a nonexistent cart item returned `404`.
- The user reported that product display, quantity/subtotal updates, removal, and persistence after refresh all passed.

### Outcome
The cart backend and React interface are implemented, and the main user-facing flow was reported to pass. Checkout was not implemented on Day 4. Stock must be validated and deducted atomically during checkout; adding an item to the cart does not reserve inventory.

---

## Part 2: Detailed Report

## 1. Starting Point and Existing Project Structure

Day 4 began after the Day 3 authentication flow had been completed. The project uses React with TypeScript on the frontend, Express with TypeScript on the backend, and PostgreSQL accessed through the existing database pool and parameterized SQL queries.

The frontend source tree was inspected before implementation. Relevant files included:

```text
client/src/
├── App.tsx
├── components/
│   ├── Navbar.tsx
│   ├── ProductCard.tsx
│   └── ui/
├── context/
│   └── AuthContext.tsx
├── pages/
│   ├── Login.tsx
│   ├── Products.tsx
│   ├── ProductsDetail.tsx
│   └── SignUp.tsx
└── types/
    ├── auth.ts
    └── product.ts
```

`Navbar.tsx` was empty when inspected. The existing `Products.tsx` fetched products from `GET /api/products`, showed loading/error/empty states, and rendered each product through `ProductCard`.

The backend already used a services/controllers/routes structure. The cart service was therefore placed in `server/src/services/`, rather than introducing a new `server/src/cart/` directory. The filename used was `cart.services.ts` (plural `services`).

## 2. Cart Database Design

The existing `cart_items` table was reviewed:

```sql
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, product_id)
);
```

What each part provides:

- `id SERIAL PRIMARY KEY`: unique identifier for each cart row.
- `user_id ... REFERENCES users(id)`: associates the cart row with its owner.
- `product_id ... REFERENCES products(id)`: associates the row with a product.
- `quantity ... CHECK (quantity > 0)`: prevents zero or negative quantities from being stored.
- `created_at ... DEFAULT NOW()`: records when the cart row was created.
- `UNIQUE (user_id, product_id)`: allows only one cart row per user/product combination.
- `ON DELETE CASCADE`: removes dependent cart rows if the referenced user or product is deleted.

The unique constraint is important for the add operation. Re-adding the same product for the same user updates the existing row instead of creating a duplicate.

## 3. Backend Cart Service

Created `server/src/services/cart.services.ts`. It contains the database-facing functions called by the controller.

### 3.1 `addToCart(userId, productId, quantity)`

The operation uses PostgreSQL `INSERT ... ON CONFLICT ... DO UPDATE`:

```sql
INSERT INTO cart_items (user_id, product_id, quantity)
VALUES ($1, $2, $3)
ON CONFLICT (user_id,product_id) DO UPDATE
SET quantity=cart_items.quantity + EXCLUDED.quantity
RETURNING id, user_id, product_id, quantity, created_at;
```

Values are passed as query parameters rather than interpolated into SQL.

How it works:
1. It attempts to insert the user ID, product ID, and requested quantity.
2. If no row exists for that user/product pair, PostgreSQL inserts one.
3. If the unique constraint conflicts, PostgreSQL updates the existing row.
4. `EXCLUDED.quantity` is the quantity proposed by the attempted insert.
5. The existing quantity is increased by the newly requested quantity.
6. `RETURNING` gives the resulting row back to the service.

This behavior was tested: adding the same product with quantity `2` twice produced a quantity of `4` in the existing row.

Adding to the cart does not reduce `products.stock`; inventory is not reserved by this operation.

### 3.2 `getCart(userId)`

The cart retrieval query joins `cart_items` with `products`:

```sql
SELECT
    ci.id,
    ci.product_id,
    ci.quantity,
    p.name,
    p.price_cents,
    p.stock
FROM cart_items AS ci
JOIN products AS p
    ON p.id=ci.product_id
WHERE ci.user_id=$1
ORDER BY ci.created_at DESC;
```

It returns cart information with product name, price, and current stock. `WHERE ci.user_id=$1` scopes the query to the authenticated user's cart. Rows are ordered newest first.

During implementation, an accidental comma after `FROM cart_items AS ci` was identified and corrected. The valid query uses `FROM cart_items AS ci JOIN products AS p ...` without a comma before `JOIN`.

### 3.3 `updateCartQuantity(userId, productId, quantity)`

```sql
UPDATE cart_items
SET quantity=$1
WHERE user_id=$2 AND product_id=$3
RETURNING id, user_id, product_id, quantity, created_at;
```

The service returns the updated row, or `null` when no matching row exists (`res.rows[0] ?? null`). The controller uses this result to return `404 Cart item not found`.

### 3.4 `deleteFromCart(userId, productId)`

```sql
DELETE FROM cart_items
WHERE user_id=$1 AND product_id=$2
RETURNING id, user_id, product_id, quantity;
```

The service returns the deleted row, or `null` if no matching row existed. Including `user_id` in the condition prevents one user from deleting another user's cart row merely by guessing a product ID.

### 3.5 Exports

The service exports `addToCart`, `getCart`, `updateCartQuantity`, and `deleteFromCart` for use by the controller.

## 4. Backend Controller

The cart controller was created within the existing controllers structure and exposes handlers for the four cart operations.

### 4.1 Authenticated user ID

Each handler obtains the user ID from the authenticated request:

```ts
const userId = req.user?.id;
```

If there is no user ID, the handler returns `401`. The routes also use `requireAuth`, so middleware checks authentication before the controller is reached. The controller-level check is an additional defensive guard.

The user ID is not accepted from the request body. The server determines the cart owner from the authenticated session.

### 4.2 Adding an item

The add handler reads `productId` and `quantity` from `req.body`. It validates that both are positive integers before calling `addToCart`.

On success, it returns JSON containing `success: true` and the created/updated `cartItem`. The frontend request returned `200 OK`.

### 4.3 Retrieving the cart

The GET handler calls `getCart(userId)` and responds with a `success` field and a `cartItems` array. The array contains joined product information when populated and is empty when the user has no cart rows.

### 4.4 Updating quantity

The update handler converts `req.params.productId` to a number and validates the product ID and requested quantity as positive integers. It calls `updateCartQuantity`.

- Invalid product ID or quantity: `400`.
- No matching cart item: `404`.
- Successful update: `200` with the updated `cartItem`.
- Unexpected database/server error: `500`.

### 4.5 Removing an item

The delete handler validates the product ID and calls `deleteFromCart`.

- Invalid product ID: `400`.
- No matching cart item: `404`.
- Successful removal: `200` with a success message and deleted row.
- Unexpected database/server error: `500`.

The nonexistent-item DELETE test returned `404`, as expected.

### 4.6 Error handling and known limitation

Handlers use `try/catch`, log errors on the server, and return JSON error responses rather than leaving a request unresolved. Raw database errors are not returned directly to the browser.

A known limitation: if `addToCart` receives a product ID that does not exist, a foreign-key violation may currently fall into the generic error handler and return `500`, rather than a deliberate `404`. Explicit product lookup and error mapping would improve this. Stock availability must also be enforced authoritatively at checkout.

## 5. Backend Routes and Server Registration

The cart router imports the existing `requireAuth` middleware and the four controller handlers. The registered routes are:

```ts
router.post("/", requireAuth, addCartItems);
router.get("/", requireAuth, getCartItems);
router.patch("/:productId", requireAuth, updateCartItems);
router.delete("/:productId", requireAuth, deleteCartItem);
```

The router is mounted in the server at:

```ts
app.use("/api/cart", cartRoutes);
```

The mount path and router-relative paths form these endpoints:

- `POST /api/cart`
- `GET /api/cart`
- `PATCH /api/cart/:productId`
- `DELETE /api/cart/:productId`

All routes use `requireAuth` and therefore depend on the session-based authentication implemented on Day 3.

## 6. Backend API Testing

Requests were tested through browser DevTools using `fetch` with `credentials: "include"` so the browser would send the logged-in session cookie.

### 6.1 POST — add a product

Example:

```js
const response = await fetch("http://localhost:5000/api/cart", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    productId: 1,
    quantity: 2,
  }),
});

console.log("Status:", response.status);
console.log("Response:", await response.json());
```

The endpoint returned success. Repeating the request for the same user/product increased quantity from `2` to `4`, confirming the upsert behavior.

### 6.2 GET — retrieve the cart

```js
const response = await fetch("http://localhost:5000/api/cart", {
  credentials: "include",
});

console.log("Status:", response.status);
console.log("Response:", await response.json());
```

The response included cart items with product details. An empty response was also observed after removing the cart item.

### 6.3 PATCH — change quantity

```js
const response = await fetch("http://localhost:5000/api/cart/1", {
  method: "PATCH",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ quantity: 3 }),
});

console.log("Status:", response.status);
console.log("Response:", await response.json());
```

The quantity changed from `4` to `3`.

### 6.4 DELETE — remove an item

```js
const response = await fetch("http://localhost:5000/api/cart/1", {
  method: "DELETE",
  credentials: "include",
});

console.log("Status:", response.status);
console.log("Response:", await response.json());
```

A nonexistent cart item request to `/api/cart/999999` returned `404` with `Cart item not found`. The user also verified that deleting a real item emptied the cart.

## 7. Frontend — ProductCard and Add to Cart

Updated `client/src/components/ProductCard.tsx`.

### 7.1 Original structure

The original card was entirely wrapped in a React Router `<Link>` to `/products/:id`. Nesting an Add to Cart button inside that link would create conflicting interactive behavior.

### 7.2 Card structure

The outer wrapper was changed to an `<article>`. A separate `<Link>` wraps the product details, and the Add to Cart button is a sibling of the link. Users can therefore open product details or add the product independently.

### 7.3 Component state

```ts
const [adding, setAdding] = useState(false);
const [message, setMessage] = useState("");
```

- `adding` tracks whether the request is in progress.
- `message` displays success or failure feedback.

While a request is running, the button is disabled and shows `Adding...`.

### 7.4 Add request

```ts
const response = await fetch(`${API_URL}/cart`, {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    productId: product.id,
    quantity: 1,
  }),
});
```

The request sends the product ID and quantity `1`, with the session cookie included. The response is parsed as JSON.

- Success shows `Added to cart!`.
- A `401` response shows `Please log in to add items.`
- Other API errors display the server message when available.
- A network error shows `Unable to reach the server.`
- `finally` resets the loading state.

### 7.5 Stock display

The component calculates:

```ts
const outOfStock = product.stock === 0;
const lowStock = product.stock > 0 && product.stock <= 2;
```

It displays `Out of stock`, `Only N left`, or `In stock`. The Add to Cart button is disabled when the currently displayed stock is zero.

This is a UI convenience, not authoritative inventory enforcement. The displayed stock may become stale, and adding to cart does not reserve inventory.

### 7.6 Frontend request verification

The user clicked Add to Cart and inspected the browser Network panel. The screenshot showed:

- Request: `POST http://localhost:5000/api/cart`
- Status: `200 OK`
- Response: `success: true`
- Returned item: `user_id: 2`, `product_id: 15`, `quantity: 1`

This confirmed that the button reached the backend and the backend returned the created cart item.

An earlier screenshot showed `GET /api/cart` returning `cartItems: []` before the POST request was selected. The later POST screenshot confirmed the add operation.

## 8. Frontend — App Routing

Updated `client/src/App.tsx` to import Cart and register `/cart` while preserving existing routes:

```tsx
<Routes>
  <Route path="/" element={<Products />} />
  <Route path="/products/:id" element={<ProductsDetail />} />
  <Route path="/cart" element={<Cart />} />
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<SignUp />} />
</Routes>
```

The cart is available at `http://localhost:5173/cart` during local development.

## 9. Frontend — Navbar

`client/src/components/Navbar.tsx` was empty at the start of this work. It was implemented with:

- `Acheter` brand linking to `/`
- `Products` link to `/`
- `Cart` link to `/cart`
- User email and Logout when authenticated
- Login when unauthenticated

The component uses `useAuth()` to access the current user and logout function. Logout calls `logout()` and navigates to `/login` after success; failures are logged.

The shared Navbar is rendered on the Products and Cart pages.

## 10. Frontend — Products Page Cleanup

The final `client/src/pages/Products.tsx` imports React state/effect hooks, the `Product` type, `ProductCard`, and `Navbar`.

The page continues to:
1. Fetch products from `GET /api/products`.
2. Check `response.ok`.
3. Parse the JSON response.
4. Set `products` from `data.products`.
5. Show a loading message while fetching.
6. Show an error message if fetching fails.
7. Show an empty-state message if no products are returned.
8. Render the shared Navbar, Products heading, and product grid when products are available.

The email/logout block was removed because the shared Navbar now owns those controls. The now-unneeded `useAuth` and `useNavigate` imports and variables were removed.

A minor UI detail remains: loading, error, and empty-product early returns occur before the main JSX that renders `<Navbar />`, so those states currently do not show the navbar. This can be polished later.

## 11. Frontend — Cart Page

Created `client/src/pages/Cart.tsx`.

### 11.1 Cart item type

```ts
interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  name: string;
  price_cents: number;
  stock: number;
}
```

The page also defines a response type containing `success`, `cartItems`, and an optional `message`.

### 11.2 State

The page tracks:
- `items`: cart rows retrieved from the API.
- `loading`: whether the initial cart fetch is in progress.
- `error`: the current error message.
- `updatingProductId`: the product being updated or removed, used to disable its controls during a request.

### 11.3 Initial retrieval and persistence

The page calls `GET /api/cart` with `credentials: "include"` and `cache: "no-store"`.

- On `401`, it navigates to `/login`.
- On another failure, it displays an error and Retry button.
- On success, it stores `data.cartItems` in React state.

Since the cart is retrieved from the backend when the page loads, refreshing the browser does not erase it.

### 11.4 Quantity controls

Minus and plus buttons call the update handler with the desired quantity. The handler sends a PATCH request to `/api/cart/:productId` with a JSON body containing the new quantity.

- The minus button is disabled at quantity `1`.
- The plus button is disabled when the displayed quantity reaches the displayed stock.
- Controls are disabled while that product's request is in progress.
- After a successful update, the page fetches the cart again so the displayed state reflects the server.

The UI stock value can become stale; checkout must still validate stock on the server.

### 11.5 Removing an item

The Remove button sends DELETE to `/api/cart/:productId`. After success, the item is filtered out of the current React state. Failures show an error, and a `401` redirects to login.

### 11.6 Subtotals and currency

The total is calculated in integer cents:

```ts
const totalCents = items.reduce(
  (total, item) => total + item.price_cents * item.quantity,
  0,
);
```

Each line subtotal is calculated from `price_cents * quantity`. The displayed amount is divided by `100` and formatted to two decimal places. Keeping calculations in integer cents avoids performing currency arithmetic with floating-point rupee amounts.

The order summary notes that shipping and taxes are not included. The Checkout button is disabled and labeled `Checkout — Coming Soon` because checkout is outside Day 4 scope.

### 11.7 Loading, empty, and error states

The cart page supports:
- `Loading your cart...`
- An empty-cart message with a Browse Products link
- An error state with Retry when the cart cannot load
- Error feedback for failed quantity updates or removals
- Redirect to login for unauthenticated responses

## 12. End-to-End Frontend Verification

The user reported the following checks as passing:

| Check | Result |
|---|---|
| Product appears in cart after adding | PASS |
| Quantity and subtotal update | PASS |
| Removing an item works | PASS |
| Cart persists after refresh | PASS |

Together with the API tests, these checks cover the main Day 4 cart workflow.

## 13. Design Decisions and Rationale

### PostgreSQL is the source of truth
The cart page retrieves persisted data rather than treating React state as the only copy. This supports persistence after refresh and allows the backend to enforce ownership and validation.

### Server-side ownership
The controller uses `req.user.id` from authentication middleware. Queries for reading, updating, and deleting include the user ID. The client cannot select another user's cart by sending a different user ID in JSON.

### Parameterized SQL
Database values are passed as query parameters such as `$1`, `$2`, and `$3`, rather than concatenated into SQL strings.

### Adding to cart does not reserve inventory
The add operation writes only to `cart_items`. Multiple customers may have the same product in their carts. Checkout must validate inventory and deduct stock atomically before confirming an order.

### Checkout remains separate
The displayed subtotal is not a final order amount. A future checkout endpoint must re-read current prices and stock on the server, validate quantities, and calculate the order from trusted database values.

## 14. Known Limitations and Follow-Up Work

The following items were not completed on Day 4:

1. **Checkout:** no order creation or payment flow is implemented.
2. **Atomic inventory handling:** checkout must use a database transaction and row locking, such as `SELECT ... FOR UPDATE`, to prevent concurrent purchases from overselling.
3. **Missing product error mapping:** an invalid product ID during add may currently produce a generic server error due to the foreign-key constraint. A deliberate lookup and `404` response would improve this.
4. **Stale stock:** the frontend stock value may become outdated. The backend must be authoritative at checkout.
5. **Automated tests:** verification was performed manually through DevTools and the UI. Automated service/controller tests and invalid-input tests remain useful follow-up work.
6. **Navbar in early product states:** Products currently returns loading, error, and empty states before rendering the shared Navbar.
7. **Shipping and taxes:** not included in the displayed subtotal.
8. **Git confirmation:** do not mark the commit/push complete until the commands succeed.

## 15. Day 4 Completion Checklist

- [x] Implement add-to-cart database operation.
- [x] Implement cart retrieval with product details.
- [x] Implement quantity update operation.
- [x] Implement cart item deletion.
- [x] Add authenticated cart API routes.
- [x] Connect ProductCard's Add to Cart button to the API.
- [x] Create the shared Navbar and Cart route.
- [x] Implement the Cart page and quantity/removal controls.
- [x] Verify adding, updating, removing, and persistence after refresh.
- [ ] Save this report as `docs/day04.md`.
- [ ] Review `git status` and commit the intended Day 4 changes.
- [ ] Push the commit to GitHub and confirm success.

## Day 4 Outcome

The persistent cart system is implemented across the database, backend API, and React UI. The user-facing flow was reported to pass manual testing, including persistence after refresh. The next stage is checkout, with particular emphasis on transaction-safe inventory validation and preventing overselling.
