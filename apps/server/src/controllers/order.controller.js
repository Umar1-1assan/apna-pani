const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const { ok, badRequest, notFound } = require('../utils/apiResponse');

exports.createOrder = async (req, res, next) => {
  try {
    const { quantity, deliveryAddress, timeSlot, paymentMethod, productType, notes } = req.body;
    
    // Validate
    if (!quantity || !deliveryAddress) {
      return badRequest(res, 'Quantity and delivery address are required');
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

    const bottlePrice = customer.bottlePrice || 150;
    const totalAmount = quantity * bottlePrice;

    const order = new Order({
      supplierId: req.supplierId, // Extracted from auth middleware
      customerId: customer._id,
      quantity,
      deliveryAddress,
      timeSlot,
      paymentMethod,
      productType,
      notes,
      totalAmount,
      deliveryDate: new Date(),
      statusTimeline: [{
        status: 'pending',
        actorRole: req.user.role,
        actorId: req.user.userId
      }]
    });

    await order.save();
    
    // Generate Invoice automatically
    const now = new Date();
    const invoice = new Invoice({
      supplierId: req.supplierId,
      customerId: customer._id,
      orderId: order._id,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
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

    const updateFields = { status };
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;
    if (emptyCarboysReturned !== undefined) updateFields.emptyCarboysReturned = emptyCarboysReturned;
    if (failureReason) updateFields.failureReason = failureReason;

    const updateQuery = {
      $set: updateFields
    };

    if (status) {
      updateQuery.$push = {
        statusTimeline: {
          status: status,
          actorRole: req.user.role,
          actorId: req.user.userId
        }
      };
      
      // If marking as paid, update paymentReceivedAt
      if (paymentStatus === 'paid') {
        updateFields.paymentReceivedAt = new Date();
      }
    }

    const order = await Order.findOneAndUpdate(
      { _id: id },
      updateQuery,
      { new: true }
    );

    if (!order) {
      return notFound(res, 'Order not found');
    }

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

    const order = await Order.findOneAndUpdate(
      { _id: id, customerId: customer._id },
      {
        status: 'completed',
        customerConfirmed: true,
        customerConfirmedAt: new Date(),
        $push: {
          statusTimeline: {
            status: 'completed',
            actorRole: 'customer',
            actorId: req.user.userId
          }
        }
      },
      { new: true }
    );

    if (!order) {
      return notFound(res, 'Order not found');
    }

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
