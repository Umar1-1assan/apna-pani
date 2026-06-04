const User = require('../models/User');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const DeliveryBoy = require('../models/DeliveryBoy');
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
 * GET /api/users/profile
 * Protected: Get the logged-in user profile, including role-specific profile details
 */
const getProfileHandler = asyncHandler(async (req, res) => {
  const user = req.user;
  let roleProfile = null;

  if (user.role === 'supplier') {
    roleProfile = await Supplier.findOne({ userId: user._id });
  } else if (user.role === 'delivery_boy') {
    roleProfile = await DeliveryBoy.findOne({ userId: user._id }).populate('supplierId');
  } else if (user.role === 'customer') {
    roleProfile = await Customer.findOne({ userId: user._id }).populate('supplierId');
  }

  return ok(res, { user, roleProfile }, 'Profile retrieved successfully');
});

/**
 * PUT /api/users/profile
 * Protected: Update core user details and role-specific details
 */
const updateProfileHandler = asyncHandler(async (req, res) => {
  const user = req.user;
  const {
    fullName,
    phone,
    email,
    password,
    businessName,
    address,
    areaName
  } = req.body;

  // Update core user details
  if (fullName) user.fullName = fullName.trim();
  if (email !== undefined) user.email = email ? email.toLowerCase().trim() : null;
  
  if (phone) {
    const normalizedPhone = normalizePhone(phone);
    if (!isValidPhone(normalizedPhone)) {
      return badRequest(res, 'Invalid Pakistani phone number. Use format: 03XXXXXXXXX or +923XXXXXXXXX');
    }
    // Check if new phone is already in use by another user
    if (normalizedPhone !== user.phone) {
      const existingUser = await User.findOne({ phone: normalizedPhone, _id: { $ne: user._id } });
      if (existingUser) {
        return conflict(res, 'Phone number already registered to another account');
      }
      user.phone = normalizedPhone;
    }
  }

  if (password) {
    if (password.length < 6) {
      return badRequest(res, 'Password must be at least 6 characters');
    }
    user.password = password;
    user.passwordText = password;
  }

  await user.save();

  // Update role-specific details
  let roleProfile = null;
  if (user.role === 'supplier') {
    roleProfile = await Supplier.findOne({ userId: user._id });
    if (roleProfile) {
      if (businessName !== undefined) roleProfile.businessName = businessName ? businessName.trim() : null;
      if (address !== undefined) roleProfile.address = address ? address.trim() : null;
      if (req.body.operatingDays !== undefined) roleProfile.operatingDays = req.body.operatingDays;
      await roleProfile.save();
    }
  } else if (user.role === 'delivery_boy') {
    roleProfile = await DeliveryBoy.findOne({ userId: user._id });
    if (roleProfile) {
      if (areaName) roleProfile.areaName = areaName.trim();
      await roleProfile.save();
    }
  } else if (user.role === 'customer') {
    roleProfile = await Customer.findOne({ userId: user._id });
    if (roleProfile) {
      if (address !== undefined) roleProfile.address = address ? address.trim() : null;
      if (req.body.bottlesPerDelivery !== undefined) roleProfile.bottlesPerDelivery = parseInt(req.body.bottlesPerDelivery) || 1;
      if (req.body.deliveryFrequency !== undefined) roleProfile.deliveryFrequency = parseInt(req.body.deliveryFrequency) || 1;
      await roleProfile.save();

      // Emit real-time event to supplier
      const io = req.app.get('io');
      if (io && roleProfile.supplierId) {
        const populatedCustomer = await Customer.findById(roleProfile._id).populate('userId', 'fullName phone email isActive username passwordText');
        io.to(roleProfile.supplierId.toString()).emit('customerUpdated', populatedCustomer);
      }
    }
  }

  return ok(res, { user, roleProfile }, 'Profile updated successfully');
});

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

module.exports = {
  listSuppliersHandler,
  registerSupplierHandler,
  registerRiderHandler,
  registerCustomerHandler,
  getProfileHandler,
  updateProfileHandler
};
