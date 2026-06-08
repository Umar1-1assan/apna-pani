const Order = require('../../models/Order');
const Customer = require('../../models/Customer');
const Invoice = require('../../models/Invoice');
const { ok, badRequest, notFound } = require('../../utils/apiResponse');

const createOrder = async (req, res, next) => {
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
      customer = await Customer.findOne({ userId: req.user._id });
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

    // Validation: Balance Limit (cutoff 500 PKR dues)
    if (customer.outstandingDues > 500) {
      return badRequest(res, 'Outstanding dues are too high. Please clear your dues before ordering.');
    }

    // Fetch Supplier to check stock
    const Supplier = require('../../models/Supplier');
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
        actorId: req.user._id
      }]
    });

    await order.save();
    
    await order.save();


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

module.exports = { createOrder };
