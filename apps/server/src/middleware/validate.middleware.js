const mongoose = require('mongoose');
const { badRequest } = require('../utils/apiResponse');

/**
 * Middleware to validate that a route param is a valid MongoDB ObjectId.
 * Prevents NoSQL injection via malformed ID parameters.
 * 
 * @param {string} paramName - The name of the route param to validate (default: 'id')
 */
const validateObjectId = (paramName = 'id') => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
    return badRequest(res, `Invalid ${paramName} format`);
  }
  next();
};

module.exports = { validateObjectId };
