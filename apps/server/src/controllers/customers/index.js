const { getCustomerProfile } = require('./getCustomerProfile');
const { updateCustomerProfile } = require('./updateCustomerProfile');
const { getCustomerOrders } = require('./getCustomerOrders');
const { getCustomerInvoices } = require('./getCustomerInvoices');
const { pauseSubscription } = require('./pauseSubscription');
const { cancelSubscription } = require('./cancelSubscription');
const { payDues } = require('./payDues');
const { notifyInvoicePaid } = require('./notifyInvoicePaid');

module.exports = {
  getCustomerProfile,
  updateCustomerProfile,
  getCustomerOrders,
  getCustomerInvoices,
  pauseSubscription,
  cancelSubscription,
  payDues,
  notifyInvoicePaid
};
