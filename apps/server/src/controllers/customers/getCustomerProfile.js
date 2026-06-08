const Customer = require('../../models/Customer');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Invoice = require('../../models/Invoice');
const Supplier = require('../../models/Supplier');
const DeliveryBoy = require('../../models/DeliveryBoy');
const { ok, notFound, badRequest, serverError } = require('../../utils/apiResponse');
const { asyncHandler } = require('../../middleware/auth.middleware');

/**
 * GET /api/customers/me
 * Retrieves full customer profile, along with supplier details and assigned rider details.
 */
const getCustomerProfile = asyncHandler(async (req, res) => {
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

module.exports = { getCustomerProfile };
