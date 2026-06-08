const { getProfileHandler } = require('./getProfileHandler');
const { updateProfileHandler } = require('./updateProfileHandler');
const { listSuppliersHandler } = require('./listSuppliersHandler');
const { registerSupplierHandler } = require('./registerSupplierHandler');
const { registerRiderHandler } = require('./registerRiderHandler');
const { registerCustomerHandler } = require('./registerCustomerHandler');

module.exports = {
  getProfileHandler,
  updateProfileHandler,
  listSuppliersHandler,
  registerSupplierHandler,
  registerRiderHandler,
  registerCustomerHandler
};
