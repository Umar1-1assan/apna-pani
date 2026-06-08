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
 * GET /api/users/profile
 * Protected: Get the logged-in user profile, including role-specific profile details
 */
const getProfileHandler = asyncHandler(async (req, res) => {
  const user = req.user;
  let roleProfile = null;

  if (user.role === 'supplier') {
    roleProfile = await Supplier.findOne({ userId: user._id });
  } else if (user.role === 'delivery_boy') {
    roleProfile = await DeliveryBoy.findOne({ userId: user._id }).populate('supplierId');
  } else if (user.role === 'customer') {
    roleProfile = await Customer.findOne({ userId: user._id }).populate('supplierId');
  }

  return ok(res, { user, roleProfile }, 'Profile retrieved successfully');
});

module.exports = { getProfileHandler };
