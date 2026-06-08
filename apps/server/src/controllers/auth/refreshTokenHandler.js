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

module.exports = { refreshTokenHandler };
