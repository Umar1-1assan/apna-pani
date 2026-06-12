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
 * PUT /api/users/profile
 * Protected: Update core user details and role-specific details
 */
const updateProfileHandler = asyncHandler(async (req, res) => {
  const user = req.user;
  const {
    fullName,
    phone,
    email,
    password,
    businessName,
    address,
    areaName
  } = req.body;

  // Update core user details
  if (fullName) user.fullName = fullName.trim();
  if (email !== undefined) {
    const formattedEmail = email ? email.toLowerCase().trim() : null;
    if (formattedEmail && formattedEmail !== user.email) {
      const existingEmail = await User.findOne({ email: formattedEmail, _id: { $ne: user._id } });
      if (existingEmail) {
        return conflict(res, 'Email already registered to another account');
      }
    }
    user.email = formattedEmail;
  }
  
  if (phone) {
    const normalizedPhone = normalizePhone(phone);
    if (!isValidPhone(normalizedPhone)) {
      return badRequest(res, 'Invalid Pakistani phone number. Use format: 03XXXXXXXXX or +923XXXXXXXXX');
    }
    // Check if new phone is already in use by another user
    if (normalizedPhone !== user.phone) {
      const existingUser = await User.findOne({ phone: normalizedPhone, _id: { $ne: user._id } });
      if (existingUser) {
        return conflict(res, 'Phone number already registered to another account');
      }
      user.phone = normalizedPhone;
    }
  }

  if (password) {
    const { validatePassword } = require('../../utils/passwordValidator');
    const passValidation = validatePassword(password);
    if (!passValidation.valid) {
      return badRequest(res, passValidation.message);
    }
    user.password = password;
  }

  await user.save();

  // Update role-specific details
  let roleProfile = null;
  if (user.role === 'supplier') {
    roleProfile = await Supplier.findOne({ userId: user._id });
    if (roleProfile) {
      if (businessName !== undefined) roleProfile.businessName = businessName ? businessName.trim() : null;
      if (address !== undefined) roleProfile.address = address ? address.trim() : null;
      if (req.body.operatingDays !== undefined) roleProfile.operatingDays = req.body.operatingDays;
      await roleProfile.save();
    }
  } else if (user.role === 'delivery_boy') {
    roleProfile = await DeliveryBoy.findOne({ userId: user._id });
    if (roleProfile) {
      if (areaName) roleProfile.areaName = areaName.trim();
      await roleProfile.save();
    }
  } else if (user.role === 'customer') {
    roleProfile = await Customer.findOne({ userId: user._id });
    if (roleProfile) {
      if (address !== undefined) roleProfile.address = address ? address.trim() : null;
      if (req.body.bottlesPerDelivery !== undefined) roleProfile.bottlesPerDelivery = parseInt(req.body.bottlesPerDelivery) || 1;
      if (req.body.deliveryFrequency !== undefined) roleProfile.deliveryFrequency = parseInt(req.body.deliveryFrequency) || 1;
      await roleProfile.save();

      // Emit real-time event to supplier
      const io = req.app.get('io');
      if (io && roleProfile.supplierId) {
        const populatedCustomer = await Customer.findById(roleProfile._id).populate('userId', 'fullName phone email isActive username');
        io.to(roleProfile.supplierId.toString()).emit('customerUpdated', populatedCustomer);
      }
    }
  }

  return ok(res, { user, roleProfile }, 'Profile updated successfully');
});

module.exports = { updateProfileHandler };
