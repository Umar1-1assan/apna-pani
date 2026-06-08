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

module.exports = { verifyOtpHandler };
