import { pool } from "../db/pool";

async function addToCart(userId: number, productId: number, quantity: number) {
  const res = await pool.query(
    `
    INSERT INTO cart_items (user_id, product_id, quantity)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id,product_id) DO UPDATE
    SET quantity=cart_items.quantity + EXCLUDED.quantity
    RETURNING id, user_id, product_id, quantity, created_at;
    `,
    [userId, productId, quantity],
  );
  return res.rows[0];
}
async function getCart(userId: number) {
  const res = await pool.query(
    `
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
    ORDER BY ci.created_at DESC
    `,
    [userId],
  );
  return res.rows;
}

async function updateCartQuantity(
  userId: number,
  productId: number,
  quantity: number,
) {
  const res = await pool.query(
    `
    UPDATE cart_items 
    SET quantity=$1 
    WHERE user_id=$2 AND product_id=$3
    RETURNING id, user_id, product_id, quantity, created_at;
    `,
    [quantity, userId, productId],
  );
  return res.rows[0] ?? null;
}

async function deleteFromCart(userId: number, productId: number) {
  const res = await pool.query(
    `
    DELETE FROM cart_items
    WHERE user_id=$1 AND product_id=$2
    RETURNING id, user_id, product_id, quantity;
    `,
    [userId, productId],
  );
  return res.rows[0] ?? null;
}
export { addToCart, getCart, updateCartQuantity, deleteFromCart };
