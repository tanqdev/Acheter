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

## 8. Added request validation

Created:

```text
server/src/auth/auth.validation.ts
```

Added Zod schemas for:

```text
signupSchema
loginSchema
```

Both validate the email and require a password of at least 8 characters.

The controllers use `safeParse()` so invalid requests return `400` before reaching the database logic.

## 9. Built the auth controller

The controller now handles:

```text
signup()
login()
logout()
getMe()
```

### Signup flow

```text
request
  ↓
validate with Zod
  ↓
check existing email
  ↓
createUser()
  ↓
INSERT INTO users
  ↓
201
```

Duplicate email → `409`.

Invalid input → `400`.

The actual `INSERT INTO users` happens inside `createUser()` in `auth.service.ts`.

### Login flow

```text
email + password
  ↓
validate
  ↓
findUserByEmail()
  ↓
verifyPassword()
  ↓
createSession()
  ↓
set HttpOnly cookie
  ↓
return user
```

One bug caught during implementation was forgetting:

```ts
await createSession(...)
```

Without `await`, I would only have the Promise instead of the actual session object.

### Logout flow

```text
session cookie
  ↓
deleteSession()
  ↓
clear cookie
  ↓
200
```

`200` is used instead of `201` because logout does not create a resource.

### `/auth/me`

`getMe()` returns the authenticated user attached by the auth middleware.

## 10. Added auth routes

The auth router now exposes:

```text
POST /auth/signup
POST /auth/login
POST /auth/logout
GET  /auth/me
```

`/auth/me` is protected:

```ts
router.get("/me", requireAuth, getMe);
```

## 11. Built authentication middleware

Created `requireAuth`.

Flow:

```text
cookie
  ↓
read session token
  ↓
getSession()
  ↓
valid session?
  ↙       ↘
yes       no
 ↓         ↓
req.user   401
 ↓
next()
```

Extended Express's `Request` type so TypeScript knows about:

```ts
req.user;
```

I also caught an important control-flow bug: after sending a `401` for an invalid session, the middleware must `return`. Otherwise it would continue and try to access `session.user_id` when `session` is missing.

## 12. Wired auth into Express

Updated the server for cookie-based authentication:

```ts
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
```

and:

```ts
app.use(cookieParser());
```

Mounted the auth router at:

```text
/api/auth
```

A mistaken auth-router import was also corrected during setup.

## 13. Built the frontend AuthContext

`AuthContext` now exposes:

```text
user
loading
signup()
login()
logout()
```

When the React app starts, it checks the backend:

```text
React app starts
  ↓
GET /auth/me
  ↓
valid session?
  ↙       ↘
yes       no
 ↓         ↓
setUser   setUser(null)
```

`credentials: "include"` is used so the browser sends the session cookie.

For `/auth/me`, I also added:

```ts
cache: "no-store";
```

so the authentication check is performed fresh.

## 14. Built the Login page

Created the manual TSX + Tailwind login UI.

It contains:

```text
email
password
loading state
error state
submit handler
```

The page uses:

```ts
const { login } = useAuth();
```

and on success:

```ts
await login(email, password);
navigate("/");
```

## 15. Built the Signup page

Created `Signup.tsx` using the same manual approach.

The page uses:

```ts
const { signup } = useAuth();
```

and:

```ts
await signup(email, password);
navigate("/login");
```

Signup does **not** call `setUser()` because the current signup endpoint only creates the account. It does not create a session.

So:

```text
Signup
  ↓
create account
  ↓
Login
  ↓
create session
```

A small `Content-Type` typo was also caught and fixed:

```text
apllication/json
```

→

```text
application/json
```

## 16. Connected and tested the frontend routes

Added:

```text
/signup
/login
```

and linked the two pages to each other.

Tested signup:

```text
valid signup      → 201
duplicate email   → 409
invalid input     → 400
```

The created user appeared in PostgreSQL.

## 17. Tested session persistence

After login:

```text
POST /auth/login
  ↓
session created in PostgreSQL
  ↓
session cookie stored in browser
```

Reloading the page kept the user logged in.

The `AuthProvider` called `/auth/me`, which restored the user from the server-side session.

This confirmed that authentication was not dependent only on React state.

## 18. Added logged-in UI and logout

The Products page now uses:

```ts
const { user, logout } = useAuth();
```

When logged in, it shows the user's email and a Logout button.

Logout:

```text
Logout
  ↓
POST /auth/logout
  ↓
delete session
  ↓
clear cookie
  ↓
setUser(null)
  ↓
navigate("/login")
```

The button also has a small Tailwind hover effect.

## 19. Final authentication testing

Verified the important states:

```text
Logged in
  ↓
GET /auth/me → authenticated response
```

After logout:

```text
GET /auth/me → 401 Unauthorized
```

The public products/home page can still be opened after logout, but the logged-in UI is hidden because:

```text
user === null
```

That is intentional. Product browsing is public; authenticated features such as cart, checkout, and order history will need protection later.

## 20. Things I learned from the implementation

```text
createSession() is async
→ use await before reading session.token
```

```text
401 response
→ return immediately from the middleware
```

```text
req.user
→ custom property on the Request object, not req.body
```

```text
signup()
→ creates an account but does not create a session
```

```text
login()
→ creates the session and updates React auth state
```

I also saw PostgreSQL `TIMESTAMPTZ` values displayed in UTC while my local time is IST. The stored UTC value is fine; the UI can convert it when displaying dates.

## Final Day 3 architecture

```text
React
  ↓
AuthContext
  ├── signup()
  ├── login()
  └── logout()
       ↓
Express
  ↓
Auth routes
  ├── Auth service
  │    └── Argon2id
  │
  └── Session layer
       └── SHA-256 token hash
              ↓
          PostgreSQL
          ├── users
          └── sessions
```

Session flow:

```text
random token
  ↓
SHA-256 hash → PostgreSQL
raw token → HttpOnly cookie
```

Protected request:

```text
cookie
  ↓
requireAuth
  ↓
getSession()
  ↓
req.user
  ↓
controller
```

## Day 3 status

```text
✅ Authentication foundation
✅ Argon2id password hashing
✅ Zod validation
✅ PostgreSQL sessions
✅ Signup
✅ Login
✅ Logout
✅ Auth middleware
✅ /auth/me
✅ AuthContext
✅ Login UI
✅ Signup UI
✅ Session persistence
✅ Browser testing
✅ Logged-in UI
```

**Day 3 is complete.**

Next: **Day 4 — Cart functionality.**
