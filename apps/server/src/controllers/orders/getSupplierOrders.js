const Order = require('../../models/Order');
const Customer = require('../../models/Customer');
const Invoice = require('../../models/Invoice');
const { ok, badRequest, notFound } = require('../../utils/apiResponse');

const getSupplierOrders = async (req, res, next) => {
  try {
    const { date, startDate, endDate } = req.query;
    let query = { supplierId: req.supplierId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.deliveryDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.deliveryDate = { $gte: start, $lte: end };
    }

    const orders = await Order.find(query)
      .populate('customerId', 'userId phoneNumber address') // Needs fixing: Customer -> User
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'fullName phone username' }
      })
      .populate({
        path: 'deliveryBoyId',
        populate: { path: 'userId', select: 'fullName phone' }
      })
      .sort({ createdAt: -1 });
    return ok(res, orders, 'Orders retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = { getSupplierOrders };
