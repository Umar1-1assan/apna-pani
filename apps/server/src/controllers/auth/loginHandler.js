const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { sendOtp, verifyOtp } = require('../../services/otp.service');
const { normalizePhone, isValidPhone } = require('../../utils/phoneUtils');
const {
  ok,
  created,
  badRequest,
  unauthorized,
  notFound,
  serverError
} = require('../../utils/apiResponse');
const { asyncHandler } = require('../../middleware/auth.middleware');
const { generateTokens } = require('./generateTokens');

/**
 * POST /api/auth/login
 */
const loginHandler = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return badRequest(res, 'Username/Email and password are required');
  }

  // Find user by username or email
  const user = await User.findOne({
    $or: [
      { username: identifier.toLowerCase().trim() },
      { email: identifier.toLowerCase().trim() }
    ]
  }).select('+password');

  if (!user) {
    return unauthorized(res, 'Invalid username/email or password');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return unauthorized(res, 'Invalid username/email or password');
  }

  if (!user.isActive) {
    return unauthorized(res, 'User account is inactive');
  }

  user.lastLogin = new Date();
  await user.save();

  const { accessToken, refreshToken } = generateTokens(user);

  // We should also find the associated tenant details if they are a supplier, customer, or rider
  let businessName = 'AquaFlow';
  if (user.role === 'supplier') {
    const Supplier = require('../../models/Supplier');
    const supplier = await Supplier.findOne({ userId: user._id });
    if (supplier) {
      businessName = supplier.businessName;
    }
  } else if (user.role === 'delivery_boy') {
    const DeliveryBoy = require('../../models/DeliveryBoy');
    const Supplier = require('../../models/Supplier');
    const rider = await DeliveryBoy.findOne({ userId: user._id });
    if (rider) {
      const supplier = await Supplier.findById(rider.supplierId);
      if (supplier) {
        businessName = supplier.businessName;
      }
    }
  } else if (user.role === 'customer') {
    const Customer = require('../../models/Customer');
    const Supplier = require('../../models/Supplier');
    const customer = await Customer.findOne({ userId: user._id });
    if (customer) {
      const supplier = await Supplier.findById(customer.supplierId);
      if (supplier) {
        businessName = supplier.businessName;
      }
    }
  }

  return ok(res, {
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      username: user.username,
      phone: user.phone || '',
      email: user.email || '',
      fullName: user.fullName,
      role: user.role,
      tenantName: businessName
    }
  }, 'Logged in successfully');
});

module.exports = { loginHandler };
