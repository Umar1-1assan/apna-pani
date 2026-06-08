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
 * GET /api/users/suppliers
 * Public: list active suppliers for registration dropdowns
 */
const listSuppliersHandler = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find({ isActive: true })
    .select('_id businessName address city')
    .sort({ businessName: 1 });

  return ok(res, suppliers, 'Suppliers retrieved successfully');
});

module.exports = { listSuppliersHandler };
