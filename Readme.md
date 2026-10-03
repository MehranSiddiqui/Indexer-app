# Rocket Indexer — Auth Service Development Handover

> **Purpose:** This document contains a detailed summary of everything implemented so far so that a new mentoring conversation can continue without losing context. The mentoring style should remain: explain architecture first, identify the next file to work on, discuss algorithms, and only provide code when explicitly requested.

## Project Architecture

- Microservice currently being developed: **Auth Service**
- Architecture: **Controller → Service → Repository → Prisma Database**
- Controllers only handle HTTP concerns (req/res, cookies, status codes)
- Services contain all business logic
- Repositories perform only database operations
- DTOs are used for request/response objects
- Global error handling through `AppError` and `asyncHandler`

## Milestones

### Milestone 1 — Project Setup
- Configured TypeScript project
- Configured Prisma ORM
- Created folder structure for controllers, services, repositories, routes, DTOs, middlewares, utils and constants
- Environment variables managed through env helper
- JWT utilities created
- Password hashing utilities created
- Cookie configuration centralized in constants

### Milestone 2 — Registration
- Registration endpoint implemented
- Email uniqueness validation
- Password hashing before persistence
- Repository creates user
- Response DTO returns sanitized user

### Milestone 3 — Login
- Validate email exists
- Compare plaintext password with bcrypt hash
- Generate Access Token
- Generate Refresh Token
- Persist refresh token in `RefreshToken` table with `expiresAt`
- Return `LoginResult` containing `accessToken`, `refreshToken` and `LoginResponse` DTO
- Controller sets refresh token as HTTP-only cookie

**Refresh Token table:**
- Columns: `id`, `token`, `expiresAt`, `revoked`, `userId`, `createdAt`
- Recommended: `token` column should be `@unique`
- Each row represents a login session

### Milestone 4 — Refresh Token Rotation
- Repository methods added: find refresh token by token, update refresh token by id
- Algorithm:
  1. Validate refresh token exists
  2. Verify JWT signature
  3. Query DB using refresh token
  4. Reject if token missing
  5. Verify `decoded.id` equals `token.userId`
  6. Reject if revoked
  7. Reject if DB `expiresAt` < current time
  8. Generate new access token
  9. Generate new refresh token
  10. Update existing DB record (token + expiresAt)
  11. Return `RefreshDTO { accessToken, refreshToken }`
- **Design decision:** rotate the existing record instead of creating a second row

### Milestone 5 — Logout
- `POST /auth/logout` chosen instead of `DELETE`
- Service algorithm:
  1. Read refresh token
  2. Verify JWT
  3. Lookup refresh token in DB
  4. Verify ownership
  5. Reject if revoked
  6. Revoke refresh token in DB
- Controller responsibilities:
  - Read cookie
  - Call service
  - Clear HTTP-only cookie
  - Return success response

### Milestone 6 — Authentication & Authorization
- Implemented `authenticate` middleware
- Validates `Authorization` Bearer header
- Verifies JWT access token
- Attaches decoded payload to `req.user` via `express.d.ts` augmentation
- Protected `GET /auth/profile` endpoint
- Introduced `UserDetailDTO` for sanitized responses
- Design: Controller → Service → Repository separation preserved

### Milestone 7 — Email Verification
- Implemented `EmailVerification` repository and complete verification flow
- Registration now:
  1. Creates user
  2. Generates cryptographically secure random token
  3. Persists token with expiry
  4. Builds frontend verification URL
  5. Sends email using provider abstraction (Resend)
- Verification flow validates token, checks expiry, verifies user, deletes token

### Milestone 8 — Forgot Password
- Implemented forgot password repository and service
- Flow:
  - Lookup user
  - Generate reset token
  - Persist token with expiry
  - Send reset email with frontend URL

### Milestone 9 — Reset Password
- Implemented reset password:
  - Validate token
  - Check expiry
  - Find user
  - Prevent invalid flow
  - Hash new password
  - Update password
  - Delete reset token
  - Revoke all refresh tokens
  - Send confirmation email

### Milestone 10 — Change Password
- Authenticated endpoint using Bearer token
- Uses `req.user.id` from JWT instead of accepting `userId`
- Validates current password
- Prevents password reuse
- Hashes password
- Revokes all refresh tokens
- Sends notification email

## Design Decisions

- JWT verified before DB lookup
- Repository methods should describe persistence, not business actions
- Refresh service returns DTO; controller handles cookies
- Refresh token rotation updates existing record
- Authentication logic never accesses Express request objects directly
- Change Password and Reset Password remain separate services
- User identity comes from access token, never request body
- Email failures after password update are logged without rolling back the password update
- DTO pattern continued
- Repository layer contains persistence only

## Important Discussions

- Difference between User ID and RefreshToken table ID
- Reason for using `findByToken()`
- Reason `token` column should be unique
- Why verify JWT before querying DB
- Difference between Access Token and Refresh Token
- Difference between session rotation and session creation
- Discussion on multiple sessions vs single session

## Current Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/profile`

## Deferred Improvements

- Prisma Transactions (Registration, Verify Email, Reset Password, Change Password)
- Redis
- Rate Limiting
- RBAC
- OAuth
- MFA
- `passwordChangedAt` support
- Structured logging (Pino)
- Automated tests

## Where We Are Right Now

**Auth Service ~95% complete.**

**Completed:**
- ✅ Registration
- ✅ Login
- ✅ Refresh Token Rotation
- ✅ Logout
- ✅ Authentication Middleware
- ✅ Protected Routes
- ✅ Current User Endpoint
- ✅ Email Verification
- ✅ Forgot Password
- ✅ Reset Password
- ✅ Change Password

**Next:**
1. Resend Verification Email
2. Redis Integration
3. Rate Limiting
4. Prisma Transactions
5. RBAC
6. OAuth
7. Logging
8. Testing

**After Auth Service:**

API Gateway → URL Submission Service → Queue Service → Worker Service → Reporting Service → Notification Service

---

# URL Submission Service — Development Handover

> Rebuilt from scratch (previous scaffold discarded). Same mentoring style as Auth Service.

## Project Architecture

- Same layering as Auth Service: **Controller → Service → Repository → Prisma Database**
- Deliberate deviation: Repository layer uses **hand-written raw SQL** via `prisma.$queryRaw`/`$executeRaw` instead of Prisma's fluent query API — a learning choice so SQL is written and understood directly, not generated
- Prisma is still used for schema definition, migrations, and as the execution engine underneath the raw queries
- Database-per-service boundary: url-service's database holds only what url-service owns. Job processing state (once Queue/Worker Service exists) will live in that service's own database, not here — url-service will only persist a `Url` and, later, publish an event for it to be picked up

## Milestone 1 — Project Setup (Day 1)

- Scaffolded `package.json`, `tsconfig.json`
- `tsconfig.json` now extends the shared monorepo config (`packages/config/tsconfig/tsconfig.json`), same as auth-service — it had been left as the raw Prisma-generated default, which caused a real type error (`exactOptionalPropertyTypes` rejecting `prisma.config.ts`'s `datasource.url: string | undefined`)
- Centralized env access through `src/config/env.ts` (zod-validated) instead of reading `process.env` directly in `app.ts`/`server.ts`
- Fixed a zod schema key-casing bug (`port` vs `PORT`) that would have crashed on import
- Fixed `/health` route — handler had no `(req, res)` signature and never sent a response, so it would hang indefinitely
- Cleaned up dead code carried over from copy-pasting auth-service (unused `PORT` const, stray `connectRedis()` comment, inverted `dependencies`/`devDependencies`)

### Schema design decisions
- **Dropped `Project` and `IndexingJob` from scope.** Considered keeping `Project` (domain grouping, ownership verification, per-domain rate limiting) but no current requirement needs it — deferred until domain-ownership verification is an actual feature ("maybe later")
- **`IndexingJob` belongs to Queue/Worker Service**, not url-service, once that service exists — avoids blurring database-per-service boundaries
- **URL normalization** (for the dedup key `normalizedUrl`, not the stored raw `url`): lowercase host, collapse `www.` prefix, collapse `http`/`https` scheme, strip tracking query params (`utm_*` etc.), strip trailing slash. Rationale: the service's purpose is fast crawling/indexing, not SEO canonical-state tracking, so collapsing scheme/www for dedup purposes is acceptable (unlike classic SEO normalization, where those distinctions matter)
- **Dedup scope: per-user** (`@@unique([userId, normalizedUrl])`), not global. Two different users submitting the same URL currently creates two rows (and, eventually, two crawl jobs). Global dedup (one canonical row + a separate submission-tracking table) deferred until Queue/Worker exists and redundant-crawl cost is observable

### Current schema (`prisma/schema.prisma`)
```
Url
  id, userId, url, normalizedUrl, createdAt, updatedAt
  @@unique([userId, normalizedUrl])
  @@index([userId])
```

## Open items carried into Day 2

- `Project` model is still physically present in `schema.prisma`, fully disconnected (no relation, no `userId`) — pending decision: delete it now, or keep as a placeholder for later
- ✅ Resolved: `prisma migrate dev` run (several times, including recoveries from failed migrations — see Milestone 4)
- ✅ Resolved: `src/config/prisma.ts` built and in use throughout the repository layer
- ✅ Resolved: full `src/` skeleton built out — `controllers`, `services`, `repositories`, `DTO`, `utils`
- Cross-service authentication approach still undecided: does url-service verify the auth-service-issued JWT locally (needs a shared `JWT_ACCESS_SECRET`), or call auth-service's API per request to validate the session? (`req.user` is populated somewhere upstream of the controllers reviewed below, but the mechanism wasn't part of this stretch of work)

## Milestone 2 — SSRF-Safe URL Validation (Phase 0 hardening)

`src/utils/validateTargetUrl.utils.ts`, called from `url.service.ts#addNewURL` before normalization/insert. Layered checks, in order:
- **Length** — rejects before parsing if the raw URL exceeds `env.MAX_URL_LENGTH` (also re-checked after normalization, since normalization can change length)
- **Protocol allowlist** — only `http:`/`https:`
- **Port** — must match the scheme's own default exactly (80 for http, 443 for https); `URL.port` is empty string for the default, so empty is treated as the scheme default before comparing
- **Credentials** — rejects any URL with a non-empty `username` or `password`
- **Hostname blocklist** — `localhost`, `.local`, `.localhost`, `.internal`, and any no-dot hostname, after stripping IPv6 brackets and a trailing dot
- **IP-literal range check** — via `ipaddr.js`; unwraps IPv4-mapped IPv6 (`::ffff:127.0.0.1`) before checking; only `range() === "unicast"` (public) passes
- **DNS resolution** — for non-IP hostnames, resolves *all* A/AAAA records (`node:dns/promises` `lookup(host, {all:true})`) against a manual timeout race, and rejects if *any* resolved address is non-public (defends against a domain that round-robins between a public and a private address)

**Known limitation, explicitly not solved here:** this only validates at submit time. It does not protect against a URL that resolves safely now but redirects to an internal address at crawl time, or DNS-rebinding between validation and the actual crawl. The Phase 1 pre-flight worker will need to re-validate every redirect hop and connect to the already-validated IP, not re-resolve the hostname.

## Milestone 3 — Status Tracking System

Added to `Url`: `status` (new `UrlStatus` enum — `Pending, Submitted, Failed, Indexed, Blocked, Queued, Aborted`), `statusReason` (nullable text), `statusUpdatedAt`.

- `createUrl`'s `ON CONFLICT` resets `status→Pending`, clears `statusReason`, refreshes `statusUpdatedAt`, resets `publishAttempts→0` — a resubmit is treated as a fresh start (and, per Milestone 4, also revives a soft-deleted row)
- `markPublished` sets `status→Queued`
- `increaseAttempt` sets `status→Failed` once the retry cap is exceeded; because Postgres evaluates every expression in one `UPDATE ... SET` against the row's pre-update values, `WHEN "publishAttempts" < 5` actually trips on the row's *old* value of 5, i.e. the cap fires on the 6th failed attempt, not the 5th — verified live by inserting a row and calling `increaseAttempt` 7 times
- `getUnPublishedUrls` (feeds the publish cron) filters on `"status" = 'Pending'`
- A generic `updateURLStatus` repository method exists for writing any status value, but is intentionally **not** exposed through a public route (see Milestone 4) — it's reserved for whatever internal process ends up reporting `Submitted`/`Indexed`/`Blocked` back from the not-yet-built Phase 1 consumer

**Known outstanding concern, not yet re-verified:** the `add_url_status` migration's backfill for pre-existing rows was written with a condition (`WHERE "publishedAt" IS NULL`) that reads inverted — rows that *were* published should backfill to `Queued`, rows that never were should stay `Pending`. This hasn't caused visible harm yet only because the table has been empty every time this migration ran; needs re-checking (and a follow-up migration if still wrong) once real data exists.

## Milestone 4 — Soft Delete & Manual Re-index

Added to `Url`: `isDeleted` (boolean, `@default(false)`), `deletedAt` (nullable timestamp).

- Every read query that lists or fetches a URL (`findURLById`, `getAllUrls`, `getUnPublishedUrls`) now filters `"isDeleted"=false AND "deletedAt" IS NULL`
- `deleteUrl` sets `isDeleted=true, deletedAt=now(), status='Aborted', statusReason='Deleted by user'`, guarded by `AND "isDeleted"=false` so a repeat delete call is a no-op (returns zero rows) instead of overwriting `deletedAt`
- Resubmitting a previously-deleted URL (same `userId`+`normalizedUrl`) revives it via the `createUrl` upsert, which also resets `isDeleted`/`deletedAt`
- **Design decision:** the "update status" endpoint was deliberately narrowed rather than left generic. Originally it accepted an arbitrary `status`/`reason` from the request body, which meant any authenticated user could set their own URL's status directly to `Indexed`/`Blocked`/`Submitted` — states that should only ever be written by the internal crawl pipeline. It's now a dedicated re-index action: the controller no longer reads `status`/`reason` from the body at all, and the repository/service hardcode `status='Pending', statusReason='Manual reindex initiated'`
- Adding `Aborted` to the `UrlStatus` enum needed its own migration (`ALTER TYPE ... ADD VALUE`), separate from any migration that uses the new value in the same transaction — Postgres forbids referencing a brand-new enum value before the transaction that added it has committed

## Milestone 5 — Pagination with Total Count

`getAllUrls` now returns the total matching row count alongside the page, using a `COUNT(*) OVER()` window function rather than a second round-trip query.

- Postgres `COUNT(*)` maps to JS `bigint`, which doesn't survive `JSON.stringify`/`res.json()` — the service converts it to `Number(...)` before it reaches the response
- The window-function count is attached per-row, so it disappears entirely when the page has zero rows (offset past the last page, or a user with no URLs at all) — the service treats an empty result as `{ urls: [], total: 0 }` rather than reading `totalCount` off a nonexistent row
- This also replaced the old behavior of throwing a 404 on an empty result — an empty page is a normal pagination outcome, not an error

## Deferred Improvements (url-service)

- **Publishing hardening** (deliberately deferred, not part of the three features above): RabbitMQ publisher confirms, a mandatory-flag + queue re-assertion on startup, `SKIP LOCKED` in the batch poll query. Known gap in the meantime: `publishUrl` sends the message and then marks it published as two separate steps — if the send succeeds but the mark-published write fails, the row stays `Pending` and gets re-sent by the next cron cycle (duplicate delivery risk)
- Extract the retry-cap magic number (`5`, in `increaseAttempt`) into a named constant
- Re-verify (and fix if still wrong) the inverted backfill condition noted in Milestone 3
- Move `validateTargetUrl` into `packages/shared` once the Phase 1 pre-flight worker is built, per the standing "implement in url-service first, backport later" convention — and make sure that worker re-validates every redirect hop rather than trusting submit-time validation alone

## User Preferences for Mentoring

- Never provide code unless explicitly requested
- Always begin by identifying the next file/folder
- Discuss architecture and algorithm first
- Review submitted code like a senior engineer
- Explain production best practices