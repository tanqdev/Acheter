import crypto, { hash } from "node:crypto";
import { pool } from "../db/pool";

const SESSION_DURATION_TIME = 1000 * 60 * 60 * 24 * 7;

function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashSessionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
// CREATE A SESSION
export async function createSession(userId: number) {
  const token = createSessionToken();
  const tokenHashed = hashSessionToken(token);

  const expires_at = new Date(Date.now() + SESSION_DURATION_TIME);

  await pool.query(
    `
        INSERT INTO sessions (
            token_hash,
            user_id,
            expires_at
            )
            VALUES ($1, $2, $3)
            `,
    [tokenHashed, userId, expires_at],
  );
  return {
    token,
    expires_at,
  };
}

// GET A SESSION
export async function getSession(token: string) {
  const tokenHashed = hashSessionToken(token);

  const result = await pool.query(
    `
    SELECT 
        sessions.user_id,
        sessions.expires_at,
        users.email 
    FROM sessions 
    JOIN users 
        ON users.id=sessions.user_id 
    WHERE sessions.token_hash=$1 
        AND sessions.expires_at>NOW()
    `,
    [tokenHashed],
  );
  return result.rows[0] ?? null;
}

// DELETE A SESSION
export async function deleteSession(token: string) {
  const tokenHash = hashSessionToken(token);

  await pool.query(
    `
    DELETE FROM sessions
    WHERE token_hash = $1
    `,
    [tokenHash],
  );
}
