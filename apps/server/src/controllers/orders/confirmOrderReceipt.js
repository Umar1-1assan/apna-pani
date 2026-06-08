const Order = require('../../models/Order');
const Customer = require('../../models/Customer');
const Invoice = require('../../models/Invoice');
const { ok, badRequest, notFound } = require('../../utils/apiResponse');

const confirmOrderReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the customer profile
    const customer = await Customer.findOne({ userId: req.user._id });
    if (!customer) {
      return notFound(res, 'Customer not found');
    }

    const order = await Order.findOne({ _id: id, customerId: customer._id });
    if (!order) {
      return notFound(res, 'Order not found');
    }

    const previousStatus = order.status;

    order.status = 'completed';
    order.customerConfirmed = true;
    order.customerConfirmedAt = new Date();
    order.statusTimeline.push({
      status: 'completed',
      actorRole: 'customer',
      actorId: req.user._id
    });

    const terminalStates = ['delivered', 'completed', 'failed', 'cancelled'];
    if (!terminalStates.includes(previousStatus)) {
      const Supplier = require('../../models/Supplier');
      const supplier = await Supplier.findById(order.supplierId);
      
      if (supplier) {
          supplier.reservedStock = Math.max(0, supplier.reservedStock - order.quantity);
          if (order.emptyCarboysReturned) supplier.emptyCarboys += order.emptyCarboysReturned;
          await supplier.save();
      }
      
      if (customer) {
          customer.outstandingDues += order.totalAmount;
          await customer.save();
      }
    }

    await order.save();

    // Emit event to supplier
    const io = req.app.get('io');
    if (io) {
      io.to(order.supplierId.toString()).emit('orderUpdated', order);
    }

    return ok(res, order, 'Order receipt confirmed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { confirmOrderReceipt };
