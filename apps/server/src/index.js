const express = require('express');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
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
app.use(helmet());

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
  max: 50,
  message: 'Too many login attempts'
});

app.use(generalLimiter);

/**
 * Body Parser
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  socket.on('join_supplier_room', (supplierId) => {
    socket.join(supplierId);
    console.log(`Socket ${socket.id} joined supplier room: ${supplierId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
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
