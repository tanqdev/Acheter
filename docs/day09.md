# Day 09 --- Production Deployment & Authentication Fixes

**Project:** Acheter Hub\
**Day:** 09\
**Focus:** Deploying the full-stack application, configuring production
environments, fixing cross-origin session authentication, and verifying
persistent cart behaviour.

------------------------------------------------------------------------

## 1. Objectives

-   Deploy the Express + TypeScript backend.
-   Deploy the React + Vite + TypeScript frontend.
-   Connect the deployed application to Neon PostgreSQL.
-   Configure production environment variables and CORS.
-   Resolve cross-origin session-cookie issues.
-   Verify login, session persistence, and cart persistence in
    production.

## 2. Deployment Architecture

  Layer         Platform   Production URL / Purpose
  ------------- ---------- ---------------------------------------
  Frontend      Vercel     `https://acheterhub.vercel.app/`
  Backend API   Render     `https://acheter-server.onrender.com`
  Database      Neon       Hosted PostgreSQL

The frontend communicates with the backend through:

``` text
https://acheter-server.onrender.com/api
```

The backend connects to Neon through the `DATABASE_URL` environment
variable.

## 3. Backend Deployment --- Render

### Render service configuration

  Setting          Value
  ---------------- ----------------------------------------------
  Root Directory   `server`
  Build Command    `npm install --include=dev && npm run build`
  Start Command    `npm start`
  Instance         Free instance

Backend package scripts:

``` json
{
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js"
}
```

The TypeScript compiler builds the backend from `server/src` into
`server/dist`; production runs the compiled `dist/server.js`.

### Render environment variables

  Variable         Purpose
  ---------------- ---------------------------------------------------
  `DATABASE_URL`   Neon PostgreSQL connection string
  `CLIENT_URL`     `https://acheterhub.vercel.app`
  `NODE_ENV`       `production`, enabling production cookie settings

Render supplies `PORT` automatically; a fixed production port was not
required.

### Build error fixed

**Problem:** The first Render build failed because TypeScript
declaration packages, including `@types/pg` and `@types/cookie-parser`,
were unavailable during compilation.

**Cause:** The build uses `tsc`, which needs development dependencies
and type declarations. A production-only install omitted packages
required by the build.

**Fix:** Changed the Render build command to:

``` bash
npm install --include=dev && npm run build
```

The deployment then built and started successfully. Render logs
confirmed:

``` text
> server@1.0.0 start
> node dist/server.js

server running on port 10000
Your service is live
```

### Backend health check

Tested:

`https://acheter-server.onrender.com/api/health`

The endpoint returned a successful response containing `success: true`,
the server-running message, and a database timestamp from PostgreSQL.
This confirmed that the deployed backend could connect to Neon.

The root URL `/` returned `Cannot GET /`. This was expected because no
root route was configured; `/api/health` is the health-check endpoint.

## 4. Frontend Deployment --- Vercel

The React + Vite + TypeScript client was deployed to Vercel.

Configured the Vercel environment variable:

``` env
VITE_API_URL=https://acheter-server.onrender.com/api
```

The client API helper supports both local and production environments:

``` ts
const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

const localApiUrl =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? `${window.location.protocol}//${window.location.hostname}:5000/api`
    : undefined;

export const API_URL = configuredApiUrl || localApiUrl || "/api";
```

-   Production uses `VITE_API_URL` to reach Render.
-   Local development builds the API URL using the current local
    hostname and port `5000`.
-   `/api` is the fallback.

The Vite production build completed. It emitted a `__dirname` warning
from the Vite configuration and a warning that a JavaScript chunk
exceeded 500 KB. These did not block deployment and were not addressed
on Day 09.

## 5. Environment Files and Git Hygiene

Example environment files were reviewed so required configuration could
be documented without committing secrets.

### `client/.env.example`

``` env
# Optional: public URL of the API used by the Vite client.
VITE_API_URL=http://localhost:5000/api
```

### `server/.env.example`

``` env
DATABASE_URL=
CLIENT_URL=http://localhost:5173
```

Actual `.env` files must remain local and must not be committed.

The client and server `.gitignore` files were configured to ignore
environment files while keeping `.env.example` trackable:

``` gitignore
.env
.env.*
!.env.example
```

The server ignore file also included:

``` gitignore
node_modules/
dist/
*.log
```

A tracking check was run:

``` bash
git ls-files | findstr /i ".env"
```

At the time of the check, only `client/.env.example` was listed; no
actual `.env` file was tracked.

## 6. Production CORS and Cookie Configuration

The frontend and backend run on separate HTTPS origins:

-   Frontend: `https://acheterhub.vercel.app`
-   Backend: `https://acheter-server.onrender.com`

This requires credentialed cross-origin requests and correctly
configured cookies.

### CORS in `server/src/server.ts`

The backend reads allowed origins from `CLIENT_URL`, while retaining
local development origins. The relevant configuration was:

``` ts
const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...configuredOrigins,
]);

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
```

Important details:

-   `CLIENT_URL` must exactly match the deployed frontend origin.
-   `credentials: true` allows credentialed cross-origin requests.
-   `trust proxy` is enabled in production for the reverse-proxy
    deployment environment.
-   Localhost origins remain available for development.

**Issue fixed:** The deployed frontend origin was initially rejected by
CORS. `CLIENT_URL` was corrected to the exact Vercel origin, and the
backend was redeployed. The website then communicated with the API
successfully.

### Session cookie settings

The configuration in `server/src/auth/auth.constants.ts` was reviewed:

``` ts
export const SESSION_COOKIE = "session";

const isProduction = process.env.NODE_ENV === "production";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  path: "/",
};
```

Production behaviour:

-   `httpOnly: true` prevents client-side JavaScript from reading the
    session cookie.
-   `secure: true` requires HTTPS.
-   `sameSite: "none"` allows the cookie to be sent in cross-site
    requests.
-   `path: "/"` makes it available across application paths.

The session duration remained seven days:

``` ts
1000 * 60 * 60 * 24 * 7
```

`NODE_ENV=production` was added to Render to activate the production
cookie settings.

## 7. Authentication and Session Flow

The existing backend session implementation was reviewed.

### Session implementation

The session utility:

-   Generates a cryptographically random 32-byte token.
-   Hashes the token with SHA-256 before storing it in PostgreSQL.
-   Uses a seven-day session duration.
-   Supports session creation, lookup, and deletion.

The raw token is sent to the browser as an HTTP-only cookie; the
database stores its hash.

### Backend authentication controller

The login controller verifies credentials, creates a session, and sets
the session cookie using the shared cookie options and seven-day maximum
age.

The logout controller reads the session cookie, deletes the
corresponding session, and clears the cookie using the same options.

The `/auth/me` endpoint returns the authenticated user when a valid
session is present.

The existing backend session utility and cookie constants did not
require code changes during this debugging process.

### Frontend `AuthContext`

The frontend authentication context was reviewed to ensure requests
include cookies.

It:

-   Calls `GET /auth/me` when the application loads to restore the
    session.
-   Uses `credentials: "include"` for authentication requests.
-   Maintains loading state while checking the session.
-   Sets the user to `null` when the session check fails.
-   Includes credentials in login and logout requests.

The signup request was also updated to include:

``` ts
credentials: "include"
```

### Browser verification

Chrome DevTools was used to inspect the production authentication flow.

The Network panel showed:

-   Logout request: `200`
-   Login preflight request: `204`
-   Login request: `200`

The login response included a session cookie with the expected
production attributes:

``` text
HttpOnly; Secure; SameSite=None
```

The cookie was also visible under Application → Storage → Cookies for
the Render backend origin.

## 8. Cart Requests and Session Persistence

The production cart issue was investigated after login appeared to work
but cart requests were treated as unauthenticated.

The frontend cart implementation was reviewed. These requests already
included `credentials: "include"`:

-   `GET /cart`
-   `PATCH /cart/:productId`
-   `DELETE /cart/:productId`

The cart component also handled `401` responses by showing the sign-in
prompt.

No backend cart-service change was needed for this issue. The browser
needed to send the session cookie with cross-origin API requests.

### Final verification

After correcting the production configuration and testing the session
flow, the user confirmed that:

-   Login succeeds on the deployed website.
-   The session cookie is stored by the browser.
-   Products can be added to the cart.
-   Refreshing the page does not log the user out.
-   Cart contents persist after refresh.
-   The session and cart continue working after closing and reopening
    the browser.

**Result:** The production authentication and cart-persistence issue was
resolved.

The precise reason the issue began working during the debugging session
was not conclusively isolated, but the final production checks passed.

## 9. Files and Areas Reviewed or Changed

  --------------------------------------------------------------------------
  File / Area                            Work performed
  -------------------------------------- -----------------------------------
  `server/src/server.ts`                 Reviewed production CORS
                                         configuration, allowed origins,
                                         proxy trust, middleware, health
                                         endpoint, and API route mounting

  `server/src/auth/auth.constants.ts`    Verified environment-dependent
                                         cookie options

  `server/src/auth/auth.controller.ts`   Reviewed login, logout,
                                         cookie-setting, and current-user
                                         behaviour

  `server/src/auth/sessions.ts`          Reviewed secure token generation,
                                         hashing, session creation, lookup,
                                         and deletion

  `client/src/context/AuthContext.tsx`   Reviewed session restoration and
                                         credentialed authentication
                                         requests; signup request was
                                         updated to include credentials

  `client/src/lib/api.ts`                Verified local and production API
                                         URL selection

  `client/src/pages/Cart.tsx`            Verified credentialed cart requests
                                         and unauthenticated response
                                         handling

  `client/.env.example`                  Documented the client API URL
                                         variable

  `server/.env.example`                  Documented server environment
                                         variables

  `client/.gitignore`                    Ensured actual environment files
                                         are ignored while `.env.example`
                                         remains trackable

  `server/.gitignore`                    Ensured environment files, build
                                         output, dependencies, and logs are
                                         ignored

  `server/package.json`                  Verified build and production start
                                         scripts

  Render service settings                Corrected build command and
                                         configured production environment
                                         variables

  Vercel project settings                Configured the production API URL
  --------------------------------------------------------------------------

> This table records files and areas reviewed or involved. It does not
> imply every listed file was modified.

## 10. Errors and Issues Resolved

  ----------------------------------------------------------------------------------------------
  Issue                   Cause                   Resolution
  ----------------------- ----------------------- ----------------------------------------------
  Render TypeScript build Development type        Changed build command to
  failed                  packages were omitted   `npm install --include=dev && npm run build`
                          during installation     

  Deployed frontend       `CLIENT_URL` did not    Set `CLIENT_URL=https://acheterhub.vercel.app`
  origin rejected by CORS exactly match the       and redeployed
                          Vercel origin           

  Production cookie       Frontend and backend    Set `NODE_ENV=production` and verified
  configuration needed    use separate HTTPS      `Secure`, `HttpOnly`, and `SameSite=None`
                          origins                 cookie attributes

  Login/cart              Cross-origin session    Inspected Network and browser cookie storage;
  authentication appeared cookie behaviour needed verified credentialed requests and session
  inconsistent            verification            persistence

  Cart displayed sign-in  Cart requests depend on Verified `credentials: "include"` on cart
  state after             the browser sending the requests and confirmed the production flow
  authentication          session cookie          worked
  ----------------------------------------------------------------------------------------------

## 11. Final Production Verification

  Check                                            Result
  ------------------------------------------------ --------
  Render backend deployment                        Passed
  Backend health endpoint                          Passed
  Neon database connection from deployed backend   Passed
  Vercel frontend deployment                       Passed
  Frontend-to-backend API communication            Passed
  Production CORS configuration                    Passed
  Login                                            Passed
  Session cookie storage                           Passed
  Session restoration after refresh                Passed
  Add product to cart                              Passed
  Cart persistence after refresh                   Passed
  Session/cart persistence after browser restart   Passed

## 12. Notes and Follow-up Items

These items were observed but were not part of the completed deployment
fix:

-   The Vite build reported a `__dirname` warning in the Vite
    configuration.
-   The Vite build reported a JavaScript chunk larger than 500 KB.
-   Render displayed a PostgreSQL SSL warning concerning
    `sslmode=require` semantics. It did not block the health check or
    deployment.
-   npm reported three audit vulnerabilities: one moderate and two high.
    These were not investigated on Day 09.
-   The backend root path `/` has no route; the health endpoint is
    `/api/health`.

### Security follow-up

A database connection string was exposed during development
troubleshooting. Before treating the deployment as production-ready,
rotate the Neon database password, update `DATABASE_URL` in Render and
the local server environment, and ensure the old credential is no longer
used. Never commit real secrets to Git.

### Suggested next steps

1.  Test the complete checkout and order-creation flow in production.
2.  Verify that inventory is deducted correctly after checkout.
3.  Test concurrent checkout attempts to confirm overselling is
    prevented.
4.  Verify order history and user-specific data isolation.
5.  Test logout and protected routes in production.
6.  Complete the README, setup instructions, screenshots, and final
    project documentation.
7.  Investigate the outstanding build warnings and npm audit findings.

------------------------------------------------------------------------

## Day 09 Outcome

**Acheter Hub was successfully deployed.** The React frontend is hosted
on Vercel, the Express + TypeScript API is hosted on Render, and the
application uses Neon PostgreSQL. The production build issue and CORS
configuration issue were fixed, and the cross-origin session-cookie flow
was verified. Login, session restoration, and persistent cart behaviour
all passed the final production checks.

**Day 09 deployment and authentication verification: complete.**
