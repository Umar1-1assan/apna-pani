const Order = require('../../models/Order');
const Customer = require('../../models/Customer');
const Invoice = require('../../models/Invoice');
const { ok, badRequest, notFound } = require('../../utils/apiResponse');

const assignRider = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deliveryBoyId } = req.body;

    const order = await Order.findOneAndUpdate(
      { _id: id, supplierId: req.supplierId },
      { 
        deliveryBoyId, 
        status: 'assigned',
        $push: {
          statusTimeline: {
            status: 'assigned',
            actorRole: req.user.role,
            actorId: req.user._id
          }
        }
      },
      { new: true }
    );

    if (!order) {
      return notFound(res, 'Order not found');
    }

    // Emit real-time event to supplier dashboard
    const io = req.app.get('io');
    if (io) {
      io.to(req.supplierId.toString()).emit('orderAssigned', order);
    }

    return ok(res, order, 'Rider assigned successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { assignRider };
