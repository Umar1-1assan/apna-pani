const { createOrder } = require('./createOrder');
const { getSupplierOrders } = require('./getSupplierOrders');
const { getRiderOrders } = require('./getRiderOrders');
const { assignRider } = require('./assignRider');
const { updateOrderStatus } = require('./updateOrderStatus');
const { getRiderEodSummary } = require('./getRiderEodSummary');
const { confirmOrderReceipt } = require('./confirmOrderReceipt');
const { cancelOrder } = require('./cancelOrder');

module.exports = {
  createOrder,
  getSupplierOrders,
  getRiderOrders,
  assignRider,
  updateOrderStatus,
  getRiderEodSummary,
  confirmOrderReceipt,
  cancelOrder
};
