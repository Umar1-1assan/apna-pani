const express = require('express');
const router = express.Router();
const { requireRole, asyncHandler } = require('../middleware/auth.middleware');
const {
  createOrder,
  getSupplierOrders,
  getRiderOrders,
  assignRider,
  updateOrderStatus,
  getRiderEodSummary,
  confirmOrderReceipt,
  cancelOrder
} = require('../controllers/order.controller');

// Create Order (Customer or Supplier can create)
// Supplier can create order manually for walk-in or phone call
// Customer can place order from their app
router.post('/', asyncHandler(createOrder));

// Supplier gets their orders
router.get('/supplier', requireRole('supplier'), asyncHandler(getSupplierOrders));

// Rider gets their orders
router.get('/rider', requireRole('delivery_boy'), asyncHandler(getRiderOrders));

// Rider gets EOD summary
router.get('/rider/eod-summary', requireRole('delivery_boy'), asyncHandler(getRiderEodSummary));

// Assign Rider
router.put('/:id/assign', requireRole('supplier'), asyncHandler(assignRider));

// Update Order Status (Rider marking delivered, etc.)
// A rider or supplier can update status
router.put('/:id/status', asyncHandler(updateOrderStatus));

// Confirm Order Receipt (Customer)
router.put('/:id/confirm', requireRole('customer'), asyncHandler(confirmOrderReceipt));

// Cancel Order (Customer)
router.put('/:id/cancel', asyncHandler(cancelOrder));

module.exports = router;
