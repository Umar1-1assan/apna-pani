const express = require('express');
const router = express.Router();
const { requireRole, asyncHandler } = require('../middleware/auth.middleware');
const {
  getCustomerProfile,
  updateCustomerProfile,
  getCustomerOrders,
  getCustomerInvoices,
  pauseSubscription,
  cancelSubscription,
  payDues,
  notifyInvoicePaid
} = require('../controllers/customers');

// Require customer role for all routes in this file
router.use(requireRole('customer'));

router.get('/me', getCustomerProfile);
router.put('/me', updateCustomerProfile);

router.get('/orders', getCustomerOrders);
router.get('/invoices', getCustomerInvoices);

router.put('/pause', pauseSubscription);
router.put('/cancel', cancelSubscription);
router.put('/pay-dues', payDues);

// Notify that an invoice is paid (sets to pending_confirmation)
router.put('/invoices/:id/pay', notifyInvoicePaid);

module.exports = router;
