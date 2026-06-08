const Order = require('../../models/Order');
const Customer = require('../../models/Customer');
const Invoice = require('../../models/Invoice');
const { ok, badRequest, notFound } = require('../../utils/apiResponse');

const getRiderOrders = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.find({ 
      deliveryBoyId: req.riderId, 
      status: { $ne: 'pending' },
      deliveryDate: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'fullName phone' }
      })
      .sort({ deliveryDate: 1 });
    return ok(res, orders, 'Rider orders retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = { getRiderOrders };
