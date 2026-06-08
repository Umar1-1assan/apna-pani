const Order = require('../../models/Order');
const Customer = require('../../models/Customer');
const Invoice = require('../../models/Invoice');
const { ok, badRequest, notFound } = require('../../utils/apiResponse');

const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findOne({ _id: id });
    if (!order) {
      return notFound(res, 'Order not found');
    }

    // Ensure customer owns the order (if customer is cancelling)
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user._id });
      if (!customer || order.customerId.toString() !== customer._id.toString()) {
         return badRequest(res, 'Unauthorized to cancel this order');
      }
    }

    if (order.status !== 'pending') {
      return badRequest(res, `Cannot cancel order in ${order.status} status.`);
    }

    order.status = 'cancelled';
    order.statusTimeline.push({
      status: 'cancelled',
      actorRole: req.user.role,
      actorId: req.user._id
    });

    await order.save();

    // Return stock
    const Supplier = require('../../models/Supplier');
    const supplier = await Supplier.findById(order.supplierId);
    if (supplier) {
      supplier.reservedStock -= order.quantity;
      supplier.availableStock += order.quantity;
      await supplier.save();
    }

    // Void Invoice
    await Invoice.findOneAndDelete({ orderId: order._id, paymentStatus: 'unpaid' });

    // Emit real-time event to supplier dashboard
    const io = req.app.get('io');
    if (io && order.supplierId) {
      io.to(order.supplierId.toString()).emit('orderUpdated', order);
    }

    return ok(res, order, 'Order cancelled successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { cancelOrder };
