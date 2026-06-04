const express = require('express');
const router = express.Router();
const { requireRole, asyncHandler } = require('../middleware/auth.middleware');
const { ok } = require('../utils/apiResponse');
const { registerRiderHandler, registerCustomerHandler } = require('../controllers/user.controller');
const Supplier = require('../models/Supplier');
const DeliveryBoy = require('../models/DeliveryBoy');
const Customer = require('../models/Customer');

/**
 * Protected Supplier Routes
 */

// GET /api/suppliers/me
router.get('/me', 
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const supplier = await Supplier.findOne({ userId: req.user._id }).populate('userId', 'fullName email phone');
    return ok(res, supplier, 'Supplier profile retrieved');
  })
);

// PUT /api/suppliers/me
router.put('/me',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const { businessName, supportEmail, supportPhone, timezone, isWhatsAppEnabled, pricing } = req.body;
    const supplier = await Supplier.findOne({ userId: req.user._id });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

    if (businessName) supplier.businessName = businessName;
    if (supportEmail) supplier.supportEmail = supportEmail;
    if (supportPhone) supplier.supportPhone = supportPhone;
    if (timezone) supplier.timezone = timezone;
    if (isWhatsAppEnabled !== undefined) supplier.isWhatsAppEnabled = isWhatsAppEnabled;
    
    // Check if we need to update pricing array element 0
    if (pricing !== undefined && pricing !== null) {
      // Create pricing array if it doesn't exist
      if (!supplier.pricing) {
        supplier.pricing = [{ label: '19L Bottle Refill', defaultPrice: pricing, active: true }];
      } else if (supplier.pricing.length > 0) {
        supplier.pricing[0].defaultPrice = pricing;
      } else {
        supplier.pricing.push({ label: '19L Bottle Refill', defaultPrice: pricing, active: true });
      }
    }
    
    await supplier.save();
    return ok(res, supplier, 'Supplier profile updated');
  })
);

// GET /api/suppliers/customers
router.get('/customers',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const supplier = await Supplier.findOne({ userId: req.user._id });
    const SubscriptionPlan = require('../models/SubscriptionPlan');
    const plan = await SubscriptionPlan.findOne({ name: supplier.plan || 'basic' });
    const limit = plan ? plan.maxCustomers : 20;

    const customers = await Customer.find({ supplierId: req.supplierId })
      .populate('userId', 'fullName phone email isActive username passwordText')
      .sort({ createdAt: 1 }) // oldest first
      .limit(limit);
    return ok(res, customers, 'List of customers');
  })
);

// POST /api/suppliers/customers
router.post('/customers',
  requireRole('supplier'),
  registerCustomerHandler
);

// PUT /api/suppliers/customers/:id
router.put('/customers/:id',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const { fullName, phone, email, address, monthlyBottles, bottlePrice, deliveryBoyId, status } = req.body;
    
    const customer = await Customer.findOne({ _id: req.params.id, supplierId: req.supplierId });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    if (address) customer.address = address;
    if (monthlyBottles !== undefined) customer.monthlyBottles = monthlyBottles;
    if (bottlePrice !== undefined) customer.bottlePrice = bottlePrice;
    if (deliveryBoyId !== undefined) customer.deliveryBoyId = deliveryBoyId || null;
    if (status) customer.status = status;
    if (phone) customer.phoneNumber = phone;
    await customer.save();

    const User = require('../models/User');
    if (customer.userId && (fullName || phone || email)) {
      const user = await User.findById(customer.userId);
      if (user) {
        if (fullName) user.fullName = fullName;
        if (phone) user.phone = phone;
        if (email) user.email = email;
        await user.save();
      }
    }

    return ok(res, customer, 'Customer updated successfully');
  })
);

// DELETE /api/suppliers/customers/:id
router.delete('/customers/:id',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const customer = await Customer.findOne({ _id: req.params.id, supplierId: req.supplierId });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    
    const User = require('../models/User');
    if (customer.userId) {
      await User.findByIdAndDelete(customer.userId);
    }
    await Customer.findByIdAndDelete(req.params.id);

    return ok(res, null, 'Customer deleted successfully');
  })
);

// GET /api/suppliers/riders
router.get('/riders',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const supplier = await Supplier.findOne({ userId: req.user._id });
    const SubscriptionPlan = require('../models/SubscriptionPlan');
    const plan = await SubscriptionPlan.findOne({ name: supplier.plan || 'basic' });
    const limit = plan ? plan.maxRiders : 3;

    const riders = await DeliveryBoy.find({ supplierId: req.supplierId })
      .populate('userId', 'fullName phone email isActive username passwordText')
      .sort({ createdAt: 1 }) // oldest first
      .limit(limit);
    return ok(res, riders, 'List of riders');
  })
);

// POST /api/suppliers/riders
router.post('/riders',
  requireRole('supplier'),
  registerRiderHandler
);

module.exports = router;
