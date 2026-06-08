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

module.exports = { registerSupplierHandler };
