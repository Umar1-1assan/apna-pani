const Customer = require('../../models/Customer');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Invoice = require('../../models/Invoice');
const Supplier = require('../../models/Supplier');
const DeliveryBoy = require('../../models/DeliveryBoy');
const { ok, notFound, badRequest, serverError } = require('../../utils/apiResponse');
const { asyncHandler } = require('../../middleware/auth.middleware');

/**
 * PUT /api/customers/pay-dues
 * Pay dues and top-up wallet
 */
const payDues = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return badRequest(res, 'A valid amount is required to pay dues');
  }

  const customer = await Customer.findOne({ userId: req.user._id });
  if (!customer) return notFound(res, 'Customer not found');

  customer.outstandingDues -= amount;
  if (customer.outstandingDues < 0) customer.outstandingDues = 0; // Prevent negative dues
  
  if (customer.outstandingDues <= 500 && (customer.status === 'pending_payment' || customer.status === 'blocked')) {
    customer.status = 'active';
  }

  await customer.save();

  const io = req.app.get('io');
  if (io && customer.supplierId) {
    io.to(customer.supplierId.toString()).emit('customerPaid', { customerId: customer._id, amount, newBalance: customer.outstandingDues });
  }

  return ok(res, customer, 'Dues paid successfully');
});

module.exports = { payDues };
