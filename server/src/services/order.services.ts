import { pool } from "../db/pool";
import type { PoolClient } from "pg";

interface CreateOrderInput {
  userId: number;
  shippingName: string;
  shippingAddress: string;
}

export async function createOrder({
  userId,
  shippingName,
  shippingAddress,
}: CreateOrderInput) {
  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");
    const cartResult = await client.query(
      `
      SELECT
        ci.product_id,
        ci.quantity,
        p.name,
        p.price_cents,
        p.stock
      FROM cart_items AS ci
      JOIN products AS p ON p.id = ci.product_id
      WHERE ci.user_id = $1
      ORDER BY ci.product_id
      `,
      [userId],
    );
    const items = cartResult.rows;

    if (items.length === 0) {
      throw new Error("CART_EMPTY");
    }

    for (const item of items) {
      const stockResult = await client.query(
        `
        UPDATE products
        SET stock=stock-$1
        WHERE id=$2
          AND stock>=$1
        RETURNING id
        `,
        [item.quantity, item.product_id],
      );
      if (stockResult.rowCount === 0) {
        throw new Error("INSUFFICIENT_STOCK");
      }
    }

    const totalCents = items.reduce(
      (total, item) => total + item.price_cents * item.quantity,
      0,
    );

    const orderResult = await client.query(
      `
      INSERT INTO orders (
        user_id,
        total_cents,
        shipping_name,
        shipping_address
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, total_cents, status, created_at
      `,
      [userId, totalCents, shippingName, shippingAddress],
    );

    const order = orderResult.rows[0];

    for (const item of items) {
      await client.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          price_cents,
          quantity
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [order.id, item.product_id, item.name, item.price_cents, item.quantity],
      );
    }

    await client.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);
    await client.query("COMMIT");
    return order;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
