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

module.exports = { sendOtpHandler };
