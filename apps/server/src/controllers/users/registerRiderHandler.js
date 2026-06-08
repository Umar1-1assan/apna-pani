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
    cnicNumber,
    email
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

  const SubscriptionPlan = require('../../models/SubscriptionPlan');
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
    role: 'delivery_boy',
    isActive: true
  });

  await user.save();

  const DeliveryBoy = require('../../models/DeliveryBoy');
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

module.exports = { registerRiderHandler };
