const Customer = require('../../models/Customer');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Invoice = require('../../models/Invoice');
const Supplier = require('../../models/Supplier');
const DeliveryBoy = require('../../models/DeliveryBoy');
const { ok, notFound, badRequest, serverError } = require('../../utils/apiResponse');
const { asyncHandler } = require('../../middleware/auth.middleware');

const notifyInvoicePaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const Invoice = require('../../models/Invoice');
    
    const customer = await Customer.findOne({ userId: req.user._id });
    if (!customer) return notFound(res, 'Customer not found');

    const invoice = await Invoice.findOne({ _id: id, customerId: customer._id });
    if (!invoice) return notFound(res, 'Invoice not found');

    if (invoice.paymentStatus === 'paid') {
      return badRequest(res, 'Invoice is already paid');
    }

    invoice.paymentStatus = 'pending_confirmation';
    await invoice.save();

    return ok(res, invoice, 'Payment notification sent to supplier');
  } catch (error) {
    next(error);
  }
};

module.exports = { notifyInvoicePaid };
