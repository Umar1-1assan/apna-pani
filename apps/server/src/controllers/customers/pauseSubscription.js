const Customer = require('../../models/Customer');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Invoice = require('../../models/Invoice');
const Supplier = require('../../models/Supplier');
const DeliveryBoy = require('../../models/DeliveryBoy');
const { ok, notFound, badRequest, serverError } = require('../../utils/apiResponse');
const { asyncHandler } = require('../../middleware/auth.middleware');

/**
 * PUT /api/customers/pause
 * Pause subscription
 */
const pauseSubscription = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ userId: req.user._id });
  if (!customer) return notFound(res, 'Customer not found');

  if (customer.status !== 'active') {
    return badRequest(res, `Cannot pause subscription. Current status is ${customer.status}`);
  }

  customer.status = 'paused';
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

  const io = req.app.get('io');
  if (io && customer.supplierId) {
    io.to(customer.supplierId.toString()).emit('customerPaused', customer);
  }

  return ok(res, customer, 'Subscription paused successfully');
});

module.exports = { pauseSubscription };
