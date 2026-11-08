import "dotenv/config";
import { pool } from "../src/db/pool";
import { createOrder } from "../src/services/order.services";

const stamp = Date.now();
const userIds: number[] = [];
const productIds: number[] = [];

async function makeUser(tag: string) {
  const r = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, 'x') RETURNING id`,
    [`ctest-${stamp}-${tag}@example.invalid`],
  );
  const id = r.rows[0].id as number;
  userIds.push(id);
  return id;
}

async function makeProduct(stock: number) {
  const r = await pool.query(
    `INSERT INTO products (name, description, price_cents, stock) VALUES ($1, 'test', 1000, $2) RETURNING id`,
    [`ctest-product-${stamp}`, stock],
  );
  const id = r.rows[0].id as number;
  productIds.push(id);
  return id;
}

async function addCart(userId: number, productId: number, qty: number) {
  await pool.query(
    `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)`,
    [userId, productId, qty],
  );
}

function attempt(userId: number) {
  return createOrder({
    userId,
    shippingName: "Test",
    shippingAddress: "Test St",
  });
}

async function testTwoBuyersOneUnit() {
  console.log("\n=== TEST 1: two users, last unit (stock = 1) ===");
  const product = await makeProduct(1);
  const a = await makeUser("a");
  const b = await makeUser("b");
  await addCart(a, product, 1);
  await addCart(b, product, 1);

  const results = await Promise.allSettled([attempt(a), attempt(b)]);
  const ok = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];

  const stock = (await pool.query(`SELECT stock FROM products WHERE id = $1`, [product])).rows[0].stock;
  const orders = (
    await pool.query(`SELECT count(*)::int c FROM orders WHERE user_id = ANY($1)`, [[a, b]])
  ).rows[0].c;

  console.log(`  fulfilled=${ok} rejected=${failed.length}`);
  failed.forEach((f) => console.log(`  rejection: ${(f.reason as Error).message}`));
  console.log(`  stock=${stock} orders=${orders}`);
  const pass = ok === 1 && failed.length === 1 && stock === 0 && orders === 1;
  console.log(`  ${pass ? "PASS" : "FAIL"}`);
  return pass;
}

async function testDoubleSubmit() {
  console.log("\n=== TEST 2: same user double-submits checkout (stock = 5) ===");
  const product = await makeProduct(5);
  const a = await makeUser("double");
  await addCart(a, product, 1);

  const results = await Promise.allSettled([attempt(a), attempt(a)]);
  const ok = results.filter((r) => r.status === "fulfilled").length;

  const stock = (await pool.query(`SELECT stock FROM products WHERE id = $1`, [product])).rows[0].stock;
  const orders = (await pool.query(`SELECT count(*)::int c FROM orders WHERE user_id = $1`, [a])).rows[0].c;

  console.log(`  fulfilled=${ok} stock=${stock} orders=${orders}`);
  const pass = ok === 1 && stock === 4 && orders === 1;
  console.log(`  ${pass ? "PASS" : "FAIL (duplicate order created)"}`);
  return pass;
}

async function cleanup() {
  if (userIds.length) {
    await pool.query(`DELETE FROM orders WHERE user_id = ANY($1)`, [userIds]);
    await pool.query(`DELETE FROM users WHERE id = ANY($1)`, [userIds]);
  }
  if (productIds.length) {
    await pool.query(`DELETE FROM products WHERE id = ANY($1)`, [productIds]);
  }
}

(async () => {
  let pass1 = false;
  let pass2 = false;
  try {
    pass1 = await testTwoBuyersOneUnit();
    pass2 = await testDoubleSubmit();
  } catch (e) {
    console.error("test harness error:", e);
  } finally {
    try {
      await cleanup();
      console.log("\ncleanup done");
    } catch (e) {
      console.error("CLEANUP FAILED — rows may remain:", e);
    }
    await pool.end();
    console.log(`\nRESULT: test1=${pass1 ? "PASS" : "FAIL"} test2=${pass2 ? "PASS" : "FAIL"}`);
  }
})();
