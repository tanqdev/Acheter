import argon2 from "argon2";
import { pool } from "../db/pool.js";

export async function findUserByEmail(email: string) {
  const result = await pool.query(
    `
    SELECT
      id,
      email,
      password_hash,
      created_at
    FROM users
    WHERE email = $1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

export async function createUser(email: string, password: string) {
  const passwordHash = await argon2.hash(password);

  const result = await pool.query(
    `
    INSERT INTO users (
      email,
      password_hash
    )
    VALUES ($1, $2)
    RETURNING id, email, created_at
    `,
    [email, passwordHash],
  );

  return result.rows[0];
}

export async function verifyPassword(password: string, passwordHash: string) {
  return argon2.verify(passwordHash, password);
}
