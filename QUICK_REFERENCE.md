# AquaFlow SaaS - Quick Reference Guide
## For Development Teams

---

## 🎯 Core Concept: 4-Role Multi-Tenant SaaS

```
┌─────────────────────────────────────────────────────────┐
│                  AQUAFLOW ECOSYSTEM                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  SUPER ADMIN                                            │
│  ├─ Email + Password login (Web only)                 │
│  ├─ Registers all suppliers globally                  │
│  ├─ Views platform revenue & analytics               │
│  └─ Manages subscription plans                        │
│                                                          │
│  ↓ Registers                                             │
│                                                          │
│  SUPPLIER (Water Company) [PRIMARY TENANT]              │
│  ├─ Phone OTP login (Web Dashboard)                   │
│  ├─ Registers customers & riders                      │
│  ├─ Views own deliveries & revenue                    │
│  ├─ Generates & sends invoices (WhatsApp/SMS)         │
│  └─ All data isolated by supplierId                   │
│                                                          │
│  ├─ Manages many CUSTOMERS                             │
│  │  ├─ Phone: +92XXXXXXXXXX                           │
│  │  ├─ Delivery address                               │
│  │  └─ Billing info                                   │
│  │                                                      │
│  └─ Manages many RIDERS (Delivery Boys)               │
│     ├─ Phone OTP login (Mobile App)                   │
│     ├─ View assigned customers                        │
│     ├─ Log deliveries (bottles count)                 │
│     ├─ Upload proof photos                            │
│     └─ Can only access own assigned customers         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flows

### Flow 1: Supplier/Rider Login (Phone OTP)
```
1. POST /api/auth/send-otp
   Input: { phone: "03001234567" }
   Action: Normalize to +923001234567, send via Twilio
   
2. POST /api/auth/verify-otp
   Input: { phone: "+923001234567", code: "123456" }
   Action: Verify with Twilio, issue JWT tokens
   Output: { accessToken: "jwt...", refreshToken: "jwt...", user: {...} }
   
3. Request protected route
   Header: Authorization: Bearer eyJhbGc...
   Middleware: 
   ├─ authenticate()         → Verify JWT
   ├─ injectTenantScope()    → Extract supplierId
   ├─ requireRole('supplier') → Check role
   └─ scopeByTenant()        → Filter by supplierId
```

### Flow 2: Super Admin Login (Email + Password)
```
1. POST /api/auth/admin/login
   Input: { email: "admin@aquaflow.pk", password: "secret..." }
   Action: Verify email & password with bcryptjs
   Output: { accessToken, refreshToken, user }
   
2. Access global resources (no tenant scoping)
```

---

## 🗄️ Database Collections (MongoDB)

| Collection | Scope | Primary Keys | Notes |
|-----------|-------|--------------|-------|
| **users** | Global | `_id`, `phone` (unique) | All authenticated users |
| **suppliers** | Global | `_id`, `userId` (unique) | Tenant entities |
| **customers** | Per Supplier | `supplierId` (indexed) | End users receiving water |
| **deliveryboys** | Per Supplier | `supplierId` (indexed) | Riders employed by supplier |
| **deliveries** | Per Supplier | `supplierId`, `deliveryDate` | Individual delivery logs |
| **invoices** | Per Supplier | `supplierId`, `month`, `year` | Monthly bills |
| **notificationlogs** | Per Supplier | `supplierId`, `channel` | Audit trail of notifications |
| **subscriptionplans** | Global | `_id`, `name` (unique) | Plan definitions |

### Key Principle: TENANT SCOPING
```typescript
// Every query on tenant collections MUST include supplierId filter
❌ WRONG:
   const customers = await Customer.find({ status: 'active' });

✅ CORRECT:
   const customers = await Customer.find({ 
     supplierId: req.supplierId,  // From authenticated context
     status: 'active' 
   });
```

---

## 📋 API Routes Summary

### Authentication Routes
```
POST   /api/auth/send-otp          Send OTP to phone
POST   /api/auth/verify-otp        Verify OTP & get tokens
POST   /api/auth/refresh           Refresh access token
POST   /api/auth/admin/login       Email + password login
```

### Supplier Routes (Tenant-Scoped)
```
GET    /api/suppliers/customers           List customers (own tenant)
POST   /api/suppliers/customers           Create customer
PUT    /api/suppliers/customers/:id       Update customer
DELETE /api/suppliers/customers/:id       Deactivate customer

GET    /api/suppliers/riders             List riders
POST   /api/suppliers/riders             Create rider
PUT    /api/suppliers/riders/:id         Update rider
DELETE /api/suppliers/riders/:id         Deactivate rider

GET    /api/deliveries                   List own deliveries
POST   /api/deliveries                   Create delivery (rider)
GET    /api/deliveries/:id               Get delivery detail
POST   /api/deliveries/:id/proof         Upload proof photo

GET    /api/invoices                     List invoices
GET    /api/invoices/:id                 Get invoice PDF
POST   /api/invoices                     Generate monthly invoice
POST   /api/invoices/:id/send            Send via WhatsApp/SMS
```

### Admin Routes (Global)
```
GET    /api/admin/suppliers              List all suppliers
POST   /api/admin/suppliers              Register new supplier
PUT    /api/admin/suppliers/:id          Update supplier
PUT    /api/admin/suppliers/:id/activate Activate supplier
PUT    /api/admin/suppliers/:id/plan     Change plan

GET    /api/admin/plans                  List subscription plans
POST   /api/admin/plans                  Create plan
PUT    /api/admin/plans/:id              Update plan

GET    /api/admin/revenue                Platform revenue analytics
GET    /api/admin/growth                 Growth metrics
```

---

## 🛡️ Middleware Stack

Every protected route should follow this pattern:

```typescript
router.get('/protected-route',
  // Step 1: Verify JWT token
  authenticate,
  
  // Step 2: Extract supplierId from authenticated user
  injectTenantScope,
  
  // Step 3: Check if user has required role
  requireRole('supplier', 'delivery_boy'),
  
  // Step 4: Auto-scope queries to tenant
  scopeByTenant,
  
  // Step 5: Route handler
  async (req, res) => {
    // req.user = authenticated user
    // req.supplierId = tenant ID (if not super_admin)
    // req.filterByTenant() = helper to add supplierId to queries
  }
);
```

---

## 📱 Frontend State Management (Zustand)

### Auth Store
```typescript
authStore = {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  login(phone, otp)          // Step 1: Send phone OTP
  verifyOtp(phone, code)     // Step 2: Verify OTP & get tokens
  logout()                   // Clear tokens & user
  isAuthenticated()          // Boolean check
  canAccess(role)            // Role check
}
```

### Delivery Store
```typescript
deliveryStore = {
  deliveries: Delivery[]
  addDelivery(delivery)      // Add new delivery (from socket)
  updateDelivery(id, data)   // Update delivery status
  filterByDate(date)         // Filter by delivery date
  filterByStatus(status)     // Filter by status
}
```

---

## 🔗 Socket.io Real-Time Events

### Server Emits (To Clients)
```typescript
// When supplier connects
socket.join(`supplier:${supplierId}`)

// When delivery is logged
io.to(`supplier:${supplierId}`).emit('delivery:new', {
  deliveryId, customerId, bottles, status, timestamp
})

// When invoice is generated
io.to(`supplier:${supplierId}`).emit('invoice:generated', {
  invoiceId, customerId, month, year, totalAmount
})
```

### Frontend Listens
```typescript
socket.on('delivery:new', (delivery) => {
  deliveryStore.addDelivery(delivery)  // Update state
  toast.success('New delivery logged!')  // Notify user
})
```

---

## 📤 Notifications Flow

### When Delivery is Marked as "Delivered"

```
Rider clicks "Mark Delivered"
  ↓
POST /api/deliveries/:id
  ├─ Data: { status: 'delivered', bottlesDelivered: 5, ... }
  ├─ Save to MongoDB Delivery document
  ├─ Mongoose post-save hook triggers:
  │  ├─ Call updateOrCreateInvoice() → Update Invoice collection
  │  ├─ Emit Socket.io event → Supplier's dashboard updates
  │  └─ Call sendDeliveryWhatsApp() → Customer receives WhatsApp
  └─ Response: { success: true }

WhatsApp Message (Template):
"Salam [Customer Name], aap ki 5 bottles deliver ho gayi hain. Shukriya! 🚰"

NotificationLog Entry:
{
  supplierId, customerId, deliveryId,
  channel: 'whatsapp', status: 'sent',
  sentAt: Date.now()
}
```

---

## 📊 Monthly Invoice Generation

### Automatic Process (via node-cron)
```
1st of Month at 00:00
  ↓
For each supplier:
  ├─ Get all customers
  ├─ For each customer:
  │  ├─ Count deliveries in last month
  │  ├─ Calculate: totalBottles × bottlePrice
  │  ├─ Add previousDues
  │  ├─ Subtract discounts
  │  ├─ Create Invoice document
  │  ├─ Generate PDF with PDFKit
  │  ├─ Upload PDF to Cloudinary
  │  ├─ Save PDF URL to Invoice
  │  └─ Send WhatsApp with PDF link
  └─ Emit Socket.io event to supplier

Invoice PDF Template:
┌─────────────────────────────────┐
│ AQUA FLOW                        │
│ Invoice: January 2025            │
├─────────────────────────────────┤
│ Customer: Ahmed Khan             │
│ Phone: 03001234567               │
│ Address: Satellite Town, Islamabad│
├─────────────────────────────────┤
│ Total Bottles:        10         │
│ Rate/Bottle:          PKR 150    │
│ Subtotal:             PKR 1,500  │
│ Previous Dues:        PKR 200    │
│ Discounts:            PKR 0      │
├─────────────────────────────────┤
│ TOTAL AMOUNT:         PKR 1,700  │
│ STATUS:               Unpaid     │
└─────────────────────────────────┘
```

---

## 🐛 Common Debugging Scenarios

### Scenario 1: Supplier can't see customers
```
Check 1: Is user authenticated?
  curl -H "Authorization: Bearer TOKEN" /api/suppliers/customers

Check 2: Does supplierId exist?
  db.suppliers.findOne({ userId: USER_ID })

Check 3: Are there customers for this supplier?
  db.customers.find({ supplierId: SUPPLIER_ID })

Check 4: Is middleware injecting supplierId?
  Add: console.log('req.supplierId:', req.supplierId) in middleware
```

### Scenario 2: Rider can't log delivery
```
Check 1: Is rider authenticated?
Check 2: Is supplier active?
  db.suppliers.findById(SUPPLIER_ID) → isActive: true

Check 3: Are customers assigned to this rider?
  db.customers.find({ deliveryBoyId: RIDER_ID })

Check 4: Is Cloudinary configured?
  Test upload: cloudinary.uploader.upload(buffer)
```

### Scenario 3: WhatsApp notification not sent
```
Check 1: Is whatsappToken configured for supplier?
  db.suppliers.findById(SUPPLIER_ID) → whatsappToken exists

Check 2: Does customer have whatsappPhone?
  db.customers.findById(CUSTOMER_ID) → whatsappPhone: +92...

Check 3: Is delivery status exactly 'delivered'?
  Mongoose post-save hook only fires on status === 'delivered'

Check 4: Check NotificationLog for errors
  db.notificationlogs.findOne({ deliveryId: ID, status: 'failed' })
```

---

## 🚀 Quick Start Commands

### Backend
```bash
cd server
npm install
npm run build        # Compile TypeScript
npm run dev          # Development (with auto-reload)
npm run seed         # Seed database with initial data
npm test             # Run tests
```

### Frontend
```bash
cd apps/web
npm install
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
```

### Mobile
```bash
cd apps/web
npm run build
npx cap sync android
npx cap open android # Opens Android Studio
# Build APK in Android Studio: Build → Generate Signed Bundle/APK
```

---

## 📞 Support Contacts

- **Twilio**: Account SID & Auth Token in `.env`
- **Cloudinary**: API Key & Secret in `.env`
- **MongoDB**: Connection string in `.env`
- **Meta WhatsApp**: Business Account required for Phone ID & Token

---

## ✅ Pre-Launch Checklist

- [ ] All 4 roles implemented with proper permissions
- [ ] JWT authentication working (access + refresh tokens)
- [ ] Phone OTP via Twilio working
- [ ] Multi-tenant scoping verified (no data leaks)
- [ ] API rate limiting configured
- [ ] Cloudinary file uploads working
- [ ] Invoice PDF generation working
- [ ] WhatsApp notifications working
- [ ] Socket.io real-time updates working
- [ ] All endpoints tested with Postman
- [ ] Frontend auth flow working
- [ ] Environment variables set correctly
- [ ] Database backups configured
- [ ] CORS properly configured
- [ ] HTTPS enabled
- [ ] Monitoring/logging set up

---

**Document Version**: 1.0  
**Last Updated**: 2025
