# Day 2 — Product Browsing

Today we connected the database to the frontend and made the first real read flow of the app.

## 1. Built the product API

We created a small backend flow:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
PostgreSQL
```

Created:

```text
server/src/
├── controllers/
│   └── product.controller.ts
├── routes/
│   └── product.routes.ts
└── services/
    └── product.service.ts
```

The service contains the SQL instead of putting SQL directly in the route.

Why:

- Keeps database logic separate from HTTP logic.
- Makes the code easier to change and test later.

We could have put the query directly inside `server.ts`, but that would get messy as the app grows, so we kept the small route → controller → service structure.

## 2. Product list endpoint

Added:

```text
GET /api/products
```

The query fetches the product information from PostgreSQL and orders it by creation time.

We also made sure the query is parameterized where parameters are needed, rather than building SQL strings manually.

## 3. Single product endpoint

Added:

```text
GET /api/products/:id
```

The query uses:

```sql
WHERE id = $1
```

with the id passed separately.

We also added proper handling for:

- Invalid product IDs
- Product not found → `404`

Why:
A missing product should produce a clear API response instead of silently returning an empty page.

## 4. Connected React to the API

Created a product type:

```text
client/src/types/product.ts
```

Then built the products page to fetch:

```text
GET http://localhost:5000/api/products
```

and render the returned products in a grid.

We added:

- Loading state
- Error state
- Empty state
- Product cards
- Stock status

The important idea here was that the React UI is using real data from Neon/PostgreSQL instead of hardcoded products.

## 5. Product cards

Created:

```text
client/src/components/ProductCard.tsx
```

Each card shows:

- Product name
- Description
- Price
- Stock status

Cards link to:

```text
/products/:id
```

We didn't add a real image system yet. The sprint doesn't need cloud image storage or another service just for this, so we kept the UI simple.

## 6. Single product page

Created:

```text
client/src/pages/ProductDetails.tsx
```

It fetches one product from the backend and displays:

- Name
- Price
- Description
- Stock status
- Quantity selector
- Add to Cart button

The Add to Cart button is intentionally disabled for now because the actual cart is a Day 4 feature.

## 7. TypeScript null handling

The product state starts as:

```ts
const [product, setProduct] = useState<Product | null>(null);
```

This makes sense because the API request hasn't finished on the first render.

After checking:

```ts
if (error || !product) {
  return ...;
}
```

we know the product exists in the rest of the component.

TypeScript still complained inside the nested `increaseQuantity()` function, so we captured the narrowed value:

```ts
const currentProduct = product;
```

and used:

```ts
currentProduct.stock;
```

This was a useful example of TypeScript narrowing not always carrying into nested functions/closures.

## 8. Bugs we hit

One important mistake was:

```ts
setProducts(data.product);
```

The API actually returned:

```json
{
  "success": true,
  "products": [...]
}
```

So it had to be:

```ts
setProducts(data.products);
```

That caused the `products.length` error because the state was being set to `undefined`.

We also fixed a few Tailwind typos:

```text
felx → flex
xl:grid-cols 4 → xl:grid-cols-4
```

## 9. Stock edge case

We temporarily changed a product's stock to `0` in Neon and checked the UI.

Expected behavior:

```text
stock = 0
→ Out of stock
→ Add-to-cart area disabled
```

We then restored the stock.

This is only a UI check. The real protection against stock changes during checkout will come later from the database transaction and row locking.

## What I learned today

- Separating routes, controllers, and services
- Parameterized PostgreSQL queries
- React data fetching with `useEffect`
- Loading/error/empty states
- TypeScript types for API data
- `Product | null` and type narrowing
- Why client-side stock checks are not enough for real checkout

## End of Day 2

The read path now works end to end:

```text
PostgreSQL
   ↓
pg
   ↓
Express
   ↓
React
   ↓
Product UI
```

Next: **Day 3 — Authentication**
