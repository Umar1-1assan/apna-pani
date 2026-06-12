const express = require('express');
const router = express.Router();
const { requireRole, asyncHandler } = require('../middleware/auth.middleware');
const { validateObjectId } = require('../middleware/validate.middleware');
const { ok } = require('../utils/apiResponse');
const Invoice = require('../models/Invoice');

// GET /api/invoices
router.get('/', requireRole('supplier'), asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ supplierId: req.supplierId })
    .populate({
      path: 'customerId',
      populate: { path: 'userId', select: 'fullName phone email' }
    })
    .sort({ createdAt: -1 });
  return ok(res, invoices, 'Invoices retrieved');
}));

// POST /api/invoices/generate-billing
// Manual trigger for testing the cron job logic
router.post('/generate-billing', requireRole('supplier'), asyncHandler(async (req, res) => {
  const { generateBillingCycleInvoices } = require('../services/invoice.service');
  // Need to pass the io instance if possible, but req.app.get('io') works
  const io = req.app.get('io');
  const result = await generateBillingCycleInvoices(io);
  return ok(res, result, 'Billing cycle generation completed');
}));

// POST /api/invoices/generate-early/:customerId
// Manual trigger to generate an invoice early for a specific customer
router.post('/generate-early/:customerId', requireRole('supplier'), validateObjectId('customerId'), asyncHandler(async (req, res) => {
  const Customer = require('../models/Customer');
  const customer = await Customer.findOne({ _id: req.params.customerId, supplierId: req.supplierId });
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

  const { generateInvoiceForCustomer } = require('../services/invoice.service');
  const io = req.app.get('io');
  const result = await generateInvoiceForCustomer(req.params.customerId, io);
  
  if (!result.success) {
    return res.status(400).json(result);
  }
  
  return ok(res, result.invoice, result.message);
}));

// POST /api/invoices (Ad-hoc manual invoice)
router.post('/', requireRole('supplier'), asyncHandler(async (req, res) => {
  const { customerId, periodStart, periodEnd, amount, bottlesDelivered } = req.body;
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return res.status(400).json({ success: false, message: 'Invalid customerId format' });
  }
  const Customer = require('../models/Customer');
  const customer = await Customer.findOne({ _id: customerId, supplierId: req.supplierId });
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  
  const invoice = new Invoice({
    supplierId: req.supplierId,
    customerId,
    startDate: periodStart || new Date(),
    endDate: periodEnd || new Date(),
    totalAmount: amount,
    totalBottles: bottlesDelivered || 0,
    bottlePrice: 0, // Ad-hoc might not have this strict
    billingCycle: 'ad-hoc',
    status: 'unpaid',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 7)) // 7 days from now
  });
  
  await invoice.save();
  await invoice.populate({
    path: 'customerId',
    populate: { path: 'userId', select: 'fullName phone email' }
  });
  
  return ok(res, invoice, 'Invoice created successfully');
}));

// PUT /api/invoices/:id/confirm-payment
router.put('/:id/confirm-payment', requireRole('supplier'), validateObjectId('id'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const invoice = await Invoice.findOne({ _id: id, supplierId: req.supplierId });
  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }

  if (invoice.paymentStatus === 'paid') {
    return res.status(400).json({ success: false, message: 'Invoice is already paid' });
  }

  invoice.paymentStatus = 'paid';
  invoice.paidAmount = invoice.totalAmount;
  await invoice.save();

  // Also deduct from customer's outstanding dues if applicable
  const Customer = require('../models/Customer');
  const customer = await Customer.findById(invoice.customerId);
  if (customer) {
     customer.outstandingDues -= invoice.totalAmount;
     if (customer.outstandingDues < 0) customer.outstandingDues = 0; // Prevent negative dues for now, or allow overpayment? The user said "JUST THE AMOUNT HE has to pay will increase... and when a inove is paid this will reduce". We can let it go negative if they overpay.
     await customer.save();
  }

  return ok(res, invoice, 'Payment confirmed successfully');
}));

// GET /api/invoices/rider/pending
router.get('/rider/pending', requireRole('delivery_boy'), asyncHandler(async (req, res) => {
  const Customer = require('../models/Customer');
  const DeliveryBoy = require('../models/DeliveryBoy');
  // Find all customers assigned to this rider
  const customers = await Customer.find({ deliveryBoyId: req.riderId }).select('_id');
  const customerIds = customers.map(c => c._id);

  const invoices = await Invoice.find({
    customerId: { $in: customerIds },
    paymentStatus: { $ne: 'paid' }
  })
    .populate({
      path: 'customerId',
      populate: { path: 'userId', select: 'fullName phone address' }
    })
    .sort({ createdAt: -1 });

  const deliveryBoy = await DeliveryBoy.findById(req.riderId);
  const cashInHand = deliveryBoy ? deliveryBoy.cashInHand : 0;

  return ok(res, { invoices, cashInHand }, 'Pending invoices retrieved for rider');
}));

// PUT /api/invoices/:id/rider-collect
router.put('/:id/rider-collect', requireRole('delivery_boy'), validateObjectId('id'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Scope to rider's assigned customers only
  const Customer = require('../models/Customer');
  const assignedCustomers = await Customer.find({ deliveryBoyId: req.riderId }).select('_id');
  const customerIds = assignedCustomers.map(c => c._id);
  const invoice = await Invoice.findOne({ _id: id, customerId: { $in: customerIds } });
  
  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }

  if (invoice.paymentStatus === 'paid') {
    return res.status(400).json({ success: false, message: 'Invoice is already paid' });
  }

  // Mark invoice as paid and record collection rider
  invoice.paymentStatus = 'paid';
  invoice.paidAmount = invoice.totalAmount;
  invoice.collectionMethod = 'cash';
  invoice.collectionRiderId = req.riderId;
  await invoice.save();

  // Deduct from customer's outstanding dues
  const customer = await Customer.findById(invoice.customerId);
  if (customer) {
     customer.outstandingDues -= invoice.totalAmount;
     if (customer.outstandingDues < 0) customer.outstandingDues = 0;
     await customer.save();
  }

  // Increment Rider's cash in hand
  const DeliveryBoy = require('../models/DeliveryBoy');
  await DeliveryBoy.findByIdAndUpdate(req.riderId, {
    $inc: { cashInHand: invoice.totalAmount }
  });

  return ok(res, invoice, 'Invoice cash collected successfully');
}));

module.exports = router;

