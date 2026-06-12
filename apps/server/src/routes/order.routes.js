const express = require('express');
const router = express.Router();
const { requireRole, asyncHandler } = require('../middleware/auth.middleware');
const { validateObjectId } = require('../middleware/validate.middleware');
const {
  createOrder,
  getSupplierOrders,
  getRiderOrders,
  assignRider,
  updateOrderStatus,
  getRiderEodSummary,
  confirmOrderReceipt,
  cancelOrder
} = require('../controllers/orders');

// Create Order (Customer or Supplier can create)
// Supplier can create order manually for walk-in or phone call
// Customer can place order from their app
router.post('/', requireRole('supplier', 'customer'), asyncHandler(createOrder));

// Supplier gets their orders
router.get('/supplier', requireRole('supplier'), asyncHandler(getSupplierOrders));

// Rider gets their orders
router.get('/rider', requireRole('delivery_boy'), asyncHandler(getRiderOrders));

// Rider gets EOD summary
router.get('/rider/eod-summary', requireRole('delivery_boy'), asyncHandler(getRiderEodSummary));

// Assign Rider
router.put('/:id/assign', requireRole('supplier'), validateObjectId('id'), asyncHandler(assignRider));

// Update Order Status (Rider marking delivered, etc.)
// A rider or supplier can update status
router.put('/:id/status', requireRole('supplier', 'delivery_boy'), validateObjectId('id'), asyncHandler(updateOrderStatus));

// Confirm Order Receipt (Customer)
router.put('/:id/confirm', requireRole('customer'), validateObjectId('id'), asyncHandler(confirmOrderReceipt));

// Cancel Order (Customer or Supplier can cancel)
router.put('/:id/cancel', requireRole('supplier', 'customer'), validateObjectId('id'), asyncHandler(cancelOrder));

module.exports = router;
