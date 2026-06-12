const express = require('express');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();

const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const {
  authenticate,
  injectTenantScope,
  scopeByTenant
} = require('./middleware/auth.middleware');
const { initCronJobs } = require('./jobs/cronJobs');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const supplierRoutes = require('./routes/supplier.routes');
const adminRoutes = require('./routes/admin.routes');
const healthRoutes = require('./routes/health.routes');
const orderRoutes = require('./routes/order.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const customerRoutes = require('./routes/customer.routes');
const subscriptionRoutes = require('./routes/subscription.routes');

const app = express();

/**
 * Security Middleware
 */
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * Rate limiting
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 5000,
  message: 'Too many requests from this IP'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts'
});

app.use(generalLimiter);

/**
 * Body Parser & NoSQL Injection Protection
 */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
app.use(mongoSanitize());

/**
 * Database Connection (Resilient)
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB connected');
    const { seedSuperAdmin, seedPlans } = require('./utils/seed');
    await seedSuperAdmin();
    await seedPlans();
  } catch (err) {
    console.error(`✗ MongoDB connection failed: ${err.message}`);
    console.log('⟳ Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};
connectDB();

/**
 * Routes
 */

// Health check (public)
app.use('/api/health', healthRoutes);

// Authentication (public with rate limiting)
app.use('/api/auth', authLimiter, authRoutes);

// User registration (public with rate limiting)
app.use('/api/users', authLimiter, userRoutes);

// Protected routes
app.use('/api/suppliers',
  authenticate,
  injectTenantScope,
  scopeByTenant,
  supplierRoutes
);

app.use('/api/customers',
  authenticate,
  injectTenantScope,
  scopeByTenant,
  customerRoutes
);

app.use('/api/admin',
  authenticate,
  injectTenantScope,
  adminRoutes
);

app.use('/api/invoices',
  authenticate,
  injectTenantScope,
  scopeByTenant,
  invoiceRoutes
);

app.use('/api/orders',
  authenticate,
  injectTenantScope,
  scopeByTenant,
  orderRoutes
);

// Subscription routes (contain both supplier and admin endpoints)
app.use('/api',
  authenticate,
  injectTenantScope,
  subscriptionRoutes
);

/**
 * 404 Handler
 */
app.use(notFoundHandler);

/**
 * Global Error Handler
 */
app.use(errorHandler);

/**
 * Server Startup
 */
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  }
});

// Set io instance to app
app.set('io', io);

// Initialize Background Jobs
initCronJobs(io);

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const User = require('./models/User');
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) return next(new Error('Invalid user'));

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  socket.on('join_supplier_room', async (supplierId) => {
    // Verify user is authorized for this supplier room
    let authorized = false;
    if (socket.user.role === 'super_admin') {
      authorized = true;
    } else if (socket.user.role === 'supplier') {
      const Supplier = require('./models/Supplier');
      const supplier = await Supplier.findOne({ userId: socket.user._id });
      authorized = supplier && supplier._id.toString() === supplierId;
    } else if (socket.user.role === 'delivery_boy') {
      const DeliveryBoy = require('./models/DeliveryBoy');
      const rider = await DeliveryBoy.findOne({ userId: socket.user._id });
      authorized = rider && rider.supplierId.toString() === supplierId;
    } else if (socket.user.role === 'customer') {
      const Customer = require('./models/Customer');
      const customer = await Customer.findOne({ userId: socket.user._id });
      authorized = customer && customer.supplierId.toString() === supplierId;
    }

    if (authorized) {
      socket.join(supplierId);
    }
  });

  socket.on('disconnect', () => {});
});

server.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ CORS Origin: ${process.env.CORS_ORIGIN || 'all origins'}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

module.exports = { app, server, io };
