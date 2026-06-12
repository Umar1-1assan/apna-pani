const User = require('../../models/User');
const Supplier = require('../../models/Supplier');
const Customer = require('../../models/Customer');
const DeliveryBoy = require('../../models/DeliveryBoy');
const {
  ok,
  created,
  badRequest,
  conflict,
  notFound
} = require('../../utils/apiResponse');
const { normalizePhone, isValidPhone } = require('../../utils/phoneUtils');
const { asyncHandler } = require('../../middleware/auth.middleware');

/**
 * POST /api/suppliers/customers (previously /api/users/register/customer)
 * Protected: Register a new customer for the logged-in supplier
 */
const registerCustomerHandler = asyncHandler(async (req, res) => {
  const {
    username,
    password,
    phone,
    fullName,
    bottlesPerDelivery,
    bottlePrice,
    billingCycle,
    address,
    area,
    whatsappPhone,
    latitude,
    longitude,
    email,
    deliveryBoyId,
    deliveryCharges,
    preferredDeliveryTime,
    deliveryFrequency
  } = req.body;

  // Retrieve supplierId from the authenticated tenant scope
  const supplierId = req.supplierId;
  if (!supplierId) {
    return badRequest(res, 'Only authenticated suppliers can register customers');
  }

  if (!username || !password || !phone || !fullName || !bottlePrice || !address) {
    return badRequest(res, 'Username, password, phone, full name, bottle price, and address are required');
  }

  if (username.length < 3) {
    return badRequest(res, 'Username must be at least 3 characters');
  }

  const { validatePassword } = require('../../utils/passwordValidator');
  const passValidation = validatePassword(password);
  if (!passValidation.valid) {
    return badRequest(res, passValidation.message);
  }

  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    return notFound(res, 'Supplier not found');
  }

  const SubscriptionPlan = require('../../models/SubscriptionPlan');
  const plan = await SubscriptionPlan.findOne({ name: supplier.plan || 'basic' });
  if (plan && supplier.totalCustomers >= plan.maxCustomers) {
    return badRequest(res, `Plan limit reached: Your ${plan.displayName} only allows up to ${plan.maxCustomers} customers. Please upgrade your plan.`);
  }

  const normalizedPhone = normalizePhone(phone);
  if (!isValidPhone(normalizedPhone)) {
    return badRequest(res, 'Invalid Pakistani phone number. Use format: 03XXXXXXXXX or +923XXXXXXXXX');
  }

  const existingUsername = await User.findOne({ username: username.toLowerCase().trim() });
  if (existingUsername) {
    return conflict(res, 'Username is already registered');
  }

  const existingUser = await User.findOne({ phone: normalizedPhone });
  if (existingUser) {
    return conflict(res, 'Phone number already registered');
  }

  if (email) {
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return conflict(res, 'Email already registered');
    }
  }

  const user = new User({
    username: username.toLowerCase().trim(),
    password,
    phone: normalizedPhone,
    fullName: fullName.trim(),
    email: email ? email.toLowerCase().trim() : null,
    role: 'customer',
    isActive: true
  });

  await user.save();

  const Customer = require('../../models/Customer');
  const customer = new Customer({
    supplierId,
    userId: user._id,
    phoneNumber: normalizedPhone, // Customer.js schema defines "phoneNumber" (let's map it safely)
    address: address.trim(),
    bottlesPerDelivery: parseInt(bottlesPerDelivery) || 2,
    deliveryFrequency: parseInt(deliveryFrequency) || 1,
    bottlePrice: parseFloat(bottlePrice),
    billingCycle: billingCycle || 'monthly',
    deliveryBoyId: deliveryBoyId || null,
    deliveryCharges: parseFloat(deliveryCharges) || 0,
    preferredDeliveryTime: preferredDeliveryTime || 'any',
    status: 'active',
    location: {
      type: 'Point',
      coordinates: [
        parseFloat(longitude) || 74.3587,
        parseFloat(latitude) || 33.7294
      ]
    }
  });

  await customer.save();

  supplier.totalCustomers = (supplier.totalCustomers || 0) + 1;
  await supplier.save();

  return created(res, {
    user: {
      _id: user._id,
      username: user.username,
      initialPassword: password,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role
    },
    customer: {
      _id: customer._id,
      address: customer.address,
      bottlesPerDelivery: customer.bottlesPerDelivery,
      deliveryFrequency: customer.deliveryFrequency,
      bottlePrice: customer.bottlePrice,
      billingCycle: customer.billingCycle
    }
  }, 'Customer registered successfully.');
});

module.exports = { registerCustomerHandler };
