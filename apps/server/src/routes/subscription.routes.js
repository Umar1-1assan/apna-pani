const express = require('express');
const router = express.Router();
const { requireRole, asyncHandler } = require('../middleware/auth.middleware');
const { ok } = require('../utils/apiResponse');

const Supplier = require('../models/Supplier');
const SubscriptionRequest = require('../models/SubscriptionRequest');
const AdminInvoice = require('../models/AdminInvoice');

// ==========================================
// SUPPLIER ROUTES
// ==========================================

// GET /api/supplier/subscription
// Get current subscription info and any pending requests
router.get('/supplier/subscription',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const supplier = await Supplier.findOne({ userId: req.user._id });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const pendingRequest = await SubscriptionRequest.findOne({
      supplierId: supplier._id,
      status: 'pending'
    });

    const invoices = await AdminInvoice.find({ supplierId: supplier._id }).sort({ createdAt: -1 });

    return ok(res, {
      currentPlan: supplier.plan,
      planStartsAt: supplier.planStartsAt,
      planExpiresAt: supplier.planExpiresAt,
      totalRiders: supplier.totalRiders,
      totalCustomers: supplier.totalCustomers,
      pendingRequest,
      invoices
    }, 'Subscription details fetched successfully');
  })
);

// POST /api/supplier/subscription/request
// Create a new upgrade/downgrade request
router.post('/supplier/subscription/request',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const { requestedPlan } = req.body;

    if (!['basic', 'standard', 'enterprise'].includes(requestedPlan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    const supplier = await Supplier.findOne({ userId: req.user._id });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    if (supplier.plan === requestedPlan) {
      return res.status(400).json({ success: false, message: 'You are already on this plan' });
    }

    // Check if there's already a pending request
    const existingRequest = await SubscriptionRequest.findOne({
      supplierId: supplier._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'You already have a pending subscription request' });
    }

    const newRequest = new SubscriptionRequest({
      supplierId: supplier._id,
      currentPlan: supplier.plan,
      requestedPlan
    });

    await newRequest.save();

    return ok(res, newRequest, 'Subscription request submitted successfully');
  })
);

// PUT /api/supplier/invoices/:id/pay
// Submit payment info for an admin invoice
router.put('/supplier/invoices/:id/pay',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const { paymentNotes } = req.body;
    
    const supplier = await Supplier.findOne({ userId: req.user._id });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const invoice = await AdminInvoice.findOne({ _id: req.params.id, supplierId: supplier._id });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Invoice is already paid' });
    }

    invoice.status = 'pending_verification';
    if (paymentNotes) {
      invoice.paymentNotes = paymentNotes;
    }

    await invoice.save();
    return ok(res, invoice, 'Payment submitted for verification');
  })
);

// ==========================================
// ADMIN ROUTES
// ==========================================

// GET /api/admin/subscriptions
// Get all pending requests and all active subscriptions
router.get('/admin/subscriptions',
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    // Get all requests
    const requests = await SubscriptionRequest.find({})
      .populate('supplierId', 'businessName plan userId')
      .sort({ createdAt: -1 });

    // Get all suppliers for manual overriding if needed
    const suppliers = await Supplier.find({})
      .select('businessName plan planStartsAt planExpiresAt isActive totalRiders totalCustomers')
      .sort({ createdAt: -1 });

    return ok(res, { requests, suppliers }, 'Subscriptions and requests fetched successfully');
  })
);

// PUT /api/admin/subscriptions/request/:id
// Approve or reject a subscription request
router.put('/admin/subscriptions/request/:id',
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const { status, adminNotes, amount, billingPeriodStart, billingPeriodEnd } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be approved or rejected.' });
    }

    const subscriptionRequest = await SubscriptionRequest.findById(req.params.id)
      .populate('supplierId');
      
    if (!subscriptionRequest) {
      return res.status(404).json({ success: false, message: 'Subscription request not found' });
    }

    if (subscriptionRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This request has already been processed' });
    }

    subscriptionRequest.status = status;
    if (adminNotes) {
      subscriptionRequest.adminNotes = adminNotes;
    }

    await subscriptionRequest.save();

    // If approved, update the supplier's plan
    if (status === 'approved') {
      const supplier = subscriptionRequest.supplierId;
      supplier.plan = subscriptionRequest.requestedPlan;
      
      // Update billing cycle dates (start from today, expire in 30 days)
      const now = new Date(billingPeriodStart || Date.now());
      supplier.planStartsAt = now;
      
      const expiresAt = new Date(billingPeriodEnd || new Date(now).setDate(now.getDate() + 30));
      supplier.planExpiresAt = expiresAt;

      await supplier.save();

      // Only create Admin Invoice if there is an actual charge
      if (amount && amount > 0) {
        const invoiceNumber = 'INV-SUB-' + Math.floor(100000 + Math.random() * 900000);
        const newInvoice = new AdminInvoice({
          supplierId: supplier._id,
          invoiceNumber,
          amount,
          billingPeriodStart: now,
          billingPeriodEnd: expiresAt,
          status: 'unpaid'
        });
        await newInvoice.save();
      }
    }

    return ok(res, subscriptionRequest, `Subscription request ${status} successfully`);
  })
);

module.exports = router;
