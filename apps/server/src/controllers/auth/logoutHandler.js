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
 * POST /api/auth/logout
 */
const logoutHandler = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.decode(token);
    const TokenBlacklist = require('../../models/TokenBlacklist');
    await TokenBlacklist.create({
      token,
      userId: decoded?.userId,
      expiresAt: new Date((decoded?.exp || (Date.now() / 1000) + 86400) * 1000)
    });
  }
  return ok(res, {}, 'Logged out successfully');
});

module.exports = { logoutHandler };
