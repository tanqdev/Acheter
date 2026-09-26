# Day 3 — Authentication (Checkpoint)

Day 3 was about setting up the authentication foundation. I stopped after the session and password-handling layer, before wiring the full signup/login flow.

## 1. Reworked the original auth plan

The original plan used:

```text
bcrypt + JWT
```

Before implementing it, I reconsidered whether that was the best approach for this project.

I decided to use:

```text
Argon2id + PostgreSQL-backed sessions
```

Why:
- Argon2id is designed for password hashing.
- Server-side sessions fit this app well because the session state lives in PostgreSQL.
- It lets me understand cookies, sessions, expiration, and middleware instead of putting everything inside a JWT.

OAuth/OIDC was also considered, but I kept email/password authentication for now because the goal is to understand the application's own authentication layer.

## 2. Added auth dependencies

Installed:

```text
argon2
zod
cookie-parser
```

Argon2 handles password hashing, Zod handles request validation, and cookie-parser lets Express read the session cookie.

## 3. Added the sessions table

Added a `sessions` table:

```sql
CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Also added indexes for `user_id` and `expires_at`.

The important design choice here is that the database stores a hash of the session token, not the raw token.

## 4. Built the session utility

Created:

```text
server/src/auth/session.ts
```

It handles:

```text
createSession()
getSession()
deleteSession()
```

A session flow looks like:

```text
random session token
        ↓
SHA-256 hash
        ↓
store hash in PostgreSQL

raw token
        ↓
HttpOnly cookie in browser
```

The token is generated with Node's built-in `crypto` module using 32 random bytes.

## 5. Added cookie configuration

Created:

```text
server/src/auth/auth.constants.ts
```

The local-development cookie is configured with:

```text
HttpOnly
SameSite=Lax
Secure=false
```

`Secure` will be enabled when the application is deployed over HTTPS.

## 6. Built the auth service

Created:

```text
server/src/auth/auth.service.ts
```

It currently handles:

```text
findUserByEmail()
createUser()
verifyPassword()
```

Passwords are never stored directly.

The flow is:

```text
password
   ↓
Argon2id
   ↓
password_hash
```

For login, the supplied password is verified against that hash.

## 7. Important distinction I learned

There are two different hashing use cases here.

Password:

```text
password
   ↓
Argon2id
   ↓
password_hash
```

Session token:

```text
random token
   ↓
SHA-256
   ↓
token_hash
```

They solve different problems. Password hashing is deliberately expensive; session tokens are already random and only need a deterministic hash for lookup.

## What remains for Day 3

The foundation is ready, but Day 3 is not finished yet.

Still to build:

```text
signup endpoint
login endpoint
logout endpoint
session cookie handling
authentication middleware
protected routes
signup/login UI
logged-in state
full auth testing
```

## Current architecture

```text
React
   ↓
Express
   ↓
Auth layer
   ├── Argon2id
   ├── Sessions
   └── PostgreSQL
```

## Day 3 checkpoint

Paused here before wiring the complete authentication flow.

Next session: connect the auth pieces into signup → login → session cookie → protected request → logout.
