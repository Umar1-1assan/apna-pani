const express = require('express');
const router = express.Router();
const { requireRole, asyncHandler } = require('../middleware/auth.middleware');
const {
  getCustomerProfile,
  updateCustomerProfile,
  getCustomerOrders,
  getCustomerInvoices
} = require('../controllers/customer.controller');

// Require customer role for all routes in this file
router.use(requireRole('customer'));

router.get('/me', getCustomerProfile);
router.put('/me', updateCustomerProfile);

router.get('/orders', getCustomerOrders);
router.get('/invoices', getCustomerInvoices);

module.exports = router;
