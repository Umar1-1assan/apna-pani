# AquaFlow SaaS - Developer Onboarding Guide

## Welcome to the AquaFlow Team! 👋

This guide will help you understand the project and get started with development.

---

## 📚 What is AquaFlow?

**AquaFlow** is a multi-tenant SaaS platform for Pakistan's water delivery industry. It enables water suppliers to digitally manage end-to-end operations:

- Register and manage customers
- Assign delivery riders
- Log deliveries in real-time
- Generate monthly invoices
- Send notifications via WhatsApp/SMS
- View analytics and reports

**Key Stats:**
- 4 user roles (Super Admin, Supplier, Rider, Customer)
- Multi-tenant (each supplier completely isolated)
- Phone-first OTP authentication
- Real-time updates via Socket.io
- Production-ready in 10 weeks

---

## 🏗️ Architecture at a Glance

```
User (Supplier)
    ↓
Phone OTP Login (Twilio)
    ↓
JWT Token issued
    ↓
Access /api/suppliers/customers
    ↓
Middleware: authenticate + injectTenantScope + requireRole
    ↓
Query auto-scoped: { supplierId: "tenant123", status: "active" }
    ↓
MongoDB returns only this supplier's customers
```

**Golden Rule**: `supplierId` is ALWAYS extracted from authenticated context. Never trust it from the request body!

---

## 💻 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Node.js + Express | REST API server |
| **Database** | MongoDB Atlas | Cloud-managed database |
| **Frontend** | React + Vite | Web dashboard |
| **Mobile** | React + Capacitor | iOS/Android rider app |
| **Auth** | Twilio OTP + JWT | Phone-based authentication |
| **Files** | Cloudinary | Image/PDF storage |
| **Real-time** | Socket.io | Live delivery updates |
| **Notifications** | WhatsApp + SMS | Customer messaging |

---

## 🚀 Getting Started (5 Minutes)

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/aquaflow.git
cd aquaflow
```

### 2. Install Dependencies
```bash
# Backend
cd server
npm install

# Frontend
cd ../apps/web
npm install
```

### 3. Configure Environment Variables

**Backend** (`server/.env`):
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/aquaflow

# JWT
JWT_SECRET=your-256-bit-secret
JWT_REFRESH_SECRET=your-256-bit-refresh-secret

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SID=VA...
TWILIO_FROM_NUMBER=+1415...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# CORS
CORS_ORIGIN=http://localhost:5173

# WhatsApp (optional for now)
WHATSAPP_VERIFY_TOKEN=...
```

**Frontend** (`apps/web/.env`):
```bash
VITE_API_URL=http://localhost:5000
```

### 4. Start Development Server

**Terminal 1 - Backend**:
```bash
cd server
npm run dev
# Server running on http://localhost:5000
```

**Terminal 2 - Frontend**:
```bash
cd apps/web
npm run dev
# UI running on http://localhost:5173
```

### 5. Test the API
```bash
# Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "03001234567"}'

# Response: { message: "OTP sent" }
```

---

## 📁 Folder Structure Quick Reference

```
aquaflow/
├── server/                          ← Node.js API
│   └── src/
│       ├── models/                  ← Mongoose schemas
│       ├── routes/                  ← API endpoints
│       ├── middleware/              ← Auth, validation
│       ├── services/                ← Business logic
│       ├── controllers/             ← Route handlers
│       └── config/                  ← Database, env
│
├── apps/web/                        ← React dashboard
│   └── src/
│       ├── pages/                   ← Page components
│       ├── components/              ← Reusable UI
│       ├── api/                     ← Axios API client
│       ├── hooks/                   ← Custom hooks
│       └── stores/                  ← Zustand state
│
└── docs/                            ← Documentation
    ├── IMPLEMENTATION_PLAN.md       ← Detailed plan (read this!)
    ├── QUICK_REFERENCE.md           ← Cheat sheet
    └── ARCHITECTURE_DIAGRAMS.md     ← Visual diagrams
```

**👉 READ THIS FIRST:** `IMPLEMENTATION_PLAN.md` (Comprehensive guide)

---

## 🔐 Understanding Authentication

### Phone OTP Flow (95% of users)

```
User: "My phone is 03001234567"
  ↓
POST /api/auth/send-otp → Twilio sends SMS with OTP
  ↓
User: "My OTP is 123456"
  ↓
POST /api/auth/verify-otp → Server verifies with Twilio
  ↓
Response: { accessToken: "jwt...", refreshToken: "jwt...", user: {...} }
  ↓
Client stores tokens and makes requests with Authorization header
```

### Email + Password (Super Admin only)

```
Super Admin: email + password
  ↓
POST /api/auth/admin/login
  ↓
Response: { accessToken, refreshToken, user: {...} }
```

### Key Points
- ✅ JWT tokens are stateless (no server-side session)
- ✅ Access token expires in 15 minutes (short-lived)
- ✅ Refresh token expires in 30 days (can refresh access)
- ✅ Always send token in Authorization header: `Bearer {token}`

---

## 🔒 Role-Based Permissions

### Super Admin
```typescript
// Can access everything globally
GET /api/admin/suppliers      // All suppliers
GET /api/admin/revenue        // Platform revenue
POST /api/admin/plans         // Create plans
```

### Supplier
```typescript
// Can only access own tenant data
GET /api/suppliers/customers  // Own customers (filtered by supplierId)
GET /api/deliveries           // Own deliveries
POST /api/invoices            // Generate own invoices
```

**Important**: Middleware automatically injects `req.supplierId` from authenticated user. Never trust it from request!

### Delivery Boy
```typescript
// Can only see assigned customers
GET /api/deliveries           // Own deliveries
POST /api/deliveries          // Log delivery
```

### Customer (Future)
```typescript
// Can only see own data
GET /api/customer/invoices    // Own invoices
GET /api/customer/deliveries  // Own deliveries
```

---

## 🛣️ Common Routes

### Authentication
```
POST   /api/auth/send-otp          Send OTP to phone
POST   /api/auth/verify-otp        Verify OTP & get tokens
POST   /api/auth/refresh           Refresh expired token
POST   /api/auth/admin/login       Email + password login
```

### Supplier Operations
```
GET    /api/suppliers/customers          List customers
POST   /api/suppliers/customers          Create customer
PUT    /api/suppliers/customers/:id      Update customer

GET    /api/suppliers/riders             List riders
POST   /api/suppliers/riders             Create rider

GET    /api/deliveries                   List deliveries
POST   /api/deliveries                   Log delivery (rider)
POST   /api/deliveries/:id/proof         Upload proof photo

GET    /api/invoices                     List invoices
POST   /api/invoices                     Generate invoice
```

### Admin Operations
```
GET    /api/admin/suppliers              All suppliers
POST   /api/admin/suppliers              Register supplier
PUT    /api/admin/suppliers/:id/plan     Change plan

GET    /api/admin/plans                  All plans
GET    /api/admin/revenue                Platform revenue
```

**Try in Postman or cURL:**
```bash
curl -X GET http://localhost:5000/api/suppliers/customers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🗄️ Database Collections (MongoDB)

| Collection | Purpose | Scoped By |
|-----------|---------|-----------|
| **users** | All authenticated users | None (global) |
| **suppliers** | Water supply companies | None (global, but one per tenant) |
| **customers** | End users | supplierId |
| **deliveryboys** | Riders | supplierId |
| **deliveries** | Individual delivery logs | supplierId |
| **invoices** | Monthly bills | supplierId |
| **notificationlogs** | Audit trail | supplierId |
| **subscriptionplans** | Plan definitions | None (global, shared) |

### Key Principle: TENANT SCOPING

Every query on tenant-scoped collections MUST include `supplierId`:

```typescript
// ✅ CORRECT
const customers = await Customer.find({
  supplierId: req.supplierId,  // From middleware
  status: 'active'
});

// ❌ WRONG - Could leak data!
const customers = await Customer.find({
  status: 'active'  // Missing supplierId!
});
```

---

## 🎨 Frontend State Management

We use **Zustand** for simple, scalable state:

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';

const authStore = create((set) => ({
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  user: null,
  
  // Login with OTP
  login: async (phone, code) => {
    const res = await api.post('/auth/verify-otp', { phone, code });
    set({ 
      accessToken: res.data.accessToken,
      user: res.data.user 
    });
    localStorage.setItem('refreshToken', res.data.refreshToken);
  },
  
  logout: () => set({ accessToken: null, user: null })
}));

// Usage in component
const { user, login, logout } = authStore();
```

---

## 🔌 API Integration (Axios)

```typescript
// src/api/axios.ts
import axios from 'axios';
import { authStore } from '../stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api'
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  res => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = authStore.getState().refreshToken;
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
        { refreshToken }
      );
      authStore.getState().setTokens(res.data.accessToken);
      return api(error.config);
    }
    return Promise.reject(error);
  }
);

export { api };
```

---

## 🧪 Testing Your Code

### Backend Tests
```bash
cd server
npm test                           # Run all tests
npm test -- auth.test.ts          # Run specific test
npm run test:watch               # Watch mode
```

### Frontend Tests
```bash
cd apps/web
npm test                          # Run all tests
npm test -- LoginPage.test.tsx    # Run specific test
npm run test:watch               # Watch mode
```

### Manual Testing with Postman

1. **Create a Postman collection** with these endpoints:
   - POST /api/auth/send-otp
   - POST /api/auth/verify-otp
   - GET /api/suppliers/customers
   - POST /api/suppliers/customers
   - Etc.

2. **Set up environment variables** in Postman:
   - `baseUrl` = `http://localhost:5000`
   - `token` = (auto-set from login response)

3. **Use Bearer token** in headers:
   - `Authorization: Bearer {{token}}`

---

## 🐛 Debugging Tips

### Issue: "User not found" on login
```typescript
// Check 1: User exists in database
db.users.findOne({ phone: "+923001234567" })

// Check 2: Role is correct
// Should be 'supplier', 'delivery_boy', etc.

// Check 3: User is active
db.users.findOne({ phone: "+923001234567", isActive: true })
```

### Issue: Supplier can't see customers
```typescript
// Check 1: Is JWT token valid?
// Decode at jwt.io

// Check 2: Does Supplier document exist?
db.suppliers.findOne({ userId: "user_id" })

// Check 3: Are there customers for this supplier?
db.customers.find({ supplierId: "supplier_id" })

// Check 4: Verify middleware is injecting supplierId
// Add console.log in middleware
```

### Issue: Cloudinary upload failing
```typescript
// Check 1: Credentials correct?
echo $CLOUDINARY_CLOUD_NAME  // Should not be empty

// Check 2: File size < 5MB?

// Check 3: Multer configuration correct?
// See: src/middleware/upload.middleware.ts
```

### Enable Verbose Logging
```typescript
// In development, add debug logs
export const authenticate = async (req, res, next) => {
  console.log('[AUTH] Token:', req.headers.authorization);
  console.log('[AUTH] User found:', req.user?._id);
  console.log('[AUTH] Role:', req.user?.role);
  next();
};
```

---

## 📝 Code Conventions

### TypeScript
```typescript
// ✅ Use interfaces
interface User {
  _id: ObjectId;
  phone: string;
  role: 'super_admin' | 'supplier' | 'delivery_boy';
}

// ✅ Use types for function parameters
async function getUserCustomers(supplierId: string): Promise<Customer[]> {
  return await Customer.find({ supplierId });
}

// ✅ Use async/await
const user = await User.findById(id);
```

### File Names
```
✅ auth.middleware.ts      (kebab-case)
✅ User.ts                 (PascalCase for models)
✅ userUtils.ts            (camelCase for utilities)
❌ user_middleware.ts      (snake_case)
❌ getUserData.ts          (don't use get prefix for files)
```

### Database Queries
```typescript
// ✅ Always scope to tenant
const customers = await Customer.find({ 
  supplierId: req.supplierId,
  status: 'active'
});

// ✅ Use projection for sensitive fields
const users = await User.find({}).select('-password');

// ✅ Use lean() for read-only queries (faster)
const customers = await Customer.find({}).lean();
```

---

## 🚀 Common Development Tasks

### Add a New Endpoint

1. **Create controller** (`src/controllers/newFeature.controller.ts`):
```typescript
export const createItem = async (req, res) => {
  const validated = itemSchema.parse(req.body);
  const item = new Item({
    ...validated,
    supplierId: req.supplierId  // Always scope!
  });
  await item.save();
  res.json(item);
};
```

2. **Create route** (`src/routes/newFeature.routes.ts`):
```typescript
router.post('/', 
  authenticate, 
  injectTenantScope, 
  requireRole('supplier'),
  createItem
);
```

3. **Register route** (`src/index.ts`):
```typescript
app.use('/api/items', itemRoutes);
```

4. **Test it**:
```bash
curl -X POST http://localhost:5000/api/items \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "value"}'
```

### Add a Frontend Page

1. **Create page component** (`src/pages/newFeature/NewFeaturePage.tsx`):
```typescript
import { api } from '../../api/axios';

export default function NewFeaturePage() {
  const [items, setItems] = useState([]);
  
  useEffect(() => {
    api.get('/items').then(res => setItems(res.data));
  }, []);
  
  return <div>{/* JSX here */}</div>;
}
```

2. **Add route** (`src/App.tsx`):
```typescript
<Route path="/new-feature" element={<NewFeaturePage />} />
```

3. **Add navigation** in sidebar component

---

## 📞 Getting Help

### Documentation
- `IMPLEMENTATION_PLAN.md` - Detailed architecture
- `QUICK_REFERENCE.md` - API cheat sheet
- `ARCHITECTURE_DIAGRAMS.md` - Visual flows

### External Resources
- [Mongoose Documentation](https://mongoosejs.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [JWT Explained](https://jwt.io/)
- [MongoDB Aggregation](https://docs.mongodb.com/manual/aggregation/)

### Team
- **Tech Lead**: [Name] - Architecture & design decisions
- **Backend Lead**: [Name] - API implementation
- **Frontend Lead**: [Name] - UI/UX
- **DevOps**: [Name] - Deployment & infrastructure

---

## ✅ Your First Task

1. **Set up your environment** (follow Getting Started section)
2. **Read** `IMPLEMENTATION_PLAN.md` (30 minutes)
3. **Make a test request** to login endpoint
4. **Explore** the database in MongoDB Atlas
5. **Pick a small task** from the Trello board and open a PR

---

## 🎯 Next Steps

1. ✅ Environment setup
2. ✅ Read documentation
3. ✅ Understand architecture
4. 🔄 **Write your first feature**
5. 🔄 Submit pull request
6. 🔄 Code review & merge
7. 🔄 Deploy to staging
8. 🔄 Test in production

---

**Welcome to the team!** 🚀

If you have any questions, don't hesitate to reach out. Happy coding!

---

**Last Updated**: 2025  
**Version**: 1.0
