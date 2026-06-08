const Customer = require('../../models/Customer');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Invoice = require('../../models/Invoice');
const Supplier = require('../../models/Supplier');
const DeliveryBoy = require('../../models/DeliveryBoy');
const { ok, notFound, badRequest, serverError } = require('../../utils/apiResponse');
const { asyncHandler } = require('../../middleware/auth.middleware');

/**
 * PUT /api/customers/cancel
 * Cancel subscription
 */
const cancelSubscription = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ userId: req.user._id });
  if (!customer) return notFound(res, 'Customer not found');

  if (customer.status === 'cancelled') {
    return badRequest(res, 'Subscription is already cancelled');
  }

  customer.status = 'cancelled';
  await customer.save();

  const now = new Date();
  await Order.updateMany(
    { 
      customerId: customer._id, 
      status: 'pending', 
      deliveryDate: { $gt: now } 
    },
    { 
      $set: { status: 'cancelled' },
      $push: {
        statusTimeline: {
          status: 'cancelled',
          actorRole: req.user.role,
          actorId: req.user._id
        }
      }
    }
  );

  if (customer.outstandingDues > 0) {
    const finalInvoice = new Invoice({
      supplierId: customer.supplierId,
      customerId: customer._id,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      totalBottles: 0,
      bottlePrice: customer.bottlePrice,
      totalAmount: customer.outstandingDues,
      paymentStatus: 'unpaid'
    });
    await finalInvoice.save();
  }

  const io = req.app.get('io');
  if (io && customer.supplierId) {
    io.to(customer.supplierId.toString()).emit('customerCancelled', customer);
  }

  return ok(res, customer, 'Subscription cancelled successfully');
});

module.exports = { cancelSubscription };
