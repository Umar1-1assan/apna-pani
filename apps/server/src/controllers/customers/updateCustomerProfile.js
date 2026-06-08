const Customer = require('../../models/Customer');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Invoice = require('../../models/Invoice');
const Supplier = require('../../models/Supplier');
const DeliveryBoy = require('../../models/DeliveryBoy');
const { ok, notFound, badRequest, serverError } = require('../../utils/apiResponse');
const { asyncHandler } = require('../../middleware/auth.middleware');

/**
 * PUT /api/customers/me
 * Update customer profile (address, phone, name)
 */
const updateCustomerProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, address, languagePref } = req.body;
  
  const customer = await Customer.findOne({ userId: req.user._id });
  if (!customer) {
    return notFound(res, 'Customer profile not found');
  }

  if (address) customer.address = address;
  await customer.save();

  const user = await User.findById(req.user._id);
  if (user) {
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    // We can store language preference in the future if added to schema
    await user.save();
  }

  return ok(res, customer, 'Profile updated successfully');
});

module.exports = { updateCustomerProfile };
