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

module.exports = { adminLoginHandler };
