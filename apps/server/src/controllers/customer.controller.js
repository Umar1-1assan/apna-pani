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
    .populate('supplierId', 'businessName supportPhone supportEmail isWhatsAppEnabled');

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

  return ok(res, {
    customer,
    rider: riderData
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
