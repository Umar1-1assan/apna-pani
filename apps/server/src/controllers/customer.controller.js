const Customer = require('../models/Customer');
const User = require('../models/User');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Supplier = require('../models/Supplier');
const DeliveryBoy = require('../models/DeliveryBoy');
const { ok, notFound, badRequest, serverError } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/auth.middleware');

/**
 * GET /api/customers/me
 * Retrieves full customer profile, along with supplier details and assigned rider details.
 */
exports.getCustomerProfile = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ userId: req.user._id })
    .populate('userId', 'fullName phone email username')
    .populate('supplierId', 'businessName supportPhone supportEmail isWhatsAppEnabled operatingDays');

  if (!customer) {
    return notFound(res, 'Customer profile not found');
  }

  // Fetch assigned rider if exists
  let riderData = null;
  if (customer.deliveryBoyId) {
    const rider = await DeliveryBoy.findById(customer.deliveryBoyId).populate('userId', 'fullName phone');
    if (rider) {
      riderData = {
        name: rider.userId?.fullName,
        phone: rider.userId?.phone,
      };
    }
  }

  // Dashboard Stats Computation
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let cycleStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
  let nextInvoiceDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  if (customer.billingCycle === 'weekly') {
    cycleStartDate = new Date(today);
    const day = cycleStartDate.getDay();
    const diff = cycleStartDate.getDate() - day + (day === 0 ? -6 : 1);
    cycleStartDate.setDate(diff);
    nextInvoiceDate = new Date(cycleStartDate);
    nextInvoiceDate.setDate(nextInvoiceDate.getDate() + 7);
  } else if (customer.billingCycle === 'fortnightly') {
    cycleStartDate = new Date(today);
    const day = cycleStartDate.getDay();
    const diff = cycleStartDate.getDate() - day + (day === 0 ? -6 : 1);
    cycleStartDate.setDate(diff);
    nextInvoiceDate = new Date(cycleStartDate);
    nextInvoiceDate.setDate(nextInvoiceDate.getDate() + 14);
  }

  // Bottles Received this Cycle
  const cycleOrders = await Order.find({
    customerId: customer._id,
    status: { $in: ['completed', 'delivered'] },
    deliveryDate: { $gte: cycleStartDate, $lt: nextInvoiceDate }
  });
  const bottlesReceivedThisCycle = cycleOrders.reduce((sum, order) => sum + order.quantity, 0);

  // Delivery Today Check
  const orderToday = await Order.findOne({
    customerId: customer._id,
    deliveryDate: { $gte: today, $lt: tomorrow },
    status: { $nin: ['cancelled', 'failed'] }
  });
  const deliveryToday = !!orderToday;

  // Project Next Delivery Date
  let nextDeliveryDate = null;
  if (!deliveryToday) {
    nextDeliveryDate = new Date(customer.lastDeliveryDate || today);
    nextDeliveryDate.setHours(0,0,0,0);
    
    if (customer.lastDeliveryDate) {
      nextDeliveryDate.setDate(nextDeliveryDate.getDate() + (customer.deliveryFrequency || 1));
    }
    
    if (nextDeliveryDate < today) {
      nextDeliveryDate = new Date(today);
    }

    const operatingDays = customer.supplierId?.operatingDays || [0,1,2,3,4,5,6];
    let safetyCounter = 0;
    while (!operatingDays.includes(nextDeliveryDate.getDay()) && safetyCounter < 14) {
      nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1);
      safetyCounter++;
    }
  }

  const dashboardStats = {
    billingCycle: customer.billingCycle || 'monthly',
    cycleStartDate,
    nextInvoiceDate,
    bottlesReceivedThisCycle,
    deliveryToday,
    nextDeliveryDate,
    deliveryTodayDetails: orderToday ? { quantity: orderToday.quantity, status: orderToday.status } : null
  };

  return ok(res, {
    customer,
    rider: riderData,
    dashboardStats
  }, 'Customer profile retrieved');
});

/**
 * PUT /api/customers/me
 * Update customer profile (address, phone, name)
 */
exports.updateCustomerProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, address, languagePref } = req.body;
  
  const customer = await Customer.findOne({ userId: req.user._id });
  if (!customer) {
    return notFound(res, 'Customer profile not found');
  }

  if (address) customer.address = address;
  await customer.save();

  const user = await User.findById(req.user._id);
  if (user) {
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    // We can store language preference in the future if added to schema
    await user.save();
  }

  return ok(res, customer, 'Profile updated successfully');
});

/**
 * GET /api/customers/orders
 * Retrieve all orders belonging to this customer
 */
exports.getCustomerOrders = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ userId: req.user._id });
  if (!customer) return notFound(res, 'Customer not found');

  const orders = await Order.find({ customerId: customer._id })
    .sort({ createdAt: -1 })
    .populate('deliveryBoyId', 'userId');
    
  return ok(res, orders, 'Orders retrieved');
});

/**
 * GET /api/customers/invoices
 * Retrieve all invoices for this customer
 */
exports.getCustomerInvoices = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ userId: req.user._id });
  if (!customer) return notFound(res, 'Customer not found');

  const invoices = await Invoice.find({ customerId: customer._id })
    .sort({ createdAt: -1 });
    
  return ok(res, invoices, 'Invoices retrieved');
});

/**
 * PUT /api/customers/pause
 * Pause subscription
 */
exports.pauseSubscription = asyncHandler(async (req, res) => {
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

/**
 * PUT /api/customers/cancel
 * Cancel subscription
 */
exports.cancelSubscription = asyncHandler(async (req, res) => {
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

  if (customer.walletBalance < 0) {
    const finalInvoice = new Invoice({
      supplierId: customer.supplierId,
      customerId: customer._id,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      totalBottles: 0,
      bottlePrice: customer.bottlePrice,
      totalAmount: Math.abs(customer.walletBalance),
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

/**
 * PUT /api/customers/pay-dues
 * Pay dues and top-up wallet
 */
exports.payDues = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return badRequest(res, 'A valid amount is required to pay dues');
  }

  const customer = await Customer.findOne({ userId: req.user._id });
  if (!customer) return notFound(res, 'Customer not found');

  customer.walletBalance += amount;
  
  if (customer.walletBalance >= -500 && (customer.status === 'pending_payment' || customer.status === 'blocked')) {
    customer.status = 'active';
  }

  await customer.save();

  const io = req.app.get('io');
  if (io && customer.supplierId) {
    io.to(customer.supplierId.toString()).emit('customerPaid', { customerId: customer._id, amount, newBalance: customer.walletBalance });
  }

  return ok(res, customer, 'Dues paid successfully');
});
