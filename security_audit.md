# 🔴 Security Audit Report — Apna Pani (AquaFlow)

**Audit Date:** June 12, 2026  
**Scope:** Full-stack — Express.js server, React frontend, MongoDB, Socket.IO, Capacitor mobile  
**Total Files Reviewed:** 50+  
**Total Vulnerabilities Found:** 27

---

## Severity Summary

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 **CRITICAL** | 7 | Immediate exploitation possible, full compromise |
| 🟠 **HIGH** | 8 | Significant security impact, exploit with moderate effort |
| 🟡 **MEDIUM** | 7 | Security weakness, needs attacker context |
| 🔵 **LOW** | 5 | Hardening issues, minor information leaks |

---

## 🔴 CRITICAL Vulnerabilities

---

### CRIT-01: Plaintext Password Storage in Database

> [!CAUTION]
> **CVSS: 9.8** — Passwords are stored in plaintext alongside their hashed versions. A single database breach exposes ALL user credentials.

**Affected Files:**
- [User.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/models/User.js#L36-L38) — `passwordText` field definition
- [registerSupplierHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/users/registerSupplierHandler.js#L83-L84) — Stores plaintext: `passwordText: password`
- [registerCustomerHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/users/registerCustomerHandler.js#L93-L94) — Same pattern
- [registerRiderHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/users/registerRiderHandler.js#L83-L84) — Same pattern
- [resetPasswordHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/auth/resetPasswordHandler.js#L43-L44) — `user.passwordText = newPassword`
- [admin.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/admin.routes.js#L117-L118) — Admin change-password also stores plaintext
- [supplier.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/supplier.routes.js#L172-L173) — Customer update stores plaintext
- [supplier.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/supplier.routes.js#L248-L250) — Rider update stores plaintext
- [seed.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/utils/seed.js#L25) — Super admin seed with plaintext

**Exploit Scenario:**
1. Attacker gains read access to MongoDB (via NoSQL injection, leaked credentials, or misconfigured Atlas access)
2. Reads `passwordText` field from ALL users — no cracking needed
3. Full account takeover for every user in the system, including super admin

**Remediation:**
- **Remove the `passwordText` field entirely** from the User schema and all code that sets it
- Never store plaintext passwords under any circumstances
- If you need credential display for suppliers creating sub-accounts, generate a one-time-viewable password and show it only at creation

---

### CRIT-02: Credentials & Secrets Committed to Git

> [!CAUTION]
> **CVSS: 9.1** — Production MongoDB URI, JWT secrets, and super admin password are committed in `.env` file inside the repository.

**Affected Files:**
- [.env](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/.env) — Contains:
  - **Line 3:** Full MongoDB Atlas connection string with username/password: `muhammadumarhassan987_db_user:IPJLnyw1HC1FlYH5`
  - **Line 4:** JWT secret: `aquaflow-jwt-secret-2025-production`
  - **Line 5:** JWT refresh secret: `aquaflow-refresh-secret-2025-production`
  - **Line 17-19:** Super admin phone, email, and password (`admin123`)

**Exploit Scenario:**
1. Attacker clones the repository (if public) or gains access to any developer's machine
2. Connects directly to the production MongoDB Atlas cluster
3. Forges JWT tokens using the known secret to impersonate any user
4. Logs in as super admin with `admin@aquaflow.com` / `admin123`

**Remediation:**
- **Immediately rotate ALL exposed secrets:** MongoDB password, JWT secrets, admin password
- Add `.env` to `.gitignore` (it already is, but the file was committed before — you must purge git history)
- Run `git filter-branch` or use `BFG Repo-Cleaner` to remove `.env` from git history
- Use environment-injected secrets in production (Railway env vars, etc.)

---

### CRIT-03: Weak & Hardcoded JWT Secrets

> [!CAUTION]
> **CVSS: 9.0** — JWT secrets are guessable human-readable strings, enabling token forgery.

**Affected Files:**
- [.env](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/.env#L4-L5) — `aquaflow-jwt-secret-2025-production` and `aquaflow-refresh-secret-2025-production`
- [generateTokens.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/auth/generateTokens.js#L18-L36) — Signs tokens with these secrets

**Exploit Scenario:**
1. Attacker guesses or brute-forces the simple secret pattern
2. Forges access tokens with `role: "super_admin"` to gain full admin access
3. Creates orders, modifies suppliers, or deletes data at will

**Remediation:**
- Use cryptographically secure random secrets (minimum 256 bits / 64 hex chars)
- Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Rotate secrets periodically

---

### CRIT-04: Password Reset Code Leaked in API Response

> [!CAUTION]
> **CVSS: 9.0** — The forgot-password endpoint returns the reset verification code directly in the API response body.

**Affected File:**
- [forgotPasswordHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/auth/forgotPasswordHandler.js#L41-L45) — Returns `debugCode: resetCode` in response

**Exploit Scenario:**
1. Attacker calls `POST /api/auth/forgot-password` with any known email
2. The response body contains the 6-digit reset code
3. Attacker immediately calls `POST /api/auth/reset-password` with the code
4. Full account takeover of any user whose email is known

**Remediation:**
- **Remove `debugCode` from the response immediately**
- The code should only be delivered via email/SMS, never in the API response
- Add rate limiting specifically on the reset endpoint

---

### CRIT-05: Plaintext Passwords Exposed via API Responses

> [!CAUTION]
> **CVSS: 8.5** — Multiple API endpoints populate and return `passwordText` (plaintext passwords) in responses.

**Affected Files:**
- [admin.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/admin.routes.js#L18) — `.populate('userId', 'fullName phone email username passwordText')` — leaks ALL supplier passwords to admin
- [supplier.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/supplier.routes.js#L130) — `.populate('userId', 'fullName phone email isActive username passwordText')` — leaks customer passwords
- [supplier.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/supplier.routes.js#L210) — Same for riders
- [updateProfileHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/users/updateProfileHandler.js#L96) — Socket emit includes `passwordText`

**Exploit Scenario:**
1. Any authenticated supplier calls `GET /api/suppliers/customers`
2. Response includes plaintext passwords of all their customers
3. Supplier (or attacker with supplier credentials) can log in as any of their customers/riders
4. Man-in-the-middle attack can intercept passwords from API responses

**Remediation:**
- **Remove `passwordText` from ALL `.populate()` and `.select()` calls**
- Remove the `passwordText` field from the schema entirely
- Audit every query that joins User data to ensure password fields are excluded

---

### CRIT-06: Unauthenticated WebSocket Connections

> [!CAUTION]
> **CVSS: 8.0** — Socket.IO accepts any connection without authentication. Anyone can join any supplier's room.

**Affected File:**
- [index.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/index.js#L168-L179) — No auth middleware on socket connections

```javascript
io.on('connection', (socket) => {
  // No token verification whatsoever
  socket.on('join_supplier_room', (supplierId) => {
    socket.join(supplierId); // Any client can join ANY supplier room
  });
});
```

**Exploit Scenario:**
1. Attacker connects to the WebSocket endpoint (no credentials needed)
2. Emits `join_supplier_room` with any supplier's ID
3. Receives all real-time events: new orders, customer updates, payment notifications, invoice data
4. Full real-time surveillance of any supplier's business operations

**Remediation:**
- Add JWT authentication middleware to Socket.IO:
```javascript
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});
```
- Validate that users can only join rooms they are authorized for

---

### CRIT-07: Default Super Admin Credentials

> [!CAUTION]
> **CVSS: 8.0** — Super admin is seeded with `admin123` password, which is never forced to change.

**Affected Files:**
- [seed.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/utils/seed.js#L24-L25) — `password: process.env.SUPER_ADMIN_PASSWORD || 'admin123'`
- [.env](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/.env#L19) — `SUPER_ADMIN_PASSWORD=admin123`
- [.env.example](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/.env.example#L19) — Same weak default

**Exploit Scenario:**
1. Attacker attempts `POST /api/auth/admin/login` with `admin@aquaflow.com` / `admin123`
2. Gains full super admin access
3. Can create/delete suppliers, modify plans, view all business data

**Remediation:**
- Force password change on first login
- Set a strong, unique default in production
- Add password complexity requirements (uppercase, numbers, special chars, minimum 12 chars)

---

## 🟠 HIGH Vulnerabilities

---

### HIGH-01: No Input Validation / Sanitization (NoSQL Injection Risk)

> [!WARNING]
> **CVSS: 7.5** — User inputs from `req.body` are passed directly into MongoDB queries without sanitization.

**Affected Files (examples):**
- [loginHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/auth/loginHandler.js#L27-L31) — `identifier` used directly in `$or` query
- [forgotPasswordHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/auth/forgotPasswordHandler.js#L25) — `email` used directly in `findOne`
- [resetPasswordHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/auth/resetPasswordHandler.js#L29) — `email` in `findOne`
- All route handlers accept `req.params.id` without ObjectId validation

**Exploit Scenario:**
1. Attacker sends `POST /api/auth/login` with body: `{"identifier": {"$gt": ""}, "password": {"$gt": ""}}`
2. MongoDB interprets this as a query operator, potentially matching the first user
3. With `$regex` operators, attacker can extract data character by character

**Remediation:**
- Install and use `express-mongo-sanitize` middleware
- Add `app.use(mongoSanitize())` before routes
- Validate all ObjectId params with `mongoose.Types.ObjectId.isValid()`
- Use a validation library like `joi` or `zod` for all inputs

---

### HIGH-02: Missing Authorization on Critical Order Endpoints

> [!WARNING]
> **CVSS: 7.5** — `POST /api/orders` and `PUT /api/orders/:id/status` lack role-based access control.

**Affected File:**
- [order.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/order.routes.js#L18) — `router.post('/', asyncHandler(createOrder))` — No `requireRole()` check
- [order.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/order.routes.js#L34) — `router.put('/:id/status', asyncHandler(updateOrderStatus))` — No role check
- [order.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/order.routes.js#L40) — `router.put('/:id/cancel', asyncHandler(cancelOrder))` — No role check

**Exploit Scenario:**
1. Any authenticated user (even a customer from another supplier) can create orders for any customer
2. Any user can update the status of any order (mark as delivered, cancelled, etc.)
3. Rider could mark orders as delivered without actually delivering — manipulating cash records

**Remediation:**
- Add `requireRole('supplier', 'customer')` to `POST /`
- Add `requireRole('supplier', 'delivery_boy')` to `PUT /:id/status`
- Add tenant ownership validation: ensure the order belongs to the user's supplier

---

### HIGH-03: Cross-Tenant Data Access (IDOR)

> [!WARNING]
> **CVSS: 7.5** — Several endpoints don't properly scope queries by tenant, allowing Supplier A to access Supplier B's data.

**Affected Files:**
- [updateOrderStatus.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/orders/updateOrderStatus.js#L11) — `Order.findById(id)` with NO `supplierId` filter
- [cancelOrder.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/orders/cancelOrder.js#L10) — `Order.findOne({ _id: id })` without tenant scope
- [invoice.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/invoice.routes.js#L123) — `Invoice.findOne({ _id: id })` — rider can collect from any supplier's invoice
- [generateInvoiceForCustomer](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/services/invoice.service.js#L139-L144) — No tenant scope check on customerId parameter

**Exploit Scenario:**
1. Attacker authenticates as Supplier A
2. Calls `PUT /api/orders/{supplierB_orderId}/status` with status `delivered`
3. Modifies Supplier B's order status, corrupting their business data
4. Or a rider can collect payment on invoices from other suppliers

**Remediation:**
- Always include `supplierId: req.supplierId` in queries for orders, invoices, and customers
- Validate that the target entity belongs to the requesting user's tenant
- Use `req.filterByTenant()` consistently across ALL protected routes

---

### HIGH-04: No Token Blacklisting / Revocation

> [!WARNING]
> **CVSS: 7.0** — Logout is a no-op; tokens remain valid until expiration.

**Affected Files:**
- [logoutHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/auth/logoutHandler.js#L18-L19) — Just returns `{ message: 'Logged out successfully' }`
- [refreshTokenHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/auth/refreshTokenHandler.js#L19-L41) — Refresh tokens are never invalidated

**Exploit Scenario:**
1. Attacker steals a user's access token (via XSS, network sniffing, etc.)
2. User logs out — token is still valid for 15 minutes
3. Attacker can use the refresh token for 30 days to keep getting new access tokens
4. Even after password change, old tokens remain valid

**Remediation:**
- Implement a token blacklist (Redis or in-memory store) for invalidated tokens
- Store refresh tokens in the database with a `revoked` flag
- Invalidate all tokens when password changes
- Consider shorter refresh token lifetimes

---

### HIGH-05: Subscription Routes Bypass Tenant Scoping

> [!WARNING]
> **CVSS: 6.5** — Subscription routes are mounted without `injectTenantScope` or `scopeByTenant`.

**Affected File:**
- [index.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/index.js#L134-L137):
```javascript
app.use('/api',
  authenticate,
  subscriptionRoutes  // Missing injectTenantScope and scopeByTenant!
);
```

**Exploit Scenario:**
1. `req.supplierId` is never set for subscription route handlers
2. Supplier endpoints in subscription routes rely on `req.user._id` to find supplier — less dangerous but inconsistent
3. If any handler were added that uses `req.supplierId`, it would be `undefined`

**Remediation:**
- Add `injectTenantScope` middleware to the subscription routes mounting

---

### HIGH-06: Rate Limiter Applied Only to Auth, Not to Sensitive Endpoints

> [!WARNING]
> **CVSS: 6.5** — The auth rate limiter allows 50 requests per 15 minutes — too high for login attempts. Critical business endpoints have a 5000 req/15min dev limit.

**Affected File:**
- [index.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/index.js#L47-L57)

**Exploit Scenario:**
1. Attacker brute-forces login at 50 attempts per 15 minutes per IP
2. With the weak `admin123` password, can crack it quickly
3. 6-digit reset codes (1M combinations) can be enumerated at this rate
4. In production: 100 req/15min general limiter allows scraping of customer/order data

**Remediation:**
- Reduce auth rate limit to 5-10 per 15 minutes
- Add account lockout after 5 failed attempts
- Add specific rate limiting on forgot-password and reset-password endpoints
- Consider progressive delays

---

### HIGH-07: Race Condition in Order ID Generation

> [!WARNING]
> **CVSS: 6.0** — Sequential order ID is generated in a pre-save hook without locking, causing collisions under concurrent load.

**Affected File:**
- [Order.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/models/Order.js#L115-L126)

**Exploit Scenario:**
1. Multiple orders created simultaneously (e.g., cron job generating daily deliveries)
2. Two orders read the same `lastOrder`, both get `ORD-1042`
3. Second save fails with duplicate key error, losing the order
4. Or worse — if `unique: true` isn't enforced, duplicate IDs exist

**Remediation:**
- Use MongoDB's atomic `$inc` on a counter collection
- Or use `findOneAndUpdate` with `$inc` to generate IDs atomically
- Or use UUIDs / nanoid instead of sequential IDs

---

### HIGH-08: Double `order.save()` Calls

> [!WARNING]
> **CVSS: 5.0** — Both `createOrder` and `updateOrderStatus` call `order.save()` twice, causing unnecessary double writes and potential timing issues.

**Affected Files:**
- [createOrder.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/orders/createOrder.js#L111-L113) — Lines 111 and 113
- [updateOrderStatus.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/orders/updateOrderStatus.js#L68-L70) — Lines 68 and 70

**Remediation:**
- Remove the duplicate `await order.save()` calls

---

## 🟡 MEDIUM Vulnerabilities

---

### MED-01: Cleartext Allowed in Capacitor Config

**Affected File:**
- [capacitor.config.json](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/web/capacitor.config.json#L8) — `"cleartext": true`

**Impact:** Allows HTTP (non-HTTPS) traffic from the mobile app, enabling man-in-the-middle attacks on all API communications including JWT tokens and user data.

**Remediation:** Set `cleartext: false` in production builds.

---

### MED-02: No Password Complexity Enforcement

**Affected Files:**
- All registration handlers — Only check `password.length < 6`
- [admin.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/admin.routes.js#L101) — `newPassword.length < 6`

**Impact:** Users can set passwords like `aaaaaa` or `123456`, easily brute-forced.

**Remediation:** Require minimum 8 chars, uppercase, lowercase, number, and special character.

---

### MED-03: Email Enumeration in Forgot-Password and Registration

**Affected Files:**
- [forgotPasswordHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/auth/forgotPasswordHandler.js#L26-L28) — Returns "No user registered with this email" (reveals which emails exist)
- [registerSupplierHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/users/registerSupplierHandler.js#L64-L78) — "Phone number already registered" / "Email already registered"

**Impact:** Attacker can enumerate valid emails and phone numbers in the system.

**Remediation:** Return generic messages like "If an account exists, a reset code has been sent."

---

### MED-04: Missing CSRF Protection

**Impact:** No CSRF tokens are used. Since auth is Bearer-token based (not cookies), this is partially mitigated, but Socket.IO with `credentials: true` could be vulnerable.

**Remediation:** Implement CSRF tokens for any state-changing operations, especially if cookies are introduced later.

---

### MED-05: Sensitive Data in Error Responses (Development Mode)

**Affected File:**
- [error.middleware.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/middleware/error.middleware.js#L60-L65) — Exposes stack traces and error names in development
- [error.middleware.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/middleware/error.middleware.js#L26) — Exposes duplicate key values: `value: err.keyValue[field]`

**Impact:** Stack traces reveal internal file paths, versions, and architecture. Duplicate key errors reveal existing data values.

**Remediation:** Never expose `err.keyValue` values. Ensure `NODE_ENV=production` in deployment.

---

### MED-06: User Registration Routes Publicly Accessible via AuthLimiter Only

**Affected File:**
- [index.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/index.js#L96) — `/api/users` routes use only `authLimiter`
- [user.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/user.routes.js#L15) — `GET /api/users/suppliers` is public

**Impact:** Public endpoint leaks list of all active suppliers with business details. While intentional for a directory feature, it should be rate-limited more aggressively.

---

### MED-07: No Request Body Size Validation per Endpoint

**Affected File:**
- [index.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/index.js#L64-L65) — Global `10mb` limit

**Impact:** 10MB JSON payloads can be sent to every endpoint, enabling memory exhaustion attacks.

**Remediation:** Set per-route body size limits. Most endpoints need < 100KB.

---

## 🔵 LOW Vulnerabilities

---

### LOW-01: Sensitive Data in LocalStorage

**Affected File:**
- [authStore.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/web/src/store/authStore.js#L17) — Stores `accessToken`, `refreshToken`, and user object in `localStorage`

**Impact:** localStorage is accessible by any JavaScript on the page. An XSS vulnerability would allow token theft.

**Remediation:** Consider storing tokens in memory only, with `httpOnly` cookies as a fallback for refresh tokens.

---

### LOW-02: Morgan Logging in Production May Log Sensitive Data

**Affected File:**
- [package.json](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/package.json#L20) — `morgan` dependency present

**Impact:** If `morgan` is configured to log request bodies, sensitive data (passwords, tokens) may appear in logs.

**Remediation:** Configure morgan for production to log only method/URL/status, not bodies.

---

### LOW-03: CSP Disabled in Development

**Affected File:**
- [index.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/index.js#L33-L35) — `contentSecurityPolicy: false` in non-production

**Impact:** No content security policy in development means XSS payloads execute freely.

**Remediation:** Define a proper CSP policy for both environments.

---

### LOW-04: Console Logging of Sensitive Data

**Affected Files:**
- [forgotPasswordHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/auth/forgotPasswordHandler.js#L37-L39) — Logs reset codes to console
- [index.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/index.js#L169-L173) — Logs socket connection details

**Impact:** Reset codes and connection info in server logs could be accessed by operators or log aggregation services.

**Remediation:** Remove all sensitive data from console.log statements in production.

---

### LOW-05: No HTTPS Enforcement / HSTS Configuration

**Impact:** No `Strict-Transport-Security` header is explicitly configured. While Helmet provides some defaults, explicit HSTS with `max-age` and `includeSubDomains` should be set.

**Remediation:** Configure Helmet's `hsts` option explicitly:
```javascript
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));
```

---

## 📋 Additional Security Observations

### Business Logic Flaws

| Issue | Location | Impact |
|-------|----------|--------|
| Customer can self-report `payDues` without real payment verification | [payDues.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/customers/payDues.js#L14-L30) | Customer reduces their own debt with no external payment verification |
| `cancelOrder` stock revert without atomicity | [cancelOrder.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/orders/cancelOrder.js#L38-L43) | Race condition: stock could be over-credited |
| Invoice rider-collect has no tenant scope | [invoice.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/invoice.routes.js#L121-L156) | Rider from Supplier A could collect on Supplier B's invoice |
| `outstandingDues` can go negative | [invoice.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/invoice.routes.js#L89) | Code comments acknowledge this as uncertain behavior |

### Missing Security Headers

- No `X-Content-Type-Options: nosniff` (Helmet provides this, verify it's active)
- No `Referrer-Policy` header
- No `Permissions-Policy` header

### Dependency Security

- No `npm audit` evidence — run `npm audit` to check for known CVEs
- Express 4.x should be checked for known vulnerabilities
- Socket.IO 4.x should be verified for security patches

---

## 🎯 Priority Remediation Plan

### Immediate (Do Today)
1. **Remove `passwordText` field** from User schema and ALL code
2. **Remove `debugCode`** from forgot-password response
3. **Rotate all secrets** — MongoDB password, JWT secrets, admin password
4. **Purge `.env` from git history**
5. **Add Socket.IO authentication**

### Short-Term (This Week)
6. Remove `passwordText` from ALL `.populate()` calls
7. Add `requireRole()` to all unprotected order routes
8. Add tenant scoping (`supplierId` filter) to ALL cross-tenant queries
9. Implement input sanitization (express-mongo-sanitize)
10. Reduce auth rate limits and add account lockout

### Medium-Term (This Sprint)
11. Implement token blacklisting for logout/password change
12. Add input validation library (joi/zod)
13. Fix Order ID race condition
14. Set `cleartext: false` in production Capacitor config
15. Add payment verification workflow for `payDues`

---

> [!IMPORTANT]
> **The most critical finding is that ALL user passwords exist in plaintext in the database (`passwordText` field) AND are actively served through API responses.** This is a showstopper for production deployment. If even one user's data is compromised, every password in the system is exposed with zero effort.
