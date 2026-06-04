const User = require('../models/User');
const Supplier = require('../models/Supplier');
const {
  ok,
  created,
  badRequest,
  conflict,
  notFound
} = require('../utils/apiResponse');
const { normalizePhone, isValidPhone } = require('../utils/phoneUtils');
const { asyncHandler } = require('../middleware/auth.middleware');

/**
 * GET /api/users/suppliers
 * Public: list active suppliers for registration dropdowns
 */
const listSuppliersHandler = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find({ isActive: true })
    .select('_id businessName address city')
    .sort({ businessName: 1 });

  return ok(res, suppliers, 'Suppliers retrieved successfully');
});

/**
 * POST /api/users/register/supplier
 * Register a new supplier (business owner)
 */
const registerSupplierHandler = asyncHandler(async (req, res) => {
  const {
    username,
    password,
    phone,
    fullName,
    email,
    businessName,
    address,
    city,
    taxId,
    businessType,
    state,
    postalCode,
    country,
    region,
    plan,
    isActive
  } = req.body;

  if (!username || !password || !phone || !fullName || !businessName || !address) {
    return badRequest(res, 'Username, password, phone, full name, business name, and address are required');
  }

  if (username.length < 3) {
    return badRequest(res, 'Username must be at least 3 characters');
  }

  if (password.length < 6) {
    return badRequest(res, 'Password must be at least 6 characters');
  }

  const normalizedPhone = normalizePhone(phone);
  if (!isValidPhone(normalizedPhone)) {
    return badRequest(
      res,
      'Invalid Pakistani phone number. Use format: 03XXXXXXXXX or +923XXXXXXXXX'
    );
  }

  const validCities = ['Rawalpindi', 'Islamabad', 'Lahore', 'Karachi', 'Multan', 'Peshawar', 'Quetta', 'Faisalabad', 'Other'];
  if (city && !validCities.includes(city)) {
    return badRequest(res, `Invalid city. Must be one of: ${validCities.join(', ')}`);
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
    passwordText: password,
    phone: normalizedPhone,
    fullName: fullName.trim(),
    email: email ? email.toLowerCase().trim() : null,
    role: 'supplier',
    isActive: isActive !== undefined ? isActive : true
  });

  await user.save();

  const supplier = new Supplier({
    userId: user._id,
    businessName: businessName.trim(),
    address: address.trim(),
    city: city || 'Other',
    taxId: taxId ? taxId.trim() : null,
    businessType: businessType ? businessType.trim() : null,
    state: state ? state.trim() : null,
    postalCode: postalCode ? postalCode.trim() : null,
    country: country ? country.trim() : 'Pakistan',
    region: region ? region.trim() : null,
    plan: plan || 'basic',
    isActive: isActive !== undefined ? isActive : true
  });

  await supplier.save();

  return created(res, {
    user: {
      _id: user._id,
      username: user.username,
      phone: user.phone,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    },
    supplier: {
      _id: supplier._id,
      businessName: supplier.businessName,
      address: supplier.address,
      city: supplier.city,
      taxId: supplier.taxId,
      businessType: supplier.businessType,
      state: supplier.state,
      postalCode: supplier.postalCode,
      country: supplier.country,
      region: supplier.region,
      plan: supplier.plan,
      isActive: supplier.isActive
    }
  }, 'Supplier registered successfully.');
});

/**
 * POST /api/suppliers/riders (previously /api/users/register/rider)
 * Protected: Register a new delivery boy (rider) for the logged-in supplier
 */
const registerRiderHandler = asyncHandler(async (req, res) => {
  const {
    username,
    password,
    phone,
    fullName,
    areaName,
    cnicNumber
  } = req.body;

  // Retrieve supplierId from the authenticated tenant scope
  const supplierId = req.supplierId;
  if (!supplierId) {
    return badRequest(res, 'Only authenticated suppliers can register riders');
  }

  if (!username || !password || !phone || !fullName || !areaName) {
    return badRequest(res, 'Username, password, phone, full name, and area name are required');
  }

  if (username.length < 3) {
    return badRequest(res, 'Username must be at least 3 characters');
  }

  if (password.length < 6) {
    return badRequest(res, 'Password must be at least 6 characters');
  }

  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    return notFound(res, 'Supplier not found');
  }

  const SubscriptionPlan = require('../models/SubscriptionPlan');
  const plan = await SubscriptionPlan.findOne({ name: supplier.plan || 'basic' });
  if (plan && supplier.totalRiders >= plan.maxRiders) {
    return badRequest(res, `Plan limit reached: Your ${plan.displayName} only allows up to ${plan.maxRiders} riders. Please upgrade your plan.`);
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

  const user = new User({
    username: username.toLowerCase().trim(),
    password,
    passwordText: password,
    phone: normalizedPhone,
    fullName: fullName.trim(),
    role: 'delivery_boy',
    isActive: true
  });

  await user.save();

  const DeliveryBoy = require('../models/DeliveryBoy');
  const deliveryBoy = new DeliveryBoy({
    userId: user._id,
    supplierId,
    areaName: areaName.trim(),
    cnicNumber: cnicNumber || null,
    isActive: true
  });

  await deliveryBoy.save();

  supplier.totalRiders = (supplier.totalRiders || 0) + 1;
  await supplier.save();

  return created(res, {
    user: {
      _id: user._id,
      username: user.username,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role
    },
    deliveryBoy: {
      _id: deliveryBoy._id,
      areaName: deliveryBoy.areaName,
      supplierId: deliveryBoy.supplierId
    }
  }, 'Delivery rider registered successfully.');
});

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
    monthlyBottles,
    bottlePrice,
    billingCycle,
    address,
    area,
    whatsappPhone,
    latitude,
    longitude
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

  if (password.length < 6) {
    return badRequest(res, 'Password must be at least 6 characters');
  }

  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    return notFound(res, 'Supplier not found');
  }

  const SubscriptionPlan = require('../models/SubscriptionPlan');
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

  const user = new User({
    username: username.toLowerCase().trim(),
    password,
    passwordText: password,
    phone: normalizedPhone,
    fullName: fullName.trim(),
    role: 'customer',
    isActive: true
  });

  await user.save();

  const Customer = require('../models/Customer');
  const customer = new Customer({
    supplierId,
    userId: user._id,
    phoneNumber: normalizedPhone, // Customer.js schema defines "phoneNumber" (let's map it safely)
    address: address.trim(),
    monthlyBottles: parseInt(monthlyBottles) || 2,
    bottlePrice: parseFloat(bottlePrice),
    billingCycle: billingCycle || 'monthly',
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
      phone: user.phone,
      fullName: user.fullName,
      role: user.role
    },
    customer: {
      _id: customer._id,
      address: customer.address,
      monthlyBottles: customer.monthlyBottles,
      bottlePrice: customer.bottlePrice,
      billingCycle: customer.billingCycle
    }
  }, 'Customer registered successfully.');
});

module.exports = {
  listSuppliersHandler,
  registerSupplierHandler,
  registerRiderHandler,
  registerCustomerHandler
};
