# AquaFlow SaaS - Visual Architecture & Flow Diagrams

## 1. System Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         AQUAFLOW SAAS PLATFORM                             │
│                      Multi-Tenant Water Delivery System                    │
└────────────────────────────────────────────────────────────────────────────┘

                                 ┌─────────────────┐
                                 │   SUPER ADMIN   │
                                 │  (Email + Pass) │
                                 │  (Web Dashboard)│
                                 └────────┬────────┘
                                          │
                        ┌─────────────────┼─────────────────┐
                        │                 │                 │
                        ▼                 ▼                 ▼
            ┌──────────────────┐  ┌──────────────┐  ┌─────────────┐
            │ Register/Manage  │  │   View All   │  │  Manage     │
            │   Suppliers      │  │   Revenue    │  │  Plans      │
            │                  │  │  & Analytics │  │             │
            └──────────────────┘  └──────────────┘  └─────────────┘


    ┌─────────────────────────────────────────────────────────────┐
    │   TENANT 1: SUPPLIER (Water Co A)  [supplierId = A]         │
    │   ├─ Login: Phone OTP (03XXXXXXXXX)                         │
    │   ├─ Platform: Web Dashboard                                │
    │   └─ Access: Own customers, riders, deliveries, invoices    │
    ├─────────────────────────────────────────────────────────────┤
    │                                                              │
    │   ┌─────────────────────────┐      ┌────────────────────┐  │
    │   │  CUSTOMERS              │      │  RIDERS            │  │
    │   ├─────────────────────────┤      ├────────────────────┤  │
    │   │ • Ahmed Khan (+923001...) │      │ • Usman (+923002...)│  │
    │   │ • Fatima Ali (+923003...) │      │ • Hassan (+923004...)│  │
    │   │ • Muhammad (+923005...)  │      │ • Ali (+923006...)   │  │
    │   │ [50-500 per supplier]   │      │ [5-20 per supplier] │  │
    │   └─────────────────────────┘      └────────────────────┘  │
    │           │                               │                 │
    │           │                               │                 │
    │           └───────────────┬────────────────┘                │
    │                           │                                 │
    │                    ┌──────▼────────┐                        │
    │                    │  DELIVERIES   │                        │
    │                    ├───────────────┤                        │
    │                    │ Date: 15 Jan  │                        │
    │                    │ Status: Pending│                        │
    │                    │ Bottles: 5    │                        │
    │                    │ Payment: 750 PKR│                      │
    │                    └───────────────┘                        │
    │                           │                                 │
    │                    ┌──────▼────────┐                        │
    │                    │  INVOICES     │                        │
    │                    ├───────────────┤                        │
    │                    │ Month: Jan    │                        │
    │                    │ Bottles: 30   │                        │
    │                    │ Total: 4500 PKR│                       │
    │                    │ Status: Unpaid│                        │
    │                    └───────────────┘                        │
    └─────────────────────────────────────────────────────────────┘


    ┌─────────────────────────────────────────────────────────────┐
    │   TENANT 2: SUPPLIER (Water Co B)  [supplierId = B]         │
    │   [Completely isolated from Tenant 1]                       │
    │   [Cannot see A's customers, deliveries, or invoices]       │
    └─────────────────────────────────────────────────────────────┘
```

---

## 2. Multi-Tenant Data Isolation Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                     REQUEST LIFECYCLE                             │
└───────────────────────────────────────────────────────────────────┘

CLIENT REQUEST:
  POST /api/suppliers/customers
  Header: Authorization: Bearer eyJhbGc...
  Body: { name: "Ahmed", phone: "03001234567" }


MIDDLEWARE CHAIN:
  │
  ├─ Step 1: authenticate()
  │  ├─ Extract token: "eyJhbGc..."
  │  ├─ Verify JWT signature
  │  ├─ Decode: { userId: "user123", role: "supplier" }
  │  ├─ Load user from DB: User { _id, phone, role, isActive }
  │  └─ Attach to request: req.user = User document
  │
  ├─ Step 2: injectTenantScope()
  │  ├─ Check role:
  │  │  ├─ If 'supplier': Find Supplier { userId: req.user._id }
  │  │  │  └─ Get supplierId from supplier document
  │  │  ├─ If 'delivery_boy': Find DeliveryBoy { userId: req.user._id }
  │  │  │  └─ Get supplierId from deliveryboy document
  │  │  └─ If 'super_admin': req.supplierId = null (global access)
  │  └─ Attach to request: req.supplierId = "supplier123"
  │
  ├─ Step 3: requireRole('supplier')
  │  ├─ Check: req.user.role === 'supplier'
  │  └─ ✅ PASS (continue) or ❌ FAIL (403 Forbidden)
  │
  └─ Step 4: scopeByTenant()
     ├─ Attach helper: req.filterByTenant = function
     └─ Usage: req.filterByTenant({ status: 'active' })
              → { supplierId: "supplier123", status: 'active' }


ROUTE HANDLER:
  const filter = req.filterByTenant({ status: 'active' });
  // filter = { supplierId: "supplier123", status: 'active' }
  
  const customers = await Customer.find(filter);
  // MongoDB: db.customers.find({ 
  //   supplierId: "supplier123", 
  //   status: 'active' 
  // })
  
  return res.json(customers);


RESPONSE:
  [
    { _id, supplierId: "supplier123", name: "Ahmed", ... },
    { _id, supplierId: "supplier123", name: "Fatima", ... }
  ]


KEY PRINCIPLE:
  ✅ supplierId ALWAYS comes from authenticated context
  ❌ NEVER from request body or query params
  
  This ensures ZERO cross-tenant data leakage!
```

---

## 3. Authentication & Authorization Flow

```
┌──────────────────────────────────────────────────────────────────┐
│           PHONE OTP AUTHENTICATION FLOW                          │
└──────────────────────────────────────────────────────────────────┘

STEP 1: REQUEST OTP
────────────────────

User (Mobile/Web):
  │
  └─→ POST /api/auth/send-otp
      Body: { phone: "03001234567" }
      
Server:
  ├─ Validate input
  ├─ Normalize phone: "03001234567" → "+923001234567"
  ├─ Check format: /^\+92[0-9]{10}$/
  ├─ Call Twilio API: twilio.verify.verifications.create()
  │  └─→ Sends SMS: "Your OTP is: 123456"
  └─ Response: { message: "OTP sent to +923001234567" }

Client:
  └─ Display: "Enter 6-digit OTP sent to your phone"


STEP 2: VERIFY OTP
──────────────────

User:
  │
  └─→ POST /api/auth/verify-otp
      Body: { phone: "+923001234567", code: "123456" }
      
Server:
  ├─ Call Twilio API: twilio.verify.verificationChecks.create()
  │  └─→ Verify code is correct and not expired
  ├─ If verification fails: return 400 "Invalid OTP"
  ├─ If verification succeeds:
  │  ├─ Find user: User.findOne({ phone: "+923001234567" })
  │  ├─ If user not found: return 404 "User not registered"
  │  ├─ Generate access token (15 min expiry):
  │  │  JWT { userId, role, iat, exp }
  │  ├─ Generate refresh token (30 day expiry):
  │  │  JWT { userId, iat, exp }
  │  └─ Return tokens + user info
  │
  └─ Response: {
       accessToken: "eyJhbGc...",
       refreshToken: "eyJhbGc...",
       user: { _id, phone, fullName, role, ... }
     }

Client:
  ├─ Store accessToken in memory (not localStorage for security)
  ├─ Store refreshToken in localStorage with httpOnly flag
  ├─ Set Authorization header: "Bearer {accessToken}"
  ├─ Redirect based on role:
  │  ├─ super_admin → /admin/dashboard
  │  ├─ supplier → /supplier/dashboard
  │  ├─ delivery_boy → /rider/route
  │  └─ customer → /customer/invoices
  │
  └─ All subsequent requests include: Authorization header


STEP 3: ACCESS PROTECTED ROUTE
───────────────────────────────

User:
  │
  └─→ GET /api/suppliers/customers
      Header: Authorization: Bearer eyJhbGc...
      
Server Middleware:
  ├─ authenticate() middleware
  │  ├─ Extract token from header
  │  ├─ Verify signature: jwt.verify(token, JWT_SECRET)
  │  ├─ Decode: { userId: "user123", role: "supplier" }
  │  ├─ Load user: User.findById("user123")
  │  └─ Attach to request: req.user = User { ... }
  │
  ├─ injectTenantScope() middleware
  │  ├─ Find: Supplier.findOne({ userId: "user123" })
  │  └─ Attach to request: req.supplierId = "supplier456"
  │
  ├─ requireRole('supplier') middleware
  │  ├─ Check: req.user.role === 'supplier' ✅
  │  └─ Continue to handler
  │
  └─ Handler executes:
     const customers = await Customer.find({
       supplierId: req.supplierId,  // = "supplier456"
       ...
     })

Server Response:
  ✅ Returns customers for supplier456 only


STEP 4: TOKEN REFRESH
──────────────────────

When access token expires (15 min):

Client:
  │
  └─→ POST /api/auth/refresh
      Body: { refreshToken: "eyJhbGc..." }
      
Server:
  ├─ Verify refresh token: jwt.verify(refreshToken, JWT_REFRESH_SECRET)
  ├─ Load user: User.findById(decoded.userId)
  ├─ Generate NEW access token: jwt.sign({ userId, role }, secret)
  └─ Response: { accessToken: "newEyJhbGc..." }

Client:
  ├─ Replace old accessToken
  ├─ Retry original request with new token
  └─ If refresh token also expired (>30 days):
     └─ Force re-login: redirect to /login


SECURITY NOTES:
  ✅ Refresh tokens stored in localStorage (can be XSS target)
  ✅ Access tokens in memory only (can't be stolen via XSS)
  ✅ Server-side token verification prevents tampering
  ✅ 15-min access token expiry minimizes breach window
  ✅ Rate limiting on /auth endpoints prevents brute force
```

---

## 4. Role-Based Access Control (RBAC)

```
┌──────────────────────────────────────────────────────────────────┐
│                    PERMISSION MATRIX                             │
└──────────────────────────────────────────────────────────────────┘

SUPER ADMIN (Global Access)
├─ Register new suppliers
├─ View all suppliers globally
├─ Activate/deactivate suppliers
├─ Manage subscription plans
├─ View platform-wide revenue
├─ View all notification logs
└─ Cannot: perform tenant-specific operations


SUPPLIER (Tenant-Scoped)
├─ View own customers
├─ Register & manage customers
├─ Register & manage delivery boys
├─ View own deliveries
├─ Generate & send invoices
├─ Configure WhatsApp/SMS tokens
├─ View own financial reports
└─ Cannot: access other suppliers' data


DELIVERY BOY / RIDER (Assigned Customers Only)
├─ View assigned customers
├─ Log delivery (bottles, payment, notes)
├─ Upload proof photo
├─ View own delivery history
└─ Cannot: register customers, access other riders' data


CUSTOMER (Own Data Only - Future)
├─ View own invoices
├─ View past deliveries
├─ Update delivery address
└─ Cannot: manage anything, view other customers' data


ACCESS PATTERN:
┌─────────────────────────────────────────┐
│  super_admin                            │
│  ├─ Scope: Global (all tenants)        │
│  ├─ Filtering: None                     │
│  └─ Can see: All data                   │
│                                          │
│  supplier                               │
│  ├─ Scope: Own tenant (supplierId)     │
│  ├─ Filtering: { supplierId: own }     │
│  └─ Can see: Own customers, riders     │
│                                          │
│  delivery_boy                          │
│  ├─ Scope: Assigned customers only     │
│  ├─ Filtering: { deliveryBoyId: own } │
│  └─ Can see: Only assigned customers   │
│                                          │
│  customer                               │
│  ├─ Scope: Own records only            │
│  ├─ Filtering: { _id: own }            │
│  └─ Can see: Own invoices, deliveries  │
└─────────────────────────────────────────┘
```

---

## 5. Delivery & Invoice Flow

```
┌──────────────────────────────────────────────────────────────────┐
│            DELIVERY → INVOICE → NOTIFICATION FLOW                │
└──────────────────────────────────────────────────────────────────┘

STEP 1: DELIVERY BOY LOGS DELIVERY
──────────────────────────────────

Rider (Mobile App):
  │
  └─→ POST /api/deliveries
      Body: {
        customerId: "customer123",
        bottlesDelivered: 5,
        bottlesReturned: 2,
        paymentCollected: 750,
        notes: "Left at gate",
        status: "delivered"
      }
      Header: Authorization: Bearer {token}

Backend:
  ├─ authenticate() + injectTenantScope()
  ├─ Verify: customerId belongs to req.supplierId
  ├─ Create Delivery document:
  │  {
  │    _id: "delivery456",
  │    supplierId: "supplier123",
  │    customerId: "customer123",
  │    deliveryBoyId: "rider789",
  │    bottlesDelivered: 5,
  │    status: "delivered",
  │    createdAt: now
  │  }
  ├─ Save to MongoDB
  └─ Delivery.post('save') hook triggers...


STEP 2: MONGOOSE POST-SAVE HOOK
────────────────────────────────

  if (delivery.status === 'delivered') {
    ├─ Call updateOrCreateInvoice(delivery):
    │  ├─ Find Invoice for (customerId, month, year)
    │  ├─ If not exists: create new Invoice
    │  ├─ Add bottlesDelivered to totalBottles
    │  └─ Save Invoice to MongoDB
    │
    ├─ Emit Socket.io event to supplier's dashboard:
    │  io.to(`supplier:${supplierId}`).emit('delivery:new', {
    │    deliveryId: "delivery456",
    │    customerId: "customer123",
    │    bottles: 5,
    │    status: "delivered",
    │    timestamp: now
    │  })
    │
    └─ Call sendDeliveryWhatsApp(delivery):
       ├─ Load customer: Customer.findById(customerId)
       ├─ Load supplier: Supplier.findById(supplierId)
       ├─ Create message:
       │  "Salam Ahmed, aap ki 5 bottles deliver ho gayi hain. Shukriya!"
       ├─ Call WhatsApp Cloud API:
       │  POST https://graph.facebook.com/v18.0/{PHONE_ID}/messages
       │  Authorization: Bearer {WHATSAPP_TOKEN}
       │  Body: {
       │    messaging_product: "whatsapp",
       │    to: "+923001234567",
       │    type: "text",
       │    text: { body: message }
       │  }
       ├─ Create NotificationLog entry:
       │  {
       │    supplierId, customerId, deliveryId,
       │    channel: "whatsapp",
       │    status: "sent",
       │    sentAt: now
       │  }
       └─ Update Delivery: notifiedAt = now


RESULT:
  ✅ Delivery logged
  ✅ Invoice updated
  ✅ Supplier's dashboard receives Socket.io event → real-time update
  ✅ Customer receives WhatsApp notification
  ✅ NotificationLog created for audit trail


STEP 3: MONTHLY INVOICE GENERATION
───────────────────────────────────

On 1st of month at 00:00 (via node-cron):

For each supplier:
  ├─ Get all customers
  ├─ For each customer:
  │  ├─ Sum deliveries: Delivery.aggregate([
  │  │    { $match: {
  │  │        customerId,
  │  │        supplierId,
  │  │        month: current,
  │  │        year: current,
  │  │        status: "delivered"
  │  │      }
  │  │    },
  │  │    { $group: { _id: null, total: { $sum: "$bottlesDelivered" } } }
  │  │  ])
  │  │
  │  ├─ Create Invoice:
  │  │  {
  │  │    supplierId,
  │  │    customerId,
  │  │    month: 1,
  │  │    year: 2025,
  │  │    totalBottles: 30,
  │  │    bottlePrice: 150,
  │  │    totalAmount: 4500,
  │  │    paymentStatus: "unpaid"
  │  │  }
  │  │
  │  ├─ Generate PDF using PDFKit:
  │  │  const doc = new PDFDocument()
  │  │  doc.fontSize(24).text("AQUA FLOW INVOICE")
  │  │  doc.fontSize(12).text(`Customer: ${customer.fullName}`)
  │  │  doc.text(`Total: PKR ${totalAmount}`)
  │  │  doc.end()
  │  │
  │  ├─ Upload PDF to Cloudinary:
  │  │  cloudinary.uploader.upload_stream({
  │  │    folder: `aquaflow/${supplierId}/invoices`,
  │  │    resource_type: "raw",
  │  │    format: "pdf"
  │  │  })
  │  │
  │  ├─ Save PDF URL to Invoice:
  │  │  Invoice.findByIdAndUpdate(invoiceId, {
  │  │    pdfUrl: result.secure_url
  │  │  })
  │  │
  │  └─ Send WhatsApp with PDF link:
  │     message = `Monthly invoice attached. Total: PKR 4500`
  │     Call WhatsApp Cloud API with pdfUrl
  │
  └─ Emit Socket.io event: 'invoice:generated'


CUSTOMER RECEIVES:
  ✅ WhatsApp message with invoice PDF link
  ✅ Can download PDF
  ✅ Can view payment history
```

---

## 6. Real-Time Updates (Socket.io)

```
┌──────────────────────────────────────────────────────────────────┐
│             SOCKET.IO REAL-TIME EVENT FLOW                       │
└──────────────────────────────────────────────────────────────────┘

SUPPLIER DASHBOARD (React + Socket.io Client):
┌─────────────────────────────────────────┐
│ Orders Today:                           │
│ ├─ Ahmed Khan (5 bottles)   ⏳ Pending  │
│ ├─ Fatima Ali (3 bottles)   ✅ Delivered│
│ └─ Muhammad (2 bottles)     ⏳ Pending  │
│                                         │
│ Real-time updates coming...             │
└─────────────────────────────────────────┘


DELIVERY BOY LOGS DELIVERY (Mobile App):
│
└─→ POST /api/deliveries { status: "delivered", ... }


BACKEND PROCESSES:
│
├─ Save Delivery to MongoDB ✅
├─ Mongoose post-save hook triggers
├─ updateOrCreateInvoice() called
├─ Socket.io emit:
│  io.to(`supplier:${supplierId}`).emit('delivery:new', {
│    deliveryId: "delivery456",
│    customerId: "customer123",
│    bottles: 5,
│    status: "delivered",
│    timestamp: "2025-01-15T10:30:00Z"
│  })
└─ sendDeliveryWhatsApp() called


SOCKET.IO EVENT TRANSMISSION:
│
├─ Event: 'delivery:new'
├─ Recipient: All users in room `supplier:supplier123`
│  (All supplier's dashboard users connected via Socket.io)
└─ Payload: { deliveryId, customerId, bottles, status, timestamp }


SUPPLIER DASHBOARD RECEIVES EVENT:
│
├─ useRealtimeDeliveries() hook listens
├─ socket.on('delivery:new', (delivery) => {
│    deliveryStore.addDelivery(delivery)  // Update Zustand
│    toast.success(`New delivery: ${delivery.bottles} bottles`)
│  })
├─ Component re-renders with new delivery
│
└─ UI UPDATES IN REAL-TIME:
   ┌─────────────────────────────────────┐
   │ Orders Today:                       │
   │ ├─ Ahmed Khan (5 bottles) ✅ Just Delivered!
   │ ├─ Fatima Ali (3 bottles)   ✅ Delivered│
   │ └─ Muhammad (2 bottles)     ⏳ Pending│
   └─────────────────────────────────────┘


SOCKET.IO ROOM MANAGEMENT:
│
├─ Supplier connects:
│  socket.on('connection', (socket) => {
│    socket.join(`supplier:${req.user.supplierId}`)
│    // Now in room: "supplier:supplier123"
│  })
│
├─ Delivery boy logs delivery → Event emitted to room
│
└─ All suppliers in that room receive event
   (But only one supplier per company uses it)


SECURITY:
  ✅ Socket.io JWT verification on connect
  ✅ Users only join their own tenant's room
  ✅ Cannot subscribe to other suppliers' rooms
  ✅ No cross-tenant event broadcast
```

---

## 7. Database Relationships

```
┌──────────────────────────────────────────────────────────────────┐
│                    MONGODB RELATIONSHIPS                         │
└──────────────────────────────────────────────────────────────────┘

users (Global)
├─ _id: ObjectId
├─ role: 'super_admin' | 'supplier' | 'delivery_boy' | 'customer'
├─ phone: String (unique, E.164 format)
├─ password: String (bcryptjs hashed, super_admin only)
└─ ...


suppliers (Global, Tenant Entity)
├─ _id: ObjectId  ← THIS IS supplierId (PRIMARY TENANT KEY)
├─ userId: ObjectId → Reference to User
├─ businessName: String
├─ isActive: Boolean
└─ ...


customers (Tenant-Scoped)
├─ _id: ObjectId
├─ supplierId: ObjectId  ← TENANT KEY (indexed)
├─ deliveryBoyId: ObjectId → Reference to DeliveryBoy
├─ fullName: String
├─ phone: String (E.164)
├─ address: String
├─ status: 'active' | 'paused' | 'blocked' | 'pending_payment'
└─ ...


deliveryboys (Tenant-Scoped)
├─ _id: ObjectId
├─ supplierId: ObjectId  ← TENANT KEY (indexed)
├─ userId: ObjectId → Reference to User
├─ areaName: String
├─ isActive: Boolean
└─ ...


deliveries (Tenant-Scoped)
├─ _id: ObjectId
├─ supplierId: ObjectId  ← TENANT KEY (indexed)
├─ customerId: ObjectId → Reference to Customer
├─ deliveryBoyId: ObjectId → Reference to DeliveryBoy
├─ deliveryDate: Date
├─ bottlesDelivered: Number
├─ status: 'pending' | 'delivered' | 'missed' | 'partial'
├─ paymentCollected: Number (PKR)
├─ proofPhotoUrl: String (Cloudinary URL)
└─ ...


invoices (Tenant-Scoped)
├─ _id: ObjectId
├─ supplierId: ObjectId  ← TENANT KEY (indexed)
├─ customerId: ObjectId → Reference to Customer
├─ month: Number (1-12)
├─ year: Number (2025)
├─ totalBottles: Number (auto-summed from deliveries)
├─ bottlePrice: Number (PKR)
├─ totalAmount: Number (calculated)
├─ paymentStatus: 'unpaid' | 'partial' | 'paid'
├─ pdfUrl: String (Cloudinary PDF URL)
└─ ...


QUERY EXAMPLES:

// Get all customers for a supplier (auto-scoped)
db.customers.find({ 
  supplierId: "supplier123",  ← ALWAYS included
  status: "active" 
})

// Get deliveries for a date range
db.deliveries.find({
  supplierId: "supplier123",  ← ALWAYS included
  deliveryDate: { $gte: startDate, $lte: endDate }
})

// Get invoice for a customer
db.invoices.find({
  supplierId: "supplier123",  ← ALWAYS included
  customerId: "customer456",
  month: 1,
  year: 2025
})
{ unique: true }  ← Ensures one invoice per customer per month
```

---

## 8. Notification Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│               NOTIFICATION SYSTEM OVERVIEW                       │
└──────────────────────────────────────────────────────────────────┘

CHANNELS:
├─ WhatsApp (Primary - 90%+ coverage in Pakistan)
├─ SMS (Fallback - Twilio)
└─ Push Notifications (Future - Capacitor)


NOTIFICATION TRIGGERS:

1. DELIVERY CONFIRMATION
   ├─ Event: Delivery status changed to "delivered"
   ├─ Recipient: Customer
   ├─ Message: "Salam [Name], aap ki [X] bottles deliver ho gayi hain. Shukriya!"
   ├─ Channel: WhatsApp (primary), SMS (fallback)
   └─ Template: WhatsApp pre-approved template


2. MONTHLY INVOICE
   ├─ Event: 1st of month (auto-generated invoice)
   ├─ Recipient: Customer
   ├─ Message: "Monthly invoice attached. Total: PKR [amount]"
   ├─ Attachment: PDF via Cloudinary link
   ├─ Channel: WhatsApp
   └─ Template: WhatsApp pre-approved template


3. PAYMENT REMINDER
   ├─ Event: Invoice unpaid after 7 days
   ├─ Recipient: Customer
   ├─ Message: "Reminder: PKR [amount] outstanding"
   ├─ Channel: SMS
   └─ Frequency: Daily for 3 days (configurable)


4. DELIVERY BOY STATUS CHANGE
   ├─ Event: Rider activated/deactivated
   ├─ Recipient: Supplier
   ├─ Message: "Push notification"
   ├─ Channel: Web dashboard Socket.io
   └─ Real-time: Immediate


NOTIFICATION LOG STRUCTURE:
┌─────────────────────────────────────────┐
│ notificationlogs collection              │
├─────────────────────────────────────────┤
│ {                                       │
│   _id: ObjectId,                        │
│   supplierId: ObjectId,  ← Scoped       │
│   customerId: ObjectId,                 │
│   deliveryId: ObjectId,                 │
│   invoiceId: ObjectId,                  │
│   channel: 'whatsapp' | 'sms' | 'push', │
│   status: 'sent' | 'failed' | 'pending',│
│   message: "Salam Ahmed...",            │
│   sentAt: 2025-01-15T10:30:00Z,        │
│   createdAt: 2025-01-15T10:30:00Z,    │
│   updatedAt: 2025-01-15T10:30:00Z      │
│ }                                       │
└─────────────────────────────────────────┘


FAILURE HANDLING:
├─ WhatsApp send fails:
│  ├─ Log: status = "failed"
│  ├─ Fallback: Retry via SMS
│  └─ Dashboard: Show "Failed - SMS Sent Instead"
│
├─ SMS send fails:
│  ├─ Log: status = "failed"
│  ├─ Retry: Every 5 minutes (3 times max)
│  └─ Dashboard: Show "Failed - Manual intervention needed"
│
└─ Invalid phone number:
   ├─ Supplier alerted: "Invalid WhatsApp phone for customer X"
   └─ Manual: Supplier updates customer phone manually


SUPPLIER SETTINGS:
┌─────────────────────────────────────┐
│ Notification Settings               │
├─────────────────────────────────────┤
│ ☑ WhatsApp Enabled                  │
│   WhatsApp Business Account ID:     │
│   [__________________]              │
│                                     │
│ ☑ SMS Enabled                       │
│   From Number: (auto-filled)        │
│                                     │
│ ☑ Daily Report                      │
│   Time: [09:00 AM]                  │
│   Include: Deliveries, Revenue      │
│                                     │
│ ☑ Payment Reminders                 │
│   After Days: [7]                   │
│   Frequency: [Every 1 day]          │
│   Max Attempts: [3]                 │
│                                     │
│            [Save Settings]          │
└─────────────────────────────────────┘
```

---

## 9. Implementation Timeline

```
┌──────────────────────────────────────────────────────────────────┐
│                      10-WEEK IMPLEMENTATION                      │
└──────────────────────────────────────────────────────────────────┘

WEEK 1: SETUP & INFRASTRUCTURE
├─ MongoDB Atlas cluster
├─ Twilio Verify & SMS setup
├─ Cloudinary account
├─ Express.js project structure
├─ Environment variables
└─ ✅ DELIVERABLE: Runnable backend scaffold

WEEK 2-3: DATA MODELS & AUTHENTICATION
├─ Mongoose schemas (all 8 models)
├─ Database indexes
├─ Phone OTP flow (Twilio)
├─ JWT token generation
├─ Middleware stack
├─ Seed script (super admin, test data)
└─ ✅ DELIVERABLE: Authenticated API endpoints

WEEK 4-5: SUPPLIER DASHBOARD APIs
├─ Customer CRUD routes
├─ Delivery boy management routes
├─ Delivery logging routes
├─ Invoice generation routes
├─ All routes with tenant scoping
└─ ✅ DELIVERABLE: Complete backend API

WEEK 6: FILE STORAGE & NOTIFICATIONS
├─ Cloudinary integration
├─ Multer upload middleware
├─ PDFKit invoice generation
├─ WhatsApp Cloud API setup
├─ SMS fallback setup
└─ ✅ DELIVERABLE: File uploads & notifications working

WEEK 7: REAL-TIME UPDATES
├─ Socket.io server setup
├─ Mongoose hooks for events
├─ Room-based messaging
├─ Dashboard real-time updates
└─ ✅ DELIVERABLE: Live delivery notifications

WEEK 8-9: REACT WEB DASHBOARD
├─ Auth pages (login, OTP verify)
├─ Supplier dashboard
├─ Customers page
├─ Riders page
├─ Deliveries page
├─ Invoices page
├─ Axios API integration
├─ Zustand state management
├─ Socket.io client
└─ ✅ DELIVERABLE: Fully functional web dashboard

WEEK 10: SUPER ADMIN PANEL & LAUNCH
├─ Admin dashboard
├─ Supplier management
├─ Plan management
├─ Android APK build
├─ Deployment to Railway/Vercel
└─ ✅ DELIVERABLE: Production-ready MVP


PARALLEL WORK:
├─ Testing (Jest, React Testing Library)
├─ Documentation
├─ Security hardening
├─ Performance optimization
└─ DevOps setup (CI/CD, monitoring)
```

---

## 10. Security Checklist

```
┌──────────────────────────────────────────────────────────────────┐
│                      SECURITY MEASURES                           │
└──────────────────────────────────────────────────────────────────┘

AUTHENTICATION:
  ✅ Phone OTP via Twilio (not guessable)
  ✅ JWT tokens (stateless, no session storage)
  ✅ Short access token expiry (15 minutes)
  ✅ Refresh token rotation possible
  ✅ Password hashing with bcryptjs (12 rounds)
  ✅ Never expose sensitive fields (select('-password'))

AUTHORIZATION:
  ✅ Role-based access control (4 roles)
  ✅ Automatic tenant scoping (no cross-tenant access)
  ✅ supplierId always from authenticated context
  ✅ Every query filtered by tenant
  ✅ Double-check on sensitive operations

API SECURITY:
  ✅ HTTPS only (enforced)
  ✅ CORS restricted to approved domains
  ✅ Rate limiting (100 req/15min, stricter on /auth)
  ✅ Helmet.js security headers
  ✅ Input validation with Zod
  ✅ SQL injection protection (Mongoose parameterized)
  ✅ XSS protection (framework-level)

DATA PROTECTION:
  ✅ Encryption in transit (HTTPS)
  ✅ Encryption at rest (MongoDB Atlas)
  ✅ Sensitive fields encrypted (WhatsApp tokens)
  ✅ File uploads scanned (Cloudinary)
  ✅ Signed URLs for private files
  ✅ Database backups daily

FILE UPLOADS:
  ✅ File type validation (images only)
  ✅ File size limits (5MB max)
  ✅ Cloudinary auto-compression
  ✅ Separate folders per tenant
  ✅ Secure delivery photo links

ENVIRONMENT:
  ✅ Secrets in .env (never in code)
  ✅ .env in .gitignore
  ✅ Different secrets per environment
  ✅ Regular secret rotation
  ✅ No logs of sensitive data

MONITORING:
  ✅ Error logging (Sentry)
  ✅ Performance monitoring
  ✅ Failed authentication logging
  ✅ Anomaly detection
  ✅ 24/7 alerting

COMPLIANCE:
  ✅ Phone number validation (PK format)
  ✅ Terms of Service acknowledgment
  ✅ Data retention policies
  ✅ GDPR compliance (if needed)
  ✅ Local data storage option
```

---

## Deployment Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                   PRODUCTION DEPLOYMENT                        │
└────────────────────────────────────────────────────────────────┘

BACKEND (Node.js API):
┌──────────────────────────────────────────┐
│ Railway / Render                         │
├──────────────────────────────────────────┤
│ • Auto-deploy from GitHub                │
│ • Environment variables secured          │
│ • 512MB RAM (free tier)                  │
│ • Auto-restart on crash                  │
│ • Health checks every 60s                │
│ • HTTPS with auto SSL                    │
│ • Domain: api.aquaflow.pk                │
└──────────────────────────────────────────┘


DATABASE:
┌──────────────────────────────────────────┐
│ MongoDB Atlas M10 Cluster                │
├──────────────────────────────────────────┤
│ • 2GB RAM, dedicated cluster              │
│ • Automatic daily backups                │
│ • Network ACL configured                 │
│ • Connection pooling enabled             │
│ • Index optimization                     │
│ • Data encrypted at rest                 │
└──────────────────────────────────────────┘


FILE STORAGE:
┌──────────────────────────────────────────┐
│ Cloudinary Plus                          │
├──────────────────────────────────────────┤
│ • 225GB storage                          │
│ • Global CDN                             │
│ • Auto image compression                 │
│ • 1-day media retention                  │
│ • Private folder per tenant              │
│ • Signed URLs for security               │
└──────────────────────────────────────────┘


FRONTEND (React):
┌──────────────────────────────────────────┐
│ Vercel                                   │
├──────────────────────────────────────────┤
│ • Auto-deploy on main branch             │
│ • Preview deployments                    │
│ • HTTPS with auto SSL                    │
│ • CDN edge caching                       │
│ • Custom domain: app.aquaflow.pk        │
│ • Environment variables (VITE_API_URL)  │
└──────────────────────────────────────────┘


SMS / OTP:
┌──────────────────────────────────────────┐
│ Twilio                                   │
├──────────────────────────────────────────┤
│ • Twilio Verify (OTP delivery)           │
│ • Twilio SMS (notifications)             │
│ • Pay per use (~0.05 PKR per SMS)        │
│ • Built-in retry logic                   │
│ • PK phone number support                │
└──────────────────────────────────────────┘


WHATSAPP:
┌──────────────────────────────────────────┐
│ Meta Cloud API                           │
├──────────────────────────────────────────┤
│ • Free: 1000 msgs/month                  │
│ • WABA number required                   │
│ • Template approval needed               │
│ • Webhook for incoming messages          │
│ • 24-hour conversation window            │
└──────────────────────────────────────────┘


MONITORING:
┌──────────────────────────────────────────┐
│ Sentry + Datadog                         │
├──────────────────────────────────────────┤
│ • Error tracking                         │
│ • Performance monitoring                 │
│ • Alerting on issues                     │
│ • 24/7 incident management               │
│ • Analytics & insights                   │
└──────────────────────────────────────────┘


CI/CD PIPELINE:
┌──────────────────────────────────────────┐
│ GitHub Actions                           │
├──────────────────────────────────────────┤
│ • Run tests on PR                        │
│ • Build Docker image (optional)          │
│ • Deploy to Railway on main              │
│ • Deploy to Vercel on main               │
│ • Run migrations                         │
└──────────────────────────────────────────┘
```

---

**Document Version**: 1.0  
**Created**: 2025  
**Author**: AquaFlow Development Team
