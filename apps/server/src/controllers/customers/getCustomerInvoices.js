const Customer = require('../../models/Customer');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Invoice = require('../../models/Invoice');
const Supplier = require('../../models/Supplier');
const DeliveryBoy = require('../../models/DeliveryBoy');
const { ok, notFound, badRequest, serverError } = require('../../utils/apiResponse');
const { asyncHandler } = require('../../middleware/auth.middleware');

/**
 * GET /api/customers/invoices
 * Retrieve all invoices for this customer
 */
const getCustomerInvoices = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ userId: req.user._id });
  if (!customer) return notFound(res, 'Customer not found');

  const invoices = await Invoice.find({ customerId: customer._id })
    .sort({ createdAt: -1 });
    
  return ok(res, invoices, 'Invoices retrieved');
});

module.exports = { getCustomerInvoices };
