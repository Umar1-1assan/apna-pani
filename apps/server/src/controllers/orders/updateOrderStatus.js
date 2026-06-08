const Order = require('../../models/Order');
const Customer = require('../../models/Customer');
const Invoice = require('../../models/Invoice');
const { ok, badRequest, notFound } = require('../../utils/apiResponse');

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, emptyCarboysReturned, failureReason } = req.body;

    const order = await Order.findById(id);
    if (!order) return notFound(res, 'Order not found');

    const previousStatus = order.status;
    
    if (status) order.status = status;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') {
        order.paymentReceivedAt = new Date();
      }
    }
    if (emptyCarboysReturned !== undefined) order.emptyCarboysReturned = emptyCarboysReturned;
    if (failureReason) order.failureReason = failureReason;

    if (status && status !== previousStatus) {
      order.statusTimeline.push({
        status: status,
        actorRole: req.user.role,
        actorId: req.user._id
      });

      const Supplier = require('../../models/Supplier');
      const Customer = require('../../models/Customer');
      const Invoice = require('../../models/Invoice');
      
      const supplier = await Supplier.findById(order.supplierId);
      const customer = await Customer.findById(order.customerId);

      const terminalStates = ['delivered', 'completed', 'failed', 'cancelled'];
      
      // If moving INTO a terminal state from a non-terminal state
      if (terminalStates.includes(status) && !terminalStates.includes(previousStatus)) {
        if (status === 'delivered' || status === 'completed') {
          // Permanently deduct from reservedStock
          if (supplier) {
             supplier.reservedStock = Math.max(0, supplier.reservedStock - order.quantity);
             if (order.emptyCarboysReturned) supplier.emptyCarboys += order.emptyCarboysReturned;
             await supplier.save();
          }
          
          // Add to customer's outstanding dues
          if (customer) {
             customer.outstandingDues += order.totalAmount;
             await customer.save();
          }
        } else if (status === 'failed' || status === 'cancelled') {
          // Revert reserved stock to available
          if (supplier) {
             supplier.reservedStock = Math.max(0, supplier.reservedStock - order.quantity);
             supplier.availableStock += order.quantity;
             await supplier.save();
          }
        }
      }
    }

    await order.save();

    await order.save();

    // Emit real-time event to supplier dashboard
    const io = req.app.get('io');
    if (io && order.supplierId) {
      io.to(order.supplierId.toString()).emit('orderUpdated', order);
    }

    return ok(res, order, 'Order status updated');
  } catch (error) {
    next(error);
  }
};

module.exports = { updateOrderStatus };
