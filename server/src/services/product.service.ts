import { pool } from "../db/pool";

async function getAllProducts() {
  const res = await pool.query(
    `SELECT id,name,description,price_cents,stock,created_at FROM products ORDER BY created_at DESC`,
  );
  return res.rows;
}

async function getAllProductsByID(id: number) {
  const res = await pool.query(
    `SELECT id,name,description,price_cents,stock,created_at FROM products WHERE id=$1`,
    [id],
  );
  return res.rows[0] ?? null;
}

export { getAllProducts, getAllProductsByID };
