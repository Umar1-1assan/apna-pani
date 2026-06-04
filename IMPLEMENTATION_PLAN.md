# AquaFlow SaaS - Detailed Implementation Plan
## Professional Role-Based Authentication & Multi-Tenant Architecture

**Version:** 1.0  
**Date:** 2025  
**Project:** AquaFlow - Water Delivery Management Platform  
**Stack:** Node.js + Express + MongoDB + React + Capacitor

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Role-Based Access Control (RBAC)](#3-role-based-access-control-rbac)
4. [Multi-Tenant Data Isolation Strategy](#4-multi-tenant-data-isolation-strategy)
5. [Database Schema Design](#5-database-schema-design)
6. [Authentication Flow](#6-authentication-flow)
7. [Authorization Middleware](#7-authorization-middleware)
8. [Implementation Phases](#8-implementation-phases)
9. [Security Best Practices](#9-security-best-practices)
10. [Code Structure & File Organization](#10-code-structure--file-organization)
11. [Testing Strategy](#11-testing-strategy)
12. [Deployment Checklist](#12-deployment-checklist)

---

## 1. Executive Summary

AquaFlow is a **multi-tenant SaaS platform** for Pakistan's water delivery industry. The system enables:

- **Super Admin**: Platform-level administration (registers suppliers, monitors revenue, manages plans)
- **Supplier (Company)**: Tenant owner (registers customers, manages riders, tracks deliveries)
- **Delivery Boy (Rider)**: Field operations (captures proof, logs deliveries, manages route)
- **Customer**: End consumer (receives water bottles, views invoices)

### Key Design Principles

1. **Phone-First OTP Authentication** - Twilio Verify for phone-based login
2. **Role-Based Access Control** - 4 distinct roles with granular permissions
3. **Complete Multi-Tenancy** - Suppliers are completely isolated; data cannot cross tenant boundaries
4. **Stateless JWT** - Scalable, stateless authentication
5. **Automatic Tenant Scoping** - Every query automatically filtered by tenant ID
6. **Professional-Grade Security** - Rate limiting, input validation, secure file storage

---

## 2. Architecture Overview

### 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     AQUAFLOW SaaS PLATFORM                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Web Application              │  Mobile Application              │
│  (React + Vite + Tailwind)    │  (React + Capacitor)             │
│                                │                                 │
│  ├─ Super Admin Dashboard      │  ├─ Delivery Boy App            │
│  ├─ Supplier Dashboard         │  ├─ GPS Tracking               │
│  └─ Analytics                  │  └─ Photo Capture              │
│                                │                                 │
└──────────────────────────────────────────────────────────────────┘
                              ↓ (HTTPS)
┌──────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  POST /api/auth/send-otp  → Twilio Verify (OTP)                │
│  POST /api/auth/verify-otp → JWT Token Issuance                │
│  POST /api/auth/refresh   → Token Refresh                       │
│                                                                  │
│  JWT Middleware:                                                │
│  ├─ Extract & Verify Token                                     │
│  ├─ Identify User Role & Tenant                                │
│  └─ Inject supplierId into Request Context                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    AUTHORIZATION LAYER                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Role Guards:                                                   │
│  ├─ requireRole('super_admin') → Global access                │
│  ├─ requireRole('supplier') → Tenant-scoped access            │
│  ├─ requireRole('delivery_boy') → Assigned customers only     │
│  └─ requireRole('customer') → Own data only                   │
│                                                                  │
│  Tenant Isolation Middleware:                                  │
│  └─ Auto-filter all queries by supplierId (req.supplierId)    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                      API ROUTES LAYER                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Supplier Routes            Admin Routes          Auth Routes   │
│  ├─ /customers   [CRUD]     ├─ /suppliers        ├─ /send-otp │
│  ├─ /riders      [CRUD]     ├─ /plans            ├─ /verify    │
│  ├─ /deliveries  [READ]     ├─ /revenue          └─ /refresh   │
│  └─ /invoices    [READ]     └─ /subscriptions                  │
│                                                                  │
│  Delivery Routes              Customer Routes                   │
│  ├─ /log-delivery [CREATE]    ├─ /profile [READ]               │
│  └─ /proof-photo [UPLOAD]     └─ /invoices [READ]              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Services:                          Hooks:                      │
│  ├─ OTP Service (Twilio)           ├─ Post-save: Invoice       │
│  ├─ WhatsApp Service               ├─ Post-save: Notification  │
│  ├─ Invoice Service (PDFKit)       └─ Pre-delete: Cleanup      │
│  ├─ Cloudinary Service                                          │
│  └─ SMS Service (Twilio)                                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                      DATA LAYER (MONGODB)                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Collections:                                                   │
│  ├─ users          (All authenticated users)                   │
│  ├─ suppliers      (Tenant entities with supplierId)           │
│  ├─ customers      (Scoped by supplierId)                      │
│  ├─ deliveryboys   (Scoped by supplierId)                      │
│  ├─ deliveries     (Scoped by supplierId)                      │
│  ├─ invoices       (Scoped by supplierId)                      │
│  ├─ notifications  (Scoped by supplierId)                      │
│  └─ subscriptionplans (Global)                                 │
│                                                                  │
│  Indexing Strategy:                                             │
│  ├─ { supplierId: 1 } on all tenant collections               │
│  ├─ { supplierId: 1, status: 1 } for filtered queries         │
│  ├─ { phone: 1 } with unique constraint (users)               │
│  └─ Compound indexes for common filter combinations           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                   EXTERNAL INTEGRATIONS                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Twilio (OTP & SMS)      MongoDB Atlas      Cloudinary          │
│  WhatsApp Cloud API      Socket.io          Email Service       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Role-Based Access Control (RBAC)

### 3.1 Role Hierarchy & Permissions Matrix

```
┌────────────────────────────────────────────────────────────────────┐
│                        ROLE HIERARCHY                              │
└────────────────────────────────────────────────────────────────────┘

Role: super_admin
├─ Scope: Global (All tenants)
├─ Platform: Web Dashboard only
├─ Auth Method: Email + Password (or Phone OTP)
├─ Key Permissions:
│  ├─ Register/activate new suppliers
│  ├─ View all suppliers globally
│  ├─ Manage subscription plans
│  ├─ View platform-wide revenue & analytics
│  ├─ Suspend/activate suppliers
│  ├─ View notification logs across all tenants
│  └─ Seed initial data
└─ Cannot: Perform tenant-specific operations

Role: supplier
├─ Scope: Own tenant only (via supplierId)
├─ Platform: Web Dashboard
├─ Auth Method: Phone OTP (Twilio Verify)
├─ Key Permissions:
│  ├─ Register & manage customers (within own tenant)
│  ├─ Register & manage delivery boys (within own tenant)
│  ├─ View all deliveries logged by own riders
│  ├─ Generate & send invoices to customers
│  ├─ Configure WhatsApp/SMS settings
│  ├─ View financial reports (own tenant)
│  └─ Manage subscription/plan
└─ Cannot: Access other suppliers' data, register super_admin users

Role: delivery_boy (Rider)
├─ Scope: Assigned customers only (via deliveryBoyId)
├─ Platform: Mobile App (React + Capacitor)
├─ Auth Method: Phone OTP (Twilio Verify)
├─ Key Permissions:
│  ├─ View assigned customers for today
│  ├─ Log delivery (bottles delivered/returned)
│  ├─ Upload proof photo (Cloudinary)
│  ├─ View payment collected
│  ├─ Access own delivery history
│  └─ View customer contact info (only assigned)
└─ Cannot: Register customers, access other riders' data, view invoices

Role: customer (Future)
├─ Scope: Own profile & invoices only
├─ Platform: Mobile App (React + Capacitor)
├─ Auth Method: Phone OTP (Twilio Verify)
├─ Key Permissions:
│  ├─ View own invoice history
│  ├─ View past deliveries
│  ├─ Update delivery address/phone
│  └─ View payment status
└─ Cannot: Register riders, manage other customers, access platform settings
```

### 3.2 Permissions Matrix

| Action | Super Admin | Supplier | Delivery Boy | Customer |
|--------|------------|----------|--------------|----------|
| **Supplier Management** |
| Register supplier | ✅ | ❌ | ❌ | ❌ |
| View all suppliers | ✅ | ❌ | ❌ | ❌ |
| Edit own supplier profile | ✅ | ✅ | ❌ | ❌ |
| View supplier analytics | ✅ | ✅* | ❌ | ❌ |
| **Customer Management** |
| Create customer | ✅ | ✅ | ❌ | ❌ |
| View customers (all) | ✅ | ✅* | ❌ | ❌ |
| Edit customer | ✅ | ✅* | ❌ | ❌ |
| View customer detail | ✅ | ✅* | ✅** | ❌ |
| **Delivery Boy Management** |
| Register delivery boy | ✅ | ✅ | ❌ | ❌ |
| View delivery boys | ✅ | ✅* | ❌ | ❌ |
| Assign customer to rider | ✅ | ✅ | ❌ | ❌ |
| **Deliveries** |
| View all deliveries | ✅ | ✅* | ❌ | ❌ |
| Log delivery | ❌ | ❌ | ✅*** | ❌ |
| Upload proof photo | ❌ | ❌ | ✅*** | ❌ |
| **Invoices** |
| Generate invoice | ✅ | ✅* | ❌ | ❌ |
| View invoices | ✅ | ✅* | ❌ | ✅**** |
| Send invoice via WhatsApp | ✅ | ✅* | ❌ | ❌ |
| **Plans & Billing** |
| Manage subscription plans | ✅ | ❌ | ❌ | ❌ |
| View plan details | ✅ | ✅ | ❌ | ❌ |

**Legend:**
- ✅ = Full access
- ❌ = No access
- ✅* = Own tenant only
- ✅** = Only assigned customers
- ✅*** = Only own deliveries
- ✅**** = Own invoices only

---

## 4. Multi-Tenant Data Isolation Strategy

### 4.1 Tenant Isolation Architecture

The platform uses **application-layer tenant isolation** with automatic query scoping. This prevents accidental cross-tenant data leakage while remaining performant.

```typescript
// ============================================================
// PRINCIPLE: Never trust the frontend or user input for tenant ID
// Always inject supplierId from authenticated context
// ============================================================

// Middleware 1: Extract & Verify JWT
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  req.user = await User.findById(decoded.userId).select('-password');
  if (!req.user) return res.status(401).json({ message: 'User not found' });
  
  next();
};

// Middleware 2: Inject supplierId from user context
export const injectTenantScope = async (req, res, next) => {
  if (req.user.role === 'supplier') {
    // Supplier: find their supplierId from Supplier document
    const supplier = await Supplier.findOne({ userId: req.user._id });
    req.supplierId = supplier?._id;  // ← INJECTED
  } else if (req.user.role === 'delivery_boy') {
    // Rider: find their supplierId from DeliveryBoy document
    const deliveryBoy = await DeliveryBoy.findOne({ userId: req.user._id });
    req.supplierId = deliveryBoy?.supplierId;  // ← INJECTED
  } else if (req.user.role === 'super_admin') {
    // Super admin has no tenant scope
    req.supplierId = null;
  }
  next();
};

// Middleware 3: Automatic query scoping
export const scopeToTenant = (req, res, next) => {
  // Attach a helper to the request object
  req.filterByTenant = (filter: any = {}) => {
    if (req.supplierId) {
      return { ...filter, supplierId: req.supplierId };
    }
    return filter;
  };
  next();
};
```

### 4.2 Query Enforcement Pattern

Every database query is automatically scoped:

```typescript
// ✅ CORRECT - Uses tenant scope
router.get('/customers', authenticate, injectTenantScope, async (req, res) => {
  const filter = req.filterByTenant({ status: 'active' });
  const customers = await Customer.find(filter);
  res.json(customers);
});

// ❌ WRONG - Could leak data
router.get('/customers', authenticate, async (req, res) => {
  const customers = await Customer.find({ status: 'active' });  // No supplierId!
  res.json(customers);
});
```

### 4.3 Data Isolation Per Role

| Role | Isolation Method | Database Constraint |
|------|-----------------|-------------------|
| **Super Admin** | Global access (no filtering) | No supplierId filter |
| **Supplier** | Filtered by supplierId | Every query: { supplierId: req.supplierId } |
| **Delivery Boy** | Filtered by assigned customers | Query: { deliveryBoyId: req.user._id, supplierId: req.supplierId } |
| **Customer** | Filtered by customerId | Query: { _id: req.user.customerId } (future) |

### 4.4 Collection-Level Indexing for Performance

```typescript
// customers.ts
CustomerSchema.index({ supplierId: 1 });
CustomerSchema.index({ supplierId: 1, status: 1 });
CustomerSchema.index({ supplierId: 1, deliveryBoyId: 1 });

// deliveries.ts
DeliverySchema.index({ supplierId: 1 });
DeliverySchema.index({ supplierId: 1, deliveryDate: -1 });
DeliverySchema.index({ supplierId: 1, customerId: 1 });

// invoices.ts
InvoiceSchema.index({ supplierId: 1 });
InvoiceSchema.index({ supplierId: 1, customerId: 1, month: 1, year: 1 }, { unique: true });
```

---

## 5. Database Schema Design

### 5.1 User Model (Global Collection)

Stores all authenticated users (super_admin, supplier, delivery_boy, customer).

```typescript
interface User {
  _id: ObjectId;
  role: 'super_admin' | 'supplier' | 'delivery_boy' | 'customer';
  fullName: string;
  phone: string;  // E.164 format: +92XXXXXXXXXX (unique, indexed)
  email?: string;  // Optional, for super_admin
  password?: string;  // Hashed with bcryptjs (super_admin only)
  avatarUrl?: string;  // Cloudinary URL
  isActive: boolean;  // Soft-delete flag
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB Schema
UserSchema.index({ phone: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.pre('save', async function() {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});
```

### 5.2 Supplier Model (Tenant Entity)

Represents a water supply company. **PRIMARY TENANT KEY**.

```typescript
interface Supplier {
  _id: ObjectId;  // supplierId (used in all queries)
  userId: ObjectId;  // Reference to User document
  businessName: string;
  address: string;
  city: string;  // e.g., "Rawalpindi", "Lahore"
  phone: string;
  plan: 'basic' | 'standard' | 'enterprise';
  planExpiresAt?: Date;
  isActive: boolean;
  logoUrl?: string;  // Cloudinary URL
  whatsappToken?: string;  // Encrypted at rest
  whatsappPhoneId?: string;
  smsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB Schema
SupplierSchema.index({ userId: 1 }, { unique: true });
SupplierSchema.index({ isActive: 1 });
SupplierSchema.index({ plan: 1 });
```

### 5.3 Customer Model (Scoped to Supplier)

Represents an end customer who receives water deliveries.

```typescript
interface Customer {
  _id: ObjectId;
  supplierId: ObjectId;  // ← Tenant scoping key
  deliveryBoyId?: ObjectId;  // Assigned rider
  fullName: string;
  phone: string;  // E.164 format
  whatsappPhone?: string;
  address: string;
  area: string;  // e.g., "Satellite Town Block B"
  location: {
    type: 'Point';
    coordinates: [number, number];  // [longitude, latitude]
  };
  monthlyBottles: number;  // Expected bottles per month
  bottlePrice: number;  // PKR
  billingCycle: 'monthly' | 'weekly';
  status: 'active' | 'paused' | 'blocked' | 'pending_payment';
  advancePaid: number;  // PKR
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB Schema
CustomerSchema.index({ supplierId: 1 });
CustomerSchema.index({ supplierId: 1, status: 1 });
CustomerSchema.index({ supplierId: 1, deliveryBoyId: 1 });
CustomerSchema.index({ location: '2dsphere' });  // Geo queries
```

### 5.4 DeliveryBoy Model (Scoped to Supplier)

Represents a delivery rider employed by a supplier.

```typescript
interface DeliveryBoy {
  _id: ObjectId;
  supplierId: ObjectId;  // ← Tenant scoping key
  userId: ObjectId;  // Reference to User document
  areaName: string;  // e.g., "Satellite Town", "Bahria Town"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB Schema
DeliveryBoySchema.index({ supplierId: 1 });
DeliveryBoySchema.index({ userId: 1 }, { unique: true });
```

### 5.5 Delivery Model (Scoped to Supplier)

Represents a single delivery transaction.

```typescript
interface Delivery {
  _id: ObjectId;
  supplierId: ObjectId;  // ← Tenant scoping key
  customerId: ObjectId;  // Reference to Customer
  deliveryBoyId: ObjectId;  // Reference to DeliveryBoy
  deliveryDate: Date;
  bottlesDelivered: number;  // Units delivered
  bottlesReturned: number;  // Empty bottles returned
  bottleType: 'standard' | 'jumbo' | 'small';
  status: 'pending' | 'delivered' | 'missed' | 'partial' | 'extra';
  paymentCollected: number;  // PKR
  proofPhotoUrl?: string;  // Cloudinary secure_url
  notes?: string;
  notifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB Schema
DeliverySchema.index({ supplierId: 1 });
DeliverySchema.index({ supplierId: 1, deliveryDate: -1 });
DeliverySchema.index({ customerId: 1, supplierId: 1 });
DeliverySchema.post('save', async function(doc) {
  if (doc.status === 'delivered') {
    await updateOrCreateInvoice(doc);
    getIO().to(`supplier:${doc.supplierId}`).emit('delivery:new', doc);
    await sendDeliveryWhatsApp(doc._id);
  }
});
```

### 5.6 Invoice Model (Scoped to Supplier)

Represents a monthly bill for a customer.

```typescript
interface Invoice {
  _id: ObjectId;
  supplierId: ObjectId;  // ← Tenant scoping key
  customerId: ObjectId;  // Reference to Customer
  month: number;  // 1-12
  year: number;  // 2025
  totalBottles: number;
  bottlePrice: number;  // PKR
  previousDues: number;  // PKR
  discounts: number;  // PKR
  paidAmount: number;  // PKR
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  pdfUrl?: string;  // Cloudinary PDF secure_url
  sentVia?: 'whatsapp' | 'sms' | 'manual';
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Virtual fields
InvoiceSchema.virtual('subtotal').get(function() {
  return this.totalBottles * this.bottlePrice;
});

InvoiceSchema.virtual('totalAmount').get(function() {
  return this.subtotal + this.previousDues - this.discounts;
});

// MongoDB Schema
InvoiceSchema.index({ supplierId: 1 });
InvoiceSchema.index({ supplierId: 1, customerId: 1, month: 1, year: 1 }, { unique: true });
```

### 5.7 NotificationLog Model (Scoped to Supplier)

Audit trail of all notifications sent.

```typescript
interface NotificationLog {
  _id: ObjectId;
  supplierId: ObjectId;  // ← Tenant scoping key
  customerId?: ObjectId;
  deliveryId?: ObjectId;
  invoiceId?: ObjectId;
  channel: 'whatsapp' | 'sms' | 'push';
  status: 'sent' | 'failed' | 'pending';
  message: string;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB Schema
NotificationLogSchema.index({ supplierId: 1, sentAt: -1 });
```

### 5.8 SubscriptionPlan Model (Global, Shared)

Defines available plans for suppliers.

```typescript
interface SubscriptionPlan {
  _id: ObjectId;
  name: string;  // 'basic', 'standard', 'enterprise'
  maxCustomers?: number;  // null = unlimited
  maxRiders?: number;
  pricePkr: number;
  features: Record<string, boolean>;  // { whatsapp: true, gps: false, ... }
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Seed data
await SubscriptionPlan.insertMany([
  {
    name: 'basic',
    maxCustomers: 100,
    maxRiders: 5,
    pricePkr: 5000,
    features: { whatsapp: false, sms: true, reports: false }
  },
  {
    name: 'standard',
    maxCustomers: 500,
    maxRiders: 20,
    pricePkr: 12000,
    features: { whatsapp: true, sms: true, reports: true, api: false }
  },
  {
    name: 'enterprise',
    maxCustomers: null,
    maxRiders: null,
    pricePkr: 0,
    features: { whatsapp: true, sms: true, reports: true, api: true, custom: true }
  }
]);
```

---

## 6. Authentication Flow

### 6.1 OTP-Based Authentication Flow (Supplier & Delivery Boy)

```
┌─────────────────────────────────────────────────────────────────┐
│              PHONE OTP AUTHENTICATION FLOW                       │
└─────────────────────────────────────────────────────────────────┘

STEP 1: User requests OTP
────────────────────────
Client (Web/Mobile)
  │
  └─→ POST /api/auth/send-otp
      Body: { phone: "03001234567" }
      
      ↓
Server
  ├─ Normalize phone: +923001234567 (E.164)
  ├─ Validate format: /^\+92[0-9]{10}$/
  ├─ Call: Twilio Verify Service
  │  └─→ Sends 6-digit OTP via SMS
  └─ Response: { message: "OTP sent", phone: "+923001234567" }

Client displays: "Enter OTP sent to your phone"


STEP 2: User verifies OTP
─────────────────────────
Client
  │
  └─→ POST /api/auth/verify-otp
      Body: { phone: "+923001234567", code: "123456" }
      
      ↓
Server
  ├─ Call: Twilio Verify Checks
  │  └─→ Validates OTP code
  ├─ Check: User exists in database
  │  └─→ SELECT * FROM users WHERE phone = "+923001234567"
  ├─ Generate Access Token
  │  └─→ JWT { userId, role, iat, exp: 15 minutes }
  ├─ Generate Refresh Token
  │  └─→ JWT { userId, iat, exp: 30 days }
  └─ Response: {
       accessToken: "eyJhbGc...",
       refreshToken: "eyJhbGc...",
       user: { _id, phone, role, fullName }
     }

Client
  ├─ Store: accessToken in memory
  ├─ Store: refreshToken in localStorage/AsyncStorage
  ├─ Set: Authorization header
  └─ Redirect: based on role


STEP 3: Access Protected Route
───────────────────────────────
Client
  │
  └─→ GET /api/suppliers/customers
      Header: Authorization: Bearer eyJhbGc...
      
      ↓
Server Middleware Chain
  ├─ authenticate()
  │  ├─ Extract token from header
  │  ├─ Verify JWT signature
  │  ├─ Check expiration
  │  └─ Load user from database
  ├─ injectTenantScope()
  │  ├─ Look up: Supplier { userId: req.user._id }
  │  └─ Set: req.supplierId = supplier._id
  ├─ requireRole('supplier')
  │  └─ Check: req.user.role === 'supplier'
  └─ Route Handler
     └─ GET /customers filtered by req.supplierId

Response: [{ _id, fullName, phone, ... }] (only own customers)


STEP 4: Token Refresh
────────────────────
When access token expires:

Client
  │
  └─→ POST /api/auth/refresh
      Body: { refreshToken: "eyJhbGc..." }
      
      ↓
Server
  ├─ Verify refresh token
  ├─ Load user from database
  ├─ Generate NEW access token
  └─ Response: { accessToken: "newJwt..." }

Client
  ├─ Replace: old accessToken
  └─ Retry: original request with new token
```

### 6.2 Email + Password Authentication (Super Admin Only)

```typescript
// POST /api/auth/admin/login
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  
  // 1. Validate input
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  });
  const validated = schema.parse(req.body);
  
  // 2. Find super_admin user
  const user = await User.findOne({ 
    email: validated.email, 
    role: 'super_admin' 
  }).select('+password');
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // 3. Verify password
  const isMatch = await bcrypt.compare(validated.password, user.password!);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // 4. Issue tokens
  const accessToken = jwt.sign(
    { userId: user._id, role: 'super_admin' },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '30d' }
  );
  
  // 5. Return tokens
  res.json({ accessToken, refreshToken, user: user.toObject() });
};
```

---

## 7. Authorization Middleware

### 7.1 Middleware Stack

```typescript
// ============================================================
// File: src/middleware/auth.middleware.ts
// ============================================================

import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Supplier } from '../models/Supplier';
import { DeliveryBoy } from '../models/DeliveryBoy';

// Middleware 1: Authenticate JWT
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'No token provided',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        message: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
    }
    
    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({ 
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Middleware 2: Inject tenant scope (supplierId)
export const injectTenantScope = async (req, res, next) => {
  try {
    if (req.user.role === 'supplier') {
      const supplier = await Supplier.findOne({ userId: req.user._id });
      if (!supplier) {
        return res.status(403).json({ 
          message: 'Supplier profile not found',
          code: 'SUPPLIER_NOT_FOUND'
        });
      }
      req.supplierId = supplier._id;
    } else if (req.user.role === 'delivery_boy') {
      const deliveryBoy = await DeliveryBoy.findOne({ userId: req.user._id });
      if (!deliveryBoy) {
        return res.status(403).json({ 
          message: 'Delivery boy profile not found',
          code: 'DELIVERY_BOY_NOT_FOUND'
        });
      }
      req.supplierId = deliveryBoy.supplierId;
      req.deliveryBoyId = deliveryBoy._id;
    } else if (req.user.role === 'super_admin') {
      // Super admin has no tenant scope
      req.supplierId = null;
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware 3: Require specific roles
export const requireRole = (...allowedRoles: string[]) => 
  (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden. Required role: ${allowedRoles.join(', ')}`,
        code: 'INSUFFICIENT_ROLE'
      });
    }
    next();
  };

// Middleware 4: Utility for tenant filtering
export const scopeByTenant = (req, res, next) => {
  req.filterByTenant = (filter: any = {}) => {
    if (req.supplierId) {
      return { ...filter, supplierId: req.supplierId };
    }
    return filter;
  };
  next();
};

// Middleware 5: Optional - Rate limiting per role
import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,  // 5 requests per window
  message: 'Too many login attempts, please try again later'
});

export const otpRateLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 3,  // 3 OTP requests per minute
  message: 'Too many OTP requests, please try again later'
});
```

### 7.2 Using Middleware in Routes

```typescript
// ============================================================
// File: src/routes/suppliers.routes.ts
// ============================================================

import { Router } from 'express';
import {
  authenticate,
  injectTenantScope,
  requireRole,
  scopeByTenant
} from '../middleware/auth.middleware';

const router = Router();

// ✅ Correct: Protected supplier route with tenant isolation
router.get('/customers', 
  authenticate,           // Step 1: Verify JWT
  injectTenantScope,      // Step 2: Extract supplierId
  requireRole('supplier'), // Step 3: Check role
  scopeByTenant,          // Step 4: Add filter helper
  async (req, res) => {
    // Auto-scoped query
    const filter = req.filterByTenant({ status: 'active' });
    const customers = await Customer.find(filter);
    res.json(customers);
  }
);

// ✅ Correct: Super admin can view all suppliers
router.get('/all-suppliers',
  authenticate,
  requireRole('super_admin'),  // Only super_admin
  async (req, res) => {
    // No tenant filtering
    const suppliers = await Supplier.find({ isActive: true });
    res.json(suppliers);
  }
);

// ✅ Correct: Delivery boy can only view assigned customers
router.get('/my-route',
  authenticate,
  injectTenantScope,
  requireRole('delivery_boy'),
  async (req, res) => {
    // Note: deliveryBoyId injected by injectTenantScope
    const filter = req.filterByTenant({ 
      deliveryBoyId: req.deliveryBoyId
    });
    const customers = await Customer.find(filter);
    res.json(customers);
  }
);

export default router;
```

---

## 8. Implementation Phases

### Phase 0: Setup (Week 1)

**Objectives:** Environment setup, project structure, dependencies

**Deliverables:**

1. **Repository Initialization**
   - [ ] Create monorepo structure with npm workspaces
   - [ ] Configure TypeScript for both server and web
   - [ ] Set up Git workflow (main, dev branches)

2. **Backend Setup**
   - [ ] Install dependencies: Express, Mongoose, JWT, Twilio, Cloudinary
   - [ ] Create `.env` file with all required variables
   - [ ] Configure MongoDB Atlas connection
   - [ ] Set up Express app scaffold (index.ts)

3. **Frontend Setup**
   - [ ] Create React + Vite project
   - [ ] Install Tailwind CSS, React Router, Axios, Zustand
   - [ ] Create folder structure (pages, components, hooks, stores)

4. **Database**
   - [ ] Create MongoDB Atlas cluster
   - [ ] Set up network access rules
   - [ ] Test connection

**Files to create:**
- `server/src/index.ts` - Express app entry
- `server/src/config/db.ts` - MongoDB connection
- `server/src/config/env.ts` - Environment validation
- `server/.env` - Environment variables
- `apps/web/.env` - Frontend env

---

### Phase 1: Data Models & Authentication (Weeks 2-3)

**Objectives:** Design database schemas, implement OTP-based authentication

**Deliverables:**

1. **Mongoose Models**
   - [ ] Create User model with phone + password validation
   - [ ] Create Supplier model with tenant reference
   - [ ] Create Customer, DeliveryBoy, Delivery models
   - [ ] Create Invoice, NotificationLog models
   - [ ] Add all necessary indexes
   - [ ] Add pre/post hooks

2. **OTP Service**
   - [ ] Configure Twilio Verify service
   - [ ] Implement `sendOtp(phone)` function
   - [ ] Implement `verifyOtp(phone, code)` function
   - [ ] Add phone normalization utility

3. **Authentication Routes**
   - [ ] POST /api/auth/send-otp
   - [ ] POST /api/auth/verify-otp
   - [ ] POST /api/auth/refresh
   - [ ] POST /api/auth/admin/login (email + password)
   - [ ] Add input validation (Zod)

4. **Middleware**
   - [ ] `authenticate` - JWT verification
   - [ ] `injectTenantScope` - Extract supplierId
   - [ ] `requireRole` - Role validation
   - [ ] `scopeByTenant` - Query filtering
   - [ ] Error handling middleware

5. **Seed Script**
   - [ ] Create super_admin user with email + password
   - [ ] Create sample suppliers for testing
   - [ ] Create subscription plans
   - [ ] Create sample customers/riders

**Files to create:**
```
server/src/
├── models/
│   ├── User.ts
│   ├── Supplier.ts
│   ├── Customer.ts
│   ├── DeliveryBoy.ts
│   ├── Delivery.ts
│   ├── Invoice.ts
│   ├── NotificationLog.ts
│   └── SubscriptionPlan.ts
├── routes/
│   └── auth.routes.ts
├── services/
│   └── otp.service.ts
├── middleware/
│   ├── auth.middleware.ts
│   └── error.middleware.ts
├── scripts/
│   └── seed.ts
└── utils/
    └── phoneUtils.ts
```

---

### Phase 2: Supplier Dashboard APIs (Weeks 4-5)

**Objectives:** Build core business logic - customer & rider management

**Deliverables:**

1. **Customer Management**
   - [ ] POST /api/suppliers/customers - Register customer
   - [ ] GET /api/suppliers/customers - List customers (paginated)
   - [ ] GET /api/suppliers/customers/:id - Get customer detail
   - [ ] PUT /api/suppliers/customers/:id - Update customer
   - [ ] DELETE /api/suppliers/customers/:id - Deactivate customer
   - [ ] POST /api/suppliers/customers/:id/assign-rider - Assign delivery boy
   - [ ] All queries auto-scoped by supplierId

2. **Delivery Boy Management**
   - [ ] POST /api/suppliers/riders - Register rider
   - [ ] GET /api/suppliers/riders - List riders
   - [ ] PUT /api/suppliers/riders/:id - Update rider
   - [ ] DELETE /api/suppliers/riders/:id - Deactivate rider

3. **Delivery Routes**
   - [ ] POST /api/deliveries - Log delivery (rider)
   - [ ] GET /api/deliveries - List deliveries (supplier)
   - [ ] GET /api/deliveries/:id - Get delivery detail
   - [ ] POST /api/deliveries/:id/proof - Upload proof photo

4. **Invoice Routes**
   - [ ] GET /api/invoices - List invoices
   - [ ] GET /api/invoices/:id - Get invoice detail
   - [ ] POST /api/invoices/:customerId/:month/:year - Generate invoice

5. **Input Validation**
   - [ ] Add Zod schemas for all endpoints
   - [ ] Validate phone numbers (PK format)
   - [ ] Validate dates, amounts, enums

**Files to create:**
```
server/src/
├── routes/
│   ├── customers.routes.ts
│   ├── riders.routes.ts
│   ├── deliveries.routes.ts
│   └── invoices.routes.ts
├── controllers/
│   ├── customers.controller.ts
│   ├── riders.controller.ts
│   ├── deliveries.controller.ts
│   └── invoices.controller.ts
└── types/
    └── express.d.ts  (extend Express Request type)
```

---

### Phase 3: File Storage & Notifications (Week 6)

**Objectives:** Integrate Cloudinary and notification systems

**Deliverables:**

1. **Cloudinary Integration**
   - [ ] Configure Cloudinary SDK
   - [ ] Create upload middleware for delivery photos
   - [ ] Create upload middleware for supplier logos
   - [ ] Implement signed URLs for private photos
   - [ ] Test transformations (resize, compression)

2. **Invoice PDF Generation**
   - [ ] Create PDFKit invoice generator
   - [ ] Upload PDFs to Cloudinary
   - [ ] Store PDF URL in Invoice document
   - [ ] Add PDF download endpoint

3. **WhatsApp Service**
   - [ ] Register with Meta Cloud API
   - [ ] Create WhatsApp message service
   - [ ] Implement delivery confirmation template
   - [ ] Implement invoice template
   - [ ] Add webhook receiver (optional for Phase 2)

4. **SMS Fallback**
   - [ ] Implement Twilio SMS service
   - [ ] Create SMS templates
   - [ ] Add SMS notification trigger

5. **Notification Logging**
   - [ ] Create NotificationLog on every send
   - [ ] Track delivery, channel, status

**Files to create:**
```
server/src/
├── services/
│   ├── cloudinary.service.ts
│   ├── invoice.service.ts  (PDF generation)
│   ├── whatsapp.service.ts
│   └── sms.service.ts
├── middleware/
│   └── upload.middleware.ts
└── config/
    └── cloudinary.ts
```

---

### Phase 4: Real-Time Updates & Socket.io (Week 7)

**Objectives:** Implement real-time delivery notifications

**Deliverables:**

1. **Socket.io Server Setup**
   - [ ] Initialize Socket.io with HTTP server
   - [ ] Configure CORS for frontend
   - [ ] Add JWT authentication middleware
   - [ ] Create room-based messaging (supplier:id)

2. **Event Emitters**
   - [ ] Emit event when delivery is created
   - [ ] Emit event when delivery is delivered
   - [ ] Emit event when invoice is generated
   - [ ] Broadcast to supplier's room

3. **Mongoose Hooks**
   - [ ] Post-save hook on Delivery to emit events
   - [ ] Post-save hook on Invoice to emit events

**Files to create:**
```
server/src/
└── socket.ts
```

---

### Phase 5: React Web Dashboard (Weeks 8-9)

**Objectives:** Build supplier dashboard UI

**Deliverables:**

1. **Auth Pages**
   - [ ] Login page (phone input)
   - [ ] OTP verification page
   - [ ] Auto-redirect based on role

2. **Supplier Dashboard**
   - [ ] Today's deliveries card
   - [ ] Revenue overview
   - [ ] Pending invoices list
   - [ ] Real-time delivery notifications (Socket.io)

3. **Customers Page**
   - [ ] Customer list with filters
   - [ ] Add customer form
   - [ ] Edit customer form
   - [ ] Assign rider modal
   - [ ] Block/activate customer

4. **Riders Page**
   - [ ] Rider list
   - [ ] Add rider form
   - [ ] View rider assignments
   - [ ] Deactivate rider

5. **Deliveries Page**
   - [ ] Date-based delivery log
   - [ ] Filter by status
   - [ ] View delivery detail
   - [ ] View proof photo

6. **Invoices Page**
   - [ ] Monthly invoices list
   - [ ] View invoice PDF
   - [ ] Send via WhatsApp button
   - [ ] Mark as paid

7. **API Integration**
   - [ ] Create Axios instance with JWT interceptors
   - [ ] Create API client functions
   - [ ] Handle token refresh
   - [ ] Error handling

8. **State Management**
   - [ ] Auth store (Zustand)
   - [ ] Delivery store (Zustand)
   - [ ] Optional: React Query for server state

**Files to create:**
```
apps/web/src/
├── api/
│   ├── axios.ts
│   ├── auth.api.ts
│   ├── customers.api.ts
│   ├── deliveries.api.ts
│   ├── invoices.api.ts
│   └── riders.api.ts
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── OtpVerifyPage.tsx
│   └── supplier/
│       ├── DashboardPage.tsx
│       ├── CustomersPage.tsx
│       ├── RidersPage.tsx
│       ├── DeliveriesPage.tsx
│       ├── InvoicesPage.tsx
│       └── SettingsPage.tsx
├── components/
│   ├── PhoneInput.tsx
│   ├── DeliveryStatusBadge.tsx
│   ├── CustomerForm.tsx
│   ├── RiderForm.tsx
│   └── InvoiceViewer.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useCustomers.ts
│   ├── useRiders.ts
│   ├── useDeliveries.ts
│   ├── useInvoices.ts
│   └── useRealtimeDeliveries.ts
├── stores/
│   ├── authStore.ts
│   └── deliveryStore.ts
└── types/
    └── index.ts
```

---

### Phase 6: Super Admin Panel (Week 10)

**Objectives:** Build admin dashboard for platform management

**Deliverables:**

1. **Admin Dashboard**
   - [ ] Total platform revenue
   - [ ] Active suppliers count
   - [ ] Monthly growth chart
   - [ ] Recent signups list

2. **Supplier Management**
   - [ ] List all suppliers with pagination
   - [ ] View supplier detail
   - [ ] Activate/deactivate supplier
   - [ ] Manage subscription plan
   - [ ] View supplier customers count

3. **Plan Management**
   - [ ] List subscription plans
   - [ ] Edit plan features/pricing
   - [ ] View subscribers

4. **Reports**
   - [ ] Revenue by plan
   - [ ] Supplier growth trends
   - [ ] Active vs inactive suppliers

**Files to create:**
```
apps/web/src/pages/admin/
├── AdminDashboardPage.tsx
├── SuppliersPage.tsx
├── SupplierDetailPage.tsx
├── PlansPage.tsx
└── ReportsPage.tsx
```

---

### Phase 7: Mobile App (Week 11+)

**Objectives:** Build delivery boy mobile app with Capacitor

**Deliverables:**

1. **Capacitor Setup**
   - [ ] Initialize Capacitor project
   - [ ] Add Android platform
   - [ ] Add iOS platform (optional)
   - [ ] Configure app icon & splash

2. **Mobile UI**
   - [ ] Login screen (OTP)
   - [ ] Today's route (customer list)
   - [ ] Delivery form (bottles, payment, notes)
   - [ ] Camera integration for proof
   - [ ] History page

3. **Native Plugins**
   - [ ] Camera - capture proof photos
   - [ ] Geolocation - GPS tracking
   - [ ] Storage - JWT persistence
   - [ ] Network - offline handling

4. **Build & Deploy**
   - [ ] Build Android APK
   - [ ] Generate signed APK
   - [ ] Upload to Play Store (optional)

---

## 9. Security Best Practices

### 9.1 Authentication Security

```typescript
// ✅ ALWAYS hash passwords
import bcrypt from 'bcryptjs';

const hashedPassword = await bcrypt.hash(password, 12);
const isMatch = await bcrypt.compare(password, hashedPassword);

// ✅ Use strong JWT secrets (256-bit)
const accessSecret = crypto.randomBytes(32).toString('hex');
// Result: a7f9d5e2c1b8a3f6e9d2c1a4b7f0e3d6c9b2a5f8e1d4a7b0c3f6e9d2a5c8f1

// ✅ Short expiration for access tokens (15 minutes)
jwt.sign(payload, secret, { expiresIn: '15m' });

// ✅ Longer expiration for refresh tokens (30 days)
jwt.sign(payload, secret, { expiresIn: '30d' });

// ✅ Never expose sensitive fields
User.select('-password -refreshToken');

// ✅ Rate limiting on auth endpoints
authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5  // 5 attempts per 15 minutes
});
```

### 9.2 Authorization Security

```typescript
// ✅ Always verify supplierId from authenticated context
export const getAllCustomers = async (req, res) => {
  // NEVER trust req.query.supplierId or req.body.supplierId
  const filter = req.filterByTenant({});  // Uses req.supplierId
  const customers = await Customer.find(filter);
  res.json(customers);
};

// ❌ DON'T DO THIS
export const getBadCustomers = async (req, res) => {
  const supplierId = req.query.supplierId;  // Can be spoofed!
  const customers = await Customer.find({ supplierId });
  res.json(customers);
};

// ✅ Always check role before action
router.post('/block-customer/:id',
  authenticate,
  injectTenantScope,
  requireRole('supplier'),  // Only suppliers can do this
  async (req, res) => {
    const customer = await Customer.findOne({
      _id: req.params.id,
      supplierId: req.supplierId  // Double-check tenant
    });
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    customer.status = 'blocked';
    await customer.save();
    res.json(customer);
  }
);
```

### 9.3 Data Validation

```typescript
import { z } from 'zod';
import { PK_PHONE_REGEX } from '../utils/phoneUtils';

// ✅ Validate input on both frontend AND backend
const phoneSchema = z.string()
  .regex(PK_PHONE_REGEX, 'Invalid Pakistani phone number');

const customerSchema = z.object({
  fullName: z.string().min(3).max(100),
  phone: phoneSchema,
  address: z.string().min(5).max(500),
  bottlePrice: z.number().min(1).max(10000),
  monthlyBottles: z.number().int().min(1).max(1000)
});

router.post('/customers', 
  authenticate,
  injectTenantScope,
  requireRole('supplier'),
  async (req, res) => {
    try {
      const validated = customerSchema.parse(req.body);
      const customer = new Customer({
        ...validated,
        supplierId: req.supplierId
      });
      await customer.save();
      res.json(customer);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);
```

### 9.4 API Security

```typescript
// ✅ Add security headers
import helmet from 'helmet';
app.use(helmet());

// ✅ Rate limiting
import rateLimit from 'express-rate-limit';
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests'
}));

// ✅ CORS configuration
import cors from 'cors';
app.use(cors({
  origin: process.env.CORS_ORIGIN,  // Only specific domain
  credentials: true
}));

// ✅ Body size limit
app.use(express.json({ limit: '10mb' }));

// ✅ HTTPS only
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 9.5 File Upload Security

```typescript
// ✅ Validate file type and size
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

export const deliveryPhotoUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: async (req) => ({
      folder: `aquaflow/${req.supplierId}/delivery-proofs`,
      format: 'webp',  // Convert to webp
      transformation: [{ width: 800, quality: 'auto' }],
      public_id: `delivery_${req.params.id}`
    })
  }),
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only images allowed'));
    } else {
      cb(null, true);
    }
  }
});

// ✅ Use signed URLs for private files
const secureUrl = cloudinary.url(publicId, {
  sign_url: true,
  secure: true,
  type: 'authenticated',
  version: timestamp
});
```

### 9.6 Environment Security

```bash
# ✅ NEVER commit .env to Git
echo ".env" >> .gitignore

# ✅ Use strong, random values
JWT_SECRET=a7f9d5e2c1b8a3f6e9d2c1a4b7f0e3d6c9b2a5f8e1d4a7b0c3f6e9d2a5c8f1
JWT_REFRESH_SECRET=9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0

# ✅ For Cloudinary, rotate API secrets regularly
# ✅ For Twilio/WhatsApp tokens, use environment secrets

# ✅ Encrypt sensitive data at rest
WHATSAPP_TOKEN=<encrypted>

# ✅ Different secrets for different environments
NODE_ENV=production
DATABASE_URL=<production MongoDB Atlas>
CORS_ORIGIN=https://app.aquaflow.pk
```

---

## 10. Code Structure & File Organization

### 10.1 Complete Backend Structure

```
server/
├── src/
│   ├── index.ts                 # Express app entry point
│   ├── socket.ts                # Socket.io initialization
│   │
│   ├── config/
│   │   ├── env.ts               # Environment variable validation (Zod)
│   │   ├── db.ts                # MongoDB connection
│   │   └── cloudinary.ts        # Cloudinary SDK config
│   │
│   ├── models/                  # Mongoose schemas
│   │   ├── User.ts
│   │   ├── Supplier.ts
│   │   ├── Customer.ts
│   │   ├── DeliveryBoy.ts
│   │   ├── Delivery.ts
│   │   ├── Invoice.ts
│   │   ├── NotificationLog.ts
│   │   └── SubscriptionPlan.ts
│   │
│   ├── controllers/             # Route handler logic
│   │   ├── auth.controller.ts
│   │   ├── customers.controller.ts
│   │   ├── riders.controller.ts
│   │   ├── deliveries.controller.ts
│   │   ├── invoices.controller.ts
│   │   ├── admin.controller.ts
│   │   └── health.controller.ts
│   │
│   ├── routes/                  # API routes
│   │   ├── auth.routes.ts
│   │   ├── customers.routes.ts
│   │   ├── riders.routes.ts
│   │   ├── deliveries.routes.ts
│   │   ├── invoices.routes.ts
│   │   ├── admin.routes.ts
│   │   ├── health.routes.ts
│   │   └── index.ts             # Route aggregator
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts   # JWT, roles, tenant scoping
│   │   ├── upload.middleware.ts # Multer configuration
│   │   ├── error.middleware.ts  # Global error handler
│   │   └── validation.middleware.ts  # Input validation
│   │
│   ├── services/                # Business logic & 3rd party APIs
│   │   ├── otp.service.ts       # Twilio OTP
│   │   ├── sms.service.ts       # Twilio SMS
│   │   ├── whatsapp.service.ts  # Meta Cloud API
│   │   ├── invoice.service.ts   # PDFKit invoice generation
│   │   ├── cloudinary.service.ts # File upload/deletion
│   │   └── email.service.ts     # Email notifications (optional)
│   │
│   ├── types/
│   │   ├── express.d.ts         # Extend Express Request type
│   │   └── index.ts             # Shared types/interfaces
│   │
│   ├── utils/
│   │   ├── phoneUtils.ts        # Phone normalization & validation
│   │   ├── apiResponse.ts       # Standard response format
│   │   ├── validators.ts        # Zod schemas
│   │   └── logger.ts            # Logging utility
│   │
│   ├── scripts/
│   │   ├── seed.ts              # Seed database with initial data
│   │   └── migrate.ts           # Database migrations
│   │
│   └── lib/
│       ├── asyncHandler.ts      # Wrapper for async route handlers
│       └── jwt.ts               # JWT utility functions
│
├── .env                         # Environment variables (not in Git)
├── .env.example                 # Environment variables template
├── tsconfig.json
├── package.json
└── README.md
```

### 10.2 Frontend Structure

```
apps/web/
├── src/
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Root component & routing
│   │
│   ├── api/
│   │   ├── axios.ts             # Axios instance with interceptors
│   │   ├── auth.api.ts
│   │   ├── customers.api.ts
│   │   ├── riders.api.ts
│   │   ├── deliveries.api.ts
│   │   └── invoices.api.ts
│   │
│   ├── pages/
│   │   ├── NotFoundPage.tsx
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── OtpVerifyPage.tsx
│   │   ├── admin/
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   ├── SuppliersPage.tsx
│   │   │   ├── SupplierDetailPage.tsx
│   │   │   └── PlansPage.tsx
│   │   └── supplier/
│   │       ├── DashboardPage.tsx
│   │       ├── CustomersPage.tsx
│   │       ├── RidersPage.tsx
│   │       ├── DeliveriesPage.tsx
│   │       ├── InvoicesPage.tsx
│   │       ├── ReportsPage.tsx
│   │       └── SettingsPage.tsx
│   │
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── PhoneInput.tsx
│   │   ├── DeliveryStatusBadge.tsx
│   │   ├── CustomerForm.tsx
│   │   ├── RiderForm.tsx
│   │   ├── InvoiceViewer.tsx
│   │   ├── tables/
│   │   │   ├── CustomersTable.tsx
│   │   │   ├── RidersTable.tsx
│   │   │   ├── DeliveriesTable.tsx
│   │   │   └── InvoicesTable.tsx
│   │   └── modals/
│   │       ├── CustomerModal.tsx
│   │       ├── RiderModal.tsx
│   │       └── AssignRiderModal.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCustomers.ts
│   │   ├── useRiders.ts
│   │   ├── useDeliveries.ts
│   │   ├── useInvoices.ts
│   │   └── useRealtimeDeliveries.ts
│   │
│   ├── stores/
│   │   ├── authStore.ts         # Auth state (Zustand)
│   │   ├── deliveryStore.ts     # Delivery state (Zustand)
│   │   └── uiStore.ts           # UI state (Zustand)
│   │
│   ├── types/
│   │   └── index.ts             # Frontend types
│   │
│   ├── utils/
│   │   ├── phoneUtils.ts        # Phone formatting
│   │   ├── formatters.ts        # Date, currency formatting
│   │   ├── validators.ts        # Zod schemas
│   │   └── constants.ts         # Constants
│   │
│   └── styles/
│       └── global.css           # Global Tailwind styles
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env (local development)
```

---

## 11. Testing Strategy

### 11.1 Backend Testing

```typescript
// ============================================================
// File: server/tests/auth.test.ts
// ============================================================

import request from 'supertest';
import app from '../src/index';
import { User } from '../src/models/User';
import { normalizePhone } from '../src/utils/phoneUtils';

describe('Authentication', () => {
  describe('POST /api/auth/send-otp', () => {
    it('should send OTP to valid phone', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: '03001234567' });
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('OTP sent');
    });
    
    it('should reject invalid phone', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: 'invalid' });
      
      expect(res.status).toBe(400);
    });
  });
  
  describe('POST /api/auth/verify-otp', () => {
    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: '+923001234567', code: '123456' });
      
      expect(res.status).toBe(404);
    });
  });
});

describe('Role-Based Access Control', () => {
  it('should allow supplier to view own customers', async () => {
    // Create supplier with valid JWT
    const supplier = await createSupplierForTest();
    const token = generateTokenForUser(supplier.userId);
    
    const res = await request(app)
      .get('/api/suppliers/customers')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
  });
  
  it('should reject supplier accessing other tenant data', async () => {
    // Get supplier A's token
    const supplierA = await createSupplierForTest();
    const tokenA = generateTokenForUser(supplierA.userId);
    
    // Create supplier B's customer
    const supplierB = await createSupplierForTest();
    const customerB = await createCustomerForSupplier(supplierB._id);
    
    // Try to access B's customer with A's token
    const res = await request(app)
      .get(`/api/suppliers/customers/${customerB._id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    
    expect(res.status).toBe(404);  // Not found (not forbidden, to avoid enumeration)
  });
});
```

### 11.2 Frontend Testing

```typescript
// ============================================================
// File: apps/web/tests/auth.test.tsx
// ============================================================

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../src/pages/auth/LoginPage';
import { api } from '../src/api/axios';

jest.mock('../src/api/axios');

describe('LoginPage', () => {
  it('should render phone input form', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
  });
  
  it('should call send-otp on submit', async () => {
    const mockSendOtp = jest.fn().mockResolvedValue({ data: {} });
    (api.post as jest.Mock).mockImplementation((url) => {
      if (url.includes('send-otp')) return mockSendOtp();
    });
    
    render(<LoginPage />);
    const input = screen.getByLabelText(/phone number/i);
    const button = screen.getByRole('button', { name: /send otp/i });
    
    await userEvent.type(input, '03001234567');
    fireEvent.click(button);
    
    expect(mockSendOtp).toHaveBeenCalled();
  });
});

describe('useAuth Hook', () => {
  it('should store tokens in state', async () => {
    const { result } = renderHook(() => useAuth());
    
    act(() => {
      result.current.setTokens('access', 'refresh');
    });
    
    expect(result.current.accessToken).toBe('access');
  });
});
```

---

## 12. Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured in respective platforms
- [ ] Database backups configured and tested
- [ ] SSL certificates installed
- [ ] Rate limiting configured
- [ ] CORS origin set to production domain
- [ ] File upload size limits configured
- [ ] Error logging set up
- [ ] Monitoring/alerting configured
- [ ] Security headers enabled (Helmet)
- [ ] Authentication keys rotated
- [ ] All secrets encrypted

### Database Setup

- [ ] MongoDB Atlas cluster created (M10+ for production)
- [ ] Backups configured
- [ ] All indexes created
- [ ] Sample data seeded
- [ ] User roles created

### Backend Deployment

- [ ] Code merged to main branch
- [ ] All tests passing
- [ ] Build successful
- [ ] Deploy to Railway/Render
- [ ] Health check endpoint verified
- [ ] Logs monitored for errors
- [ ] API endpoints tested in production

### Frontend Deployment

- [ ] Build successful with no warnings
- [ ] All API endpoints pointing to production
- [ ] JWT token handling tested
- [ ] Mobile responsive verified
- [ ] Deploy to Vercel
- [ ] Custom domain configured
- [ ] SSL working

### Mobile Deployment

- [ ] Android APK built and signed
- [ ] Upload to Google Play Store
- [ ] App permissions configured
- [ ] Testing on physical devices completed

### Post-Deployment

- [ ] Monitor error logs for 24 hours
- [ ] Test all critical user flows
- [ ] Performance monitoring active
- [ ] Database queries optimized if needed
- [ ] Plan backup and disaster recovery

---

## Summary

This implementation plan provides a **professional, production-grade architecture** for AquaFlow SaaS. Key highlights:

1. **4-Role RBAC System**: Super Admin, Supplier, Rider, Customer with granular permissions
2. **Complete Multi-Tenancy**: Suppliers are 100% isolated with automatic query scoping
3. **Phone-First OTP Auth**: Twilio Verify for Pakistani users
4. **Secure API Design**: JWT tokens, rate limiting, input validation
5. **Real-Time Updates**: Socket.io for live delivery notifications
6. **Integrated Notifications**: WhatsApp + SMS notifications
7. **Professional DevOps**: Clear deployment strategy and security practices

The phased approach allows for **MVP launch in 10 weeks** while maintaining quality and security standards.

---

**Document Version**: 1.0  
**Last Updated**: 2025  
**Next Review**: After MVP launch
