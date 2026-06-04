const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const { ok, badRequest, notFound } = require('../utils/apiResponse');

exports.createOrder = async (req, res, next) => {
  try {
    const { quantity, deliveryAddress, timeSlot, paymentMethod, productType, notes, deliveryType } = req.body;
    
    // Validate
    if (!quantity || !deliveryAddress) {
      return badRequest(res, 'Quantity and delivery address are required');
    }

    if (quantity < 1) {
      return badRequest(res, 'Minimum quantity is 1');
    }

    let customer;
    if (req.user.role === 'customer') {
      customer = await Customer.findOne({ userId: req.user.userId });
    } else {
      customer = await Customer.findById(req.body.customerId);
    }
    
    if (!customer) {
      return notFound(res, 'Customer not found');
    }

    // Validation: Account Status
    if (customer.status !== 'active') {
      return badRequest(res, `Customer account is ${customer.status}. Cannot place order.`);
    }

    // Validation: Balance Limit (cutoff -500 PKR)
    if (customer.walletBalance < -500) {
      return badRequest(res, 'Wallet balance is too low. Please clear your dues before ordering.');
    }

    // Fetch Supplier to check stock
    const Supplier = require('../models/Supplier');
    const supplier = await Supplier.findById(req.supplierId);
    if (!supplier) {
      return notFound(res, 'Supplier not found');
    }

    // Validation: Stock Check
    if (supplier.availableStock < quantity) {
      return badRequest(res, 'Insufficient stock available.');
    }

    // Validation: Time Slot Cutoff (10 PM Pakistan Time)
    const now = new Date();
    const utcHours = now.getUTCHours();
    const pktHours = (utcHours + 5) % 24;
    
    let finalTimeSlot = timeSlot || 'morning';
    let deliveryDate = new Date();
    
    if (finalTimeSlot === 'morning' && pktHours >= 22) {
      finalTimeSlot = 'afternoon';
    }

    // Validation: Overlap Detection
    const startOfDay = new Date(deliveryDate);
    startOfDay.setUTCHours(0,0,0,0);
    const endOfDay = new Date(deliveryDate);
    endOfDay.setUTCHours(23,59,59,999);

    const existingOrder = await Order.findOne({
      customerId: customer._id,
      deliveryDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['failed', 'cancelled', 'completed', 'delivered'] }
    });

    if (existingOrder) {
      return badRequest(res, 'An order is already scheduled for today.');
    }

    // Execution
    const bottlePrice = customer.bottlePrice || 150;
    const finalDeliveryType = deliveryType || 'standard';
    const deliveryFee = finalDeliveryType === 'express' ? 50 : 0;
    const totalAmount = (quantity * bottlePrice) + deliveryFee;

    // Deduct from available, add to reserved
    supplier.availableStock -= quantity;
    supplier.reservedStock += quantity;
    await supplier.save();

    const order = new Order({
      supplierId: req.supplierId, 
      customerId: customer._id,
      quantity,
      deliveryAddress,
      timeSlot: finalTimeSlot,
      paymentMethod,
      productType,
      deliveryType: finalDeliveryType,
      deliveryFee,
      notes,
      totalAmount,
      deliveryDate: deliveryDate,
      statusTimeline: [{
        status: 'pending',
        actorRole: req.user.role,
        actorId: req.user.userId
      }]
    });

    await order.save();
    
    // Generate Invoice automatically
    const invoice = new Invoice({
      supplierId: req.supplierId,
      customerId: customer._id,
      orderId: order._id,
      month: deliveryDate.getMonth() + 1,
      year: deliveryDate.getFullYear(),
      totalBottles: quantity,
      bottlePrice: bottlePrice,
      totalAmount: totalAmount,
      paymentStatus: 'unpaid'
    });
    await invoice.save();

    // Emit real-time event to supplier dashboard
    const io = req.app.get('io');
    if (io && order.supplierId) {
      io.to(order.supplierId.toString()).emit('orderCreated', order);
    }

    return ok(res, order, 'Order created successfully');
  } catch (error) {
    next(error);
  }
};

exports.getSupplierOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ supplierId: req.supplierId })
      .populate('customerId', 'userId phoneNumber address') // Needs fixing: Customer -> User
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'fullName phone username' }
      })
      .populate({
        path: 'deliveryBoyId',
        populate: { path: 'userId', select: 'fullName phone' }
      })
      .sort({ createdAt: -1 });
    return ok(res, orders, 'Orders retrieved');
  } catch (error) {
    next(error);
  }
};

exports.getRiderOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ deliveryBoyId: req.riderId, status: { $ne: 'pending' } })
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'fullName phone' }
      })
      .sort({ deliveryDate: 1 });
    return ok(res, orders, 'Rider orders retrieved');
  } catch (error) {
    next(error);
  }
};

exports.assignRider = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deliveryBoyId } = req.body;

    const order = await Order.findOneAndUpdate(
      { _id: id, supplierId: req.supplierId },
      { 
        deliveryBoyId, 
        status: 'assigned',
        $push: {
          statusTimeline: {
            status: 'assigned',
            actorRole: req.user.role,
            actorId: req.user.userId
          }
        }
      },
      { new: true }
    );

    if (!order) {
      return notFound(res, 'Order not found');
    }

    // Emit real-time event to supplier dashboard
    const io = req.app.get('io');
    if (io) {
      io.to(req.supplierId.toString()).emit('orderAssigned', order);
    }

    return ok(res, order, 'Rider assigned successfully');
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
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
        actorId: req.user.userId
      });

      const Supplier = require('../models/Supplier');
      const Customer = require('../models/Customer');
      const Invoice = require('../models/Invoice');
      
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
          
          // If unpaid, deduct from customer's wallet balance
          if (order.paymentStatus !== 'paid' && customer) {
             customer.walletBalance -= order.totalAmount;
             await customer.save();
          }
        } else if (status === 'failed' || status === 'cancelled') {
          // Revert reserved stock to available
          if (supplier) {
             supplier.reservedStock = Math.max(0, supplier.reservedStock - order.quantity);
             supplier.availableStock += order.quantity;
             await supplier.save();
          }
          
          // Void the unpaid invoice
          await Invoice.findOneAndDelete({ orderId: order._id, paymentStatus: 'unpaid' });
        }
      }
    }

    await order.save();

    // If order payment is marked paid, update the associated invoice
    if (paymentStatus === 'paid') {
      const Invoice = require('../models/Invoice');
      await Invoice.findOneAndUpdate(
        { orderId: order._id },
        { paymentStatus: 'paid', totalPaymentReceived: order.totalAmount }
      );
    }

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

exports.getRiderEodSummary = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      deliveryBoyId: req.riderId,
      status: { $in: ['delivered', 'completed'] },
      updatedAt: { $gte: startOfDay, $lte: endOfDay }
    });

    let totalCashCollected = 0;
    let totalOnlineCollected = 0;
    let totalEmptyCarboys = 0;
    let totalDeliveries = orders.length;

    for (const order of orders) {
      if (order.paymentStatus === 'paid') {
        if (order.paymentMethod === 'COD') {
          totalCashCollected += order.totalAmount;
        } else {
          totalOnlineCollected += order.totalAmount;
        }
      }
      totalEmptyCarboys += (order.emptyCarboysReturned || 0);
    }

    return ok(res, { totalCashCollected, totalOnlineCollected, totalEmptyCarboys, totalDeliveries }, 'EOD Summary retrieved');
  } catch (error) {
    next(error);
  }
};

exports.confirmOrderReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the customer profile
    const customer = await Customer.findOne({ userId: req.user.userId });
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
      actorId: req.user.userId
    });

    const terminalStates = ['delivered', 'completed', 'failed', 'cancelled'];
    if (!terminalStates.includes(previousStatus)) {
      const Supplier = require('../models/Supplier');
      const supplier = await Supplier.findById(order.supplierId);
      
      if (supplier) {
          supplier.reservedStock = Math.max(0, supplier.reservedStock - order.quantity);
          if (order.emptyCarboysReturned) supplier.emptyCarboys += order.emptyCarboysReturned;
          await supplier.save();
      }
      
      if (order.paymentStatus !== 'paid') {
          customer.walletBalance -= order.totalAmount;
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

exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findOne({ _id: id });
    if (!order) {
      return notFound(res, 'Order not found');
    }

    // Ensure customer owns the order (if customer is cancelling)
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user.userId });
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
      actorId: req.user.userId
    });

    await order.save();

    // Return stock
    const Supplier = require('../models/Supplier');
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
