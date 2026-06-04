const express = require('express');
const router = express.Router();
const { requireRole, asyncHandler } = require('../middleware/auth.middleware');
const { ok } = require('../utils/apiResponse');

/**
 * Protected Admin Routes
 */

const { registerSupplierHandler } = require('../controllers/user.controller');
const Supplier = require('../models/Supplier');

// GET /api/admin/suppliers
router.get('/suppliers',
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const suppliers = await Supplier.find({})
      .populate('userId', 'fullName phone email username passwordText')
      .sort({ createdAt: -1 });
    return ok(res, suppliers, 'List of all suppliers');
  })
);

// POST /api/admin/suppliers
router.post('/suppliers',
  requireRole('super_admin'),
  registerSupplierHandler
);

// PUT /api/admin/suppliers/:id/plan
router.put('/suppliers/:id/plan',
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const { plan } = req.body;
    if (!['basic', 'standard', 'enterprise'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }
    
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    
    supplier.plan = plan;
    await supplier.save();
    
    return ok(res, supplier, `Supplier plan updated to ${plan}`);
  })
);

// PUT /api/admin/suppliers/:id/status
router.put('/suppliers/:id/status',
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const { isActive } = req.body;
    
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    
    supplier.isActive = isActive;
    await supplier.save();
    
    // Also update the User model associated with the supplier if needed
    const User = require('../models/User');
    if (supplier.userId) {
      await User.findByIdAndUpdate(supplier.userId, { isActive });
    }
    
    return ok(res, supplier, `Supplier status updated to ${isActive ? 'Active' : 'Inactive'}`);
  })
);

// GET /api/admin/plans
router.get('/plans',
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    return ok(res, [], 'List plans - Coming soon');
  })
);

// GET /api/admin/revenue
router.get('/revenue',
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    return ok(res, {}, 'Revenue analytics - Coming soon');
  })
);

// POST /api/admin/change-password
router.post('/change-password',
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }
    
    const User = require('../models/User');
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }
    
    user.password = newPassword;
    user.passwordText = newPassword;
    await user.save();
    
    return ok(res, {}, 'Password updated successfully');
  })
);

const AdminInvoice = require('../models/AdminInvoice');

// GET /api/admin/invoices
router.get('/invoices',
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const invoices = await AdminInvoice.find({})
      .populate('supplierId', 'businessName plan')
      .sort({ createdAt: -1 });
    return ok(res, invoices, 'List of admin invoices');
  })
);

// POST /api/admin/invoices
router.post('/invoices',
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const { supplierId, invoiceNumber, amount, billingPeriodStart, billingPeriodEnd } = req.body;
    
    if (!supplierId || !invoiceNumber || amount === undefined || !billingPeriodStart || !billingPeriodEnd) {
      return res.status(400).json({ success: false, message: 'All invoice fields are required' });
    }
    
    const invoice = new AdminInvoice({
      supplierId,
      invoiceNumber,
      amount,
      billingPeriodStart,
      billingPeriodEnd,
      status: 'unpaid'
    });
    
    await invoice.save();
    return ok(res, invoice, 'Invoice generated successfully');
  })
);

// PUT /api/admin/invoices/:id/status
router.put('/invoices/:id/status',
  requireRole('super_admin'),
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['unpaid', 'paid', 'overdue'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const invoice = await AdminInvoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    
    invoice.status = status;
    await invoice.save();
    
    return ok(res, invoice, `Invoice marked as ${status}`);
  })
);

module.exports = router;
