# Day 8 — Reliability, BIGINT Money, and End-to-End Verification

## Overview

Day 8 focused on making the cart and checkout flow more reliable, especially around invalid product references, quantity boundaries, and large monetary values.

## Completed reliability work

### 404 handling for nonexistent cart products

Cart operations now handle products that no longer exist.

When PostgreSQL rejects a cart insert or update because the referenced product is missing (`23503` foreign-key violation), the API returns a clear `404 Not Found` response instead of exposing a database error.

### Cart quantity validation

Cart quantities are validated before they reach the database.

A quantity must be:

- A number
- A positive safe integer
- No greater than `2147483647` (`INTEGER` maximum)

Invalid values, including zero, negative numbers, decimals, unsafe integers, and values above the PostgreSQL `INTEGER` limit, are rejected with a validation error.

## BIGINT monetary migration

Monetary columns were migrated from `INTEGER` to `BIGINT` while preserving existing Neon database data:

- `products.price_cents`
- `orders.total_cents`
- `order_items.price_cents`

This prevents overflow when storing high-value product prices or order totals.

The migration uses PostgreSQL type conversion so existing values remain intact.

## BigInt monetary calculations

Checkout and frontend monetary calculations now use `BigInt` where needed.

This ensures cart subtotals, order totals, and line-item calculations remain accurate beyond JavaScript `Number` safe-integer limits.

If a calculated order total cannot be represented safely by the application or database flow, checkout returns the `ORDER_TOTAL_TOO_LARGE` error instead of creating an incorrect order.

## API serialization

PostgreSQL `BIGINT` values are serialized as strings in API responses.

This includes:

- Product prices
- Order totals
- Order-item prices
- Nested JSON order items returned with order history

Serializing these values as strings prevents JSON serialization failures and preserves exact cents values.

Clients convert the string values to `BigInt` when performing monetary calculations or formatting currency.

## End-to-end verification

The complete purchase flow was tested successfully:

1. Product listing loads correctly.
2. Product details load correctly.
3. Cart quantities update correctly.
4. Cart subtotals are calculated and displayed correctly.
5. Checkout displays the expected products, quantities, prices, and total.
6. An order can be created successfully.
7. The created order appears in order history.
8. Order history shows the correct line items, quantities, prices, shipping details, status, and total.

A test order was created successfully with a total of ₹92.98, confirming the flow:

```text
Products → Cart → Checkout → Order Creation → Order History
```
