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
    return ok(res, {
      email: email.toLowerCase().trim(),
      message: 'If this email is registered, a verification code has been sent.'
    }, 'Verification code generated');
  }

  // Generate 6-digit verification code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = resetCode;
  user.resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  await user.save();

  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] Reset code for ${user.email}: ${resetCode}`);
  }

  return ok(res, {
    email: user.email,
    message: 'If this email is registered, a verification code has been sent.'
  }, 'Verification code generated');
});

module.exports = { forgotPasswordHandler };
