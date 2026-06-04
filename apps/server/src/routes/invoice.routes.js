const express = require('express');
const router = express.Router();
const { requireRole, asyncHandler } = require('../middleware/auth.middleware');
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

// POST /api/invoices
router.post('/', requireRole('supplier'), asyncHandler(async (req, res) => {
  const { customerId, periodStart, periodEnd, amount, bottlesDelivered } = req.body;
  
  const invoice = new Invoice({
    supplierId: req.supplierId,
    customerId,
    periodStart,
    periodEnd,
    amount,
    bottlesDelivered,
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

module.exports = router;
