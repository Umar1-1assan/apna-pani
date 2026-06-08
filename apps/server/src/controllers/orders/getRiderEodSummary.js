const Order = require('../../models/Order');
const Customer = require('../../models/Customer');
const Invoice = require('../../models/Invoice');
const { ok, badRequest, notFound } = require('../../utils/apiResponse');

const getRiderEodSummary = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      deliveryBoyId: req.riderId,
      status: { $in: ['delivered', 'completed'] },
      updatedAt: { $gte: startOfDay, $lte: endOfDay }
    });

    let totalCashCollected = 0;
    let totalOnlineCollected = 0;
    let totalEmptyCarboys = 0;
    let totalDeliveries = orders.length;

    for (const order of orders) {
      if (order.paymentStatus === 'paid') {
        if (order.paymentMethod === 'COD') {
          totalCashCollected += order.totalAmount;
        } else {
          totalOnlineCollected += order.totalAmount;
        }
      }
      totalEmptyCarboys += (order.emptyCarboysReturned || 0);
    }

    return ok(res, { totalCashCollected, totalOnlineCollected, totalEmptyCarboys, totalDeliveries }, 'EOD Summary retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = { getRiderEodSummary };
