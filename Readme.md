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

## User Preferences for Mentoring

- Never provide code unless explicitly requested
- Always begin by identifying the next file/folder
- Discuss architecture and algorithm first
- Review submitted code like a senior engineer
- Explain production best practices