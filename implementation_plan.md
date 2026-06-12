# Security Remediation — Implementation Plan

Fix all 27 vulnerabilities identified in the [security audit](file:///C:/Users/muham/.gemini/antigravity-ide/brain/0fe2142b-aaf6-4eba-a9d5-d9d8e20efa32/security_audit.md), organized into 4 phases by severity.

> [!IMPORTANT]
> **Phases are sequential.** Phase 1 must be completed before Phase 2, etc. Each phase has a verification step at the end. Total estimated effort: ~4-6 hours of focused implementation.

## User Review Required

> [!WARNING]
> **Breaking Change — Password Display Feature:** The admin dashboard currently shows plaintext passwords for suppliers in a "Credentials" column ([AdminDashboard.jsx:L480](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/web/src/pages/admin/AdminDashboard.jsx#L480)). Removing `passwordText` means this column will show "—" for all suppliers. The replacement approach will show the password **only once at creation time** in a modal. Is this acceptable?

> [!WARNING]
> **Breaking Change — Frontend Debug Code:** The login page currently shows the password reset code on-screen for testing ([LoginPage.jsx:L116-118](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/web/src/pages/LoginPage.jsx#L116-L118)). After this fix, password reset will require actual email delivery to work. You'll need to integrate an email provider (e.g., Nodemailer + Gmail/SendGrid) or keep Twilio SMS for OTP verification only.

## Open Questions

> [!IMPORTANT]
> 1. **Email provider for password resets:** Since we're removing `debugCode` from the response, do you want me to integrate an email service (e.g., Nodemailer with Gmail SMTP, or SendGrid) so reset codes are actually delivered? Or should we keep the code as console-log-only for now and integrate email later?
> 2. **MongoDB data migration:** There are existing `passwordText` values in the database for all users. Should I create a migration script to `$unset` this field from all existing documents?
> 3. **Git history purge:** The `.env` file with real credentials is in git history. Do you want me to provide commands to purge it using `git filter-branch` or BFG Repo-Cleaner?

---

## Phase 1: CRITICAL Fixes (Fixes CRIT-01 through CRIT-07)

*Immediate — these vulnerabilities allow full system compromise.*

---

### 1.1 — Remove Plaintext Password Storage (CRIT-01, CRIT-05)

Eliminates the `passwordText` field from the entire codebase. Every registration, update, and populate call that touches this field must be modified.

#### [MODIFY] [User.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/models/User.js)

- **Remove lines 36-38** — Delete the `passwordText` field definition entirely
- **Add `select: false`** to `resetCode` field (line 39) so it's never accidentally returned

```diff
   password: {
     type: String,
     select: false
   },
-  passwordText: {
-    type: String
-  },
   resetCode: {
     type: String
+    select: false
   },
```

---

#### [MODIFY] [registerSupplierHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/users/registerSupplierHandler.js)

- **Remove line 84** — `passwordText: password,`
- **Add `initialPassword` to the response** (one-time visibility at creation):

```diff
   const user = new User({
     username: username.toLowerCase().trim(),
     password,
-    passwordText: password,
     phone: normalizedPhone,
     ...
   });
```

In the response at line 111, add the password so it's visible once:

```diff
   return created(res, {
     user: {
       _id: user._id,
       username: user.username,
+      initialPassword: password, // shown ONCE at creation, never stored
       ...
     },
```

---

#### [MODIFY] [registerCustomerHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/users/registerCustomerHandler.js)

- **Remove line 94** — `passwordText: password,`
- **Add `initialPassword: password`** to the response user object (one-time)

---

#### [MODIFY] [registerRiderHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/users/registerRiderHandler.js)

- **Remove line 84** — `passwordText: password,`
- **Add `initialPassword: password`** to the response user object (one-time)

---

#### [MODIFY] [resetPasswordHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/auth/resetPasswordHandler.js)

- **Remove line 44** — `user.passwordText = newPassword;`

---

#### [MODIFY] [updateProfileHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/users/updateProfileHandler.js)

- **Remove line 64** — `user.passwordText = password;`
- **Remove `passwordText` from line 96 populate**: Change `'fullName phone email isActive username passwordText'` → `'fullName phone email isActive username'`

---

#### [MODIFY] [admin.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/admin.routes.js)

- **Line 18**: Change `.populate('userId', 'fullName phone email username passwordText')` → `.populate('userId', 'fullName phone email username')`
- **Line 118**: Remove `user.passwordText = newPassword;`

---

#### [MODIFY] [supplier.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/supplier.routes.js)

- **Line 130**: Change populate to `'fullName phone email isActive username'` (remove `passwordText`)
- **Line 173**: Remove `user.passwordText = password;`
- **Line 210**: Change populate to `'fullName phone email isActive username'` (remove `passwordText`)
- **Line 250**: Remove `user.passwordText = password;`

---

#### [MODIFY] [seed.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/utils/seed.js)

- **Remove line 25** — `passwordText: process.env.SUPER_ADMIN_PASSWORD || 'admin123',`
- **Modify line 31** — Change `!existingAdmin.passwordText` → `!existingAdmin.username` (only check username)
- **Remove line 35** — `existingAdmin.passwordText = process.env.SUPER_ADMIN_PASSWORD || 'admin123';`

---

#### [MODIFY] [AdminDashboard.jsx](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/web/src/pages/admin/AdminDashboard.jsx)

- **Remove lines 470-483** — The entire "Credentials" column showing `passwordText`
- **Remove the `<th>Credentials</th>`** from line 452
- Or replace with a note: "Credentials shown only at creation"

---

### 1.2 — Remove Debug Code from Forgot-Password (CRIT-04)

#### [MODIFY] [forgotPasswordHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/auth/forgotPasswordHandler.js)

- **Remove line 44** — `debugCode: resetCode`
- **Remove lines 37-39** — Console.log of reset code (or gate behind `NODE_ENV === 'development'`)

```diff
   return ok(res, {
     email: user.email,
-    message: 'Verification code sent successfully to email.',
-    debugCode: resetCode
+    message: 'If this email is registered, a verification code has been sent.'
   }, 'Verification code generated');
```

#### [MODIFY] [LoginPage.jsx](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/web/src/pages/LoginPage.jsx)

- **Remove lines 116-118** — Code that reads and displays `debugCode` from the response

---

### 1.3 — Secure JWT Secrets & Environment (CRIT-02, CRIT-03)

#### [MODIFY] [.env](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/.env)

Replace weak secrets with cryptographically strong random values:

```diff
-JWT_SECRET=aquaflow-jwt-secret-2025-production
+JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
-JWT_REFRESH_SECRET=aquaflow-refresh-secret-2025-production
+JWT_REFRESH_SECRET=<generate with same command, different value>
-SUPER_ADMIN_PASSWORD=admin123
+SUPER_ADMIN_PASSWORD=<strong password, 12+ chars, mixed case, numbers, symbols>
```

> [!CAUTION]
> After changing the JWT secrets, ALL existing tokens will be invalidated. All logged-in users will be force-logged out. This is expected and desired.

#### [MODIFY] [.env.example](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/.env.example)

- Change `SUPER_ADMIN_PASSWORD=admin123` → `SUPER_ADMIN_PASSWORD=CHANGE_ME_STRONG_PASSWORD`
- Change JWT secrets to `CHANGE_ME_RANDOM_SECRET`

---

### 1.4 — Secure Default Admin Password (CRIT-07)

#### [MODIFY] [seed.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/utils/seed.js)

Add a validation check that the default password is not `admin123`:

```javascript
const adminPassword = process.env.SUPER_ADMIN_PASSWORD;
if (!adminPassword || adminPassword === 'admin123') {
  console.error('✗ SUPER_ADMIN_PASSWORD is missing or insecure. Set a strong password in .env');
  return;
}
```

---

### 1.5 — Add Socket.IO Authentication (CRIT-06)

#### [MODIFY] [index.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/index.js)

Add JWT verification middleware to Socket.IO and validate room joins:

```diff
+const jwt = require('jsonwebtoken');
+const User = require('./models/User');
+const Supplier = require('./models/Supplier');
+const DeliveryBoy = require('./models/DeliveryBoy');

 const io = new Server(server, { ... });

+// Socket.IO authentication middleware
+io.use(async (socket, next) => {
+  try {
+    const token = socket.handshake.auth?.token;
+    if (!token) return next(new Error('Authentication required'));
+
+    const decoded = jwt.verify(token, process.env.JWT_SECRET);
+    const user = await User.findById(decoded.userId);
+    if (!user || !user.isActive) return next(new Error('Invalid user'));
+
+    socket.user = user;
+    next();
+  } catch (err) {
+    next(new Error('Authentication failed'));
+  }
+});

 io.on('connection', (socket) => {
-  console.log(`Socket connected: ${socket.id}`);
-
-  socket.on('join_supplier_room', (supplierId) => {
-    socket.join(supplierId);
-    console.log(`Socket ${socket.id} joined supplier room: ${supplierId}`);
-  });
+  socket.on('join_supplier_room', async (supplierId) => {
+    // Verify user is authorized for this supplier room
+    let authorized = false;
+    if (socket.user.role === 'super_admin') {
+      authorized = true;
+    } else if (socket.user.role === 'supplier') {
+      const supplier = await Supplier.findOne({ userId: socket.user._id });
+      authorized = supplier && supplier._id.toString() === supplierId;
+    } else if (socket.user.role === 'delivery_boy') {
+      const rider = await DeliveryBoy.findOne({ userId: socket.user._id });
+      authorized = rider && rider.supplierId.toString() === supplierId;
+    }
+
+    if (authorized) {
+      socket.join(supplierId);
+    }
+  });
 });
```

#### [MODIFY] Frontend Socket connection (wherever Socket.IO client connects)

Pass the auth token when connecting:

```javascript
const socket = io(API_URL, {
  auth: { token: accessToken }
});
```

---

## Phase 2: HIGH Fixes (Fixes HIGH-01 through HIGH-08)

*Complete within 1-2 days — significant security impact.*

---

### 2.1 — Add NoSQL Injection Protection (HIGH-01)

#### [NEW] Install `express-mongo-sanitize` dependency

```bash
cd apps/server && npm install express-mongo-sanitize
```

#### [MODIFY] [index.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/index.js)

```diff
+const mongoSanitize = require('express-mongo-sanitize');

 app.use(express.json({ limit: '10mb' }));
 app.use(express.urlencoded({ limit: '10mb', extended: true }));
+
+// Sanitize inputs against NoSQL injection
+app.use(mongoSanitize());
```

#### [NEW] [middleware/validate.middleware.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/middleware/validate.middleware.js)

Create an ObjectId validation helper:

```javascript
const mongoose = require('mongoose');
const { badRequest } = require('../utils/apiResponse');

const validateObjectId = (paramName = 'id') => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
    return badRequest(res, `Invalid ${paramName} format`);
  }
  next();
};

module.exports = { validateObjectId };
```

Apply `validateObjectId()` to ALL routes that accept `:id` params — order routes, invoice routes, supplier routes (customer/:id, rider/:id, product/:id), admin routes.

---

### 2.2 — Fix Missing Authorization on Order Endpoints (HIGH-02)

#### [MODIFY] [order.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/order.routes.js)

```diff
-router.post('/', asyncHandler(createOrder));
+router.post('/', requireRole('supplier', 'customer'), asyncHandler(createOrder));

-router.put('/:id/status', asyncHandler(updateOrderStatus));
+router.put('/:id/status', requireRole('supplier', 'delivery_boy'), asyncHandler(updateOrderStatus));

-router.put('/:id/cancel', asyncHandler(cancelOrder));
+router.put('/:id/cancel', requireRole('supplier', 'customer'), asyncHandler(cancelOrder));
```

---

### 2.3 — Fix Cross-Tenant Data Access / IDOR (HIGH-03)

#### [MODIFY] [updateOrderStatus.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/orders/updateOrderStatus.js)

```diff
-    const order = await Order.findById(id);
+    // Scope to user's tenant
+    const filter = { _id: id };
+    if (req.supplierId) filter.supplierId = req.supplierId;
+    const order = await Order.findOne(filter);
```

#### [MODIFY] [cancelOrder.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/orders/cancelOrder.js)

```diff
-    const order = await Order.findOne({ _id: id });
+    const filter = { _id: id };
+    if (req.supplierId) filter.supplierId = req.supplierId;
+    const order = await Order.findOne(filter);
```

#### [MODIFY] [invoice.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/invoice.routes.js) — rider-collect endpoint (line 123)

```diff
-  const invoice = await Invoice.findOne({ _id: id });
+  // Scope to rider's assigned customers only
+  const Customer = require('../models/Customer');
+  const assignedCustomers = await Customer.find({ deliveryBoyId: req.riderId }).select('_id');
+  const customerIds = assignedCustomers.map(c => c._id);
+  const invoice = await Invoice.findOne({ _id: id, customerId: { $in: customerIds } });
```

#### [MODIFY] [invoice.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/invoice.routes.js) — generate-early endpoint (line 30)

Add supplier ownership check:

```diff
+  const Customer = require('../models/Customer');
+  const customer = await Customer.findOne({ _id: req.params.customerId, supplierId: req.supplierId });
+  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
```

---

### 2.4 — Add Token Blacklisting for Logout (HIGH-04)

#### [NEW] [models/TokenBlacklist.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/models/TokenBlacklist.js)

```javascript
const mongoose = require('mongoose');

const TokenBlacklistSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: { type: Date, required: true }
});

// Auto-delete expired entries (TTL index)
TokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TokenBlacklist', TokenBlacklistSchema);
```

#### [MODIFY] [logoutHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/auth/logoutHandler.js)

```javascript
const logoutHandler = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.decode(token);
    const TokenBlacklist = require('../../models/TokenBlacklist');
    await TokenBlacklist.create({
      token,
      userId: decoded?.userId,
      expiresAt: new Date(decoded?.exp * 1000)
    });
  }
  return ok(res, {}, 'Logged out successfully');
});
```

#### [MODIFY] [auth.middleware.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/middleware/auth.middleware.js) — `authenticate` function

Add blacklist check after token verification:

```diff
     const token = authHeader.split(' ')[1];
     const { JWT_SECRET } = process.env;
     const decoded = jwt.verify(token, JWT_SECRET);
+
+    // Check if token has been blacklisted (logged out)
+    const TokenBlacklist = require('../models/TokenBlacklist');
+    const isBlacklisted = await TokenBlacklist.findOne({ token });
+    if (isBlacklisted) {
+      return unauthorized(res, 'Token has been revoked');
+    }
+
     const user = await User.findById(decoded.userId);
```

#### [MODIFY] [auth.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/auth.routes.js)

Add `authenticate` middleware to the logout route:

```diff
+const { authenticate } = require('../middleware/auth.middleware');
-router.post('/logout', logoutHandler);
+router.post('/logout', authenticate, logoutHandler);
```

---

### 2.5 — Add Tenant Scope to Subscription Routes (HIGH-05)

#### [MODIFY] [index.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/index.js)

```diff
 app.use('/api',
   authenticate,
+  injectTenantScope,
   subscriptionRoutes
 );
```

---

### 2.6 — Strengthen Rate Limiting (HIGH-06)

#### [MODIFY] [index.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/index.js)

```diff
 const authLimiter = rateLimit({
   windowMs: 15 * 60 * 1000,
-  max: 50,
+  max: 10,
   message: 'Too many login attempts'
 });

+const resetLimiter = rateLimit({
+  windowMs: 15 * 60 * 1000,
+  max: 3,
+  message: 'Too many password reset attempts'
+});
```

Apply `resetLimiter` to forgot-password and reset-password routes in [auth.routes.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/routes/auth.routes.js):

```diff
-router.post('/forgot-password', forgotPasswordHandler);
+router.post('/forgot-password', resetLimiter, forgotPasswordHandler);
-router.post('/reset-password', resetPasswordHandler);
+router.post('/reset-password', resetLimiter, resetPasswordHandler);
```

> [!NOTE]
> The `resetLimiter` must be created in auth.routes.js or passed from index.js. The simplest approach is to define it in index.js and export, or define it inline in auth.routes.js.

---

### 2.7 — Fix Order ID Race Condition (HIGH-07)

#### [NEW] [models/Counter.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/models/Counter.js)

```javascript
const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 999 }
});

module.exports = mongoose.model('Counter', CounterSchema);
```

#### [MODIFY] [Order.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/models/Order.js) — Replace pre-save hook (lines 115-126)

```javascript
OrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Counter = require('./Counter');
    const counter = await Counter.findByIdAndUpdate(
      'orderId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.orderId = `ORD-${counter.seq}`;
  }
  next();
});
```

---

### 2.8 — Fix Double Save Calls (HIGH-08)

#### [MODIFY] [createOrder.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/orders/createOrder.js)

- **Remove line 113** — duplicate `await order.save();`

#### [MODIFY] [updateOrderStatus.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/orders/updateOrderStatus.js)

- **Remove line 70** — duplicate `await order.save();`

---

## Phase 3: MEDIUM Fixes (Fixes MED-01 through MED-07)

*Complete within the current sprint.*

---

### 3.1 — Disable Cleartext in Capacitor Production (MED-01)

#### [MODIFY] [capacitor.config.json](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/web/capacitor.config.json)

```diff
   "server": {
     "androidScheme": "https",
     "hostname": "apnapani.com",
-    "cleartext": true
+    "cleartext": false
   },
```

---

### 3.2 — Add Password Complexity Validation (MED-02)

#### [NEW] [utils/passwordValidator.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/utils/passwordValidator.js)

```javascript
function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
}

module.exports = { validatePassword };
```

Apply in all registration handlers, reset password, change password, and update profile.

---

### 3.3 — Fix Email/Phone Enumeration (MED-03)

#### [MODIFY] [forgotPasswordHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/auth/forgotPasswordHandler.js)

```diff
   const user = await User.findOne({ email: email.toLowerCase().trim() });
   if (!user) {
-    return notFound(res, 'No user registered with this email address');
+    // Return success even if no user found (prevents enumeration)
+    return ok(res, { email }, 'If this email is registered, a verification code has been sent.');
   }
```

---

### 3.4 — Fix Error Response Information Leakage (MED-05)

#### [MODIFY] [error.middleware.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/middleware/error.middleware.js)

```diff
   // Mongoose duplicate key error
   if (err.code === 11000) {
     const field = Object.keys(err.keyValue)[0];
     return res.status(409).json({
       statusCode: 409,
-      message: `${field} already exists`,
-      data: { field, value: err.keyValue[field] },
+      message: `A record with this ${field} already exists`,
+      data: null,
       success: false,
       timestamp: new Date().toISOString()
     });
   }
```

---

### 3.5 — Reduce Body Size Limit (MED-07)

#### [MODIFY] [index.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/index.js)

```diff
-app.use(express.json({ limit: '10mb' }));
-app.use(express.urlencoded({ limit: '10mb', extended: true }));
+app.use(express.json({ limit: '1mb' }));
+app.use(express.urlencoded({ limit: '1mb', extended: true }));
```

---

## Phase 4: LOW Fixes & Hardening (Fixes LOW-01 through LOW-05)

*Complete as time permits — defense-in-depth.*

---

### 4.1 — Remove Console Logging of Sensitive Data (LOW-04)

#### [MODIFY] [forgotPasswordHandler.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/controllers/auth/forgotPasswordHandler.js)

```diff
-  console.log(`\n==========================================`);
-  console.log(`[RESET PASSWORD] Verification code for ${user.email}: ${resetCode}`);
-  console.log(`==========================================\n`);
+  if (process.env.NODE_ENV === 'development') {
+    console.log(`[DEV] Reset code for ${user.email}: ${resetCode}`);
+  }
```

#### [MODIFY] [index.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/index.js) — Socket connection logs

```diff
-  console.log(`Socket connected: ${socket.id}`);
-  console.log(`Socket ${socket.id} joined supplier room: ${supplierId}`);
-  console.log(`Socket disconnected: ${socket.id}`);
```

---

### 4.2 — Enhance Helmet Security Headers (LOW-03, LOW-05)

#### [MODIFY] [index.js](file:///c:/Users/muham/Desktop/work-storage/apna%20pani/apna-pani/apps/server/src/index.js)

```diff
-app.use(helmet({
-  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
-}));
+app.use(helmet({
+  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
+  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
+  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
+}));
```

---

### 4.3 — Audit npm Dependencies

Run `npm audit` in both `apps/server` and `apps/web` and fix any reported vulnerabilities.

---

## Summary of New Files

| File | Purpose |
|------|---------|
| `apps/server/src/middleware/validate.middleware.js` | ObjectId param validation |
| `apps/server/src/models/TokenBlacklist.js` | Token revocation for logout |
| `apps/server/src/models/Counter.js` | Atomic order ID generation |
| `apps/server/src/utils/passwordValidator.js` | Password complexity rules |

## Summary of Modified Files

| File | Changes |
|------|---------|
| `apps/server/src/models/User.js` | Remove `passwordText` field |
| `apps/server/src/index.js` | Socket auth, mongo sanitize, rate limits, helmet, body limits |
| `apps/server/src/middleware/auth.middleware.js` | Token blacklist check |
| `apps/server/src/middleware/error.middleware.js` | Remove data leakage |
| `apps/server/src/routes/auth.routes.js` | Rate limiters, auth on logout |
| `apps/server/src/routes/order.routes.js` | Add `requireRole()` |
| `apps/server/src/routes/admin.routes.js` | Remove passwordText |
| `apps/server/src/routes/supplier.routes.js` | Remove passwordText, all 4 instances |
| `apps/server/src/routes/invoice.routes.js` | Tenant scope on rider-collect |
| `apps/server/src/controllers/auth/*` | Remove debugCode, passwordText, console logs |
| `apps/server/src/controllers/users/*` | Remove passwordText from 4 files |
| `apps/server/src/controllers/orders/createOrder.js` | Remove duplicate save |
| `apps/server/src/controllers/orders/updateOrderStatus.js` | Add tenant scope, remove duplicate save |
| `apps/server/src/controllers/orders/cancelOrder.js` | Add tenant scope |
| `apps/server/src/models/Order.js` | Atomic order ID generation |
| `apps/server/src/utils/seed.js` | Remove passwordText, enforce strong password |
| `apps/server/.env` | Rotate all secrets |
| `apps/server/.env.example` | Update placeholders |
| `apps/web/src/pages/admin/AdminDashboard.jsx` | Remove password display column |
| `apps/web/src/pages/LoginPage.jsx` | Remove debugCode display |
| `apps/web/capacitor.config.json` | Disable cleartext |

---

## Verification Plan

### Automated Tests

```bash
# After each phase, run the server and verify no crashes
cd apps/server && npm run dev

# Check for any remaining passwordText references
grep -rn "passwordText" apps/

# Check for any remaining debugCode references
grep -rn "debugCode" apps/

# Run npm audit
cd apps/server && npm audit
cd apps/web && npm audit
```

### Manual Verification

After Phase 1:
- [ ] Try `POST /api/auth/forgot-password` — verify response has NO `debugCode`
- [ ] Try `GET /api/admin/suppliers` — verify response has NO `passwordText`
- [ ] Try `GET /api/suppliers/customers` — verify response has NO `passwordText`
- [ ] Try connecting to Socket.IO without a token — verify rejection
- [ ] Try logging in as admin with `admin123` — verify it's rejected (after secret rotation)

After Phase 2:
- [ ] Send `{"identifier": {"$gt": ""}}` to login — verify rejection by mongo-sanitize
- [ ] As Supplier A, try `PUT /api/orders/{supplierB_orderId}/status` — verify 404
- [ ] Logout, then use the old token — verify rejection
- [ ] Create 10 simultaneous orders — verify no duplicate order IDs

After Phase 3:
- [ ] Try forgot-password with a non-existent email — verify generic success message
- [ ] Try creating user with password `aaaaaa` — verify rejection (needs uppercase + number)
- [ ] Send 10MB JSON body — verify rejection
