# Day 6 — Transactional Checkout and Inventory Concurrency

## Part 1: Brief Summary

### Objective

Make checkout atomic and prevent multiple buyers from purchasing inventory that is no longer available.

### What Was Built

- Added a PostgreSQL transaction to the checkout service.
- Used a single database client for all checkout queries.
- Replaced the separate stock check with a conditional stock update.
- Added rollback handling for failed checkout operations.
- Ensured the database client is released in a `finally` block.
- Standardized the insufficient-stock error returned to the frontend.

### API Endpoint

`POST /api/orders`

The endpoint requires authentication and valid shipping details.

### Verification Results

- TypeScript check passed using `npx tsc --noEmit`.
- A successful checkout reduced product stock from 1 to 0.
- A subsequent out-of-stock checkout returned the expected message: "One or more items no longer have enough stock."
- The losing buyer's cart retained the item after the failed checkout.
- Existing database records showed a successful order for product 15.

**Verification limitation:** The observed results are consistent with correct inventory protection. A clean, controlled simultaneous-checkout test with recorded before-and-after order IDs has not yet been completed.

### Outcome

Checkout now uses a transaction and a conditional stock update to protect inventory. The implementation is ready for further controlled concurrency testing.

## Part 2: Detailed Report

## 1. Starting Point and Existing Project Structure

Day 5 introduced checkout and order creation. The original service read the cart, checked stock, inserted an order, inserted order items, and cleared the cart using separate pool queries.

That implementation had two main risks:

- Concurrent checkouts could both observe sufficient stock before either deducted it.
- A failure partway through order creation could leave partial database changes.

Day 6 addresses these issues using a PostgreSQL transaction.

## 2. Transaction Setup

The service obtains one dedicated database client:

```ts
const client: PoolClient = await pool.connect();
```

It starts a transaction:

```ts
await client.query("BEGIN");
```

All checkout queries use `client.query()` so they execute on the same connection and within the same transaction.

Using `pool.query()` for a query inside this transaction could execute it on a different connection and outside the transaction.

## 3. Retrieving Cart Items

The service reads the authenticated user's cart and joins the products table:

```sql
SELECT
  ci.product_id,
  ci.quantity,
  p.name,
  p.price_cents,
  p.stock
FROM cart_items AS ci
JOIN products AS p ON p.id = ci.product_id
WHERE ci.user_id = $1
ORDER BY ci.product_id;
```

The product ID ordering provides a consistent order for processing cart items.

If the cart is empty, the service throws `CART_EMPTY`.

## 4. Conditional Stock Update

### 4.1 Why the previous approach was insufficient

Checking stock in application code and deducting it in a separate query leaves a race condition. Two requests could read the same available stock before either performs its deduction.

### 4.2 The conditional update

For every cart item, the service executes:

```sql
UPDATE products
SET stock = stock - $1
WHERE id = $2
  AND stock >= $1
RETURNING id;
```

The parameters are the requested quantity and product ID.

The update deducts stock only when enough inventory remains. PostgreSQL coordinates concurrent updates to the same row. Under the default `READ COMMITTED` isolation level, a waiting update re-evaluates its condition against the updated row version.

### 4.3 Detecting insufficient stock

The service checks the update result:

```ts
if (stockResult.rowCount === 0) {
  throw new Error("INSUFFICIENT_STOCK");
}
```

If the update affects no row, the requested quantity is unavailable or the product row no longer exists. The service treats this as insufficient stock.

The controller recognizes `INSUFFICIENT_STOCK` and returns HTTP `409 Conflict`.

## 5. Calculating the Order Total

The service calculates the total on the backend using product prices from the database:

```ts
const totalCents = items.reduce(
  (total, item) => total + item.price_cents * item.quantity,
  0,
);
```

The total is stored in cents to avoid using floating-point currency values.

## 6. Creating the Order

The service inserts an order containing:

- User ID
- Total in cents
- Shipping name
- Shipping address

It returns the new order's ID, total, status, and creation timestamp.

This query uses `client.query()` and participates in the transaction.

## 7. Inserting Order Items

For each cart item, the service inserts a corresponding `order_items` row containing the order ID, product ID, product name, price, and quantity.

These inserts use the same database client and transaction.

## 8. Clearing the Cart

After the order and its items are inserted, the service deletes the user's cart rows:

```sql
DELETE FROM cart_items
WHERE user_id = $1;
```

Cart deletion is part of the transaction. If a later operation fails before commit, the deletion is rolled back along with the other changes.

## 9. Commit, Rollback, and Connection Cleanup

### 9.1 Commit

After all checkout operations succeed:

```ts
await client.query("COMMIT");
```

The transaction commits the stock deductions, order, order items, and cart deletion together.

### 9.2 Rollback

If an operation throws an error:

```ts
catch (e) {
  await client.query("ROLLBACK");
  throw e;
}
```

The rollback undoes changes made by the transaction. The error is rethrown so the controller can handle it.

### 9.3 Releasing the client

The service releases the client in `finally`:

```ts
finally {
  client.release();
}
```

This returns the connection to the pool on both success and failure.

## 10. Error Handling

The service uses these error identifiers:

- `CART_EMPTY`
- `INSUFFICIENT_STOCK`

The controller maps `CART_EMPTY` to HTTP `400` and `INSUFFICIENT_STOCK` to HTTP `409`.

The stock error must use the exact string `INSUFFICIENT_STOCK`. A different string, such as `INSUFFICIENT STOCK`, will not match the controller's condition and may result in an HTTP `500` response.

The frontend reads the backend response message and displays it when checkout fails.

## 11. Manual Verification

### 11.1 TypeScript check

Command:

```bash
npx tsc --noEmit
```

Result: passed with no compiler output.

### 11.2 Successful checkout

Product 15, Limited Edition Keyboard, was reset to stock 1 for testing.

After checkout, the observed stock was 0, and an order item was recorded for quantity 1.

### 11.3 Insufficient-stock response

A subsequent checkout attempt while stock was 0 returned:

"One or more items no longer have enough stock."

The response confirmed that the service's error identifier matched the controller's handling.

### 11.4 Cart persistence after failure

The database showed that user 4 still had product 15, quantity 1, in the cart after the failed checkout.

This is consistent with rollback preserving the cart when checkout fails.

### 11.5 Scope of concurrency verification

The observed successful and failed checkouts are consistent with inventory protection. However, the database also contained historical orders for product 15, and the available records do not independently establish that the two checkout requests overlapped in time.

A controlled concurrency test with two identified users, stock initialized to 1, and before-and-after order records remains a follow-up verification task.

## 12. Design Decisions and Rationale

### Conditional update instead of explicit row locking

A conditional update combines the stock check and deduction in one SQL statement. It is simpler for the current requirement: deduct a requested quantity only if enough stock remains.

### Transactional checkout

A transaction keeps inventory changes, order creation, order-item insertion, and cart deletion atomic.

### Backend inventory validation

The frontend may display stock information, but only the backend can safely decide whether a purchase is allowed because inventory may change between page load and checkout.

### Database-backed order totals

The backend calculates the total using database prices rather than trusting client-submitted prices.

## 13. Known Limitations and Follow-Up Work

- Complete a controlled simultaneous-checkout test with two distinct users and stock set to 1.
- Verify that exactly one new order is created by the test and that the other checkout receives HTTP 409.
- Test rollback after a failure occurring after stock has been deducted, confirming that the stock is restored and no partial order remains.
- Consider stronger validation for unusual database failures and transaction rollback errors.
- Continue with Day 7: order history.

## 14. Day 6 Completion Checklist

- [x] Checkout uses a dedicated PostgreSQL client.
- [x] Checkout starts a transaction.
- [x] All checkout queries use the same client.
- [x] Stock is deducted with a conditional update.
- [x] Insufficient stock triggers an error.
- [x] Successful checkout commits all changes together.
- [x] Failed checkout rolls back changes.
- [x] Database client is released in `finally`.
- [x] TypeScript check passes.
- [x] Frontend displays the insufficient-stock message.
- [ ] Controlled simultaneous-checkout test completed and documented.

## Day 6 Outcome

The checkout service now uses transactional database operations and a conditional stock update to prevent inventory from being oversold by concurrent requests. The TypeScript check and the observed success and failure paths passed. A controlled concurrency test remains necessary before marking the concurrency requirement fully verified.
