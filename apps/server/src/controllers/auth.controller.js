const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOtp, verifyOtp } = require('../services/otp.service');
const { normalizePhone, isValidPhone } = require('../utils/phoneUtils');
const {
  ok,
  created,
  badRequest,
  unauthorized,
  notFound,
  serverError
} = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/auth.middleware');

/**
 * Generate JWT tokens
 */
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      phone: user.phone
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

/**
 * POST /api/auth/send-otp
 */
const sendOtpHandler = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone || typeof phone !== 'string') {
    return badRequest(res, 'Phone number is required');
  }

  const normalizedPhone = normalizePhone(phone);
  if (!isValidPhone(normalizedPhone)) {
    return badRequest(
      res,
      'Invalid Pakistani phone number. Use format: 03XXXXXXXXX or +923XXXXXXXXX'
    );
  }

  const result = await sendOtp(normalizedPhone);
  if (!result.success) {
    return badRequest(res, result.message);
  }

  return ok(res, {
    phone: normalizedPhone,
    message: 'OTP sent successfully'
  }, 'OTP sent');
});

/**
 * POST /api/auth/verify-otp
 */
const verifyOtpHandler = asyncHandler(async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return badRequest(res, 'Phone and OTP code are required');
  }

  if (!/^\d{6}$/.test(code)) {
    return badRequest(res, 'OTP must be 6 digits');
  }

  const normalizedPhone = normalizePhone(phone);
  if (!isValidPhone(normalizedPhone)) {
    return badRequest(res, 'Invalid phone number');
  }

  const otpResult = await verifyOtp(normalizedPhone, code);
  if (!otpResult.success) {
    return unauthorized(res, 'Invalid or expired OTP');
  }

  let user = await User.findOne({ phone: normalizedPhone });
  if (!user) {
    return notFound(res, 'User not found. Please register first');
  }

  if (!user.isActive) {
    return unauthorized(res, 'User account is inactive');
  }

  user.lastLogin = new Date();
  await user.save();

  const { accessToken, refreshToken } = generateTokens(user);

  return ok(res, {
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      email: user.email
    }
  }, 'Logged in successfully');
});

/**
 * POST /api/auth/refresh
 */
const refreshTokenHandler = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return badRequest(res, 'Refresh token is required');
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return unauthorized(res, 'User not found or inactive');
    }

    const { accessToken } = generateTokens(user);

    return ok(res, {
      accessToken
    }, 'Token refreshed');
  } catch (error) {
    return unauthorized(res, 'Invalid refresh token');
  }
});

/**
 * POST /api/auth/admin/login
 */
const adminLoginHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return badRequest(res, 'Email and password are required');
  }

  const user = await User.findOne({
    email,
    role: 'super_admin'
  }).select('+password');

  if (!user) {
    return unauthorized(res, 'Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return unauthorized(res, 'Invalid email or password');
  }

  if (!user.isActive) {
    return unauthorized(res, 'Admin account is inactive');
  }

  user.lastLogin = new Date();
  await user.save();

  const { accessToken, refreshToken } = generateTokens(user);

  return ok(res, {
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    }
  }, 'Admin logged in successfully');
});

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
    const Supplier = require('../models/Supplier');
    const supplier = await Supplier.findOne({ userId: user._id });
    if (supplier) {
      businessName = supplier.businessName;
    }
  } else if (user.role === 'delivery_boy') {
    const DeliveryBoy = require('../models/DeliveryBoy');
    const Supplier = require('../models/Supplier');
    const rider = await DeliveryBoy.findOne({ userId: user._id });
    if (rider) {
      const supplier = await Supplier.findById(rider.supplierId);
      if (supplier) {
        businessName = supplier.businessName;
      }
    }
  } else if (user.role === 'customer') {
    const Customer = require('../models/Customer');
    const Supplier = require('../models/Supplier');
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

/**
 * POST /api/auth/forgot-password
 */
const forgotPasswordHandler = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return badRequest(res, 'Email address is required');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return notFound(res, 'No user registered with this email address');
  }

  // Generate 6-digit verification code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = resetCode;
  user.resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  await user.save();

  console.log(`\n==========================================`);
  console.log(`[RESET PASSWORD] Verification code for ${user.email}: ${resetCode}`);
  console.log(`==========================================\n`);

  return ok(res, {
    email: user.email,
    message: 'Verification code sent successfully to email.',
    debugCode: resetCode 
  }, 'Verification code generated');
});

/**
 * POST /api/auth/reset-password
 */
const resetPasswordHandler = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return badRequest(res, 'Email, code, and new password are required');
  }

  if (newPassword.length < 6) {
    return badRequest(res, 'New password must be at least 6 characters long');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return notFound(res, 'User not found');
  }

  if (!user.resetCode || user.resetCode !== code) {
    return unauthorized(res, 'Invalid verification code');
  }

  if (user.resetCodeExpires < new Date()) {
    return unauthorized(res, 'Verification code has expired');
  }

  // Update password and raw password storage
  user.password = newPassword;
  user.passwordText = newPassword;
  user.resetCode = undefined;
  user.resetCodeExpires = undefined;

  await user.save();

  return ok(res, {}, 'Password updated successfully. You can now log in.');
});

/**
 * POST /api/auth/logout
 */
const logoutHandler = (req, res) => {
  return ok(res, {}, 'Logged out successfully');
};

module.exports = {
  sendOtpHandler,
  verifyOtpHandler,
  refreshTokenHandler,
  adminLoginHandler,
  logoutHandler,
  loginHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  generateTokens
};
