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

module.exports = { resetPasswordHandler };
